# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-09

### Added

#### Core Indicators
- **Moving Averages**: SMA, EMA, WMA, HMA
- **Oscillators**: RSI, MACD, Stochastic Fast/Slow, Stochastic RSI
- **Volatility**: Bollinger Bands, ATR, Linear Regression
- **Trend**: ADX (with +DI/-DI), Ichimoku Cloud
- **Volume**: CVD, MFI, Fixed Range Volume Profile
- **VWAP Variants**: Session VWAP, Rolling VWAP, Anchored VWAP
- **Support Levels**: Pivot Points (Standard, Fibonacci, Woodie)

#### API Features
- **Batch Mode**: Instant calculations over historical data arrays
- **Streaming Mode**: O(1) incremental updates for live candle feeds
- **Candle API**: Accept `Candle[]` directly with optional volume/time
- **Legacy Support**: Backward-compatible positional array arguments
- **Type Safety**: Full TypeScript definitions for all indicators
- **Multi-Indicator**: `analyze()` helper for running multiple indicators on same data
- **Utilities**: `toFloat64Array()`, `extractOHLCV()` for data transformation

#### Performance
- **WASM-based**: Compiled with `wasm-opt -Oz` for minimal bundle size (~228KB)
- **Zero-Copy**: Direct array passing to native code
- **Precision**: 64-bit floating-point (f64) calculations
- **Portable**: Universal package runs on Node.js, Bun, Deno, and browsers

#### Development
- Comprehensive test suite (118 tests, all passing)
- Benchmark infrastructure against competing libraries
- CI/CD pipeline with GitHub Actions
- ESM and CJS compatibility

### Technical Details

- **Language**: Rust compiled to WebAssembly
- **Node Support**: 22.0.0+
- **License**: MIT
- **Entry Points**:
  - CommonJS/ESM: `dist/index.js`
  - Types: `dist/index.d.ts`
  - WASM: `pkg/ta_core_bg.wasm`

### Known Limitations

- Indicators currently accept full historical arrays (no true streaming within Rust layer)
- Custom indicator weights/parameters not yet configurable at runtime
- No GPU acceleration (planned for future releases)

---

## Future Roadmap

- [ ] Browser-specific optimizations and streaming WebWorker support
- [ ] Binary serialization for indicator state persistence
- [ ] Additional exotic indicators (Gartley, Elliot Wave analysis)
- [ ] Real-time performance profiling tools
- [ ] Comprehensive documentation site with interactive examples
