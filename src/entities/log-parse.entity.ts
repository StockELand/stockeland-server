import { DateTransformer } from 'src/common/DateTransformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ParseStatus = 'success' | 'fail';

@Entity('log_parse')
export class LogParse {
  @PrimaryGeneratedColumn()
  id?: number; // 고유 ID

  @CreateDateColumn({ name: 'parsed_at' })
  parsedAt?: Date; // 파싱 실행 시간 (자동 생성)

  @Column({ type: 'enum', enum: ['success', 'fail'] })
  status?: ParseStatus; // 실행 상태

  @Column({ name: 'modified_count', type: 'int', default: 0 })
  modifiedCount?: number; // 수정된 데이터 개수

  @Column({ name: 'execution_time', type: 'float' })
  executionTime?: number; // 실행 시간 (초)

  @Column({ type: 'text', nullable: true })
  message?: string; // 로그 메시지 (에러 또는 결과)

  @Column({
    name: 'parsed_range_start',
    type: 'date',
    nullable: true,
    transformer: new DateTransformer(),
  })
  parsedRangeStart?: string; // 파싱 시작 날짜 (파싱한 데이터 기간 시작)

  @Column({
    name: 'parsed_range_end',
    type: 'date',
    nullable: true,
    transformer: new DateTransformer(),
  })
  parsedRangeEnd?: string; // 파싱 종료 날짜 (파싱한 데이터 기간 종료)

  @Column({
    name: 'last_data_date',
    type: 'date',
    nullable: true,
    transformer: new DateTransformer(),
  })
  lastDataDate?: string; // 실제 데이터의 마지막 날짜
}
