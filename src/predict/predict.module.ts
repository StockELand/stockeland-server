import { Module } from '@nestjs/common';
import { PredictController } from './predict.controller';
import { PredictService } from './predict.service';
import { StockModule } from 'src/stock/stock.module';
import { PredictProcessor } from './predict.processor';

@Module({
  imports: [StockModule],
  controllers: [PredictController],
  providers: [PredictService, PredictProcessor],
})
export class PredictModule {}
