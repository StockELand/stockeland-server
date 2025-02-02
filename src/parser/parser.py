import json
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

symbols = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'BRK-B', 'NVDA', 'TSLA', 'META', 'UNH',
    'XOM', 'JNJ', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'LLY', 'PEP', 'KO',
    'ABBV', 'AVGO', 'COST', 'TMO', 'CSCO', 'MCD', 'ACN', 'NEE', 'WMT', 'DHR',
    'DIS', 'ADBE', 'NFLX', 'INTC', 'AMD', 'TXN', 'PYPL', 'HON', 'ABT', 'CRM',
    'QCOM', 'MDT', 'NKE', 'UPS', 'BMY', 'RTX', 'LIN', 'ORCL', 'AMGN', 'LOW',
    'CVS', 'UNP', 'MS', 'T', 'USB', 'SCHW', 'GS', 'RTX', 'BLK', 'C', 'BK',
    'PLD', 'SCHW', 'SPGI', 'AXP', 'CI', 'CNC', 'DE', 'DUK', 'HUM', 'ICE', 'ITW',
    'MMM', 'TGT', 'CAT', 'FDX', 'WM', 'MO', 'PSA', 'LMT', 'EL', 'SYK', 'ADI',
    'D', 'BDX', 'ETN', 'ZTS', 'ADP', 'ISRG', 'CL', 'GILD', 'BSX', 'PGR',
    'AMT', 'MDLZ', 'TFC', 'CCI', 'NSC', 'WM', 'TJX', 'SHW', 'SPG', 'NOW',
    'HCA', 'EOG', 'CMCSA', 'ATVI', 'CARR', 'EXC', 'AON', 'COP', 'VRTX', 'EQIX',
    'ICE', 'MCO', 'REGN', 'APD', 'CHTR', 'SO', 'BAX', 'KHC', 'KMB', 'AEP',
    'SBUX', 'GM', 'FIS', 'DFS', 'EBAY', 'HAL', 'DOW', 'KMI', 'WBA', 'SYY',
    'STZ', 'ADM', 'AIG', 'PRU', 'FISV', 'FTNT', 'MET', 'HLT', 'TEL', 'DD',
    'WELL', 'CTVA', 'TRV', 'PXD', 'ECL', 'APH', 'PPL', 'ROK', 'PCAR', 'AFL',
    'GLW', 'DLR', 'HSY', 'MAR', 'CMS', 'SLB', 'PAYX', 'MSCI', 'ED', 'ODFL',
    'HIG', 'CTAS', 'CME', 'MNST', 'MTD', 'ROST', 'CDNS', 'FAST', 'IQV', 'IDXX'
]


def fetch_stock_data(symbols):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=100)
    data = yf.download(symbols, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), group_by='ticker', progress=False)

    if data.empty:
        return []

    results = []

    for symbol in symbols:
        try:
            stock_df = data.xs(symbol, level="Ticker", axis=1).dropna()
            for index, row in stock_df.iterrows():
                try:
                    results.append({
                        "symbol": symbol,
                        "date": index.strftime('%Y-%m-%d'),
                        "open": round(row["Open"], 2),
                        "high": round(row["High"], 2),
                        "low": round(row["Low"], 2),
                        "close": round(row["Close"], 2),
                        "volume": int(row["Volume"]),
                    })
                except Exception as e:
                    print(f"⚠️ Error processing row {index} for {symbol}: {e}")

        except KeyError:
            print(f"⚠️ No data found for {symbol}")
        except Exception as e:
            print(f"⚠️ Unexpected error for {symbol}: {e}")

    return results

if __name__ == '__main__':
    stock_data = fetch_stock_data(symbols)
    print(json.dumps(stock_data, indent=4))