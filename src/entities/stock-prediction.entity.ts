import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StockInfoData } from './stock-info.entity';

@Entity('stock_prediction')
@Unique(['stockInfo', 'predicted_at'])
export class StockPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  change_percent: number;

  @Column({ type: 'date' })
  predicted_at: string;

  @ManyToOne(() => StockInfoData, (stockInfo) => stockInfo.stockData)
  @JoinColumn({ name: 'symbol' })
  stockInfo: StockInfoData;
}
