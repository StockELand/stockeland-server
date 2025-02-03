import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Subject } from 'rxjs';
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

interface ProgressUpdatePayload {
  progress: number;
  state: string;
}

@Injectable()
export class StockService {
  private progressSubject = new Subject<ProgressUpdatePayload>();

  constructor(
    @InjectRepository(StockData)
    private stockRepository: Repository<StockData>,
    @InjectQueue('stock-queue') private stockQueue: Queue,
  ) {}

  getProgressStream() {
    return this.progressSubject.asObservable();
  }

  @OnEvent('progress.update')
  handleProgressUpdate(payload: ProgressUpdatePayload) {
    this.progressSubject.next(payload);
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

    // ✅ 실패한 데이터 로그만 출력 (재시도 없음)
    if (failedRows.length > 0) {
      console.error(
        `⚠️ The following ${failedRows.length} records already exist and were skipped:`,
      );
      console.table(
        failedRows.map((row) => ({ symbol: row.symbol, date: row.date })),
      );
    }
  }
  async startStockParsing(): Promise<void> {
    const existingJobs = await this.stockQueue.getJobs([
      'waiting', // 대기 중인 작업
      'active', // 실행 중인 작업
      'delayed', // 예약된 작업
    ]);

    console.log(existingJobs);

    if (existingJobs.length > 0) {
      console.log(
        `A job is already in progress. Job ID: ${existingJobs[0].id}`,
      );
      return;
    }

    await this.stockQueue.add('parse-stock-data', { symbols });
    console.log('New job added to queue.');
  }

  async removeJob(jobId: string): Promise<{ message: string }> {
    const job = await this.stockQueue.getJob(jobId);
    if (!job) {
      return { message: `Job with ID ${jobId} not found.` };
    }

    await job.remove(); // ✅ 작업을 강제 종료 및 삭제
    return { message: `Job with ID ${jobId} has been removed.` };
  }
}
