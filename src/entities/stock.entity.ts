import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockInfoData } from './stock-info.entity';

@Entity('stock_data')
@Unique(['stockInfo', 'date'])
export class StockData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string; // ✅ FK이지만 직접 컬럼으로 추가 (중복 업데이트 가능)

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  open: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  high: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  low: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  close: number;

  @Column({ type: 'bigint' })
  volume: number;

  @ManyToOne(() => StockInfoData, (stockInfo) => stockInfo.stockData)
  @JoinColumn({ name: 'symbol' })
  stockInfo: StockInfoData;
}
