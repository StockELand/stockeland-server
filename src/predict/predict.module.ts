import { Module } from '@nestjs/common';
import { PredictController } from './predict.controller';
import { PredictService } from './predict.service';
import { StockModule } from 'src/stock/stock.module';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PredictProcessor } from './predict.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'predict-queue' }),
    EventEmitterModule.forRoot(),
    StockModule,
  ],
  controllers: [PredictController],
  providers: [PredictService, PredictProcessor],
})
export class PredictModule {}
