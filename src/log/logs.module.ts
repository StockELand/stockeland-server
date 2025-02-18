import { Module } from '@nestjs/common';
import { ParseLogService } from './parse-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogParse } from 'src/entities/log-parse.entity';
import { PredictionLogService } from './predictions-log.service';
import { LogPredict } from 'src/entities/log-predict.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogParse, LogPredict])],
  providers: [ParseLogService, PredictionLogService],
  exports: [ParseLogService, PredictionLogService],
})
export class LogsModule {}
