import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockData } from 'src/entities/stock.entity';
import { ParserModule } from 'src/parser/parser.module';
import { BullModule } from '@nestjs/bull';
import { StockProcessor } from './stock.processor';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockData]),
    BullModule.registerQueue({ name: 'stock-queue' }),
    EventEmitterModule.forRoot(),
    ParserModule,
  ],
  controllers: [StockController],
  providers: [StockService, StockProcessor],
  exports: [StockService, TypeOrmModule],
})
export class StockModule {}
