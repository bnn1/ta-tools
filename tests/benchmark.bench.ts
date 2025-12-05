import { bench, describe } from "vitest";

// ta-tools (our library)
import {
  sma,
  ema,
  rsi,
  wma,
  macd,
  SmaStream,
  EmaStream,
  RsiStream,
  WmaStream,
  MacdStream,
} from "../dist/index.js";

// fast-technical-indicators
import {
  sma as ftiSma,
  ema as ftiEma,
  rsi as ftiRsi,
  wma as ftiWma,
  macd as ftiMacd,
  SMA as FtiSmaStream,
  EMA as FtiEmaStream,
  RSI as FtiRsiStream,
  WMA as FtiWmaStream,
  MACD as FtiMacdStream,
} from "fast-technical-indicators";

// indicatorts
import {
  sma as itSma,
  ema as itEma,
  rsi as itRsi,
  macd as itMacd,
} from "indicatorts";

// trading-signals (streaming-first library)
import {
  SMA as TsSma,
  EMA as TsEma,
  RSI as TsRsi,
  WMA as TsWma,
  MACD as TsMacd,
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

// Dataset sizes per requirements: 100, 10K, 1M
const SMALL_DATA = generatePrices(100);
const BIG_DATA = generatePrices(10_000);
const HUGE_DATA = generatePrices(1_000_000);

const SMALL_F64 = new Float64Array(SMALL_DATA);
const BIG_F64 = new Float64Array(BIG_DATA);
const HUGE_F64 = new Float64Array(HUGE_DATA);

// ============================================================================
// SMA Benchmarks
// ============================================================================

describe("SMA (Simple Moving Average)", () => {
  describe("Small dataset (100 items)", () => {
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

  describe("Huge dataset (1,000,000 items)", () => {
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
  describe("Small dataset (100 items)", () => {
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

  describe("Huge dataset (1,000,000 items)", () => {
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
  describe("Small dataset (100 items)", () => {
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

  describe("Huge dataset (1,000,000 items)", () => {
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
  describe("Small dataset (100 items)", () => {
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

  describe("Huge dataset (1,000,000 items)", () => {
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
  describe("Small dataset (100 items)", () => {
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

  describe("Huge dataset (1,000,000 items)", () => {
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
