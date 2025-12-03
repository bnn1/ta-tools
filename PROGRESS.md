# ta-tools Development Progress

---

## 🚨 INVESTIGATION QUEUE (Priority)

### Issue 1: Synchronous WASM Compilation Bottleneck
**File:** `pkg/ta_core.js` (bottom of file)
**Problem:** `new WebAssembly.Module()` and `new WebAssembly.Instance()` are synchronous operations.
**Impact:**
- Event loop blocking during startup if WASM binary is large
- V8 engine has ~4KB limit on sync WASM compilation on main thread
- May throw errors or warnings in some Node.js versions

**Solution Plan:**
- [ ] Research wasm-bindgen/wasm-pack options for async module instantiation
- [ ] Consider using `WebAssembly.instantiateStreaming()` or `WebAssembly.compile()` + `WebAssembly.instantiate()` 
- [ ] May need custom JS wrapper that lazily initializes WASM on first use
- [ ] Check if `--target web` vs `--target nodejs` affects this behavior

### Issue 2: Function Aliasing (Confusing Stack Traces)
**File:** `pkg/ta_core.js`
**Problem:** Compiler optimization merges identical functions (e.g., `bbandsstream_k` used for `WasmMacdOutput.macd`)
**Impact:**
- Stack traces show wrong function names during debugging
- Code appears to call BBands functions when actually using MACD

**Root Cause:** LLVM/wasm-opt ICF (Identical Code Folding) - functions that compile to same bytecode are merged.

**Solution Plan:**
- [ ] Research wasm-pack/wasm-opt flags to disable ICF (`--no-icf` or similar)
- [ ] Alternative: Add `#[inline(never)]` or `std::hint::black_box()` in Rust to force unique code
- [ ] Alternative: Accept this as cosmetic issue (all tests pass, values correct)
- [ ] Document this behavior for library users

### Issue 3: Memory Detachment Vulnerability
**File:** `pkg/ta_core.js` - `passArrayF64ToWasm0` function
**Problem:** If WASM output (a view into WASM memory) is passed directly to another WASM function without `.slice()`, memory growth can detach the input buffer.

**Scenario:**
1. Get `Float64Array` result from WASM function (backed by WASM memory)
2. Pass it to another WASM function
3. If `malloc` triggers memory growth, original buffer detaches
4. `.set(arg)` fails because `arg` is now length 0

**Current State:** Generated exports call `.slice()` on returns (safe). Risk exists for manual `Stream` class usage.

**Solution Plan:**
- [ ] Audit all WASM exports to ensure they return copied arrays, not views
- [ ] Add documentation warning about retaining WASM memory views
- [ ] Consider wrapper that auto-slices outputs

### Issue 4: Finalizer/GC Reliability for Memory Management
**File:** `pkg/ta_core.js` - `FinalizationRegistry` usage
**Problem:** WASM memory cleanup relies on JavaScript GC timing.

**Risk:** Creating many stream objects in tight loops may exhaust WASM memory (2-4GB cap) before GC runs.

**Solution Plan:**
- [ ] Document best practice: call `.free()` or use `using` keyword explicitly
- [ ] Add usage examples showing proper disposal patterns
- [ ] Consider adding pool/reuse pattern for high-throughput scenarios

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

**Total: 7 indicators implemented with batch + streaming modes**

### Phase 4: WASM Bindings ✅

**Batch functions (stateless):**
- `sma(data: Float64Array, period: number): Float64Array`
- `ema(data: Float64Array, period: number): Float64Array`
- `rsi(data: Float64Array, period: number): Float64Array`
- `wma(data: Float64Array, period: number): Float64Array`
- `macd(data, fastPeriod, slowPeriod, signalPeriod): { macd, signal, histogram }`
- `bbands(data, period, k): { upper, middle, lower, percentB, bandwidth }`
- `atr(high, low, close, period): Float64Array`

**Streaming classes (stateful):**
- `SmaStream`, `EmaStream`, `RsiStream`, `WmaStream` - Single value input
- `MacdStream` - Returns `{ macd, signal, histogram }` output object
- `BBandsStream` - Returns `{ upper, middle, lower, percentB, bandwidth }` output object
- `AtrStream` - Takes (high, low, close) per candle

**Common interface:**
- Constructor: `new XxxStream(period, ...options)`
- Methods: `init(data)`, `next(value)`, `reset()`, `isReady()`
- Getters: `period`, plus indicator-specific (e.g., `multiplier` for EMA, `k` for BBands)

### Phase 5: Testing ✅

**Test counts:**
- Rust unit tests: 56 passing
- Rust doc-tests: 10 passing  
- JS integration tests: 26 passing

**Test coverage:**
- Batch calculation correctness
- Streaming matches batch results
- Comparison with `fast-technical-indicators` library
- Edge cases (empty data, insufficient data, invalid params)
- Multi-input indicators (ATR with high/low/close)

### Phase 6: Bug Fixes ✅

**WASM Binding Struct Refactor:**
- Converted `WasmMacdOutput` and `WasmBBandsOutput` from public fields with `#[wasm_bindgen(readonly)]` to private fields with explicit `#[wasm_bindgen(getter)]` methods
- This makes the Rust code cleaner and more intentional
- Note: Function aliasing still occurs (cosmetic issue, values are correct)

---

## 📋 Next Steps

### Remaining Tier A Indicators

1. **VWAP (Volume Weighted Average Price)**
   - Three modes: Session (daily reset), Rolling (window), Anchored (from timestamp)
   - Requires OHLCV input, not just prices

2. **Stochastic Oscillator**
   - Fast and Slow variants
   - Uses high/low/close

3. **Stochastic RSI**
   - RSI of RSI with stochastic formula

4. **Pivot Points**
   - Standard, Fibonacci, Woodie variants
   - Auto-detect timeframe from timestamps

5. **FRVP (Fixed Range Volume Profile)**
   - Volume histogram by price level
   - Output: POC, VAH, VAL

6. **CVD (Cumulative Volume Delta)**
   - Requires buy/sell volume input
   - Simple cumulative sum

### Tier B Indicators

7. **MFI (Money Flow Index)** - Volume-weighted RSI
8. **HMA (Hull Moving Average)** - Low-lag MA using WMA
9. **Ichimoku Cloud** - Full suite (5 components)
10. **ADX (Average Directional Index)** - Trend strength
11. **Linear Regression Channels** - With Pearson's R

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
