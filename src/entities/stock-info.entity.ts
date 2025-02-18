import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { StockPrice } from './stock-price.entity';
import { StockPrediction } from './stock-prediction.entity';

@Entity('stock_info')
export class StockInfo {
  @PrimaryColumn()
  symbol: string;

  @Column()
  name: string;

  @OneToMany(() => StockPrice, (stock) => stock.stockInfo)
  stockPrice: StockPrice[];

  @OneToMany(
    () => StockPrediction,
    (stock_predictions) => stock_predictions.stockInfo,
  )
  stockPrediction: StockPrediction[];
}
