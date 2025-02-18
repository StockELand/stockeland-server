import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StockInfo } from './stock-info.entity';

@Entity('stock_prediction')
@Unique(['stockInfo', 'predictedAt'])
export class StockPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column({ name: 'change_percent', type: 'decimal', precision: 10, scale: 2 })
  changePercent: number;

  @Column({ name: 'predicted_at', type: 'date' })
  predictedAt: string;

  @ManyToOne(() => StockInfo, (stockInfo) => stockInfo.stockPrice)
  @JoinColumn({ name: 'symbol' })
  stockInfo: StockInfo;
}
