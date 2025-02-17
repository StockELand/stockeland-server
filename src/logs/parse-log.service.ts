import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ParseLog, ParseStatus } from 'src/entities/parse-log.entity';
import { Between, Repository } from 'typeorm';

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

  async getLogsByDate(date: string): Promise<ParseLog[]> {
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    return await this.parseLogRepository.find({
      where: {
        parsedAt: Between(startDate, endDate),
      },
      order: { parsedAt: 'DESC' },
    });
  }
}
