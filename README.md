# ta-tools

A high-performance Technical Analysis library written in **Rust** and compiled to **WebAssembly**.

`ta-tools` provides near-native calculation speeds for technical indicators while remaining universally compatible across Node.js, Bun, Deno, and modern browsers.

### Why?

Most existing TA libraries fall into two categories:
1.  **Pure JavaScript:** Easy to use but suffers from garbage collection overhead during heavy calculations.
2.  **Native C++ Add-ons (e.g., `tulind`):** Fast, but require complex compile-chains (`node-gyp`) on installation and do not run in the browser.

`ta-tools` solves this by using **WebAssembly**. It offers the performance of C++ with the portability of JavaScript.
*   **Zero Compilation:** Users do not need a C++ compiler installed.
*   **Universal:** The exact same package runs on the server and the client.
*   **Type Safe:** Built with Rust for memory safety and correctness.

---

## Installation

```bash
npm install ta-tools
```

---

## Supported Indicators

**Moving Averages:**
- SMA (Simple Moving Average)
- EMA (Exponential Moving Average)
- WMA (Weighted Moving Average)
- HMA (Hull Moving Average)

**Oscillators & Momentum:**
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Stochastic Fast/Slow
- Stochastic RSI

**Volatility:**
- Bollinger Bands
- ATR (Average True Range)
- Linear Regression

**Trend & Volume:**
- ADX (Average Directional Index)
- Ichimoku Cloud
- CVD (Cumulative Volume Delta)
- MFI (Money Flow Index)

**Volume Profile & VWAP:**
- Fixed Range Volume Profile
- Session VWAP
- Rolling VWAP
- Anchored VWAP

**Support Levels:**
- Pivot Points (Standard, Fibonacci, Woodie variants)

---

## Usage/API

### Basic Usage - Batch Mode

All indicators accept either `number[]` or `Float64Array` and return results immediately:

```typescript
import { sma, ema, rsi, bbands } from 'ta-tools';

const prices = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10];

// Simple Moving Average
const sma14 = sma(prices, 14);
console.log(sma14); // Float64Array

// Exponential Moving Average
const ema12 = ema(prices, 12);

// Relative Strength Index
const rsi14 = rsi(prices, 14);

// Bollinger Bands (period, standard deviations)
const bands = bbands(prices, 20, 2);
console.log(bands.upper);    // Upper band
console.log(bands.middle);   // Middle band (SMA)
console.log(bands.lower);    // Lower band
console.log(bands.percentB); // %B indicator
```

### OHLCV Indicators - Candle Input

OHLCV indicators accept `Candle[]` directly, eliminating positional arguments:

```typescript
import { atr, adx, ichimoku, mfi } from 'ta-tools';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: number;
}

const candles: Candle[] = [
  { open: 100, high: 102, low: 99, close: 101, volume: 1000000 },
  { open: 101, high: 103, low: 100, close: 102, volume: 1100000 },
  // ... more candles
];

// Average True Range
const atrValues = atr(candles, 14);

// Average Directional Index
const adxResult = adx(candles, 14);
console.log(adxResult.adx);     // ADX line
console.log(adxResult.plusDI);  // +DI
console.log(adxResult.minusDI); // -DI

// Ichimoku Cloud
const cloud = ichimoku(candles, 9, 26, 52);
console.log(cloud.tenkan);   // Conversion line
console.log(cloud.kijun);    // Base line
console.log(cloud.senkouA);  // Leading Span A
console.log(cloud.senkouB);  // Leading Span B
console.log(cloud.chikou);   // Lagging Span

// Money Flow Index
const mfiValues = mfi(candles, 14);
```

### Streaming Mode

For live data, use `.stream()` to maintain indicator state:

```typescript
import { rsi, ema, macd } from 'ta-tools';

// RSI streaming
const rsiStream = rsi.stream(14);
rsiStream.init([44.34, 44.09, 44.15, 43.61]); // Initialize with historical data
const currentRsi = rsiStream.next(44.33);     // Add new candle

// EMA streaming
const emaStream = ema.stream(12);
emaStream.init(historicalPrices);
const currentEma = emaStream.next(newPrice);

// MACD streaming
const macdStream = macd.stream(12, 26, 9);
macdStream.init(historicalPrices);
const { macd, signal, histogram } = macdStream.next(newPrice);
```

### Multi-Indicator Analysis

Use `analyze()` to run multiple indicators on the same data:

```typescript
import { analyze, sma, ema, rsi, bbands, macd } from 'ta-tools';

const results = analyze(prices, {
  sma20: (d) => sma(d, 20),
  sma50: (d) => sma(d, 50),
  rsi14: (d) => rsi(d, 14),
  bbands: (d) => bbands(d, 20, 2),
  macd: (d) => macd(d, 12, 26, 9),
});

console.log(results.sma20);       // Float64Array
console.log(results.rsi14);       // Float64Array
console.log(results.bbands.upper); // Float64Array
console.log(results.macd.histogram); // Float64Array
```

### Type Utilities

```typescript
import { toFloat64Array, extractOHLCV } from 'ta-tools';

// Convert number[] to Float64Array
const arr = toFloat64Array([1, 2, 3, 4, 5]); // Returns Float64Array

// Extract OHLCV components from Candle[]
const { open, high, low, close, volume, time } = extractOHLCV(candles);
```

---

## Performance Notes

`ta-tools` is optimized to minimize boundary overhead between JavaScript and WebAssembly:

*   **Zero-Copy Operations:** Arrays are passed directly to WASM without copying
*   **Memory:** Uses flat `Float64Array` buffers to avoid object overhead
*   **Precision:** All calculations use 64-bit floating-point precision (`f64`)
*   **Compilation:** WASM is pre-compiled and optimized with `wasm-opt -Oz`

### Benchmark Results

Below is a concise, exact summary of the [benchmarking results](benchmarks/2025-12-09-results.md).
Each cell shows how ta-tools (WASM) performs relative to the other libraries for the indicated dataset size (values are "times faster" where >1 means ta-tools is faster than the compared library, and <1 means ta-tools is slower).

| Indicator | Small (1k) | Big (10k) | Huge (100k) | Streaming (single next) |
|---|---:|---:|---:|---:|
| SMA | vs indicatorts: 0.58×<br>vs fast-technical-indicators: 1.82×<br>vs trading-signals: 8.51× | vs indicatorts: 0.69×<br>vs fast-technical-indicators: 2.63×<br>vs trading-signals: 14.14× | vs indicatorts: 1.46×<br>vs fast-technical-indicators: 4.95×<br>vs trading-signals: 13.41× | vs fast-technical-indicators: 0.99×<br>vs trading-signals: 1.16× |
| EMA | vs indicatorts: 1.05×<br>vs fast-technical-indicators: 1.27×<br>vs trading-signals: 1.55× | vs indicatorts: 1.29×<br>vs fast-technical-indicators: 1.33×<br>vs trading-signals: 6.08× | vs indicatorts: 2.26×<br>vs fast-technical-indicators: 4.11×<br>vs trading-signals: 6.28× | vs fast-technical-indicators: 0.94× |
| RSI | vs indicatorts: 2.52×<br>vs fast-technical-indicators: 16.79×<br>vs trading-signals: 19.71× | vs indicatorts: 2.81×<br>vs fast-technical-indicators: 16.47×<br>vs trading-signals: 19.69× | vs indicatorts: 4.10×<br>vs fast-technical-indicators: 15.71×<br>vs trading-signals: 15.36× | vs fast-technical-indicators: 1.18×<br>vs trading-signals: 1.18× |
| WMA | vs fast-technical-indicators: 2.90×<br>vs trading-signals: 9.45× | vs fast-technical-indicators: 4.05×<br>vs trading-signals: 15.11× | vs fast-technical-indicators: 6.48×<br>vs trading-signals: 14.67× | vs fast-technical-indicators: 0.98× |
| MACD | vs indicatorts: 0.99×<br>vs fast-technical-indicators: 2.26×<br>vs trading-signals: 4.06× | vs indicatorts: 1.23×<br>vs fast-technical-indicators: 2.65×<br>vs trading-signals: 5.79× | vs indicatorts: 1.45×<br>vs fast-technical-indicators: 4.10×<br>vs trading-signals: 3.64× | vs fast-technical-indicators: 0.81× |
| Bollinger Bands | vs indicatorts: 1.08×<br>vs fast-technical-indicators: 6.91×<br>vs trading-signals: 11.52× | vs indicatorts: 1.33×<br>vs fast-technical-indicators: 10.09×<br>vs trading-signals: 16.47× | vs indicatorts: 1.66×<br>vs fast-technical-indicators: 10.69×<br>vs trading-signals: 10.80× | vs fast-technical-indicators: 1.05×<br>vs trading-signals: 1.03× |
| ATR | vs indicatorts: 7.13×<br>vs fast-technical-indicators: 1.34×<br>vs trading-signals: 4.42× | vs indicatorts: 9.93×<br>vs fast-technical-indicators: 1.36×<br>vs trading-signals: 5.90× | vs indicatorts: 13.22×<br>vs fast-technical-indicators: 2.85×<br>vs trading-signals: 4.56× | vs fast-technical-indicators: 1.00×<br>vs trading-signals: 1.04× |
| Stochastic Oscillator | vs indicatorts: 2.25×<br>vs fast-technical-indicators: 4.80×<br>vs trading-signals: 9.45× | vs indicatorts: 2.00×<br>vs fast-technical-indicators: 3.99×<br>vs trading-signals: 8.08× | vs indicatorts: 2.23×<br>vs fast-technical-indicators: 4.78×<br>vs trading-signals: 8.26× | vs fast-technical-indicators: 0.95×<br>vs trading-signals: 0.73× |
| MFI | vs indicatorts: 4.55×<br>vs fast-technical-indicators: 13.57× | vs indicatorts: 6.93×<br>vs fast-technical-indicators: 20.02× | vs indicatorts: 7.53×<br>vs fast-technical-indicators: 14.15× | vs fast-technical-indicators: 1.12× |
| ADX | vs fast-technical-indicators: 2.68×<br>vs trading-signals: 8.63× | vs fast-technical-indicators: 3.06×<br>vs trading-signals: 10.06× | vs fast-technical-indicators: 4.90×<br>vs trading-signals: 7.74× | vs fast-technical-indicators: 0.87×<br>vs trading-signals: 0.85× |
| StochRSI | vs fast-technical-indicators: 3.25× | vs fast-technical-indicators: 3.54× | vs fast-technical-indicators: 4.30× | vs fast-technical-indicators: 1.10× |
| Ichimoku Cloud | vs fast-technical-indicators: 1.79×<br>vs indicatorts: 16.90× | vs fast-technical-indicators: 2.04×<br>vs indicatorts: 98.41× | vs fast-technical-indicators: 1.80× | vs fast-technical-indicators: 1.19× |
| VWAP (Session) | vs indicatorts: 0.83× | vs indicatorts: 1.33× | vs indicatorts: 1.31× | - |


*Notes: the ATR rows in the original report list 'ta-tools (WASM) - ATR > Small dataset' as "1.34x faster than fast-technical-indicators" and "7.13x faster than indicatorts" etc. For readability this table shows ta-tools's reported multiplier against each library directly when available; where the report lists another library being faster than ta-tools the table displays the computed inverse (ta-tools relative to that library). Empty cells mean the report did not include a direct entry for that combination.

For full per-indicator, dataset, and streaming breakdowns see `benchmarks/2025-12-09-results.md`.

---

## Development

### Prerequisites

*   [Rust](https://www.rust-lang.org/tools/install) (1.56+)
*   [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
*   Node.js 22+

### Build

```bash
# Full build (WASM + TypeScript)
npm run build

# WASM only
npm run build:wasm

# TypeScript only
npm run build:ts
```

### Test

```bash
npm test
npm run bench
```

### Project Structure

```
.
├── crates/ta-core/           # Rust WASM library
│   └── src/indicators/        # Indicator implementations
├── js/                        # TypeScript wrapper
│   └── index.ts              # High-level API
├── dist/                     # Compiled TypeScript
├── pkg/                      # Compiled WASM
└── tests/                    # Integration tests
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new indicators
4. Ensure `npm run build && npm test` passes
5. Open a pull request

## Roadmap

- [ ] Add more exotic indicators
- [ ] Browser-specific optimizations
- [ ] Binary persistence/deserialization
- [ ] WebWorker utilities
- [ ] Deno support

## License

MIT