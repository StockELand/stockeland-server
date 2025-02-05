import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockInfoData } from './stock-info.entity';

@Entity('stock_prediction')
export class StockPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column({ type: 'float' })
  change_percent: number;

  @CreateDateColumn({ type: 'timestamp' })
  predicted_at: Date;

  @ManyToOne(() => StockInfoData, (stockInfo) => stockInfo.stockData)
  @JoinColumn({ name: 'symbol' })
  stockInfo: StockInfoData;
}
