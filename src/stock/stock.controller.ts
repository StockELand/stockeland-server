import { Controller, Get, Query } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get('predictions')
  async getPredictions(@Query('date') date?: string) {
    return this.stockService.getPredictionsWithPrevious(date);
  }

  @Get('all')
  async getAll() {
    return this.stockService.getLatestAndPreviousStockData();
  }
  @Get('symbols')
  async getAllSymbols() {
    return this.stockService.getAllSymbol();
  }
}
