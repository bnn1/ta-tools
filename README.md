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

const average = sma(prices, { period: 3 }, new Float64Array(prices.values.length));
const bands = bbands(
  prices,
  { period: 3, k: 2 },
  {
    upper: new Float64Array(prices.values.length),
    middle: new Float64Array(prices.values.length),
    lower: new Float64Array(prices.values.length),
    percentB: new Float64Array(prices.values.length),
    bandwidth: new Float64Array(prices.values.length),
  },
);
const trend = macd(prices, {
  fastPeriod: 3,
  slowPeriod: 5,
  signalPeriod: 2,
  signalType: "ema",
}, {
  macd: new Float64Array(prices.values.length),
  signal: new Float64Array(prices.values.length),
  histogram: new Float64Array(prices.values.length),
});
```

OHLC-based indicators use the smallest required record shape:

```typescript
import { atr, sessionVwap } from "@bnn1/ta-tools";

const high = new Float64Array([102, 103, 104]);
const low = new Float64Array([99, 100, 101]);
const close = new Float64Array([101, 102, 103]);
const volume = new Float64Array([1000, 1100, 1200]);

const range = atr(
  { high, low, close },
  { period: 2 },
  new Float64Array(high.length),
);
const vwap = sessionVwap({
  timestamp: new Float64Array([0, 60_000, 120_000]),
  high,
  low,
  close,
  volume,
}, new Float64Array(high.length));
```

All related columns must have equal lengths and finite values. Timestamps must be safe integer Unix-millisecond values. Invalid inputs throw explicit errors.

Batch output buffers are caller-owned and must have the input length. Reuse them across repeated calculations to avoid allocating and copying a result on every call.

## Streaming API

Stream classes accept the same options and record shapes as batch functions:

```typescript
import { EmaStream, MacdStream } from "@bnn1/ta-tools";

const prices = { values: new Float64Array([1, 2, 3, 4]) };

const ema = new EmaStream({ period: 3 });
ema.init(prices, new Float64Array(prices.values.length));
const current = ema.next(5); // number | undefined

const macd = new MacdStream({
  fastPeriod: 3,
  slowPeriod: 5,
  signalPeriod: 2,
  signalType: "ema",
});
macd.init(prices, {
  macd: new Float64Array(prices.values.length),
  signal: new Float64Array(prices.values.length),
  histogram: new Float64Array(prices.values.length),
});
const point = macd.next(5); // MacdPoint | undefined

// Allocation-free stream updates use caller-owned output buffers:
const nextOutput = new Float64Array(1);
const ready = ema.nextInto(6, nextOutput); // boolean
```

Streams return `undefined` until they can produce a value. Batch results preserve the indicator's leading `NaN` alignment. Every regular stream also keeps its complete output history in native memory: `history()` returns an allocating snapshot, while `historyInto(output)` copies the history into a caller-owned buffer (or output object) whose arrays must have the current history length.

```typescript
const history = ema.history(); // Float64Array: init output plus every next/nextInto result
const reusableHistory = new Float64Array(ema.historyLength);
ema.historyInto(reusableHistory);
ema.reset(); // clears both indicator state and history
```

FRVP remains snapshot-only because each output is a full volume-profile histogram rather than a single output series. Native stream objects are garbage-collected normally; no `free()` method is exposed.

## Multi-indicator analysis

```typescript
import { analyze, rsi, sma } from "@bnn1/ta-tools";

const result = analyze(prices, {
  average: (series) =>
    sma(series, { period: 3 }, new Float64Array(series.values.length)),
  strength: (series) =>
    rsi(series, { period: 3 }, new Float64Array(series.values.length)),
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

Run the complete deterministic benchmark matrix with:

```bash
pnpm bench
```

This runs every public batch case at 1,000, 10,000, and 100,000 values, plus every retained stream class after each of those initialization sizes. Each matrix row is labeled `ta-tools (NAPI)`, `ta-tools (WASM)`, or by the installed comparison library: `fast-technical-indicators@1.1.4`, `indicatorts@2.2.2`, and `trading-signals@8.2.0`. Unsupported equivalents are omitted instead of being represented by unrelated algorithms; closest-semantic cases such as close/volume VWAP and volume profile are labeled explicitly. Results are written to `benchmark-results.json`; FRVP streaming is labeled as append/recalculate because it is not an O(1) update.

## License

MIT
