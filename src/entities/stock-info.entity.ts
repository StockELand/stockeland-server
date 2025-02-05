import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { StockData } from './stock.entity';
import { StockPrediction } from './stock-prediction.entity';

@Entity('stock_info')
export class StockInfoData {
  @PrimaryColumn()
  symbol: string;

  @Column()
  name: string;

  @OneToMany(() => StockData, (stock) => stock.stockInfo)
  stockData: StockData[];

  @OneToMany(
    () => StockPrediction,
    (stock_predictions) => stock_predictions.stockInfo,
  )
  stockPredictions: StockPrediction[];
}
