import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StockModule } from './stock/stock.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { BullModule } from '@nestjs/bull';
import { ParseController } from './parse/parse.controller';
import { ParseModule } from './parse/parse.module';
import { PredictModule } from './predict/predict.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 },
    }),
    StockModule,
    ParseModule,
    PredictModule,
    CommonModule,
  ],
  controllers: [AppController, ParseController],
  providers: [AppService],
})
export class AppModule {}
