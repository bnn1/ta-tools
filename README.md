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

See `benchmarks/` for detailed performance comparisons against other TA libraries.

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