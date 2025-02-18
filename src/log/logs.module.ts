import { Module } from '@nestjs/common';
import { ParseLogService } from './parse-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogParse } from 'src/entities/log-parse.entity';
import { PredictionLogService } from './prediction-log.service';
import { LogPrediction } from 'src/entities/log-prediction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogParse, LogPrediction])],
  providers: [ParseLogService, PredictionLogService],
  exports: [ParseLogService, PredictionLogService],
})
export class LogsModule {}
