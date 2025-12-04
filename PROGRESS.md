# ta-tools Development Progress

---

## 📋 Next Steps

### Remaining Tier A Indicators

1. **VWAP (Volume Weighted Average Price)**
   - Three modes: Session (daily reset), Rolling (window), Anchored (from timestamp)
   - Requires OHLCV input, not just prices

2. **Stochastic RSI**
   - RSI of RSI with stochastic formula

3. **Pivot Points**
   - Standard, Fibonacci, Woodie variants
   - Auto-detect timeframe from timestamps

4. **FRVP (Fixed Range Volume Profile)**
   - Volume histogram by price level
   - Output: POC, VAH, VAL

5. **CVD (Cumulative Volume Delta)**
   - Requires buy/sell volume input
   - Simple cumulative sum

### Tier B Indicators

6. **MFI (Money Flow Index)** - Volume-weighted RSI
7. **HMA (Hull Moving Average)** - Low-lag MA using WMA
8. **Ichimoku Cloud** - Full suite (5 components)
9. **ADX (Average Directional Index)** - Trend strength
10. **Linear Regression Channels** - With Pearson's R

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

**Total: 8 indicators implemented with batch + streaming modes**

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

**Streaming classes (stateful):**
- `SmaStream`, `EmaStream`, `RsiStream`, `WmaStream` - Single value input
- `MacdStream` - Returns `{ macd, signal, histogram }` output object
- `BBandsStream` - Returns `{ upper, middle, lower, percentB, bandwidth }` output object
- `AtrStream` - Takes (high, low, close) per candle
- `StochFastStream`, `StochSlowStream` - Takes (high, low, close), returns `{ k, d }`

**Common interface:**
- Constructor: `new XxxStream(period, ...options)`
- Methods: `init(data)`, `next(value)`, `reset()`, `isReady()`
- Getters: `period`, plus indicator-specific (e.g., `multiplier` for EMA, `k` for BBands)

### Phase 5: Testing ✅

**Test counts:**
- Rust unit tests: 68 passing
- Rust doc-tests: 10 passing  
- JS integration tests: 33 passing

**Test coverage:**
- Batch calculation correctness
- Streaming matches batch results
- Comparison with `fast-technical-indicators` library
- Edge cases (empty data, insufficient data, invalid params)
- Multi-input indicators (ATR, Stochastic with high/low/close)

### Phase 6: Optimization ✅

**WASM Optimization:**
- wasm-opt enabled with `--enable-simd -O3` flags
- WASM binary size: 75KB (optimized)
- Full LLVM optimization including ICF (Identical Code Folding)

