import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type PredictionStatus = 'success' | 'fail';

@Entity('prediction_log')
export class PredictionLog {
  @PrimaryGeneratedColumn()
  id: number; // 고유 ID

  @CreateDateColumn({ name: 'predicted_at' })
  predictedAt: Date; // 파싱 실행 시간 (자동 생성)

  @Column({ type: 'enum', enum: ['success', 'fail'] })
  status: PredictionStatus; // 실행 상태

  @Column({ type: 'int', default: 0 })
  modifiedCount: number; // 수정된 데이터 개수

  @Column({ type: 'float' })
  executionTime: number; // 실행 시간 (초)

  @Column({ type: 'text', nullable: true })
  message: string; // 로그 메시지 (에러 또는 결과)
}
