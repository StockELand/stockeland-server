import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StockData } from 'src/entities/stock.entity';
import { ParserService } from 'src/parser/parser.service';
import { Repository } from 'typeorm';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockData)
    private stockRepository: Repository<StockData>,
    private parserService: ParserService,
  ) {}

  async updateStockData(): Promise<void> {
    try {
      const stockData = await this.parserService.fetchStockData();
      await this.saveToDatabase(stockData);
    } catch (error) {
      console.error(`Error updating stock data: ${error}`);
    }
  }

  async saveToDatabase(data: any[]): Promise<void> {
    for (const row of data) {
      try {
        await this.stockRepository
          .createQueryBuilder()
          .insert()
          .into(StockData)
          .values(row)
          .orUpdate(
            ['open', 'high', 'low', 'close', 'volume'],
            ['symbol', 'date'],
          )
          .execute();
      } catch (error) {
        console.error(
          `Error saving stock data for ${row.symbol} (${row.date}): ${error}`,
        );
      }
    }
  }
}
