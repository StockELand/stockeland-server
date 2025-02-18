import { Module } from '@nestjs/common';
import { ParseService } from './parse.service';
import { ParseController } from './parse.controller';
import { ParseProcessor } from './parse.processor';
import { StockModule } from 'src/stock/stock.module';
import { LogsModule } from 'src/log/logs.module';

@Module({
  imports: [StockModule, LogsModule],
  controllers: [ParseController],
  providers: [ParseService, ParseProcessor],
  exports: [ParseService],
})
export class ParseModule {}
