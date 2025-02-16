import { Module } from '@nestjs/common';
import { ParseLogService } from './parse-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParseLog } from 'src/entities/parse-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParseLog])],
  providers: [ParseLogService],
  exports: [ParseLogService],
})
export class LogsModule {}
