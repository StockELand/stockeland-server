import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockData } from 'src/entities/stock.entity';
import { StockInfoData } from 'src/entities/stock-info.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockData, StockInfoData])],
  providers: [StockService],
  exports: [StockService, TypeOrmModule],
})
export class StockModule {}
