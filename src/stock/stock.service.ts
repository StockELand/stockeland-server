import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StockInfoData } from 'src/entities/stock-info.entity';
import { StockPrediction } from 'src/entities/stock-prediction.entity';
import { StockData } from 'src/entities/stock.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockData)
    private stockRepository: Repository<StockData>,
    @InjectRepository(StockInfoData)
    private stockInfoRepository: Repository<StockInfoData>,
    @InjectRepository(StockPrediction)
    private predictRepository: Repository<StockPrediction>,
  ) {}

  async findAllSymbol(): Promise<string[]> {
    const symbols = (
      await this.stockInfoRepository.find({ select: ['symbol'] })
    ).map((info) => info.symbol);
    return symbols;
  }

  async findLast100StockData(): Promise<any[]> {
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

  async saveToDatabase(data: any[]): Promise<void> {
    if (data.length === 0) return;

    try {
      await this.stockRepository
        .createQueryBuilder()
        .insert()
        .into(StockData)
        .values(data)
        .orUpdate(
          ['open', 'high', 'low', 'close', 'volume'],
          ['symbol', 'date'],
        )
        .execute();
    } catch (error) {
      console.error(`❌ Bulk insert/update failed: ${error.message}`);
    }
  }

  async savePredictions(
    predictions: { symbol: string; change_percent: number }[],
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.predictRepository
      .createQueryBuilder()
      .insert()
      .into(StockPrediction)
      .values(
        predictions.map((prediction) => ({
          ...prediction,
          predicted_at: today,
        })),
      )
      .orUpdate(['change_percent'], ['symbol', 'predicted_at'])
      .execute();
  }

  async getPredictionsWithPrevious(date?: string) {
    // 1. 최신 예측 날짜 찾기 (날짜가 없을 경우)
    if (!date) {
      const latestPrediction = await this.predictRepository
        .createQueryBuilder('stock_prediction')
        .select('MAX(predicted_at)', 'maxDate')
        .getRawOne();

      date = latestPrediction?.maxDate;
      console.log(date);
    }

    // 2. 해당 날짜의 예측 데이터 조회
    const predictions = await this.predictRepository
      .createQueryBuilder('current')
      .where('DATE(current.predicted_at) = :date', { date })
      .orderBy('current.change_percent', 'DESC')
      .getMany();

    // 3. 해당 날짜보다 이전의 가장 가까운 예측 날짜 찾기
    const previousPrediction = await this.predictRepository
      .createQueryBuilder('stock_prediction')
      .select('MAX(predicted_at)', 'maxDate')
      .where('predicted_at < :date', { date })
      .getRawOne();

    const previousDate = previousPrediction?.maxDate;

    if (!previousDate) {
      // 이전 예측이 없으면 현재 예측 데이터만 반환
      return predictions.map((p) => ({
        ...p,
        previous: null,
      }));
    }

    // 4. 이전 날짜의 예측 데이터 조회 (쿼리 최적화)
    const previousPredictions = await this.predictRepository
      .createQueryBuilder('previous')
      .where('DATE(previous.predicted_at) = :previousDate', { previousDate })
      .select('previous.symbol', 'symbol')
      .addSelect('previous.change_percent', 'change_percent')
      .addSelect('previous.predicted_at', 'predicted_at')
      .getRawMany();

    // 5. 이전 데이터 매핑
    const previousMap = new Map(
      previousPredictions.map((p) => [p.symbol, p.change_percent]),
    );

    // 6. 결과 반환 (이전 예측값 추가)
    return predictions.map((p) => ({
      ...p,
      prev_change_percent: previousMap.get(p.symbol) || null,
    }));
  }
}
