import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockData } from 'src/entities/stock.entity';
import { StockInfoData } from 'src/entities/stock-info.entity';
import { StockPrediction } from 'src/entities/stock-prediction.entity';
import { StockController } from './stock.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockData, StockInfoData, StockPrediction]),
  ],
  providers: [StockService],
  exports: [StockService, TypeOrmModule],
  controllers: [StockController],
})
export class StockModule {}
