import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get(':symbol')
  async getStock(
    @Param('symbol') symbol: string,
    @Query('range') range: '1w' | '1m' | '3m' | '6m' | '1y' = '1y',
  ) {
    return this.stockService.getStockClose(symbol, range);
  }

  @Get('symbols')
  async getAllSymbols() {
    return this.stockService.getAllSymbol();
  }
}
