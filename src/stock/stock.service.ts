import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}

  getStockSymbols() {
    return symbols;
  }

  async saveToDatabase(data: any[]): Promise<void> {
    if (data.length === 0) return;
    const failedRows: any[] = [];

    try {
      await this.stockRepository
        .createQueryBuilder()
        .insert()
        .into(StockData)
        .values(data)
        .orUpdate(
          ['open', 'high', 'low', 'close', 'volume'],
          ['symbol', 'date'],
        )
        .execute();
    } catch (error) {
      console.error(`❌ Bulk insert/update failed: ${error.message}`);
      failedRows.push(...data);
    }

    if (failedRows.length > 0) {
      console.error(
        `⚠️ The following ${failedRows.length} records already exist and were skipped:`,
      );
      console.table(
        failedRows.map((row) => ({ symbol: row.symbol, date: row.date })),
      );
    }
  }
}
