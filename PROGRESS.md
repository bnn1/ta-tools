# ta-tools Development Progress

---

## 📋 Next Steps

### Remaining Tier A Indicators

1. **FRVP (Fixed Range Volume Profile)**
   - Volume histogram by price level
   - Output: POC, VAH, VAL

### Tier B Indicators

2. **MFI (Money Flow Index)** - Volume-weighted RSI
3. **HMA (Hull Moving Average)** - Low-lag MA using WMA
4. **Ichimoku Cloud** - Full suite (5 components)
5. **ADX (Average Directional Index)** - Trend strength
6. **Linear Regression Channels** - With Pearson's R

### Infrastructure Improvements

- [ ] GitHub Actions CI/CD pipeline
- [ ] npm publish workflow
- [ ] Documentation site (TypeDoc or similar)
- [ ] Add Rust-level benchmarks with Criterion

### Optimizations

- [ ] Add `#[inline]` hints for hot paths
- [ ] Consider use shared memory (SharedArrayBuffer) to avoid copies
- [ ] Consider batch `next()` method to reduce WASM calls
- [ ] Consider keep more state in JS for streaming to reduce WASM calls

### API Enhancements

- [ ] Add OHLCV-based indicator variants
- [ ] Support custom smoothing multipliers for all MAs
- [ ] Add `update()` method to modify last value (for live candle updates)
- [ ] Provide raw indicator state for serialization/persistence

---

## ✅ Completed Work

### Phase 1: Project Foundation ✅

**Project Structure:**
- Rust workspace with `crates/ta-core` for the WASM library
- TypeScript wrapper in `src/` for ergonomic API
- Build outputs: `pkg/` (WASM), `dist/` (JS)
- Testing with Vitest, benchmarking against `fast-technical-indicators`

**Configuration:**
- `Cargo.toml` workspace with optimized release profile (LTO, opt-level 3)
- `wasm-pack` targeting Node.js with SIMD enabled
- TypeScript with ESM modules targeting ES2022

### Phase 2: Core Architecture ✅

**Traits defined in `traits.rs`:**
- `Indicator<Input, Output>` - Batch/historical calculations
- `StreamingIndicator<Input, Output>` - O(1) real-time updates with `init()`, `next()`, `reset()`, `is_ready()`

**Types defined in `types.rs`:**
- `OHLCV` struct with timestamp (Unix ms), open, high, low, close, volume
- `IndicatorError` enum for proper error handling
- Helper methods: `typical_price()`, `median_price()`

### Phase 3: Indicator Implementations ✅

| Indicator | Batch | Streaming | Algorithm | Tests |
|-----------|-------|-----------|-----------|-------|
| SMA | `Sma` | `SmaStream` | Ring buffer O(1) | ✅ |
| EMA | `Ema` | `EmaStream` | O(1), stores prev only | ✅ |
| RSI | `Rsi` | `RsiStream` | Wilder's smoothing | ✅ |
| WMA | `Wma` | `WmaStream` | Ring buffer + weighted sum | ✅ |
| MACD | `Macd` | `MacdStream` | Composes 3 EMA streams | ✅ |
| Bollinger Bands | `BBands` | `BBandsStream` | Welford's online variance O(1) | ✅ |
| ATR | `Atr` | `AtrStream` | Wilder's smoothing on True Range | ✅ |
| Stochastic | `Stoch` | `StochStream` | Monotonic deques for O(1) min/max | ✅ |
| Stochastic RSI | `StochRsi` | `StochRsiStream` | RSI + Stochastic with deques | ✅ |
| CVD | `Cvd`, `CvdOhlcv` | `CvdStream`, `CvdOhlcvStream` | Cumulative sum, OHLCV delta approx | ✅ |
| **VWAP** | `SessionVwap`, `RollingVwap`, `AnchoredVwap` | `SessionVwapStream`, `RollingVwapStream`, `AnchoredVwapStream` | Cumulative TP×Vol / Vol | ✅ |
| **Pivot Points** | `PivotPoints` | N/A (stateless) | Standard, Fibonacci, Woodie | ✅ |

**Total: 12 indicators implemented**

### Phase 4: WASM Bindings ✅

**Batch functions (stateless):**
- `sma(data: Float64Array, period: number): Float64Array`
- `ema(data: Float64Array, period: number): Float64Array`
- `rsi(data: Float64Array, period: number): Float64Array`
- `wma(data: Float64Array, period: number): Float64Array`
- `macd(data, fastPeriod, slowPeriod, signalPeriod): { macd, signal, histogram }`
- `bbands(data, period, k): { upper, middle, lower, percentB, bandwidth }`
- `atr(high, low, close, period): Float64Array`
- `stochFast(high, low, close, kPeriod, dPeriod): { k, d }`
- `stochSlow(high, low, close, kPeriod, dPeriod, slowing): { k, d }`
- `stochRsi(data, rsiPeriod, stochPeriod, kSmooth, dPeriod): { k, d }`
- `cvd(deltas): Float64Array` - From pre-computed deltas
- `cvdOhlcv(high, low, close, volume): Float64Array` - Approximates delta from candle structure
- `sessionVwap(timestamps, opens, highs, lows, closes, volumes): Float64Array` - Daily reset VWAP
- `rollingVwap(timestamps, opens, highs, lows, closes, volumes, period): Float64Array` - Window-based
- `anchoredVwap(timestamps, opens, highs, lows, closes, volumes, anchorIndex): Float64Array`
- `anchoredVwapFromTimestamp(timestamps, opens, highs, lows, closes, volumes, anchorTs): Float64Array`
- `pivotPoints(high, low, close, variant): { pivot, r1, r2, r3, s1, s2, s3 }` - Single candle
- `pivotPointsBatch(highs, lows, closes, variant): { pivot, r1, r2, r3, s1, s2, s3 }` - Arrays

**Streaming classes (stateful):**
- `SmaStream`, `EmaStream`, `RsiStream`, `WmaStream` - Single value input
- `MacdStream` - Returns `{ macd, signal, histogram }` output object
- `BBandsStream` - Returns `{ upper, middle, lower, percentB, bandwidth }` output object
- `AtrStream` - Takes (high, low, close) per candle
- `StochFastStream`, `StochSlowStream` - Takes (high, low, close), returns `{ k, d }`
- `StochRsiStream` - Single value input, returns `{ k, d }`
- `CvdStream` - Direct delta input, returns cumulative value
- `CvdOhlcvStream` - Takes (high, low, close, volume), returns cumulative value
- `SessionVwapStream` - OHLCV input, resets daily at UTC midnight
- `RollingVwapStream` - OHLCV input, sliding window
- `AnchoredVwapStream` - OHLCV input, from anchor point

**Common interface:**
- Constructor: `new XxxStream(period, ...options)`
- Methods: `init(data)`, `next(value)`, `reset()`, `isReady()`
- Getters: `period`, plus indicator-specific (e.g., `multiplier` for EMA, `k` for BBands)

### Phase 5: Testing ✅

**Test counts:**
- Rust unit tests: 110 passing
- JS integration tests: 78 passing

**Test coverage:**
- Batch calculation correctness
- Streaming matches batch results
- Comparison with `fast-technical-indicators` library
- Edge cases (empty data, insufficient data, invalid params)
- Multi-input indicators (ATR, Stochastic with high/low/close)
- NaN handling - returns NaN for insufficient data, never crashes

### Phase 6: Optimization ✅

**WASM Optimization:**
- wasm-opt enabled with `--enable-simd --enable-bulk-memory --enable-nontrapping-float-to-int -O3`
- WASM binary size: ~80KB (optimized)
- Full LLVM optimization including ICF (Identical Code Folding)

