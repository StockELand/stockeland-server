import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StockInfo } from 'src/entities/stock-info.entity';
import { StockPrediction } from 'src/entities/stock-prediction.entity';
import { StockPrice } from 'src/entities/stock-price.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockPrice)
    private stockRepository: Repository<StockPrice>,
    @InjectRepository(StockInfo)
    private stockInfoRepository: Repository<StockInfo>,
    @InjectRepository(StockPrediction)
    private predictRepository: Repository<StockPrediction>,
  ) {}

  async getAllSymbol(): Promise<string[]> {
    const symbols = (
      await this.stockInfoRepository.find({ select: ['symbol'] })
    ).map((info) => info.symbol);
    return symbols;
  }

  async getLast100Close(): Promise<StockPrice[]> {
    const today = new Date();
    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(today.getDate() - 100);
    return this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.date BETWEEN :start AND :end', {
        start: hundredDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD 형식
        end: today.toISOString().split('T')[0],
      })
      .orderBy('stock.date', 'ASC') // 날짜 오름차순 정렬
      .getMany();
  }

  async saveClose(data: any[]): Promise<number> {
    if (data.length === 0) return 0;

    try {
      const result = await this.stockRepository
        .createQueryBuilder()
        .insert()
        .into(StockPrice)
        .values(data)
        .orUpdate(
          ['open', 'high', 'low', 'close', 'volume'], // 업데이트 대상 컬럼
          ['symbol', 'date'], // 중복 체크 기준 컬럼
        )
        .execute();

      const affectedRows = result.raw?.affectedRows ?? data.length;

      return affectedRows;
    } catch (error) {
      throw error;
    }
  }

  async savePredictions(
    predictions: { symbol: string; change_percent: number }[],
    date?: string,
  ): Promise<number> {
    if (predictions.length === 0) return 0;

    try {
      const today = new Date(date ? date : await this.getTradingDate())
        .toISOString()
        .split('T')[0];

      const result = await this.predictRepository
        .createQueryBuilder()
        .insert()
        .into(StockPrediction)
        .values(
          predictions.map((prediction) => ({
            ...prediction,
            predictedAt: today,
          })),
        )
        .orUpdate(['change_percent'], ['symbol', 'predicted_at'])
        .execute();

      const affectedRows = result.raw?.affectedRows ?? predictions.length;

      return affectedRows;
    } catch (error) {
      throw error;
    }
  }

  async getTradingDate(daysAgo?: number, dateStr?: string): Promise<string> {
    let query = this.stockRepository
      .createQueryBuilder('sp')
      .select('date')
      .distinct(true)
      .orderBy('date', 'DESC');

    // 특정 날짜가 주어진 경우, 해당 날짜보다 이전의 거래일을 조회
    if (dateStr) {
      query = query.where('date <= :date', { date: dateStr });
    }

    // 특정 날짜 기준 N일 전 거래일 가져오기
    if (daysAgo) {
      query = query.skip(daysAgo).take(1);
    } else {
      query = query.take(1);
    }
    const result = await query.getRawOne();
    return new Date(result?.date).toISOString().slice(0, 10) || null;
  }

  async getPredictionsWithPrevious(date?: string) {
    // 1. 최신 예측 날짜 찾기
    if (!date) {
      date = await this.getTradingDate();
    }

    // 2. 해당 날짜의 예측 데이터 조회
    const predictions = await this.predictRepository
      .createQueryBuilder('current')
      .innerJoin('current.stockInfo', 'si')
      .select([
        'current.id AS id',
        'current.symbol AS symbol',
        'current.change_percent AS changePercent',
        'current.predicted_at AS predictedAt',
        'si.name AS name',
      ])
      .where('DATE(current.predicted_at) = :date', { date })
      .orderBy('current.change_percent', 'DESC')
      .getRawMany();

    // 3. 이전 예측 날짜 찾기
    const previousDate = await this.getTradingDate(1, date);
    if (!previousDate) {
      return predictions.map((p) => ({
        ...p,
        prev_change_percent: null,
      }));
    }

    // 4. 이전 날짜의 예측 데이터 조회
    const previousPredictions = await this.predictRepository
      .createQueryBuilder('previous')
      .where('DATE(previous.predicted_at) = :previousDate', { previousDate })
      .select('previous.symbol', 'symbol')
      .addSelect('previous.change_percent', 'changePercent')
      .getRawMany();

    // 5. 이전 데이터 매핑
    const previousMap = new Map(
      previousPredictions.map((p) => [p.symbol, p.changePercent]),
    );

    // 6. 최종 데이터 반환 및 정렬 보장
    const result = predictions
      .map((p) => ({
        ...p,
        prevChangePercent: previousMap.get(p.symbol) ?? null,
      }))
      .sort((a, b) => b.changePercent - a.changePercent);
    return result;
  }

  async getLatestAndPreviousStockData() {
    // 최신 거래일을 찾는 서브쿼리
    const latestTradeSubQuery = this.stockRepository
      .createQueryBuilder('s1')
      .select('s1.symbol', 'symbol')
      .addSelect('MAX(s1.date)', 'latest_date')
      .groupBy('s1.symbol');

    // 최신 거래일보다 이전 거래일을 찾는 서브쿼리
    const latestTradingDate = await this.getTradingDate();
    const previousTradeSubQuery = `
    SELECT s2.symbol, MAX(s2.date) AS prev_date
    FROM stock_price s2
    WHERE s2.date < '${latestTradingDate}'
    GROUP BY s2.symbol
  `;

    // 최종 데이터 조회
    const query = this.stockRepository
      .createQueryBuilder('s1')
      .innerJoin('s1.stockInfo', 'si')
      .select([
        's1.symbol AS symbol',
        'si.name AS name',
        'latest.latest_date AS latestDate',
        's1.close AS latestClose',
        'p1.change_percent AS latestChangePercent',
        'prev.prev_date AS prevDate',
        's2.close AS prevClose',
        'p2.change_percent AS prevChangePercent',
      ])
      .innerJoin(
        `(${latestTradeSubQuery.getQuery()})`,
        'latest',
        's1.symbol = latest.symbol AND s1.date = latest.latest_date',
      )
      .leftJoin(`(${previousTradeSubQuery})`, 'prev', 's1.symbol = prev.symbol')
      .leftJoin(
        StockPrice,
        's2',
        's2.symbol = prev.symbol AND s2.date = prev.prev_date',
      )
      .leftJoin(
        'stock_prediction',
        'p1',
        's1.symbol = p1.symbol AND s1.date = p1.predicted_at',
      )
      .leftJoin(
        'stock_prediction',
        'p2',
        's2.symbol = p2.symbol AND s2.date = p2.predicted_at',
      );

    return query.getRawMany();
  }
}
