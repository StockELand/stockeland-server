import json
import yfinance as yf
import pandas as pd
import sys
from datetime import datetime, timedelta


def parse_date(date_str, default):
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except (ValueError, TypeError):
        return default


def fetch_stock_data(symbols, start_date=None, end_date=None):

    if start_date and end_date:
        end_date = parse_date(end_date, datetime.now()) + timedelta(days=1)
        start_date = parse_date(start_date, datetime.now())
    else:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=10)

    data = yf.download(
        symbols,
        start=start_date.strftime('%Y-%m-%d'),
        end=end_date.strftime('%Y-%m-%d'),
        group_by='ticker',
        progress=False,
        auto_adjust=True,
    )

    if data.empty:
        print(json.dumps({"debug": "Data is empty!"}), flush=True)
        return

    total_symbols = len(symbols)
    for i, symbol in enumerate(symbols):
        try:
            stock_df = data.get(symbol, None)
            if stock_df is None:
                print(json.dumps(
                    {"debug": f"No data for {symbol}"}), flush=True)
                continue

            stock_df = stock_df.dropna()
            for index, row in stock_df.iterrows():
                result = {
                    "symbol": symbol,
                    "date": index.strftime('%Y-%m-%d'),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                }
                print(json.dumps({"data": result}), flush=True)

        except Exception as e:
            if "YFTzMissingError" in str(e):
                print(json.dumps(
                    {"warning": f"Skipped {symbol} due to missing timezone (possibly delisted)."}), flush=True)
                continue
            else:
                print(json.dumps(
                    {"error": f"Error processing {symbol}: {str(e)}"}), flush=True)

        print(json.dumps(
            {"progress": round((i + 1) / total_symbols * 100)}), flush=True)


if __name__ == '__main__':
    symbols = json.loads(sys.argv[1])
    start_date = sys.argv[2] if len(sys.argv) > 2 else None
    end_date = sys.argv[3] if len(sys.argv) > 3 else None
    fetch_stock_data(symbols, start_date, end_date)
