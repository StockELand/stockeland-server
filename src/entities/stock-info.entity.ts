import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { StockData } from './stock.entity';

@Entity('stock_info')
export class StockInfoData {
  @PrimaryColumn()
  symbol: string;

  @Column()
  name: string;

  @OneToMany(() => StockData, (stock) => stock.stockInfo)
  stockData: StockData[];
}
