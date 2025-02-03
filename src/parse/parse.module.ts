import { Module } from '@nestjs/common';
import { ParseService } from './parse.service';
import { ParseController } from './parse.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ParseProcessor } from './parse.processor';
import { StockModule } from 'src/stock/stock.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'stock-queue' }),
    EventEmitterModule.forRoot(),
    StockModule,
  ],
  controllers: [ParseController],
  providers: [ParseService, ParseProcessor],
  exports: [ParseService],
})
export class ParseModule {}
