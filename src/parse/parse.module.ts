import { Module } from '@nestjs/common';
import { ParseService } from './parse.service';
import { ParseController } from './parse.controller';
import { ParseProcessor } from './parse.processor';
import { StockModule } from 'src/stock/stock.module';

@Module({
  imports: [StockModule],
  controllers: [ParseController],
  providers: [ParseService, ParseProcessor],
  exports: [ParseService],
})
export class ParseModule {}
