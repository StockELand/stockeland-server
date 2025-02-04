import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StockInfoData } from 'src/entities/stock-info.entity';
import { StockData } from 'src/entities/stock.entity';
import { Repository } from 'typeorm';

const symbols = [
  'AAPL',
  'MSFT',
  'AMZN',
  'GOOGL',
  'GOOG',
  'BRK-B',
  'NVDA',
  'TSLA',
  'META',
  'UNH',
  'XOM',
  'JNJ',
  'JPM',
  'V',
  'PG',
  'MA',
  'HD',
  'CVX',
  'MRK',
  'LLY',
  'PEP',
  'KO',
  'ABBV',
  'AVGO',
  'COST',
  'TMO',
  'CSCO',
  'MCD',
  'ACN',
  'NEE',
  'WMT',
  'DHR',
  'DIS',
  'ADBE',
  'NFLX',
  'INTC',
  'AMD',
  'TXN',
  'PYPL',
  'HON',
  'ABT',
  'CRM',
  'QCOM',
  'MDT',
  'NKE',
  'UPS',
  'BMY',
  'RTX',
  'LIN',
  'ORCL',
  'AMGN',
  'LOW',
  'CVS',
  'UNP',
  'MS',
  'T',
  'USB',
  'SCHW',
  'GS',
  'RTX',
  'BLK',
  'C',
  'BK',
  'PLD',
  'SCHW',
  'SPGI',
  'AXP',
  'CI',
  'CNC',
  'DE',
  'DUK',
  'HUM',
  'ICE',
  'ITW',
  'MMM',
  'TGT',
  'CAT',
  'FDX',
  'WM',
  'MO',
  'PSA',
  'LMT',
  'EL',
  'SYK',
  'ADI',
  'D',
  'BDX',
  'ETN',
  'ZTS',
  'ADP',
  'ISRG',
  'CL',
  'GILD',
  'BSX',
  'PGR',
  'AMT',
  'MDLZ',
  'TFC',
  'CCI',
  'NSC',
  'WM',
  'TJX',
  'SHW',
  'SPG',
  'NOW',
  'HCA',
  'EOG',
  'CMCSA',
  'ATVI',
  'CARR',
  'EXC',
  'AON',
  'COP',
  'VRTX',
  'EQIX',
  'ICE',
  'MCO',
  'REGN',
  'APD',
  'CHTR',
  'SO',
  'BAX',
  'KHC',
  'KMB',
  'AEP',
  'SBUX',
  'GM',
  'FIS',
  'DFS',
  'EBAY',
  'HAL',
  'DOW',
  'KMI',
  'WBA',
  'SYY',
  'STZ',
  'ADM',
  'AIG',
  'PRU',
  'FISV',
  'FTNT',
  'MET',
  'HLT',
  'TEL',
  'DD',
  'WELL',
  'CTVA',
  'TRV',
  'PXD',
  'ECL',
  'APH',
  'PPL',
  'ROK',
  'PCAR',
  'AFL',
  'GLW',
  'DLR',
  'HSY',
  'MAR',
  'CMS',
  'SLB',
  'PAYX',
  'MSCI',
  'ED',
  'ODFL',
  'HIG',
  'CTAS',
  'CME',
  'MNST',
  'MTD',
  'ROST',
  'CDNS',
  'FAST',
  'IQV',
  'IDXX',
];

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockData)
    private stockRepository: Repository<StockData>,
    @InjectRepository(StockInfoData)
    private stockInfoRepository: Repository<StockInfoData>,
  ) {}

  getStockSymbols() {
    return symbols;
  }

  async saveToDatabase(data: any[]): Promise<void> {
    if (data.length === 0) return;

    const symbolsToCheck = [...new Set(data.map((d) => d.symbol))]; // 중복 제거
    const existingStockInfo = await this.stockInfoRepository
      .createQueryBuilder('stockInfo')
      .select('stockInfo.symbol')
      .where('stockInfo.symbol IN (:...symbols)', { symbols: symbolsToCheck })
      .getMany();

    const existingSymbols = new Set(existingStockInfo.map((s) => s.symbol));

    const validData = data.filter((d) => existingSymbols.has(d.symbol));
    const failedRows = data.filter((d) => !existingSymbols.has(d.symbol)); // stock_info에 없는 symbol

    try {
      if (validData.length > 0) {
        await this.stockRepository
          .createQueryBuilder()
          .insert()
          .into(StockData)
          .values(validData)
          .orUpdate(
            ['open', 'high', 'low', 'close', 'volume'],
            ['symbol', 'date'],
          )
          .execute();
      }
    } catch (error) {
      console.error(`❌ Bulk insert/update failed: ${error.message}`);
    }

    if (failedRows.length > 0) {
      console.error(
        `⚠️ The following ${failedRows.length} records have missing symbols in stock_info:`,
      );
      console.table(
        failedRows.map((row) => ({ symbol: row.symbol, date: row.date })),
      );
    }
  }
}
