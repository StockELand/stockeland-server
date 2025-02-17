import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PredictionLog,
  PredictionStatus,
} from 'src/entities/prediction-log.entity';
import { Between, Repository } from 'typeorm';

@Injectable()
export class PredictionLogService {
  constructor(
    @InjectRepository(PredictionLog)
    private readonly predictionLogRepository: Repository<PredictionLog>,
  ) {}

  async logParseResult(
    status: PredictionStatus,
    modifiedCount: number,
    executionTime: number,
    message?: string,
  ) {
    const log = this.predictionLogRepository.create({
      status,
      modifiedCount,
      executionTime,
      message,
    });
    return await this.predictionLogRepository.save(log);
  }

  async getLogsByDate(date: string): Promise<PredictionLog[]> {
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    return await this.predictionLogRepository.find({
      where: {
        predictedAt: Between(startDate, endDate),
      },
      order: { predictedAt: 'DESC' },
    });
  }
}
