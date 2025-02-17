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

  async getParseStatusByDateRange(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // 주어진 날짜 범위 내의 모든 로그 조회
    const logs = await this.parseLogRepository.find({
      where: { parsedAt: Between(start, end) },
    });

    // 날짜별 성공/실패 여부를 저장할 객체
    const statusMap: Record<string, { success: boolean; fail: boolean }> = {};

    logs.forEach((log) => {
      const dateKey = log.parsedAt.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환

      if (!statusMap[dateKey]) {
        statusMap[dateKey] = { success: false, fail: false };
      }

      if (log.status === 'success') {
        statusMap[dateKey].success = true;
      } else if (log.status === 'fail') {
        statusMap[dateKey].fail = true;
      }
    });

    // 성공 날짜와 실패 날짜 분류
    const successDates: string[] = [];
    const failDates: string[] = [];

    Object.entries(statusMap).forEach(([date, { success, fail }]) => {
      if (success) {
        successDates.push(date);
      } else if (fail) {
        failDates.push(date);
      }
    });

    return {
      success: { dates: successDates },
      fail: { dates: failDates },
    };
  }
}
