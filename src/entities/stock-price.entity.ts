import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockInfo } from './stock-info.entity';

@Entity('stock_price')
@Unique(['stockInfo', 'date'])
export class StockPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

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

  @ManyToOne(() => StockInfo, (stockInfo) => stockInfo.stockPrice)
  @JoinColumn({ name: 'symbol' })
  stockInfo: StockInfo;
}
