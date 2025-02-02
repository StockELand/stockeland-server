import { Controller, Get, Post } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // @Post('parse')
  @Get('parse')
  async parseStockData() {
    await this.stockService.updateStockData();
    return { message: 'Stock data parsing started and saved to DB' };
  }
}
