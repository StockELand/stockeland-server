import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ParseLog, ParseStatus } from 'src/entities/parse-log.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ParseLogService {
  constructor(
    @InjectRepository(ParseLog)
    private readonly parseLogRepository: Repository<ParseLog>,
  ) {}

  async logParseResult(
    status: ParseStatus,
    modifiedCount: number,
    executionTime: number,
    message?: string,
  ) {
    const log = this.parseLogRepository.create({
      status,
      modifiedCount,
      executionTime,
      message,
    });
    return await this.parseLogRepository.save(log);
  }
}
