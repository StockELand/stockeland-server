import { DateTransformer } from 'src/common/DateTransformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type PredictionStatus = 'success' | 'fail';

@Entity('log_prediction')
export class LogPrediction {
  @PrimaryGeneratedColumn()
  id?: number; // 고유 ID

  @CreateDateColumn({ name: 'predicted_at' })
  predictedAt?: Date; // 파싱 실행 시간 (자동 생성)

  @Column({ type: 'enum', enum: ['success', 'fail'] })
  status?: PredictionStatus; // 실행 상태

  @Column({ name: 'modified_count', type: 'int', default: 0 })
  modifiedCount?: number; // 수정된 데이터 개수

  @Column({ name: 'execution_time', type: 'float' })
  executionTime?: number; // 실행 시간 (초)

  @Column({ type: 'text', nullable: true })
  message?: string; // 로그 메시지 (에러 또는 결과)

  @Column({
    name: 'last_data_date',
    type: 'date',
    nullable: true,
    transformer: new DateTransformer(),
  })
  lastDataDate?: string; // 실제 데이터의 마지막 날짜
}
