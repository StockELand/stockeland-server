import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SseModule } from './sse/sse.module';
import { ParserModule } from './parser/parser.module';
import { StockModule } from './stock/stock.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 },
    }),
    StockModule,
    SseModule,
    ParserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
