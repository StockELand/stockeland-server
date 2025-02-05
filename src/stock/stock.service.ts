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
    const entities = predictions.map((prediction) =>
      this.predictRepository.create(prediction),
    );
    await this.predictRepository.save(entities);
  }
}
