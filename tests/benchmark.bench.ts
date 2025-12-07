import { bench, describe } from "vitest";

// ta-tools (our library)
import {
  sma,
  ema,
  rsi,
  wma,
  macd,
  bbands,
  atr,
  stochFast,
  stochRsi,
  mfi,
  adx,
  hma,
  ichimoku,
  linreg,
  sessionVwap,
  rollingVwap,
  anchoredVwap,
  cvdOhlcv,
  pivotPointsBatch,
  frvp,
  SmaStream,
  EmaStream,
  RsiStream,
  WmaStream,
  MacdStream,
  BBandsStream,
  AtrStream,
  StochFastStream,
  StochRsiStream,
  MfiStream,
  AdxStream,
  HmaStream,
  IchimokuStream,
  LinRegStream,
  SessionVwapStream,
  RollingVwapStream,
  CvdOhlcvStream,
  FrvpStream,
} from "../dist/index.js";

// fast-technical-indicators
import {
  sma as ftiSma,
  ema as ftiEma,
  rsi as ftiRsi,
  wma as ftiWma,
  macd as ftiMacd,
  bollingerbands as ftiBBands,
  atr as ftiAtr,
  stochastic as ftiStoch,
  stochasticrsi as ftiStochRsi,
  mfi as ftiMfi,
  adx as ftiAdx,
  ichimokucloud as ftiIchimoku,
  SMA as FtiSmaStream,
  EMA as FtiEmaStream,
  RSI as FtiRsiStream,
  WMA as FtiWmaStream,
  MACD as FtiMacdStream,
  BollingerBands as FtiBBandsStream,
  ATR as FtiAtrStream,
  Stochastic as FtiStochStream,
  StochasticRSI as FtiStochRsiStream,
  MFI as FtiMfiStream,
  ADX as FtiAdxStream,
  IchimokuCloud as FtiIchimokuStream,
} from "fast-technical-indicators";

// indicatorts
import {
  sma as itSma,
  ema as itEma,
  rsi as itRsi,
  macd as itMacd,
  bb as itBBands,
  atr as itAtr,
  stoch as itStoch,
  mfi as itMfi,
  ichimokuCloud as itIchimoku,
  vwap as itVwap,
} from "indicatorts";

// trading-signals (streaming-first library)
import {
  SMA as TsSma,
  EMA as TsEma,
  RSI as TsRsi,
  WMA as TsWma,
  MACD as TsMacd,
  BollingerBands as TsBBands,
  ATR as TsAtr,
  StochasticOscillator as TsStoch,
  ADX as TsAdx,
} from "trading-signals";

// Helper to run trading-signals on array (it's streaming-first)
const runTradingSignals = <T extends { add: (v: number) => unknown }>(
  indicator: T,
  data: number[]
): void => {
  for (const price of data) {
    indicator.add(price);
  }
};

// Generate test data
const generatePrices = (count: number): number[] => {
  const prices: number[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    price += (Math.random() - 0.5) * 2;
    prices.push(price);
  }
  return prices;
};

// Generate OHLCV data for indicators that need it
interface OHLCVData {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestampF64: Float64Array;
  openF64: Float64Array;
  highF64: Float64Array;
  lowF64: Float64Array;
  closeF64: Float64Array;
  volumeF64: Float64Array;
}

const generateOHLCV = (count: number): OHLCVData => {
  const timestamp: number[] = [];
  const open: number[] = [];
  const high: number[] = [];
  const low: number[] = [];
  const close: number[] = [];
  const volume: number[] = [];
  let basePrice = 100;
  // Start timestamp: 2024-01-01 00:00:00 UTC
  let ts = 1704067200000;

  for (let i = 0; i < count; i++) {
    const volatility = Math.random() * 2 + 0.5;
    const o = basePrice;
    const h = basePrice + volatility;
    const l = basePrice - volatility;
    const c = l + Math.random() * (h - l);
    const v = Math.floor(Math.random() * 1000000) + 100000;

    timestamp.push(ts);
    open.push(o);
    high.push(h);
    low.push(l);
    close.push(c);
    volume.push(v);

    basePrice = c + (Math.random() - 0.5) * 1;
    ts += 60000; // 1 minute candles
  }

  return {
    timestamp,
    open,
    high,
    low,
    close,
    volume,
    timestampF64: new Float64Array(timestamp),
    openF64: new Float64Array(open),
    highF64: new Float64Array(high),
    lowF64: new Float64Array(low),
    closeF64: new Float64Array(close),
    volumeF64: new Float64Array(volume),
  };
};

// Dataset sizes per requirements: 100, 10K, 1M
const SMALL_DATA = generatePrices(1_000);
const BIG_DATA = generatePrices(10_000);
const HUGE_DATA = generatePrices(100_000);

const SMALL_F64 = new Float64Array(SMALL_DATA);
const BIG_F64 = new Float64Array(BIG_DATA);
const HUGE_F64 = new Float64Array(HUGE_DATA);

// OHLCV datasets
const SMALL_OHLCV = generateOHLCV(1000);
const BIG_OHLCV = generateOHLCV(10_000);
const HUGE_OHLCV = generateOHLCV(100_000);

// ============================================================================
// SMA Benchmarks
// ============================================================================

describe("SMA (Simple Moving Average)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      sma(SMALL_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiSma({ period: 14, values: SMALL_DATA });
    });

    bench("indicatorts", () => {
      itSma(SMALL_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsSma(14);
      runTradingSignals(ts, SMALL_DATA);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      sma(BIG_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiSma({ period: 14, values: BIG_DATA });
    });

    bench("indicatorts", () => {
      itSma(BIG_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsSma(14);
      runTradingSignals(ts, BIG_DATA);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      sma(HUGE_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiSma({ period: 14, values: HUGE_DATA });
    });

    bench("indicatorts", () => {
      itSma(HUGE_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsSma(14);
      runTradingSignals(ts, HUGE_DATA);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new SmaStream(14);
    taStream.init(BIG_F64);

    const ftiStream = new FtiSmaStream({ period: 14, values: BIG_DATA });

    const tsStream = new TsSma(14);
    runTradingSignals(tsStream, BIG_DATA);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });

    bench("trading-signals", () => {
      tsStream.add(100.5);
    });
  });
});

// ============================================================================
// EMA Benchmarks
// ============================================================================

describe("EMA (Exponential Moving Average)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      ema(SMALL_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiEma({ period: 14, values: SMALL_DATA });
    });

    bench("indicatorts", () => {
      itEma(SMALL_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsEma(14);
      runTradingSignals(ts, SMALL_DATA);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      ema(BIG_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiEma({ period: 14, values: BIG_DATA });
    });

    bench("indicatorts", () => {
      itEma(BIG_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsEma(14);
      runTradingSignals(ts, BIG_DATA);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      ema(HUGE_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiEma({ period: 14, values: HUGE_DATA });
    });

    bench("indicatorts", () => {
      itEma(HUGE_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsEma(14);
      runTradingSignals(ts, HUGE_DATA);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new EmaStream(14);
    taStream.init(BIG_F64);

    const ftiStream = new FtiEmaStream({ period: 14, values: BIG_DATA });

    const tsStream = new TsEma(14);
    runTradingSignals(tsStream, BIG_DATA);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });

    bench("trading-signals", () => {
      tsStream.add(100.5);
    });
  });
});

// ============================================================================
// RSI Benchmarks
// ============================================================================

describe("RSI (Relative Strength Index)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      rsi(SMALL_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiRsi({ period: 14, values: SMALL_DATA });
    });

    bench("indicatorts", () => {
      itRsi(SMALL_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsRsi(14);
      runTradingSignals(ts, SMALL_DATA);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      rsi(BIG_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiRsi({ period: 14, values: BIG_DATA });
    });

    bench("indicatorts", () => {
      itRsi(BIG_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsRsi(14);
      runTradingSignals(ts, BIG_DATA);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      rsi(HUGE_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiRsi({ period: 14, values: HUGE_DATA });
    });

    bench("indicatorts", () => {
      itRsi(HUGE_DATA, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsRsi(14);
      runTradingSignals(ts, HUGE_DATA);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new RsiStream(14);
    taStream.init(BIG_F64);

    const ftiStream = new FtiRsiStream({ period: 14, values: BIG_DATA });

    const tsStream = new TsRsi(14);
    runTradingSignals(tsStream, BIG_DATA);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });

    bench("trading-signals", () => {
      tsStream.add(100.5);
    });
  });
});

// ============================================================================
// WMA Benchmarks
// ============================================================================

describe("WMA (Weighted Moving Average)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      wma(SMALL_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiWma({ period: 14, values: SMALL_DATA });
    });

    bench("trading-signals", () => {
      const ts = new TsWma(14);
      runTradingSignals(ts, SMALL_DATA);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      wma(BIG_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiWma({ period: 14, values: BIG_DATA });
    });

    bench("trading-signals", () => {
      const ts = new TsWma(14);
      runTradingSignals(ts, BIG_DATA);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      wma(HUGE_F64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiWma({ period: 14, values: HUGE_DATA });
    });

    bench("trading-signals", () => {
      const ts = new TsWma(14);
      runTradingSignals(ts, HUGE_DATA);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new WmaStream(14);
    taStream.init(BIG_F64);

    const ftiStream = new FtiWmaStream({ period: 14, values: BIG_DATA });

    const tsStream = new TsWma(14);
    runTradingSignals(tsStream, BIG_DATA);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });

    bench("trading-signals", () => {
      tsStream.add(100.5);
    });
  });
});

// ============================================================================
// MACD Benchmarks
// ============================================================================

describe("MACD (Moving Average Convergence Divergence)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      macd(SMALL_F64, 12, 26, 9);
    });

    bench("fast-technical-indicators", () => {
      ftiMacd({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: SMALL_DATA,
      });
    });

    bench("indicatorts", () => {
      itMacd(SMALL_DATA, { fast: 12, slow: 26, signal: 9 });
    });

    bench("trading-signals", () => {
      const ts = new TsMacd(new TsEma(12), new TsEma(26), new TsEma(9));
      runTradingSignals(ts, SMALL_DATA);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      macd(BIG_F64, 12, 26, 9);
    });

    bench("fast-technical-indicators", () => {
      ftiMacd({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: BIG_DATA,
      });
    });

    bench("indicatorts", () => {
      itMacd(BIG_DATA, { fast: 12, slow: 26, signal: 9 });
    });

    bench("trading-signals", () => {
      const ts = new TsMacd(new TsEma(12), new TsEma(26), new TsEma(9));
      runTradingSignals(ts, BIG_DATA);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      macd(HUGE_F64, 12, 26, 9);
    });

    bench("fast-technical-indicators", () => {
      ftiMacd({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: HUGE_DATA,
      });
    });

    bench("indicatorts", () => {
      itMacd(HUGE_DATA, { fast: 12, slow: 26, signal: 9 });
    });

    bench("trading-signals", () => {
      const ts = new TsMacd(new TsEma(12), new TsEma(26), new TsEma(9));
      runTradingSignals(ts, HUGE_DATA);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new MacdStream(12, 26, 9);
    taStream.init(BIG_F64);

    const ftiStream = new FtiMacdStream({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: BIG_DATA,
    });

    const tsStream = new TsMacd(new TsEma(12), new TsEma(26), new TsEma(9));
    runTradingSignals(tsStream, BIG_DATA);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });

    bench("trading-signals", () => {
      tsStream.add(100.5);
    });
  });
});

// ============================================================================
// Bollinger Bands Benchmarks
// ============================================================================

describe("Bollinger Bands", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      bbands(SMALL_F64, 20, 2.0);
    });

    bench("fast-technical-indicators", () => {
      ftiBBands({ period: 20, stdDev: 2, values: SMALL_DATA });
    });

    bench("indicatorts", () => {
      itBBands(SMALL_DATA, { period: 20 });
    });

    bench("trading-signals", () => {
      const ts = new TsBBands(20, 2);
      runTradingSignals(ts, SMALL_DATA);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      bbands(BIG_F64, 20, 2.0);
    });

    bench("fast-technical-indicators", () => {
      ftiBBands({ period: 20, stdDev: 2, values: BIG_DATA });
    });

    bench("indicatorts", () => {
      itBBands(BIG_DATA, { period: 20 });
    });

    bench("trading-signals", () => {
      const ts = new TsBBands(20, 2);
      runTradingSignals(ts, BIG_DATA);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      bbands(HUGE_F64, 20, 2.0);
    });

    bench("fast-technical-indicators", () => {
      ftiBBands({ period: 20, stdDev: 2, values: HUGE_DATA });
    });

    bench("indicatorts", () => {
      itBBands(HUGE_DATA, { period: 20 });
    });

    bench("trading-signals", () => {
      const ts = new TsBBands(20, 2);
      runTradingSignals(ts, HUGE_DATA);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new BBandsStream(20, 2.0);
    taStream.init(BIG_F64);

    const ftiStream = new FtiBBandsStream({ period: 20, stdDev: 2, values: BIG_DATA });

    const tsStream = new TsBBands(20, 2);
    runTradingSignals(tsStream, BIG_DATA);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });

    bench("trading-signals", () => {
      tsStream.add(100.5);
    });
  });
});

// ============================================================================
// ATR (Average True Range) Benchmarks
// ============================================================================

describe("ATR (Average True Range)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      atr(SMALL_OHLCV.highF64, SMALL_OHLCV.lowF64, SMALL_OHLCV.closeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiAtr({
        period: 14,
        high: SMALL_OHLCV.high,
        low: SMALL_OHLCV.low,
        close: SMALL_OHLCV.close,
      });
    });

    bench("indicatorts", () => {
      itAtr(SMALL_OHLCV.high, SMALL_OHLCV.low, SMALL_OHLCV.close, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsAtr(14);
      for (let i = 0; i < SMALL_OHLCV.close.length; i++) {
        ts.add({ high: SMALL_OHLCV.high[i], low: SMALL_OHLCV.low[i], close: SMALL_OHLCV.close[i] });
      }
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      atr(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiAtr({
        period: 14,
        high: BIG_OHLCV.high,
        low: BIG_OHLCV.low,
        close: BIG_OHLCV.close,
      });
    });

    bench("indicatorts", () => {
      itAtr(BIG_OHLCV.high, BIG_OHLCV.low, BIG_OHLCV.close, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsAtr(14);
      for (let i = 0; i < BIG_OHLCV.close.length; i++) {
        ts.add({ high: BIG_OHLCV.high[i], low: BIG_OHLCV.low[i], close: BIG_OHLCV.close[i] });
      }
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      atr(HUGE_OHLCV.highF64, HUGE_OHLCV.lowF64, HUGE_OHLCV.closeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiAtr({
        period: 14,
        high: HUGE_OHLCV.high,
        low: HUGE_OHLCV.low,
        close: HUGE_OHLCV.close,
      });
    });

    bench("indicatorts", () => {
      itAtr(HUGE_OHLCV.high, HUGE_OHLCV.low, HUGE_OHLCV.close, { period: 14 });
    });

    bench("trading-signals", () => {
      const ts = new TsAtr(14);
      for (let i = 0; i < HUGE_OHLCV.close.length; i++) {
        ts.add({ high: HUGE_OHLCV.high[i], low: HUGE_OHLCV.low[i], close: HUGE_OHLCV.close[i] });
      }
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new AtrStream(14);
    taStream.init(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64);

    const ftiStream = new FtiAtrStream({
      period: 14,
      high: BIG_OHLCV.high,
      low: BIG_OHLCV.low,
      close: BIG_OHLCV.close,
    });

    const tsStream = new TsAtr(14);
    for (let i = 0; i < BIG_OHLCV.close.length; i++) {
      tsStream.add({ high: BIG_OHLCV.high[i], low: BIG_OHLCV.low[i], close: BIG_OHLCV.close[i] });
    }

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.0);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5, 99.5, 100.0);
    });

    bench("trading-signals", () => {
      tsStream.add({ high: 100.5, low: 99.5, close: 100.0 });
    });
  });
});

// ============================================================================
// Stochastic Oscillator Benchmarks
// ============================================================================

describe("Stochastic Oscillator", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      stochFast(SMALL_OHLCV.highF64, SMALL_OHLCV.lowF64, SMALL_OHLCV.closeF64, 14, 3);
    });

    bench("fast-technical-indicators", () => {
      ftiStoch({
        period: 14,
        signalPeriod: 3,
        high: SMALL_OHLCV.high,
        low: SMALL_OHLCV.low,
        close: SMALL_OHLCV.close,
      });
    });

    bench("indicatorts", () => {
      itStoch(SMALL_OHLCV.high, SMALL_OHLCV.low, SMALL_OHLCV.close, { kPeriod: 14, dPeriod: 3 });
    });

    bench("trading-signals", () => {
      const ts = new TsStoch(14, 3, 3);
      for (let i = 0; i < SMALL_OHLCV.close.length; i++) {
        ts.add({ high: SMALL_OHLCV.high[i], low: SMALL_OHLCV.low[i], close: SMALL_OHLCV.close[i] });
      }
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      stochFast(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64, 14, 3);
    });

    bench("fast-technical-indicators", () => {
      ftiStoch({
        period: 14,
        signalPeriod: 3,
        high: BIG_OHLCV.high,
        low: BIG_OHLCV.low,
        close: BIG_OHLCV.close,
      });
    });

    bench("indicatorts", () => {
      itStoch(BIG_OHLCV.high, BIG_OHLCV.low, BIG_OHLCV.close, { kPeriod: 14, dPeriod: 3 });
    });

    bench("trading-signals", () => {
      const ts = new TsStoch(14, 3, 3);
      for (let i = 0; i < BIG_OHLCV.close.length; i++) {
        ts.add({ high: BIG_OHLCV.high[i], low: BIG_OHLCV.low[i], close: BIG_OHLCV.close[i] });
      }
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      stochFast(HUGE_OHLCV.highF64, HUGE_OHLCV.lowF64, HUGE_OHLCV.closeF64, 14, 3);
    });

    bench("fast-technical-indicators", () => {
      ftiStoch({
        period: 14,
        signalPeriod: 3,
        high: HUGE_OHLCV.high,
        low: HUGE_OHLCV.low,
        close: HUGE_OHLCV.close,
      });
    });

    bench("indicatorts", () => {
      itStoch(HUGE_OHLCV.high, HUGE_OHLCV.low, HUGE_OHLCV.close, { kPeriod: 14, dPeriod: 3 });
    });

    bench("trading-signals", () => {
      const ts = new TsStoch(14, 3, 3);
      for (let i = 0; i < HUGE_OHLCV.close.length; i++) {
        ts.add({ high: HUGE_OHLCV.high[i], low: HUGE_OHLCV.low[i], close: HUGE_OHLCV.close[i] });
      }
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new StochFastStream(14, 3);
    taStream.init(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64);

    const ftiStream = new FtiStochStream({
      period: 14,
      signalPeriod: 3,
      high: [],
      low: [],
      close: [],
    });
    for (let i = 0; i < BIG_OHLCV.close.length; i++) {
      ftiStream.nextValue(BIG_OHLCV.high[i], BIG_OHLCV.low[i], BIG_OHLCV.close[i]);
    }

    const tsStream = new TsStoch(14, 3, 3);
    for (let i = 0; i < BIG_OHLCV.close.length; i++) {
      tsStream.add({ high: BIG_OHLCV.high[i], low: BIG_OHLCV.low[i], close: BIG_OHLCV.close[i] });
    }

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.0);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5, 99.5, 100.0);
    });

    bench("trading-signals", () => {
      tsStream.add({ high: 100.5, low: 99.5, close: 100.0 });
    });
  });
});

// ============================================================================
// MFI (Money Flow Index) Benchmarks
// ============================================================================

describe("MFI (Money Flow Index)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      mfi(SMALL_OHLCV.highF64, SMALL_OHLCV.lowF64, SMALL_OHLCV.closeF64, SMALL_OHLCV.volumeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiMfi({
        period: 14,
        high: SMALL_OHLCV.high,
        low: SMALL_OHLCV.low,
        close: SMALL_OHLCV.close,
        volume: SMALL_OHLCV.volume,
      });
    });

    bench("indicatorts", () => {
      itMfi(SMALL_OHLCV.high, SMALL_OHLCV.low, SMALL_OHLCV.close, SMALL_OHLCV.volume, { period: 14 });
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      mfi(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64, BIG_OHLCV.volumeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiMfi({
        period: 14,
        high: BIG_OHLCV.high,
        low: BIG_OHLCV.low,
        close: BIG_OHLCV.close,
        volume: BIG_OHLCV.volume,
      });
    });

    bench("indicatorts", () => {
      itMfi(BIG_OHLCV.high, BIG_OHLCV.low, BIG_OHLCV.close, BIG_OHLCV.volume, { period: 14 });
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      mfi(HUGE_OHLCV.highF64, HUGE_OHLCV.lowF64, HUGE_OHLCV.closeF64, HUGE_OHLCV.volumeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiMfi({
        period: 14,
        high: HUGE_OHLCV.high,
        low: HUGE_OHLCV.low,
        close: HUGE_OHLCV.close,
        volume: HUGE_OHLCV.volume,
      });
    });

    bench("indicatorts", () => {
      itMfi(HUGE_OHLCV.high, HUGE_OHLCV.low, HUGE_OHLCV.close, HUGE_OHLCV.volume, { period: 14 });
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new MfiStream(14);
    taStream.init(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64, BIG_OHLCV.volumeF64);

    const ftiStream = new FtiMfiStream({
      period: 14,
      high: BIG_OHLCV.high,
      low: BIG_OHLCV.low,
      close: BIG_OHLCV.close,
      volume: BIG_OHLCV.volume,
    });

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.0, 500000);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5, 99.5, 100.0, 500000);
    });
  });
});

// ============================================================================
// ADX (Average Directional Index) Benchmarks
// ============================================================================

describe("ADX (Average Directional Index)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      adx(SMALL_OHLCV.highF64, SMALL_OHLCV.lowF64, SMALL_OHLCV.closeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiAdx({
        period: 14,
        high: SMALL_OHLCV.high,
        low: SMALL_OHLCV.low,
        close: SMALL_OHLCV.close,
      });
    });

    bench("trading-signals", () => {
      const ts = new TsAdx(14);
      for (let i = 0; i < SMALL_OHLCV.close.length; i++) {
        ts.add({ high: SMALL_OHLCV.high[i], low: SMALL_OHLCV.low[i], close: SMALL_OHLCV.close[i] });
      }
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      adx(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiAdx({
        period: 14,
        high: BIG_OHLCV.high,
        low: BIG_OHLCV.low,
        close: BIG_OHLCV.close,
      });
    });

    bench("trading-signals", () => {
      const ts = new TsAdx(14);
      for (let i = 0; i < BIG_OHLCV.close.length; i++) {
        ts.add({ high: BIG_OHLCV.high[i], low: BIG_OHLCV.low[i], close: BIG_OHLCV.close[i] });
      }
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      adx(HUGE_OHLCV.highF64, HUGE_OHLCV.lowF64, HUGE_OHLCV.closeF64, 14);
    });

    bench("fast-technical-indicators", () => {
      ftiAdx({
        period: 14,
        high: HUGE_OHLCV.high,
        low: HUGE_OHLCV.low,
        close: HUGE_OHLCV.close,
      });
    });

    bench("trading-signals", () => {
      const ts = new TsAdx(14);
      for (let i = 0; i < HUGE_OHLCV.close.length; i++) {
        ts.add({ high: HUGE_OHLCV.high[i], low: HUGE_OHLCV.low[i], close: HUGE_OHLCV.close[i] });
      }
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new AdxStream(14);
    taStream.init(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64);

    const ftiStream = new FtiAdxStream({
      period: 14,
      high: BIG_OHLCV.high,
      low: BIG_OHLCV.low,
      close: BIG_OHLCV.close,
    });

    const tsStream = new TsAdx(14);
    for (let i = 0; i < BIG_OHLCV.close.length; i++) {
      tsStream.add({ high: BIG_OHLCV.high[i], low: BIG_OHLCV.low[i], close: BIG_OHLCV.close[i] });
    }

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.0);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5, 99.5, 100.0);
    });

    bench("trading-signals", () => {
      tsStream.add({ high: 100.5, low: 99.5, close: 100.0 });
    });
  });
});

// ============================================================================
// StochRSI (Stochastic RSI) Benchmarks
// Note: trading-signals StochasticRSI has issues, only comparing with fti
// ============================================================================

describe("StochRSI (Stochastic RSI)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      stochRsi(SMALL_F64, 14, 14, 3, 3);
    });

    bench("fast-technical-indicators", () => {
      ftiStochRsi({
        values: SMALL_DATA,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      });
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      stochRsi(BIG_F64, 14, 14, 3, 3);
    });

    bench("fast-technical-indicators", () => {
      ftiStochRsi({
        values: BIG_DATA,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      });
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      stochRsi(HUGE_F64, 14, 14, 3, 3);
    });

    bench("fast-technical-indicators", () => {
      ftiStochRsi({
        values: HUGE_DATA,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      });
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new StochRsiStream(14, 14, 3, 3);
    taStream.init(BIG_F64);

    const ftiStream = new FtiStochRsiStream({
      values: BIG_DATA,
      rsiPeriod: 14,
      stochasticPeriod: 14,
      kPeriod: 3,
      dPeriod: 3,
    });

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5);
    });
  });
});

// ============================================================================
// HMA (Hull Moving Average) Benchmarks
// Note: Only ta-tools has HMA - no competitor comparison possible
// ============================================================================

describe("HMA (Hull Moving Average)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      hma(SMALL_F64, 14);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      hma(BIG_F64, 14);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      hma(HUGE_F64, 14);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new HmaStream(14);
    taStream.init(BIG_F64);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });
  });
});

// ============================================================================
// Ichimoku Cloud Benchmarks
// ============================================================================

describe("Ichimoku Cloud", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      ichimoku(SMALL_OHLCV.highF64, SMALL_OHLCV.lowF64, SMALL_OHLCV.closeF64, 9, 26, 52);
    });

    bench("fast-technical-indicators", () => {
      ftiIchimoku({
        high: SMALL_OHLCV.high,
        low: SMALL_OHLCV.low,
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
      });
    });

    bench("indicatorts", () => {
      itIchimoku(SMALL_OHLCV.high, SMALL_OHLCV.low, SMALL_OHLCV.close, {
        short: 9,
        medium: 26,
        long: 52,
      });
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      ichimoku(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64, 9, 26, 52);
    });

    bench("fast-technical-indicators", () => {
      ftiIchimoku({
        high: BIG_OHLCV.high,
        low: BIG_OHLCV.low,
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
      });
    });

    bench("indicatorts", () => {
      itIchimoku(BIG_OHLCV.high, BIG_OHLCV.low, BIG_OHLCV.close, {
        short: 9,
        medium: 26,
        long: 52,
      });
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      ichimoku(HUGE_OHLCV.highF64, HUGE_OHLCV.lowF64, HUGE_OHLCV.closeF64, 9, 26, 52);
    });

    bench("fast-technical-indicators", () => {
      ftiIchimoku({
        high: HUGE_OHLCV.high,
        low: HUGE_OHLCV.low,
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
      });
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new IchimokuStream(9, 26, 52);
    taStream.init(BIG_OHLCV.highF64, BIG_OHLCV.lowF64, BIG_OHLCV.closeF64);

    const ftiStream = new FtiIchimokuStream({
      high: BIG_OHLCV.high,
      low: BIG_OHLCV.low,
      conversionPeriod: 9,
      basePeriod: 26,
      spanPeriod: 52,
      displacement: 26,
    });

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.0);
    });

    bench("fast-technical-indicators", () => {
      ftiStream.nextValue(100.5, 99.5);
    });
  });
});

// ============================================================================
// Linear Regression Benchmarks
// ============================================================================

describe("Linear Regression", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      linreg(SMALL_F64, 14, 2.0);
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      linreg(BIG_F64, 14, 2.0);
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      linreg(HUGE_F64, 14, 2.0);
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new LinRegStream(14, 2.0);
    taStream.init(BIG_F64);

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5);
    });
  });
});

// ============================================================================
// VWAP (Volume Weighted Average Price) Benchmarks
// ============================================================================

describe("VWAP (Volume Weighted Average Price)", () => {
  describe("Session VWAP - Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      sessionVwap(
        SMALL_OHLCV.timestampF64,
        SMALL_OHLCV.openF64,
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        SMALL_OHLCV.volumeF64
      );
    });

    bench("indicatorts", () => {
      itVwap(SMALL_OHLCV.close, SMALL_OHLCV.volume, { period: 14 });
    });
  });

  describe("Session VWAP - Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      sessionVwap(
        BIG_OHLCV.timestampF64,
        BIG_OHLCV.openF64,
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        BIG_OHLCV.volumeF64
      );
    });

    bench("indicatorts", () => {
      itVwap(BIG_OHLCV.close, BIG_OHLCV.volume, { period: 14 });
    });
  });

  describe("Session VWAP - Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      sessionVwap(
        HUGE_OHLCV.timestampF64,
        HUGE_OHLCV.openF64,
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        HUGE_OHLCV.volumeF64
      );
    });

    bench("indicatorts", () => {
      itVwap(HUGE_OHLCV.close, HUGE_OHLCV.volume, { period: 14 });
    });
  });

  describe("Rolling VWAP - Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      rollingVwap(
        SMALL_OHLCV.timestampF64,
        SMALL_OHLCV.openF64,
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        SMALL_OHLCV.volumeF64,
        20
      );
    });
  });

  describe("Rolling VWAP - Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      rollingVwap(
        BIG_OHLCV.timestampF64,
        BIG_OHLCV.openF64,
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        BIG_OHLCV.volumeF64,
        20
      );
    });
  });

  describe("Rolling VWAP - Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      rollingVwap(
        HUGE_OHLCV.timestampF64,
        HUGE_OHLCV.openF64,
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        HUGE_OHLCV.volumeF64,
        20
      );
    });
  });

  describe("Anchored VWAP - Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      anchoredVwap(
        SMALL_OHLCV.timestampF64,
        SMALL_OHLCV.openF64,
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        SMALL_OHLCV.volumeF64,
        100 // anchor at index 100
      );
    });
  });

  describe("Anchored VWAP - Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      anchoredVwap(
        BIG_OHLCV.timestampF64,
        BIG_OHLCV.openF64,
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        BIG_OHLCV.volumeF64,
        1000 // anchor at index 1000
      );
    });
  });

  describe("Anchored VWAP - Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      anchoredVwap(
        HUGE_OHLCV.timestampF64,
        HUGE_OHLCV.openF64,
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        HUGE_OHLCV.volumeF64,
        10000 // anchor at index 10000
      );
    });
  });

  describe("Streaming - Session VWAP (single next() call)", () => {
    const taStream = new SessionVwapStream();
    taStream.init(
      BIG_OHLCV.timestampF64,
      BIG_OHLCV.openF64,
      BIG_OHLCV.highF64,
      BIG_OHLCV.lowF64,
      BIG_OHLCV.closeF64,
      BIG_OHLCV.volumeF64
    );

    bench("ta-tools (WASM)", () => {
      taStream.next(Date.now(), 100.0, 100.5, 99.5, 100.2, 500000);
    });
  });

  describe("Streaming - Rolling VWAP (single next() call)", () => {
    const taStream = new RollingVwapStream(20);
    taStream.init(
      BIG_OHLCV.timestampF64,
      BIG_OHLCV.openF64,
      BIG_OHLCV.highF64,
      BIG_OHLCV.lowF64,
      BIG_OHLCV.closeF64,
      BIG_OHLCV.volumeF64
    );

    bench("ta-tools (WASM)", () => {
      taStream.next(Date.now(), 100.0, 100.5, 99.5, 100.2, 500000);
    });
  });
});

// ============================================================================
// CVD (Cumulative Volume Delta) Benchmarks
// Note: No competitor libraries have CVD - ta-tools exclusive
// ============================================================================

describe("CVD (Cumulative Volume Delta)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      cvdOhlcv(
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        SMALL_OHLCV.volumeF64
      );
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      cvdOhlcv(
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        BIG_OHLCV.volumeF64
      );
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      cvdOhlcv(
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        HUGE_OHLCV.volumeF64
      );
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new CvdOhlcvStream();
    taStream.init(
      BIG_OHLCV.highF64,
      BIG_OHLCV.lowF64,
      BIG_OHLCV.closeF64,
      BIG_OHLCV.volumeF64
    );

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.2, 500000);
    });
  });
});

// ============================================================================
// Pivot Points Benchmarks
// Note: No competitor libraries have Pivot Points - ta-tools exclusive
// ============================================================================

describe("Pivot Points", () => {
  describe("Standard Pivot - Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        "standard"
      );
    });
  });

  describe("Standard Pivot - Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        "standard"
      );
    });
  });

  describe("Standard Pivot - Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        "standard"
      );
    });
  });

  describe("Fibonacci Pivot - Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        "fibonacci"
      );
    });
  });

  describe("Fibonacci Pivot - Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        "fibonacci"
      );
    });
  });

  describe("Fibonacci Pivot - Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        "fibonacci"
      );
    });
  });

  describe("Woodie Pivot - Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        "woodie"
      );
    });
  });

  describe("Woodie Pivot - Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        "woodie"
      );
    });
  });

  describe("Woodie Pivot - Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      pivotPointsBatch(
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        "woodie"
      );
    });
  });
});

// ============================================================================
// FRVP (Fixed Range Volume Profile) Benchmarks
// Note: No competitor libraries have Volume Profile - ta-tools exclusive
// ============================================================================

describe("FRVP (Fixed Range Volume Profile)", () => {
  describe("Small dataset (1,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      frvp(
        SMALL_OHLCV.highF64,
        SMALL_OHLCV.lowF64,
        SMALL_OHLCV.closeF64,
        SMALL_OHLCV.volumeF64,
        100, // 100 price bins
        0.70 // 70% value area
      );
    });
  });

  describe("Big dataset (10,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      frvp(
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        BIG_OHLCV.volumeF64,
        100,
        0.70
      );
    });
  });

  describe("Huge dataset (100,000 items)", () => {
    bench("ta-tools (WASM)", () => {
      frvp(
        HUGE_OHLCV.highF64,
        HUGE_OHLCV.lowF64,
        HUGE_OHLCV.closeF64,
        HUGE_OHLCV.volumeF64,
        100,
        0.70
      );
    });
  });

  describe("High resolution (500 bins) - Big dataset", () => {
    bench("ta-tools (WASM)", () => {
      frvp(
        BIG_OHLCV.highF64,
        BIG_OHLCV.lowF64,
        BIG_OHLCV.closeF64,
        BIG_OHLCV.volumeF64,
        500, // Higher resolution
        0.70
      );
    });
  });

  describe("Streaming (single next() call)", () => {
    const taStream = new FrvpStream(100);
    taStream.init(
      BIG_OHLCV.highF64,
      BIG_OHLCV.lowF64,
      BIG_OHLCV.closeF64,
      BIG_OHLCV.volumeF64
    );

    bench("ta-tools (WASM)", () => {
      taStream.next(100.5, 99.5, 100.2, 500000);
    });
  });
});
