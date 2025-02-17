import { Module } from '@nestjs/common';
import { ParseLogService } from './parse-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParseLog } from 'src/entities/parse-log.entity';
import { PredictionLogService } from './predictions-log.service';
import { PredictionLog } from 'src/entities/prediction-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParseLog, PredictionLog])],
  providers: [ParseLogService, PredictionLogService],
  exports: [ParseLogService, PredictionLogService],
})
export class LogsModule {}
