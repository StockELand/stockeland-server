import sys
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout, Bidirectional, Conv1D, Attention, Concatenate
from tensorflow.keras.callbacks import EarlyStopping,Callback
from tensorflow.keras.regularizers import L1L2

def training_progress_callback():
    class TrainingProgressCallback(Callback):
        def on_epoch_end(self, epoch, logs=None):
            print(json.dumps({"progress": round((epoch+1)/10*100)}), flush=True)
    return TrainingProgressCallback()

def preprocess_data(df):
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(df.values)
    return scaled_data, scaler

def create_dataset(data, lookback):
    X, Y = [], []
    for i in range(len(data) - lookback):
        X.append(data[i:i+lookback])
        Y.append(data[i+lookback])
    return np.array(X), np.array(Y)

def build_model(input_shape):
    input_layer = Input(shape=input_shape)
    conv1 = Conv1D(64, 3, activation='relu', padding='same')(input_layer)
    conv2 = Conv1D(64, 3, activation='relu', padding='same')(conv1)

    bilstm1 = Bidirectional(LSTM(128, return_sequences=True))(conv2)
    bilstm2 = Bidirectional(LSTM(128, return_sequences=True))(bilstm1)
    bilstm3 = Bidirectional(LSTM(64, return_sequences=True))(bilstm2)

    query = Dense(128)(bilstm3)
    value = Dense(128)(bilstm3)
    attention_output = Attention()([query, value])

    concat_layer = Concatenate()([bilstm3, attention_output])
    dropout_layer = Dropout(0.3)(concat_layer)

    bilstm4 = Bidirectional(LSTM(64))(dropout_layer)
    dropout_layer2 = Dropout(0.3)(bilstm4)

    dense_layer1 = Dense(128, activation='relu')(dropout_layer2)
    dropout_layer3 = Dropout(0.3)(dense_layer1)

    output_layer = Dense(input_shape[1], kernel_regularizer=L1L2(l1=0.01, l2=0.01))(dropout_layer3)

    model = Model(inputs=input_layer, outputs=output_layer)
    model.compile(optimizer='adam', loss='mse')
    return model

def read_stdin():
    input_data = ""
    for line in sys.stdin:
        input_data += line
    return input_data

if __name__ == "__main__":
    # NestJS에서 JSON 데이터를 stdin으로 받음
    input_data = read_stdin()
    
    try:
        json_data = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    try:
        df = pd.DataFrame(json_data)
        
        # 날짜 변환
        df['date'] = pd.to_datetime(df['date'])
        
        # 숫자로 변환 (open, high, low, close, volume)
        df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].astype(float)

        # 피벗 테이블 생성 (각 symbol을 컬럼으로 변환하여 close price 사용)
        df_pivot = df.pivot_table(index='date', columns='symbol', values='close')

        # NaN 값 제거 (일부 종목이 NaN일 경우 제거)
        df_pivot.dropna(axis=1, how='any', inplace=True)

        df_pivot.sort_index(inplace=True)

    except Exception as e:
        print(json.dumps({"error": f"Error processing input data: {str(e)}"}))
        sys.exit(1)

    # 데이터 스케일링
    scaled_data, scaler = preprocess_data(df_pivot)
    lookback = min(100, len(df_pivot) // 2)
    X, Y = create_dataset(scaled_data, lookback)

    if len(X) > 0:
        model = build_model((lookback, len(df_pivot.columns)))
        early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        model.fit(X, Y, epochs=10, batch_size=1, validation_split=0.2, callbacks=[early_stopping, training_progress_callback()],verbose=0)

        # 마지막 100일 데이터를 가져와 예측 수행
        test_data = scaled_data[-lookback:]
        test_data = test_data.reshape(1, lookback, len(df_pivot.columns))
        y_pred = model.predict(test_data)

        # 스케일링 역변환
        last_close_prices = df_pivot.iloc[-1].values.reshape(1, -1)
        y_pred = scaler.inverse_transform(y_pred)

        # 예측 상승률 계산
        price_changes = [
            {"symbol": symbol, "change_percent": ((y_pred[0, i] - last_close_prices[0, i]) / last_close_prices[0, i]) * 100}
            for i, symbol in enumerate(df_pivot.columns)
        ]
        price_changes.sort(key=lambda x: x["change_percent"], reverse=True)
        for stock in price_changes:
            print(json.dumps({"data": stock}), flush=True)
    else:
        print(json.dumps({"error": "Insufficient data to train the model"}))