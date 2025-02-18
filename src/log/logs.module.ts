import { Module } from '@nestjs/common';
import { ParseLogService } from './parse-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogParse } from 'src/entities/log-parse.entity';
import { PredictLogService } from './predict-log.service';
import { LogPredict } from 'src/entities/log-predict.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogParse, LogPredict])],
  providers: [ParseLogService, PredictLogService],
  exports: [ParseLogService, PredictLogService],
})
export class LogsModule {}
