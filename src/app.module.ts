import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SseModule } from './sse/sse.module';
import { ParserModule } from './parser/parser.module';
import { StockService } from './stock/stock.service';
import { StockModule } from './stock/stock.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    SseModule,
    ParserModule,
    StockModule,
  ],
  controllers: [AppController],
  providers: [AppService, StockService],
})
export class AppModule {}
