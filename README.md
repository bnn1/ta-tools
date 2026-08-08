# ta-tools

High-performance technical-analysis indicators implemented in Rust and exposed through a Node.js 26+ ESM API using NAPI-RS.

The package accepts columnar `Float64Array` records, returns typed-array results, and exposes explicit stream classes. It is a breaking, Node-only API: `number[]`, `Candle[]`, positional overloads, implicit defaults, and function `.stream()` helpers are not supported.

## Installation

```bash
pnpm add @bnn1/ta-tools
```

The package is ESM-only and requires Node.js 26 or newer.

## Batch API

```typescript
import { bbands, macd, sma } from "@bnn1/ta-tools";

const prices = {
  values: new Float64Array([44.34, 44.09, 44.15, 43.61, 44.33, 44.83]),
};

const average = sma(prices, { period: 3 });
const bands = bbands(prices, { period: 3, k: 2 });
const trend = macd(prices, {
  fastPeriod: 3,
  slowPeriod: 5,
  signalPeriod: 2,
  signalType: "ema",
});
```

OHLC-based indicators use the smallest required record shape:

```typescript
import { atr, sessionVwap } from "@bnn1/ta-tools";

const high = new Float64Array([102, 103, 104]);
const low = new Float64Array([99, 100, 101]);
const close = new Float64Array([101, 102, 103]);
const volume = new Float64Array([1000, 1100, 1200]);

const range = atr({ high, low, close }, { period: 2 });
const vwap = sessionVwap({
  timestamp: new Float64Array([0, 60_000, 120_000]),
  high,
  low,
  close,
  volume,
});
```

All related columns must have equal lengths and finite values. Timestamps must be safe integer Unix-millisecond values. Invalid inputs throw explicit errors.

## Streaming API

Stream classes accept the same options and record shapes as batch functions:

```typescript
import { EmaStream, MacdStream } from "@bnn1/ta-tools";

const prices = { values: new Float64Array([1, 2, 3, 4]) };

const ema = new EmaStream({ period: 3 });
ema.init(prices);
const current = ema.next(5); // number | undefined

const macd = new MacdStream({
  fastPeriod: 3,
  slowPeriod: 5,
  signalPeriod: 2,
  signalType: "ema",
});
macd.init(prices); // MacdPoint[]
const point = macd.next(5); // MacdPoint | undefined
```

Streams return `undefined` until they can produce a value. Batch results preserve the indicator's leading `NaN` alignment. Native stream objects are garbage-collected normally; no `free()` method is exposed.

## Multi-indicator analysis

```typescript
import { analyze, rsi, sma } from "@bnn1/ta-tools";

const result = analyze(prices, {
  average: (series) => sma(series, { period: 3 }),
  strength: (series) => rsi(series, { period: 3 }),
});
```

## Development

Prerequisites:

- Node.js 26+
- pnpm
- Rust and Cargo

Build the native addon, bundle, and declarations with:

```bash
pnpm run build
```

Run the tests with:

```bash
pnpm run test
```

The Rust algorithms live in `crates/ta-core`, native bindings live in `crates/ta-native`, and the typed TypeScript facade lives in `js/`. The generated `native/` loader and `dist/` bundle are build output. The package is native-only; platform-specific NAPI-RS packages are added during the publishing step.

## License

MIT
