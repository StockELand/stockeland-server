import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockData } from 'src/entities/stock.entity';
import { ParserModule } from 'src/parser/parser.module';

@Module({
  imports: [TypeOrmModule.forFeature([StockData]), ParserModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService, TypeOrmModule],
})
export class StockModule {}
