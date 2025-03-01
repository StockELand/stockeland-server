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
    private stockPriceRepository: Repository<StockPrice>,
    @InjectRepository(StockInfo)
    private stockInfoRepository: Repository<StockInfo>,
    @InjectRepository(StockPrediction)
    private stockPredictionRepository: Repository<StockPrediction>,
  ) {}

  async getAllSymbol(): Promise<string[]> {
    const symbols = (
      await this.stockInfoRepository.find({ select: ['symbol'] })
    ).map((info) => info.symbol);
    return symbols;
  }

  async getLast100Close(date?: string): Promise<StockPrice[]> {
    // 기준 날짜를 하루 전으로 설정
    const baseDate = date ? new Date(date) : new Date();
    baseDate.setDate(baseDate.getDate() - 1); // 당일 제외, 하루 전으로 조정

    const hundredDaysAgo = new Date(baseDate);
    hundredDaysAgo.setDate(baseDate.getDate() - 100);

    return this.stockPriceRepository
      .createQueryBuilder('stock')
      .where('stock.date BETWEEN :start AND :end', {
        start: hundredDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD 형식
        end: baseDate.toISOString().split('T')[0],
      })
      .orderBy('stock.date', 'ASC') // 날짜 오름차순 정렬
      .getMany();
  }

  async getTradingDate(daysAgo?: number, dateStr?: string): Promise<string> {
    let query = this.stockPriceRepository
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
    const predictions = await this.stockPredictionRepository
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
    const previousPredictions = await this.stockPredictionRepository
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
    const latestTradeSubQuery = this.stockPriceRepository
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
    const query = this.stockPriceRepository
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

  async getStockClose(symbol: string, range: '1w' | '1m' | '3m' | '6m' | '1y') {
    const today = new Date();
    const dateFrom = new Date();

    // 기간별 날짜 계산
    switch (range) {
      case '1w': // 1주 전
        dateFrom.setDate(today.getDate() - 7);
        break;
      case '1m': // 1달 전
        dateFrom.setMonth(today.getMonth() - 1);
        break;
      case '3m': // 3달 전
        dateFrom.setMonth(today.getMonth() - 3);
        break;
      case '6m': // 6달 전
        dateFrom.setMonth(today.getMonth() - 6);
        break;
      case '1y': // 1년 전 (기본값)
      default:
        dateFrom.setFullYear(today.getFullYear() - 1);
        break;
    }

    return this.stockPriceRepository
      .createQueryBuilder('stock')
      .where('stock.symbol = :symbol', { symbol })
      .andWhere('stock.date >= :dateFrom', { dateFrom }) // 선택한 기간에 맞는 데이터 필터링
      .orderBy('stock.date', 'DESC') // 최신 데이터부터 정렬
      .getMany();
  }
}
