import { describe, it, expect, beforeAll } from "vitest";
import {
  sma,
  ema,
  rsi,
  macd,
  bbands,
  atr,
  stochFast,
  stochSlow,
  stochRsi,
  cvd,
  cvdOhlcv,
  sessionVwap,
  rollingVwap,
  anchoredVwap,
  anchoredVwapFromTimestamp,
  pivotPoints,
  pivotPointsBatch,
  frvp,
  SmaStream,
  EmaStream,
  RsiStream,
  MacdStream,
  BBandsStream,
  AtrStream,
  StochFastStream,
  StochSlowStream,
  StochRsiStream,
  CvdStream,
  CvdOhlcvStream,
  SessionVwapStream,
  RollingVwapStream,
  AnchoredVwapStream,
  FrvpStream,
  mfi,
  hma,
  ichimoku,
  adx,
  linreg,
  MfiStream,
  HmaStream,
  IchimokuStream,
  AdxStream,
  LinRegStream,
} from "../dist/index.js";
import {
  sma as ftiSma,
  ema as ftiEma,
  rsi as ftiRsi,
  macd as ftiMacd,
  bollingerbands as ftiBBands,
  atr as ftiAtr,
  stochasticrsi as ftiStochRsi,
} from "fast-technical-indicators";

// Sample price data for testing
const SAMPLE_PRICES = [
  44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03, 46.83,
  47.69, 46.49, 46.26, 47.09, 46.66, 46.8, 46.23, 46.38, 46.33, 46.55, 45.88,
  47.82, 47.23,
];

const TOLERANCE = 0.01; // Allow 0.01 difference for floating point comparisons

function assertClose(actual: number, expected: number, tolerance = TOLERANCE) {
  if (Number.isNaN(expected)) {
    expect(Number.isNaN(actual)).toBe(true);
  } else {
    expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
  }
}

describe("ta-tools Integration Tests", () => {
  describe("SMA", () => {
    it("should calculate SMA correctly (batch)", () => {
      const period = 10;
      const data = new Float64Array(SAMPLE_PRICES);
      const result = sma(data, period);

      // Verify first valid SMA value (at index period-1)
      expect(result.length).toBe(data.length);

      // First (period-1) values should be NaN
      for (let i = 0; i < period - 1; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // Manually calculate expected SMA at index 9
      const expectedFirst =
        SAMPLE_PRICES.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      assertClose(result[9], expectedFirst);
    });

    it("should match fast-technical-indicators SMA results", () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      const ourResult = sma(data, period);
      const ftiResult = ftiSma({ period, values: SAMPLE_PRICES });

      // fast-technical-indicators returns only valid values (no NaN prefix)
      // Our result has NaN for first (period-1) values
      const ourValidResults = Array.from(ourResult).filter(
        (v) => !Number.isNaN(v)
      );

      expect(ourValidResults.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        assertClose(ourValidResults[i], ftiResult[i]);
      }
    });

    it("should work in streaming mode", () => {
      const period = 5;
      const stream = new SmaStream(period);

      // Initialize with first batch
      const initData = new Float64Array(SAMPLE_PRICES.slice(0, 10));
      const initResult = stream.init(initData);

      expect(initResult.length).toBe(10);
      expect(stream.isReady()).toBe(true);

      // Stream next values
      const nextResult = stream.next(SAMPLE_PRICES[10]);
      expect(nextResult).toBeDefined();
      expect(typeof nextResult).toBe("number");
    });

    it("streaming should match batch results", () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      // Batch calculation
      const batchResult = sma(data, period);

      // Streaming calculation
      const stream = new SmaStream(period);
      const streamResult = stream.init(data);

      expect(streamResult.length).toBe(batchResult.length);

      for (let i = 0; i < batchResult.length; i++) {
        if (Number.isNaN(batchResult[i])) {
          expect(Number.isNaN(streamResult[i])).toBe(true);
        } else {
          assertClose(streamResult[i], batchResult[i]);
        }
      }
    });
  });

  describe("EMA", () => {
    it("should calculate EMA correctly (batch)", () => {
      const period = 10;
      const data = new Float64Array(SAMPLE_PRICES);
      const result = ema(data, period);

      expect(result.length).toBe(data.length);

      // First (period-1) values should be NaN
      for (let i = 0; i < period - 1; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // Value at index (period-1) should be the SMA (seed value)
      const expectedSeed =
        SAMPLE_PRICES.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      assertClose(result[9], expectedSeed);
    });

    it("should match fast-technical-indicators EMA results", () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      const ourResult = ema(data, period);
      const ftiResult = ftiEma({ period, values: SAMPLE_PRICES });

      const ourValidResults = Array.from(ourResult).filter(
        (v) => !Number.isNaN(v)
      );

      expect(ourValidResults.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        assertClose(ourValidResults[i], ftiResult[i]);
      }
    });

    it("streaming should match batch results", () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      const batchResult = ema(data, period);
      const stream = new EmaStream(period);
      const streamResult = stream.init(data);

      expect(streamResult.length).toBe(batchResult.length);

      for (let i = 0; i < batchResult.length; i++) {
        if (Number.isNaN(batchResult[i])) {
          expect(Number.isNaN(streamResult[i])).toBe(true);
        } else {
          assertClose(streamResult[i], batchResult[i]);
        }
      }
    });
  });

  describe("RSI", () => {
    it("should calculate RSI correctly (batch)", () => {
      const period = 14;
      const data = new Float64Array(SAMPLE_PRICES);
      const result = rsi(data, period);

      expect(result.length).toBe(data.length);

      // First `period` values should be NaN (need period+1 values to get first RSI)
      for (let i = 0; i < period; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // RSI should be between 0 and 100 for valid values
      for (let i = period; i < result.length; i++) {
        if (!Number.isNaN(result[i])) {
          expect(result[i]).toBeGreaterThanOrEqual(0);
          expect(result[i]).toBeLessThanOrEqual(100);
        }
      }
    });

    it("should match fast-technical-indicators RSI results (within tolerance)", () => {
      const period = 14;
      const data = new Float64Array(SAMPLE_PRICES);

      const ourResult = rsi(data, period);
      const ftiResult = ftiRsi({ period, values: SAMPLE_PRICES });

      const ourValidResults = Array.from(ourResult).filter(
        (v) => !Number.isNaN(v)
      );

      // RSI implementations can vary slightly due to Wilder vs EMA smoothing
      // We check that they're in the same ballpark (within 5%)
      expect(ourValidResults.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        // RSI values should be relatively close (within 5 points)
        expect(Math.abs(ourValidResults[i] - ftiResult[i])).toBeLessThan(5);
      }
    });

    it("streaming should match batch results", () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      const batchResult = rsi(data, period);
      const stream = new RsiStream(period);
      const streamResult = stream.init(data);

      expect(streamResult.length).toBe(batchResult.length);

      for (let i = 0; i < batchResult.length; i++) {
        if (Number.isNaN(batchResult[i])) {
          expect(Number.isNaN(streamResult[i])).toBe(true);
        } else {
          assertClose(streamResult[i], batchResult[i], 0.1); // Slightly higher tolerance for RSI
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data", () => {
      const data = new Float64Array([]);
      const smaResult = sma(data, 5);
      expect(smaResult.length).toBe(0);
    });

    it("should handle data shorter than period", () => {
      const data = new Float64Array([1, 2, 3]);
      const result = sma(data, 10);
      expect(result.length).toBe(3);
      expect(result.every((v) => Number.isNaN(v))).toBe(true);
    });

    it("should throw on invalid period", () => {
      const data = new Float64Array([1, 2, 3, 4, 5]);
      expect(() => sma(data, 0)).toThrow();
    });
  });

  describe("MACD", () => {
    // Use more data for MACD since it needs slow period (26) + signal period (9) = 35 values minimum
    const MACD_PRICES = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03,
      46.83, 47.69, 46.49, 46.26, 47.09, 46.66, 46.8, 46.23, 46.38, 46.33,
      46.55, 45.88, 47.82, 47.23, 47.45, 46.9, 47.3, 46.78, 47.12, 46.99, 47.55,
      48.1, 47.89, 48.35, 48.2, 48.75, 48.5, 49.1, 48.8, 49.25,
    ];

    it("should calculate MACD correctly (batch)", () => {
      const data = new Float64Array(MACD_PRICES);
      const result = macd(data, 12, 26, 9);

      // Result should have macd, signal, histogram arrays
      expect(result.macd).toBeDefined();
      expect(result.signal).toBeDefined();
      expect(result.histogram).toBeDefined();

      expect(result.macd.length).toBe(data.length);
      expect(result.signal.length).toBe(data.length);
      expect(result.histogram.length).toBe(data.length);

      // First (slow_period - 1) MACD values should be NaN
      for (let i = 0; i < 25; i++) {
        expect(Number.isNaN(result.macd[i])).toBe(true);
      }

      // MACD line should be valid from index 25
      expect(Number.isNaN(result.macd[25])).toBe(false);

      // Signal should be valid after slow_period + signal_period - 2 = 25 + 8 = 33
      expect(Number.isNaN(result.signal[33])).toBe(false);
    });

    it("should match fast-technical-indicators MACD results", () => {
      const data = new Float64Array(MACD_PRICES);

      const ourResult = macd(data, 12, 26, 9);
      const ftiResult = ftiMacd({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: MACD_PRICES,
      });

      // Extract valid values from our result (where all components are valid)
      const ourMacdValid: number[] = [];
      const ourSignalValid: number[] = [];
      const ourHistogramValid: number[] = [];

      for (let i = 0; i < data.length; i++) {
        if (
          !Number.isNaN(ourResult.macd[i]) &&
          !Number.isNaN(ourResult.signal[i])
        ) {
          ourMacdValid.push(ourResult.macd[i]);
          ourSignalValid.push(ourResult.signal[i]);
          ourHistogramValid.push(ourResult.histogram[i]);
        }
      }

      // fast-technical-indicators returns array of {MACD, signal?, histogram?} objects
      // Filter to only complete results (with signal)
      const ftiComplete = ftiResult.filter((r) => r.signal !== undefined);

      expect(ourMacdValid.length).toBe(ftiComplete.length);

      // Values should match closely
      for (let i = 0; i < ftiComplete.length; i++) {
        assertClose(ourMacdValid[i], ftiComplete[i].MACD!);
        assertClose(ourSignalValid[i], ftiComplete[i].signal!);
        assertClose(ourHistogramValid[i], ftiComplete[i].histogram!);
      }
    });

    it("streaming should match batch results", () => {
      const data = new Float64Array(MACD_PRICES);

      const batchResult = macd(data, 12, 26, 9);
      const stream = new MacdStream(12, 26, 9);
      const streamResult = stream.init(data);

      expect(streamResult.macd.length).toBe(batchResult.macd.length);
      expect(streamResult.signal.length).toBe(batchResult.signal.length);
      expect(streamResult.histogram.length).toBe(batchResult.histogram.length);

      for (let i = 0; i < batchResult.macd.length; i++) {
        if (Number.isNaN(batchResult.macd[i])) {
          expect(Number.isNaN(streamResult.macd[i])).toBe(true);
        } else {
          assertClose(streamResult.macd[i], batchResult.macd[i]);
        }
        if (Number.isNaN(batchResult.signal[i])) {
          expect(Number.isNaN(streamResult.signal[i])).toBe(true);
        } else {
          assertClose(streamResult.signal[i], batchResult.signal[i]);
        }
      }
    });

    it("should throw on invalid parameters", () => {
      const data = new Float64Array(MACD_PRICES);
      expect(() => macd(data, 0, 26, 9)).toThrow();
      expect(() => macd(data, 26, 12, 9)).toThrow(); // fast >= slow
    });
  });

  describe("Bollinger Bands", () => {
    // Use enough data for the default period (20)
    const BBANDS_PRICES = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03,
      46.83, 47.69, 46.49, 46.26, 47.09, 46.66, 46.8, 46.23, 46.38, 46.33,
      46.55, 45.88, 47.82, 47.23, 47.45, 46.9, 47.3, 46.78, 47.12, 46.99,
    ];

    it("should calculate Bollinger Bands correctly (batch)", () => {
      const data = new Float64Array(BBANDS_PRICES);
      const result = bbands(data, 20, 2.0);

      // Result should have all band arrays
      expect(result.upper).toBeDefined();
      expect(result.middle).toBeDefined();
      expect(result.lower).toBeDefined();
      expect(result.percentB).toBeDefined();
      expect(result.bandwidth).toBeDefined();

      expect(result.upper.length).toBe(data.length);
      expect(result.middle.length).toBe(data.length);
      expect(result.lower.length).toBe(data.length);

      // First 19 values should be NaN
      for (let i = 0; i < 19; i++) {
        expect(Number.isNaN(result.upper[i])).toBe(true);
        expect(Number.isNaN(result.middle[i])).toBe(true);
        expect(Number.isNaN(result.lower[i])).toBe(true);
      }

      // From index 19, should have valid values
      expect(Number.isNaN(result.upper[19])).toBe(false);
      expect(Number.isNaN(result.middle[19])).toBe(false);
      expect(Number.isNaN(result.lower[19])).toBe(false);

      // Upper > middle > lower for valid values
      for (let i = 19; i < result.upper.length; i++) {
        expect(result.upper[i]).toBeGreaterThanOrEqual(result.middle[i]);
        expect(result.middle[i]).toBeGreaterThanOrEqual(result.lower[i]);
      }
    });

    it("should match fast-technical-indicators Bollinger Bands results", () => {
      const data = new Float64Array(BBANDS_PRICES);
      const period = 20;
      const stdDev = 2;

      const ourResult = bbands(data, period, stdDev);
      const ftiResult = ftiBBands({
        period,
        stdDev,
        values: BBANDS_PRICES,
      });

      // Extract valid values from our result
      const ourUpperValid: number[] = [];
      const ourMiddleValid: number[] = [];
      const ourLowerValid: number[] = [];

      for (let i = 0; i < data.length; i++) {
        if (!Number.isNaN(ourResult.upper[i])) {
          ourUpperValid.push(ourResult.upper[i]);
          ourMiddleValid.push(ourResult.middle[i]);
          ourLowerValid.push(ourResult.lower[i]);
        }
      }

      expect(ourUpperValid.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        assertClose(ourUpperValid[i], ftiResult[i].upper!);
        assertClose(ourMiddleValid[i], ftiResult[i].middle!);
        assertClose(ourLowerValid[i], ftiResult[i].lower!);
      }
    });

    it("streaming should match batch results", () => {
      const data = new Float64Array(BBANDS_PRICES);

      const batchResult = bbands(data, 20, 2.0);
      const stream = new BBandsStream(20, 2.0);
      const streamResult = stream.init(data);

      expect(streamResult.upper.length).toBe(batchResult.upper.length);

      for (let i = 0; i < batchResult.upper.length; i++) {
        if (Number.isNaN(batchResult.upper[i])) {
          expect(Number.isNaN(streamResult.upper[i])).toBe(true);
        } else {
          assertClose(streamResult.upper[i], batchResult.upper[i]);
          assertClose(streamResult.middle[i], batchResult.middle[i]);
          assertClose(streamResult.lower[i], batchResult.lower[i]);
          assertClose(streamResult.percentB[i], batchResult.percentB[i]);
          assertClose(streamResult.bandwidth[i], batchResult.bandwidth[i]);
        }
      }
    });

    it("should throw on invalid parameters", () => {
      const data = new Float64Array(BBANDS_PRICES);
      expect(() => bbands(data, 0, 2.0)).toThrow();
      expect(() => bbands(data, 20, 0)).toThrow();
      expect(() => bbands(data, 20, -1)).toThrow();
    });
  });

  describe("ATR", () => {
    // Sample OHLC data for ATR testing
    const HIGHS = [
      48.7, 48.72, 48.9, 48.87, 48.82, 49.05, 49.2, 49.35, 49.92, 50.19, 50.12,
      49.66, 49.88, 50.19, 50.36, 50.57, 50.65, 50.43, 49.63, 50.33,
    ];
    const LOWS = [
      47.79, 48.14, 48.39, 48.37, 48.24, 48.64, 48.94, 48.86, 49.5, 49.87, 49.2,
      48.9, 49.43, 49.73, 49.26, 50.09, 50.3, 49.21, 48.98, 49.61,
    ];
    const CLOSES = [
      48.16, 48.61, 48.75, 48.63, 48.74, 49.03, 49.07, 49.32, 49.91, 50.13,
      49.53, 49.5, 49.75, 50.03, 50.31, 50.52, 50.41, 49.34, 49.37, 50.23,
    ];

    it("should calculate ATR correctly (batch)", () => {
      const highs = new Float64Array(HIGHS);
      const lows = new Float64Array(LOWS);
      const closes = new Float64Array(CLOSES);
      const result = atr(highs, lows, closes, 14);

      expect(result.length).toBe(HIGHS.length);

      // First 13 values should be NaN
      for (let i = 0; i < 13; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // From index 13, should have valid ATR values
      expect(Number.isNaN(result[13])).toBe(false);

      // ATR should always be positive
      for (let i = 13; i < result.length; i++) {
        expect(result[i]).toBeGreaterThan(0);
      }
    });

    it("should produce values in expected range compared to fast-technical-indicators", () => {
      const highs = new Float64Array(HIGHS);
      const lows = new Float64Array(LOWS);
      const closes = new Float64Array(CLOSES);
      const period = 14;

      const ourResult = atr(highs, lows, closes, period);
      const ftiResult = ftiAtr({
        period,
        high: HIGHS,
        low: LOWS,
        close: CLOSES,
      });

      // Both implementations produce ATR values
      const ourValid = Array.from(ourResult).filter((v) => !Number.isNaN(v));

      expect(ourValid.length).toBeGreaterThan(0);
      expect(ftiResult.length).toBeGreaterThan(0);

      // ATR values should be in similar range (within 20%)
      // Different implementations may seed the first ATR differently
      const ourLast = ourValid[ourValid.length - 1];
      const ftiLast = ftiResult[ftiResult.length - 1] as number;
      const pctDiff = Math.abs(ourLast - ftiLast) / ftiLast;
      expect(pctDiff).toBeLessThan(0.2);
    });

    it("streaming should match batch results", () => {
      const highs = new Float64Array(HIGHS);
      const lows = new Float64Array(LOWS);
      const closes = new Float64Array(CLOSES);

      const batchResult = atr(highs, lows, closes, 5);
      const stream = new AtrStream(5);
      const streamResult = stream.init(highs, lows, closes);

      expect(streamResult.length).toBe(batchResult.length);

      for (let i = 0; i < batchResult.length; i++) {
        if (Number.isNaN(batchResult[i])) {
          expect(Number.isNaN(streamResult[i])).toBe(true);
        } else {
          assertClose(streamResult[i], batchResult[i]);
        }
      }
    });

    it("should throw on invalid parameters", () => {
      const highs = new Float64Array(HIGHS);
      const lows = new Float64Array(LOWS);
      const closes = new Float64Array(CLOSES);
      expect(() => atr(highs, lows, closes, 0)).toThrow();
    });

    it("should throw on mismatched array lengths", () => {
      const highs = new Float64Array([1, 2, 3]);
      const lows = new Float64Array([0.5, 1.5]); // Different length
      const closes = new Float64Array([0.8, 1.8, 2.8]);
      expect(() => atr(highs, lows, closes, 2)).toThrow();
    });
  });

  describe("Stochastic Oscillator", () => {
    // Longer price series for stochastic (validated OHLC data)
    const STOCH_HIGHS = [
      127.01, 127.62, 126.59, 127.35, 128.17, 128.43, 127.37, 126.42, 126.9,
      126.85, 125.65, 125.72, 127.16, 127.72, 128.22, 128.27, 128.09, 128.27,
      127.74, 128.77,
    ];
    const STOCH_LOWS = [
      125.36, 126.16, 124.93, 126.09, 126.82, 126.48, 126.03, 124.83, 126.39,
      125.72, 124.56, 124.57, 125.07, 126.86, 126.63, 126.8, 126.71, 126.13,
      125.92, 126.36,
    ];
    const STOCH_CLOSES = [
      126.9, 127.16, 125.3, 126.53, 127.79, 128.01, 127.11, 125.44, 126.7,
      126.25, 125.09, 125.52, 126.74, 127.35, 127.91, 128.01, 127.59, 127.59,
      127.01, 127.88,
    ];

    it("should calculate Fast Stochastic correctly (batch)", () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);
      const kPeriod = 5;
      const dPeriod = 3;

      const result = stochFast(highs, lows, closes, kPeriod, dPeriod);

      expect(result.k).toBeDefined();
      expect(result.d).toBeDefined();
      expect(result.k.length).toBe(STOCH_HIGHS.length);
      expect(result.d.length).toBe(STOCH_HIGHS.length);

      // First (kPeriod - 1) values should be NaN
      for (let i = 0; i < kPeriod - 1; i++) {
        expect(Number.isNaN(result.k[i])).toBe(true);
      }

      // %K values should be between 0 and 100
      for (let i = kPeriod - 1; i < result.k.length; i++) {
        expect(result.k[i]).toBeGreaterThanOrEqual(0);
        expect(result.k[i]).toBeLessThanOrEqual(100);
      }

      // %D should start appearing after kPeriod + dPeriod - 2
      const firstValidD = kPeriod + dPeriod - 2;
      for (let i = firstValidD; i < result.d.length; i++) {
        expect(Number.isNaN(result.d[i])).toBe(false);
        expect(result.d[i]).toBeGreaterThanOrEqual(0);
        expect(result.d[i]).toBeLessThanOrEqual(100);
      }
    });

    it("should calculate Slow Stochastic correctly (batch)", () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);
      const kPeriod = 5;
      const dPeriod = 3;
      const slowing = 3;

      const result = stochSlow(highs, lows, closes, kPeriod, dPeriod, slowing);

      expect(result.k).toBeDefined();
      expect(result.d).toBeDefined();
      expect(result.k.length).toBe(STOCH_HIGHS.length);

      // Slow stochastic smooths %K, so valid values appear later
      // First valid smoothed %K at: kPeriod - 1 + slowing - 1 = kPeriod + slowing - 2
      const firstValidK = kPeriod + slowing - 2;

      for (let i = firstValidK; i < result.k.length; i++) {
        expect(Number.isNaN(result.k[i])).toBe(false);
        expect(result.k[i]).toBeGreaterThanOrEqual(0);
        expect(result.k[i]).toBeLessThanOrEqual(100);
      }
    });

    it("Fast Stochastic streaming should match batch results", () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);
      const kPeriod = 5;
      const dPeriod = 3;

      const batchResult = stochFast(highs, lows, closes, kPeriod, dPeriod);
      const stream = new StochFastStream(kPeriod, dPeriod);
      const streamResult = stream.init(highs, lows, closes);

      expect(streamResult.k.length).toBe(batchResult.k.length);
      expect(streamResult.d.length).toBe(batchResult.d.length);

      for (let i = 0; i < batchResult.k.length; i++) {
        if (Number.isNaN(batchResult.k[i])) {
          expect(Number.isNaN(streamResult.k[i])).toBe(true);
        } else {
          assertClose(streamResult.k[i], batchResult.k[i]);
        }

        if (Number.isNaN(batchResult.d[i])) {
          expect(Number.isNaN(streamResult.d[i])).toBe(true);
        } else {
          assertClose(streamResult.d[i], batchResult.d[i]);
        }
      }
    });

    it("Slow Stochastic streaming should match batch results", () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);
      const kPeriod = 5;
      const dPeriod = 3;
      const slowing = 3;

      const batchResult = stochSlow(
        highs,
        lows,
        closes,
        kPeriod,
        dPeriod,
        slowing
      );
      const stream = new StochSlowStream(kPeriod, dPeriod, slowing);
      const streamResult = stream.init(highs, lows, closes);

      expect(streamResult.k.length).toBe(batchResult.k.length);
      expect(streamResult.d.length).toBe(batchResult.d.length);

      for (let i = 0; i < batchResult.k.length; i++) {
        if (Number.isNaN(batchResult.k[i])) {
          expect(Number.isNaN(streamResult.k[i])).toBe(true);
        } else {
          assertClose(streamResult.k[i], batchResult.k[i]);
        }

        if (Number.isNaN(batchResult.d[i])) {
          expect(Number.isNaN(streamResult.d[i])).toBe(true);
        } else {
          assertClose(streamResult.d[i], batchResult.d[i]);
        }
      }
    });

    it("streaming should continue with O(1) updates", () => {
      const highs = new Float64Array(STOCH_HIGHS.slice(0, 10));
      const lows = new Float64Array(STOCH_LOWS.slice(0, 10));
      const closes = new Float64Array(STOCH_CLOSES.slice(0, 10));

      const stream = new StochFastStream(5, 3);
      stream.init(highs, lows, closes);

      expect(stream.isReady()).toBe(true);

      // Add remaining data points one by one
      for (let i = 10; i < STOCH_HIGHS.length; i++) {
        const output = stream.next(
          STOCH_HIGHS[i],
          STOCH_LOWS[i],
          STOCH_CLOSES[i]
        );
        expect(output).toBeDefined();
        expect(output!.k).toBeGreaterThanOrEqual(0);
        expect(output!.k).toBeLessThanOrEqual(100);
      }
    });

    it("should throw on invalid parameters", () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);

      expect(() => stochFast(highs, lows, closes, 0, 3)).toThrow();
      expect(() => stochFast(highs, lows, closes, 5, 0)).toThrow();
      expect(() => stochSlow(highs, lows, closes, 5, 3, 0)).toThrow();
    });

    it("should throw on mismatched array lengths", () => {
      const highs = new Float64Array([1, 2, 3]);
      const lows = new Float64Array([0.5, 1.5]); // Different length
      const closes = new Float64Array([0.8, 1.8, 2.8]);
      expect(() => stochFast(highs, lows, closes, 2, 2)).toThrow();
    });
  });

  describe("Stochastic RSI", () => {
    // Extended sample data for Stochastic RSI (needs more data points)
    const EXTENDED_PRICES = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08,
      45.89, 46.03, 45.61, 46.28, 46.28, 46.0, 46.03, 46.41, 46.22, 45.64,
      46.21, 46.25, 45.71, 46.45, 45.78, 46.23, 46.69, 47.23, 46.98, 47.29,
      47.71, 47.57, 47.85, 47.45, 47.89, 48.23, 48.05, 47.79, 48.15, 48.45,
      48.32, 48.67, 48.89, 49.12, 48.95, 49.35, 49.67, 49.45, 49.78, 50.01,
    ];

    it("should calculate Stochastic RSI correctly (batch)", () => {
      const data = new Float64Array(EXTENDED_PRICES);
      const result = stochRsi(data, 14, 14, 3, 3);

      expect(result.k.length).toBe(data.length);
      expect(result.d.length).toBe(data.length);

      // Early values should be NaN
      for (let i = 0; i < 29; i++) {
        expect(Number.isNaN(result.k[i])).toBe(true);
      }

      // Valid values should be in range 0-100
      for (let i = 31; i < result.k.length; i++) {
        expect(result.k[i]).toBeGreaterThanOrEqual(0);
        expect(result.k[i]).toBeLessThanOrEqual(100);
        expect(result.d[i]).toBeGreaterThanOrEqual(0);
        expect(result.d[i]).toBeLessThanOrEqual(100);
      }
    });

    it("should handle insufficient data gracefully", () => {
      // Short data - should NOT throw, just return NaN values
      const shortData = new Float64Array([1, 2, 3, 4, 5]);
      const result = stochRsi(shortData, 14, 14, 3, 3);

      expect(result.k.length).toBe(5);
      expect(result.d.length).toBe(5);

      // All should be NaN since there's not enough data
      for (let i = 0; i < result.k.length; i++) {
        expect(Number.isNaN(result.k[i])).toBe(true);
        expect(Number.isNaN(result.d[i])).toBe(true);
      }
    });

    it("streaming should match batch results", () => {
      const data = new Float64Array(EXTENDED_PRICES);

      // Batch calculation
      const batchResult = stochRsi(data, 14, 14, 3, 3);

      // Streaming calculation
      const stream = new StochRsiStream(14, 14, 3, 3);
      const streamResult = stream.init(data);

      // Compare results
      for (let i = 0; i < data.length; i++) {
        if (Number.isNaN(batchResult.k[i])) {
          expect(Number.isNaN(streamResult.k[i])).toBe(true);
        } else {
          assertClose(streamResult.k[i], batchResult.k[i], 1e-10);
        }
        if (Number.isNaN(batchResult.d[i])) {
          expect(Number.isNaN(streamResult.d[i])).toBe(true);
        } else {
          assertClose(streamResult.d[i], batchResult.d[i], 1e-10);
        }
      }
    });

    it("streaming should continue with O(1) updates", () => {
      const data = new Float64Array(EXTENDED_PRICES);
      const stream = new StochRsiStream(14, 14, 3, 3);
      stream.init(data);

      expect(stream.isReady()).toBe(true);

      // Process additional values
      const newPrices = [50.25, 50.5, 49.75, 50.1];
      for (const price of newPrices) {
        const output = stream.next(price);
        expect(output).not.toBeUndefined();
        expect(output!.k).toBeGreaterThanOrEqual(0);
        expect(output!.k).toBeLessThanOrEqual(100);
        expect(output!.d).toBeGreaterThanOrEqual(0);
        expect(output!.d).toBeLessThanOrEqual(100);
      }
    });

    it("should throw on invalid parameters", () => {
      const data = new Float64Array(EXTENDED_PRICES);

      expect(() => stochRsi(data, 0, 14, 3, 3)).toThrow();
      expect(() => stochRsi(data, 14, 0, 3, 3)).toThrow();
      expect(() => stochRsi(data, 14, 14, 0, 3)).toThrow();
      expect(() => stochRsi(data, 14, 14, 3, 0)).toThrow();
    });

    it("should match fast-technical-indicators StochRSI results", () => {
      const data = new Float64Array(EXTENDED_PRICES);

      // Our implementation
      const ourResult = stochRsi(data, 14, 14, 3, 3);

      // fast-technical-indicators implementation
      const ftiResult = ftiStochRsi({
        values: EXTENDED_PRICES,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      });

      // ftiResult starts from the first valid value, our result is aligned with input
      // Find valid values in our result and compare
      const validOurK: number[] = [];
      const validOurD: number[] = [];

      for (let i = 0; i < ourResult.k.length; i++) {
        if (!Number.isNaN(ourResult.k[i]) && !Number.isNaN(ourResult.d[i])) {
          validOurK.push(ourResult.k[i]);
          validOurD.push(ourResult.d[i]);
        }
      }

      // Compare lengths - should have same number of valid results
      expect(validOurK.length).toBe(ftiResult.length);

      // Compare K and D values with tolerance (different implementations may have small variations)
      for (let i = 0; i < ftiResult.length; i++) {
        assertClose(validOurK[i], ftiResult[i].k as number, 0.5); // Some tolerance for algorithm differences
        assertClose(validOurD[i], ftiResult[i].d as number, 0.5);
      }
    });
  });

  describe("CVD (Cumulative Volume Delta)", () => {
    // Sample data for CVD testing
    const SAMPLE_DELTAS = [100, -50, 75, -25, 150, -100, 200, -150, 50, 25];

    // OHLCV data: high, low, close, volume
    const SAMPLE_HIGHS = [110, 112, 108, 115, 113, 118, 116, 120, 117, 122];
    const SAMPLE_LOWS = [100, 105, 102, 108, 107, 110, 109, 114, 112, 115];
    const SAMPLE_CLOSES = [108, 110, 104, 114, 109, 117, 111, 119, 113, 121];
    const SAMPLE_VOLUMES = [
      1000, 1200, 800, 1500, 900, 2000, 1100, 1800, 950, 1600,
    ];

    it("should calculate CVD from direct delta values (batch)", () => {
      const deltas = new Float64Array(SAMPLE_DELTAS);
      const result = cvd(deltas);

      expect(result.length).toBe(SAMPLE_DELTAS.length);

      // Verify cumulative sum
      let cumulative = 0;
      for (let i = 0; i < SAMPLE_DELTAS.length; i++) {
        cumulative += SAMPLE_DELTAS[i];
        assertClose(result[i], cumulative, 0.0001);
      }
    });

    it("should handle empty input", () => {
      const result = cvd(new Float64Array([]));
      expect(result.length).toBe(0);
    });

    it("should handle NaN values gracefully", () => {
      const deltas = new Float64Array([100, NaN, 50, NaN, 25]);
      const result = cvd(deltas);

      expect(result.length).toBe(5);
      assertClose(result[0], 100, 0.0001);
      expect(Number.isNaN(result[1])).toBe(true); // NaN propagates
      assertClose(result[2], 150, 0.0001); // Continues from 100
      expect(Number.isNaN(result[3])).toBe(true);
      assertClose(result[4], 175, 0.0001);
    });

    it("should calculate CVD from OHLCV data (batch)", () => {
      const highs = new Float64Array(SAMPLE_HIGHS);
      const lows = new Float64Array(SAMPLE_LOWS);
      const closes = new Float64Array(SAMPLE_CLOSES);
      const volumes = new Float64Array(SAMPLE_VOLUMES);

      const result = cvdOhlcv(highs, lows, closes, volumes);

      expect(result.length).toBe(SAMPLE_HIGHS.length);

      // First result should be the delta of first candle
      // delta = ((close-low)/(high-low) - (high-close)/(high-low)) * volume
      // For first candle: ((108-100)/(110-100) - (110-108)/(110-100)) * 1000
      // = (0.8 - 0.2) * 1000 = 600
      assertClose(result[0], 600, 1);
    });

    it("OHLCV should throw on mismatched array lengths", () => {
      const highs = new Float64Array([110, 112]);
      const lows = new Float64Array([100, 105, 102]); // Different length
      const closes = new Float64Array([108, 110]);
      const volumes = new Float64Array([1000, 1200]);

      expect(() => cvdOhlcv(highs, lows, closes, volumes)).toThrow();
    });

    it("streaming CVD should match batch results", () => {
      const deltas = new Float64Array(SAMPLE_DELTAS);

      // Batch
      const batchResult = cvd(deltas);

      // Streaming
      const stream = new CvdStream();
      const streamResult = stream.init(deltas);

      expect(streamResult.length).toBe(batchResult.length);

      for (let i = 0; i < batchResult.length; i++) {
        assertClose(streamResult[i], batchResult[i], 0.0001);
      }
    });

    it("streaming CVD should update incrementally", () => {
      const stream = new CvdStream();
      const initialDeltas = new Float64Array(SAMPLE_DELTAS.slice(0, 5));
      stream.init(initialDeltas);

      expect(stream.isReady()).toBe(true);

      // Add more deltas one at a time
      const expected = SAMPLE_DELTAS.slice(0, 5).reduce((a, b) => a + b, 0);
      assertClose(stream.current()!, expected, 0.0001);

      // Next delta
      const next = stream.next(100);
      assertClose(next!, expected + 100, 0.0001);
    });

    it("streaming OHLCV CVD should match batch", () => {
      const highs = new Float64Array(SAMPLE_HIGHS);
      const lows = new Float64Array(SAMPLE_LOWS);
      const closes = new Float64Array(SAMPLE_CLOSES);
      const volumes = new Float64Array(SAMPLE_VOLUMES);

      // Batch
      const batchResult = cvdOhlcv(highs, lows, closes, volumes);

      // Streaming
      const stream = new CvdOhlcvStream();
      const streamResult = stream.init(highs, lows, closes, volumes);

      expect(streamResult.length).toBe(batchResult.length);

      for (let i = 0; i < batchResult.length; i++) {
        assertClose(streamResult[i], batchResult[i], 0.0001);
      }
    });

    it("streaming OHLCV CVD should update incrementally", () => {
      const highs = new Float64Array(SAMPLE_HIGHS.slice(0, 5));
      const lows = new Float64Array(SAMPLE_LOWS.slice(0, 5));
      const closes = new Float64Array(SAMPLE_CLOSES.slice(0, 5));
      const volumes = new Float64Array(SAMPLE_VOLUMES.slice(0, 5));

      const stream = new CvdOhlcvStream();
      stream.init(highs, lows, closes, volumes);

      expect(stream.isReady()).toBe(true);

      // Add new bar
      const currentCvd = stream.current()!;
      const newCvd = stream.next(125, 118, 123, 1400); // bullish candle
      expect(newCvd).not.toBeUndefined();
      expect(newCvd!).toBeGreaterThan(currentCvd); // Should increase for bullish
    });

    it("should handle doji candles (high == low)", () => {
      const highs = new Float64Array([100, 100, 100]);
      const lows = new Float64Array([100, 100, 100]);
      const closes = new Float64Array([100, 100, 100]);
      const volumes = new Float64Array([1000, 1000, 1000]);

      const result = cvdOhlcv(highs, lows, closes, volumes);

      // Doji candles have no range, so delta should be 0
      for (const val of result) {
        assertClose(val, 0, 0.0001);
      }
    });

    it("streaming CVD reset should clear state", () => {
      const stream = new CvdStream();
      stream.init(new Float64Array([100, 50, 25]));

      expect(stream.isReady()).toBe(true);
      assertClose(stream.current()!, 175, 0.0001);

      stream.reset();

      expect(stream.isReady()).toBe(false);
      expect(stream.current()).toBeUndefined();

      // Should start fresh
      stream.init(new Float64Array([200, -100]));
      assertClose(stream.current()!, 100, 0.0001);
    });
  });

  // ==========================================================================
  // VWAP (Volume Weighted Average Price)
  // ==========================================================================

  describe("VWAP", () => {
    // Sample OHLCV data - same day (within 24 hours)
    const SAMPLE_TIMESTAMPS = [
      1700000000000, // 2023-11-14 22:13:20 UTC
      1700000060000, // +1 min
      1700000120000, // +2 min
      1700000180000, // +3 min
      1700000240000, // +4 min
    ];
    const SAMPLE_OPENS = [100.0, 102.0, 104.0, 103.0, 105.0];
    const SAMPLE_OHLCV_HIGHS = [105.0, 106.0, 108.0, 107.0, 110.0];
    const SAMPLE_OHLCV_LOWS = [99.0, 101.0, 103.0, 102.0, 104.0];
    const SAMPLE_OHLCV_CLOSES = [102.0, 104.0, 106.0, 105.0, 108.0];
    const SAMPLE_OHLCV_VOLUMES = [1000.0, 1500.0, 2000.0, 1200.0, 1800.0];

    // Helper to calculate typical price
    const typicalPrice = (h: number, l: number, c: number) => (h + l + c) / 3;

    describe("Session VWAP", () => {
      it("should calculate session VWAP correctly (batch)", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        const result = sessionVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );

        expect(result.length).toBe(SAMPLE_TIMESTAMPS.length);

        // First value should be the typical price (only one bar)
        const tp0 = typicalPrice(
          SAMPLE_OHLCV_HIGHS[0],
          SAMPLE_OHLCV_LOWS[0],
          SAMPLE_OHLCV_CLOSES[0]
        );
        assertClose(result[0], tp0, 0.01);

        // VWAP should be weighted average
        let cumTpVol = 0;
        let cumVol = 0;
        for (let i = 0; i < SAMPLE_TIMESTAMPS.length; i++) {
          const tp = typicalPrice(
            SAMPLE_OHLCV_HIGHS[i],
            SAMPLE_OHLCV_LOWS[i],
            SAMPLE_OHLCV_CLOSES[i]
          );
          cumTpVol += tp * SAMPLE_OHLCV_VOLUMES[i];
          cumVol += SAMPLE_OHLCV_VOLUMES[i];
          assertClose(result[i], cumTpVol / cumVol, 0.01);
        }
      });

      it("should reset on new UTC day", () => {
        // Day 1 data
        const day1Ts = 86400000 * 19000; // Some day
        const day2Ts = day1Ts + 86400000; // Next day

        const timestamps = new Float64Array([
          day1Ts,
          day1Ts + 60000, // Day 1
          day2Ts,
          day2Ts + 60000, // Day 2
        ]);
        const opens = new Float64Array([100, 102, 50, 52]);
        const highs = new Float64Array([105, 106, 55, 56]);
        const lows = new Float64Array([99, 101, 49, 51]);
        const closes = new Float64Array([102, 104, 52, 54]);
        const volumes = new Float64Array([1000, 1500, 2000, 1000]);

        const result = sessionVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );

        // Day 2 first bar should reset - VWAP should be typical price of that bar
        const day2Tp = typicalPrice(55, 49, 52);
        assertClose(result[2], day2Tp, 0.01);
      });

      it("streaming should match batch", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        const batchResult = sessionVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );

        const stream = new SessionVwapStream();
        const streamResult = stream.init(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );

        expect(streamResult.length).toBe(batchResult.length);
        for (let i = 0; i < batchResult.length; i++) {
          assertClose(streamResult[i], batchResult[i], 0.0001);
        }
      });

      it("streaming next should update correctly", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        const stream = new SessionVwapStream();
        stream.init(timestamps, opens, highs, lows, closes, volumes);

        expect(stream.isReady()).toBe(true);

        // Add a new candle
        const newVwap = stream.next(
          SAMPLE_TIMESTAMPS[4] + 60000,
          108,
          112,
          107,
          110,
          2000
        );
        expect(newVwap).toBeDefined();
        expect(typeof newVwap).toBe("number");
      });
    });

    describe("Rolling VWAP", () => {
      it("should calculate rolling VWAP correctly (batch)", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        const period = 3;
        const result = rollingVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes,
          period
        );

        expect(result.length).toBe(SAMPLE_TIMESTAMPS.length);

        // First (period-1) values should be NaN
        expect(Number.isNaN(result[0])).toBe(true);
        expect(Number.isNaN(result[1])).toBe(true);

        // Calculate expected value at index 2 (first valid)
        let cumTpVol = 0;
        let cumVol = 0;
        for (let i = 0; i < period; i++) {
          const tp = typicalPrice(
            SAMPLE_OHLCV_HIGHS[i],
            SAMPLE_OHLCV_LOWS[i],
            SAMPLE_OHLCV_CLOSES[i]
          );
          cumTpVol += tp * SAMPLE_OHLCV_VOLUMES[i];
          cumVol += SAMPLE_OHLCV_VOLUMES[i];
        }
        assertClose(result[2], cumTpVol / cumVol, 0.01);
      });

      it("streaming should match batch", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        const period = 3;
        const batchResult = rollingVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes,
          period
        );

        const stream = new RollingVwapStream(period);
        const streamResult = stream.init(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );

        expect(streamResult.length).toBe(batchResult.length);
        for (let i = 0; i < batchResult.length; i++) {
          if (Number.isNaN(batchResult[i])) {
            expect(Number.isNaN(streamResult[i])).toBe(true);
          } else {
            assertClose(streamResult[i], batchResult[i], 0.0001);
          }
        }
      });

      it("should have correct period getter", () => {
        const stream = new RollingVwapStream(20);
        expect(stream.period).toBe(20);
      });
    });

    describe("Anchored VWAP", () => {
      it("should calculate anchored VWAP from index correctly (batch)", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        const anchorIndex = 2;
        const result = anchoredVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes,
          anchorIndex
        );

        expect(result.length).toBe(SAMPLE_TIMESTAMPS.length);

        // Values before anchor should be NaN
        expect(Number.isNaN(result[0])).toBe(true);
        expect(Number.isNaN(result[1])).toBe(true);

        // First value at anchor should be typical price
        const tp = typicalPrice(
          SAMPLE_OHLCV_HIGHS[anchorIndex],
          SAMPLE_OHLCV_LOWS[anchorIndex],
          SAMPLE_OHLCV_CLOSES[anchorIndex]
        );
        assertClose(result[anchorIndex], tp, 0.01);

        // Subsequent values should be cumulative VWAP from anchor
        let cumTpVol = 0;
        let cumVol = 0;
        for (let i = anchorIndex; i < SAMPLE_TIMESTAMPS.length; i++) {
          const thisTp = typicalPrice(
            SAMPLE_OHLCV_HIGHS[i],
            SAMPLE_OHLCV_LOWS[i],
            SAMPLE_OHLCV_CLOSES[i]
          );
          cumTpVol += thisTp * SAMPLE_OHLCV_VOLUMES[i];
          cumVol += SAMPLE_OHLCV_VOLUMES[i];
          assertClose(result[i], cumTpVol / cumVol, 0.01);
        }
      });

      it("should calculate anchored VWAP from timestamp correctly (batch)", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        // Use exact timestamp of bar 2
        const anchorTs = SAMPLE_TIMESTAMPS[2];
        const result = anchoredVwapFromTimestamp(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes,
          anchorTs
        );

        expect(result.length).toBe(SAMPLE_TIMESTAMPS.length);

        // Values before anchor should be NaN
        expect(Number.isNaN(result[0])).toBe(true);
        expect(Number.isNaN(result[1])).toBe(true);
        expect(Number.isNaN(result[2])).toBe(false);
      });

      it("streaming with withAnchor should work correctly", () => {
        const timestamps = new Float64Array(SAMPLE_TIMESTAMPS);
        const opens = new Float64Array(SAMPLE_OPENS);
        const highs = new Float64Array(SAMPLE_OHLCV_HIGHS);
        const lows = new Float64Array(SAMPLE_OHLCV_LOWS);
        const closes = new Float64Array(SAMPLE_OHLCV_CLOSES);
        const volumes = new Float64Array(SAMPLE_OHLCV_VOLUMES);

        // Anchor at bar 2's timestamp
        const stream = AnchoredVwapStream.withAnchor(SAMPLE_TIMESTAMPS[2]);
        const result = stream.init(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );

        expect(Number.isNaN(result[0])).toBe(true);
        expect(Number.isNaN(result[1])).toBe(true);
        expect(Number.isNaN(result[2])).toBe(false);
        expect(stream.anchorTimestamp()).toBe(SAMPLE_TIMESTAMPS[2]);
      });

      it("streaming anchorNow should anchor at first candle", () => {
        const stream = new AnchoredVwapStream();
        stream.anchorNow();

        // First candle should become anchor
        const vwap = stream.next(
          SAMPLE_TIMESTAMPS[0],
          SAMPLE_OPENS[0],
          SAMPLE_OHLCV_HIGHS[0],
          SAMPLE_OHLCV_LOWS[0],
          SAMPLE_OHLCV_CLOSES[0],
          SAMPLE_OHLCV_VOLUMES[0]
        );
        expect(vwap).toBeDefined();
        expect(stream.anchorTimestamp()).toBe(SAMPLE_TIMESTAMPS[0]);
        expect(stream.isReady()).toBe(true);
      });

      it("streaming setAnchor should update anchor", () => {
        const stream = new AnchoredVwapStream();
        stream.setAnchor(SAMPLE_TIMESTAMPS[3]);

        // Candles before anchor should return undefined
        expect(
          stream.next(
            SAMPLE_TIMESTAMPS[0],
            SAMPLE_OPENS[0],
            SAMPLE_OHLCV_HIGHS[0],
            SAMPLE_OHLCV_LOWS[0],
            SAMPLE_OHLCV_CLOSES[0],
            SAMPLE_OHLCV_VOLUMES[0]
          )
        ).toBeUndefined();
        expect(
          stream.next(
            SAMPLE_TIMESTAMPS[1],
            SAMPLE_OPENS[1],
            SAMPLE_OHLCV_HIGHS[1],
            SAMPLE_OHLCV_LOWS[1],
            SAMPLE_OHLCV_CLOSES[1],
            SAMPLE_OHLCV_VOLUMES[1]
          )
        ).toBeUndefined();

        // Candle at or after anchor should return value
        const vwap = stream.next(
          SAMPLE_TIMESTAMPS[3],
          SAMPLE_OPENS[3],
          SAMPLE_OHLCV_HIGHS[3],
          SAMPLE_OHLCV_LOWS[3],
          SAMPLE_OHLCV_CLOSES[3],
          SAMPLE_OHLCV_VOLUMES[3]
        );
        expect(vwap).toBeDefined();
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty data", () => {
        const empty = new Float64Array([]);

        const sessionResult = sessionVwap(
          empty,
          empty,
          empty,
          empty,
          empty,
          empty
        );
        expect(sessionResult.length).toBe(0);

        const rollingResult = rollingVwap(
          empty,
          empty,
          empty,
          empty,
          empty,
          empty,
          5
        );
        expect(rollingResult.length).toBe(0);

        const anchoredResult = anchoredVwap(
          empty,
          empty,
          empty,
          empty,
          empty,
          empty,
          0
        );
        expect(anchoredResult.length).toBe(0);
      });

      it("should handle zero volume gracefully", () => {
        const timestamps = new Float64Array([1700000000000]);
        const opens = new Float64Array([100]);
        const highs = new Float64Array([105]);
        const lows = new Float64Array([99]);
        const closes = new Float64Array([102]);
        const volumes = new Float64Array([0]); // Zero volume

        const result = sessionVwap(
          timestamps,
          opens,
          highs,
          lows,
          closes,
          volumes
        );
        expect(Number.isNaN(result[0])).toBe(true);
      });

      it("should throw on mismatched array lengths", () => {
        const timestamps = new Float64Array([1, 2, 3]);
        const opens = new Float64Array([1, 2]); // Wrong length
        const highs = new Float64Array([1, 2, 3]);
        const lows = new Float64Array([1, 2, 3]);
        const closes = new Float64Array([1, 2, 3]);
        const volumes = new Float64Array([1, 2, 3]);

        expect(() =>
          sessionVwap(timestamps, opens, highs, lows, closes, volumes)
        ).toThrow();
      });
    });
  });

  // ==========================================================================
  // Pivot Points
  // ==========================================================================

  describe("Pivot Points", () => {
    describe("Standard Pivot Points", () => {
      it("should calculate standard pivot points correctly", () => {
        // High = 110, Low = 100, Close = 105
        const result = pivotPoints(110, 100, 105, "standard");

        // Pivot = (110 + 100 + 105) / 3 = 105
        assertClose(result.pivot, 105, 0.001);

        // R1 = 2 × 105 - 100 = 110
        assertClose(result.r1, 110, 0.001);

        // S1 = 2 × 105 - 110 = 100
        assertClose(result.s1, 100, 0.001);

        // R2 = 105 + (110 - 100) = 115
        assertClose(result.r2, 115, 0.001);

        // S2 = 105 - (110 - 100) = 95
        assertClose(result.s2, 95, 0.001);

        // R3 = 110 + 2 × (105 - 100) = 120
        assertClose(result.r3, 120, 0.001);

        // S3 = 100 - 2 × (110 - 105) = 90
        assertClose(result.s3, 90, 0.001);
      });

      it('should accept "classic" as alias for standard', () => {
        const result = pivotPoints(110, 100, 105, "classic");
        assertClose(result.pivot, 105, 0.001);
      });
    });

    describe("Fibonacci Pivot Points", () => {
      it("should calculate fibonacci pivot points correctly", () => {
        // High = 110, Low = 100, Close = 105
        const result = pivotPoints(110, 100, 105, "fibonacci");

        // Pivot = (110 + 100 + 105) / 3 = 105
        assertClose(result.pivot, 105, 0.001);

        // Range = 10
        // R1 = 105 + 0.382 × 10 = 108.82
        assertClose(result.r1, 108.82, 0.01);

        // S1 = 105 - 0.382 × 10 = 101.18
        assertClose(result.s1, 101.18, 0.01);

        // R2 = 105 + 0.618 × 10 = 111.18
        assertClose(result.r2, 111.18, 0.01);

        // S2 = 105 - 0.618 × 10 = 98.82
        assertClose(result.s2, 98.82, 0.01);

        // R3 = 105 + 1.0 × 10 = 115
        assertClose(result.r3, 115, 0.001);

        // S3 = 105 - 1.0 × 10 = 95
        assertClose(result.s3, 95, 0.001);
      });

      it('should accept "fib" as alias for fibonacci', () => {
        const result = pivotPoints(110, 100, 105, "fib");
        assertClose(result.pivot, 105, 0.001);
        assertClose(result.r1, 108.82, 0.01);
      });
    });

    describe("Woodie Pivot Points", () => {
      it("should calculate woodie pivot points correctly", () => {
        // High = 110, Low = 100, Close = 108 (bullish close)
        const result = pivotPoints(110, 100, 108, "woodie");

        // Woodie: Pivot = (110 + 100 + 2 × 108) / 4 = 106.5
        assertClose(result.pivot, 106.5, 0.001);

        // R1 = 2 × 106.5 - 100 = 113
        assertClose(result.r1, 113, 0.001);

        // S1 = 2 × 106.5 - 110 = 103
        assertClose(result.s1, 103, 0.001);
      });

      it('should accept "woodies" as alias for woodie', () => {
        const result = pivotPoints(110, 100, 108, "woodies");
        assertClose(result.pivot, 106.5, 0.001);
      });

      it("should differ from standard when close is not midpoint", () => {
        const standard = pivotPoints(110, 100, 108, "standard");
        const woodie = pivotPoints(110, 100, 108, "woodie");

        // Standard: (110 + 100 + 108) / 3 = 106
        assertClose(standard.pivot, 106, 0.001);

        // Woodie: (110 + 100 + 2 × 108) / 4 = 106.5
        assertClose(woodie.pivot, 106.5, 0.001);

        expect(Math.abs(standard.pivot - woodie.pivot)).toBeGreaterThan(0.1);
      });
    });

    describe("Batch Calculation", () => {
      it("should calculate pivot points for multiple periods", () => {
        const highs = new Float64Array([110, 120, 115]);
        const lows = new Float64Array([100, 105, 108]);
        const closes = new Float64Array([105, 118, 110]);

        const result = pivotPointsBatch(highs, lows, closes, "standard");

        // Check it returns arrays
        expect(result.pivot).toBeInstanceOf(Float64Array);
        expect(result.r1).toBeInstanceOf(Float64Array);
        expect(result.s1).toBeInstanceOf(Float64Array);
        expect(result.pivot.length).toBe(3);

        // First candle: (110 + 100 + 105) / 3 = 105
        assertClose(result.pivot[0], 105, 0.001);

        // Second candle: (120 + 105 + 118) / 3 = 114.33
        assertClose(result.pivot[1], 114.333, 0.01);

        // Third candle: (115 + 108 + 110) / 3 = 111
        assertClose(result.pivot[2], 111, 0.001);
      });

      it("should work with all variants in batch mode", () => {
        const highs = new Float64Array([110]);
        const lows = new Float64Array([100]);
        const closes = new Float64Array([105]);

        const standard = pivotPointsBatch(highs, lows, closes, "standard");
        const fib = pivotPointsBatch(highs, lows, closes, "fibonacci");
        const woodie = pivotPointsBatch(highs, lows, closes, "woodie");

        // All should have same pivot for symmetric close
        assertClose(standard.pivot[0], 105, 0.001);
        assertClose(fib.pivot[0], 105, 0.001);
        assertClose(woodie.pivot[0], 105, 0.001);

        // But different R1 values for fib
        assertClose(standard.r1[0], 110, 0.001);
        assertClose(fib.r1[0], 108.82, 0.01);
      });
    });

    describe("Edge Cases", () => {
      it("should handle NaN values", () => {
        const result = pivotPoints(NaN, 100, 105, "standard");
        expect(Number.isNaN(result.pivot)).toBe(true);
        expect(Number.isNaN(result.r1)).toBe(true);
      });

      it("should handle zero range (doji)", () => {
        const result = pivotPoints(100, 100, 100, "standard");
        assertClose(result.pivot, 100, 0.001);
        assertClose(result.r1, 100, 0.001);
        assertClose(result.s1, 100, 0.001);
      });

      it("should throw on invalid variant", () => {
        expect(() => pivotPoints(110, 100, 105, "invalid")).toThrow();
      });

      it("should throw on mismatched array lengths in batch", () => {
        const highs = new Float64Array([110, 120]);
        const lows = new Float64Array([100]); // Wrong length
        const closes = new Float64Array([105, 118]);

        expect(() =>
          pivotPointsBatch(highs, lows, closes, "standard")
        ).toThrow();
      });
    });
  });

  describe("FRVP (Fixed Range Volume Profile)", () => {
    // Sample OHLCV data for volume profile testing
    const SAMPLE_HIGHS = new Float64Array([
      105, 110, 108, 112, 115, 113, 118, 116, 120, 118,
    ]);
    const SAMPLE_LOWS = new Float64Array([
      100, 105, 102, 108, 110, 108, 112, 110, 115, 112,
    ]);
    const SAMPLE_CLOSES = new Float64Array([
      102, 108, 105, 110, 112, 110, 115, 113, 118, 115,
    ]);
    const SAMPLE_VOLUMES = new Float64Array([
      1000, 1500, 1200, 2000, 2500, 1800, 3000, 2200, 2800, 2000,
    ]);

    describe("Batch Mode", () => {
      it("should calculate FRVP correctly", () => {
        const result = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES,
          10
        );

        // Check structure
        expect(result.poc).toBeDefined();
        expect(result.vah).toBeDefined();
        expect(result.val).toBeDefined();
        expect(result.totalVolume).toBeDefined();
        expect(result.histogram).toBeDefined();

        // POC should be within the price range
        expect(result.poc).toBeGreaterThanOrEqual(100);
        expect(result.poc).toBeLessThanOrEqual(120);

        // VAL <= POC <= VAH
        expect(result.val).toBeLessThanOrEqual(result.poc);
        expect(result.vah).toBeGreaterThanOrEqual(result.poc);

        // Total volume should match
        const expectedTotal = Array.from(SAMPLE_VOLUMES).reduce(
          (a, b) => a + b,
          0
        );
        assertClose(result.totalVolume, expectedTotal, 1);
      });

      it("should return histogram with correct structure", () => {
        const numBins = 20;
        const result = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES,
          numBins
        );

        // Histogram should have arrays for prices, volumes, lows, highs
        expect(result.histogram.prices).toBeInstanceOf(Float64Array);
        expect(result.histogram.volumes).toBeInstanceOf(Float64Array);
        expect(result.histogram.lows).toBeInstanceOf(Float64Array);
        expect(result.histogram.highs).toBeInstanceOf(Float64Array);

        // All arrays should have numBins elements
        expect(result.histogram.prices.length).toBe(numBins);
        expect(result.histogram.volumes.length).toBe(numBins);
      });

      it("should calculate value area correctly (~70% of volume)", () => {
        const result = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES,
          20,
          0.7
        );

        // Value area volume should be approximately 70% of total
        const vaRatio = result.valueAreaVolume / result.totalVolume;
        expect(vaRatio).toBeGreaterThanOrEqual(0.65);
        expect(vaRatio).toBeLessThanOrEqual(1.0);
      });

      it("should support custom value area percentage", () => {
        const result50 = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES,
          20,
          0.5
        );
        const result80 = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES,
          20,
          0.8
        );

        // Higher percentage should include more volume
        expect(result80.valueAreaVolume).toBeGreaterThanOrEqual(
          result50.valueAreaVolume
        );
      });

      it("should use default values when not specified", () => {
        // Should work without numBins and valueAreaPercent (defaults to 100 bins, 70%)
        const result = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES
        );

        expect(result.poc).toBeDefined();
        expect(result.histogram.prices.length).toBe(100);
      });

      it("should handle single candle", () => {
        const highs = new Float64Array([110]);
        const lows = new Float64Array([100]);
        const closes = new Float64Array([105]);
        const volumes = new Float64Array([1000]);

        const result = frvp(highs, lows, closes, volumes, 10);

        expect(result.totalVolume).toBe(1000);
        expect(result.poc).toBeGreaterThanOrEqual(100);
        expect(result.poc).toBeLessThanOrEqual(110);
      });

      it("should throw on mismatched array lengths", () => {
        const highs = new Float64Array([110, 120]);
        const lows = new Float64Array([100]); // Wrong length
        const closes = new Float64Array([105, 115]);
        const volumes = new Float64Array([1000, 1500]);

        expect(() => frvp(highs, lows, closes, volumes, 10)).toThrow();
      });
    });

    describe("Streaming Mode", () => {
      it("should initialize and return FRVP output", () => {
        const stream = new FrvpStream(10);

        expect(stream.isReady()).toBe(false);

        const initResult = stream.init(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES
        );

        expect(stream.isReady()).toBe(true);
        expect(initResult).toBeDefined();
        expect(initResult!.poc).toBeDefined();
        expect(initResult!.vah).toBeDefined();
        expect(initResult!.val).toBeDefined();
      });

      it("should update with new candles", () => {
        const stream = new FrvpStream(10);
        stream.init(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, SAMPLE_VOLUMES);

        const beforeCount = stream.candleCount;
        const result = stream.next(125, 120, 123, 5000);

        expect(stream.candleCount).toBe(beforeCount + 1);
        expect(result).toBeDefined();
        expect(result!.totalVolume).toBeGreaterThan(0);
      });

      it("should match batch results after init", () => {
        const batchResult = frvp(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES,
          10
        );

        const stream = new FrvpStream(10);
        const streamResult = stream.init(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES
        );

        expect(streamResult).toBeDefined();
        assertClose(streamResult!.poc, batchResult.poc, 0.001);
        assertClose(streamResult!.vah, batchResult.vah, 0.001);
        assertClose(streamResult!.val, batchResult.val, 0.001);
        assertClose(streamResult!.totalVolume, batchResult.totalVolume, 0.01);
      });

      it("should reset correctly", () => {
        const stream = new FrvpStream(10);
        stream.init(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, SAMPLE_VOLUMES);

        expect(stream.isReady()).toBe(true);
        expect(stream.candleCount).toBeGreaterThan(0);

        stream.reset();

        expect(stream.isReady()).toBe(false);
        expect(stream.candleCount).toBe(0);
      });

      it("should clear candles correctly", () => {
        const stream = new FrvpStream(10);
        stream.init(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, SAMPLE_VOLUMES);

        stream.clear();

        expect(stream.isReady()).toBe(false);
        expect(stream.candleCount).toBe(0);
      });

      it("should have correct numBins getter", () => {
        const stream = new FrvpStream(50);
        expect(stream.numBins).toBe(50);
      });

      it("should support custom value area percentage", () => {
        const stream = new FrvpStream(10, 0.8);
        const result = stream.init(
          SAMPLE_HIGHS,
          SAMPLE_LOWS,
          SAMPLE_CLOSES,
          SAMPLE_VOLUMES
        );

        expect(result).toBeDefined();
        // 80% should capture more volume than default 70%
        const vaRatio = result!.valueAreaVolume / result!.totalVolume;
        expect(vaRatio).toBeGreaterThanOrEqual(0.75);
      });
    });

    describe("Volume Distribution", () => {
      it("should distribute volume evenly for uniform candle", () => {
        // Single candle spanning 100-110 with 1000 volume
        const highs = new Float64Array([110]);
        const lows = new Float64Array([100]);
        const closes = new Float64Array([105]);
        const volumes = new Float64Array([1000]);

        const result = frvp(highs, lows, closes, volumes, 10);

        // Each of 10 bins should have ~100 volume
        const binVolumes = Array.from(result.histogram.volumes);
        for (const vol of binVolumes) {
          assertClose(vol as number, 100, 5); // Allow small floating point variance
        }
      });

      it("should concentrate volume at high-activity levels", () => {
        // Create data with concentrated activity in the 105-110 range
        const highs = new Float64Array([106, 110, 108, 107, 109]);
        const lows = new Float64Array([104, 107, 105, 104, 106]);
        const closes = new Float64Array([105, 109, 106, 106, 108]);
        const volumes = new Float64Array([1000, 2000, 1500, 1000, 1500]);

        const result = frvp(highs, lows, closes, volumes, 20);

        // POC should be in the concentrated area
        expect(result.poc).toBeGreaterThanOrEqual(104);
        expect(result.poc).toBeLessThanOrEqual(110);
      });
    });

    describe("Edge Cases", () => {
      it("should handle flat price (no range)", () => {
        const highs = new Float64Array([100, 100]);
        const lows = new Float64Array([100, 100]);
        const closes = new Float64Array([100, 100]);
        const volumes = new Float64Array([500, 500]);

        const result = frvp(highs, lows, closes, volumes, 10);

        // All prices should be at 100
        expect(result.poc).toBe(100);
        assertClose(result.totalVolume, 1000, 0.01);
      });

      it("should handle zero volume candles", () => {
        const highs = new Float64Array([110, 115]);
        const lows = new Float64Array([100, 105]);
        const closes = new Float64Array([105, 110]);
        const volumes = new Float64Array([0, 1000]); // First candle has zero volume

        const result = frvp(highs, lows, closes, volumes, 10);

        // Should still work, total volume = 1000
        assertClose(result.totalVolume, 1000, 0.01);
      });
    });
  });

  // ============================================================================
  // Tier B Indicators
  // ============================================================================

  describe("MFI (Money Flow Index)", () => {
    // Generate sample OHLCV data with realistic price movements
    const generateOhlcvData = (length: number) => {
      const highs: number[] = [];
      const lows: number[] = [];
      const closes: number[] = [];
      const volumes: number[] = [];

      let basePrice = 100;
      for (let i = 0; i < length; i++) {
        const range = 2 + Math.random() * 2;
        const low = basePrice - range / 2;
        const high = basePrice + range / 2;
        const close = low + Math.random() * range;

        highs.push(high);
        lows.push(low);
        closes.push(close);
        volumes.push(1000 + Math.random() * 500);

        // Random walk
        basePrice += (Math.random() - 0.5) * 2;
      }

      return {
        highs: new Float64Array(highs),
        lows: new Float64Array(lows),
        closes: new Float64Array(closes),
        volumes: new Float64Array(volumes),
      };
    };

    it("should calculate MFI correctly (batch)", () => {
      const data = generateOhlcvData(30);
      const period = 14;
      const result = mfi(
        data.highs,
        data.lows,
        data.closes,
        data.volumes,
        period
      );

      expect(result.length).toBe(30);

      // First period values should be NaN
      for (let i = 0; i < period; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // Valid values should be between 0 and 100
      for (let i = period; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(0);
        expect(result[i]).toBeLessThanOrEqual(100);
      }
    });

    it("should work in streaming mode", () => {
      const data = generateOhlcvData(30);
      const period = 14;

      const stream = new MfiStream(period);
      const initResult = stream.init(
        data.highs,
        data.lows,
        data.closes,
        data.volumes
      );

      expect(initResult.length).toBe(30);
      expect(stream.isReady()).toBe(true);

      // Stream a new value
      const nextResult = stream.next(101, 99, 100.5, 1200);
      expect(nextResult).toBeDefined();
      expect(typeof nextResult).toBe("number");
    });

    it("streaming should match batch results", () => {
      const data = generateOhlcvData(30);
      const period = 14;

      const batchResult = mfi(
        data.highs,
        data.lows,
        data.closes,
        data.volumes,
        period
      );

      const stream = new MfiStream(period);
      const streamResult = stream.init(
        data.highs,
        data.lows,
        data.closes,
        data.volumes
      );

      for (let i = 0; i < batchResult.length; i++) {
        if (Number.isNaN(batchResult[i])) {
          expect(Number.isNaN(streamResult[i])).toBe(true);
        } else {
          assertClose(streamResult[i], batchResult[i]);
        }
      }
    });
  });

  describe("HMA (Hull Moving Average)", () => {
    it("should calculate HMA correctly (batch)", () => {
      const period = 9;
      const data = new Float64Array(SAMPLE_PRICES);
      const result = hma(data, period);

      expect(result.length).toBe(SAMPLE_PRICES.length);

      // HMA has a lookback = period + sqrt(period) - 2
      const lookback = period + Math.floor(Math.sqrt(period)) - 2;

      // First lookback values should be NaN
      for (let i = 0; i < lookback; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // Valid values should exist after lookback
      for (let i = lookback; i < result.length; i++) {
        expect(Number.isNaN(result[i])).toBe(false);
      }
    });

    it("should work in streaming mode", () => {
      const period = 9;
      const data = new Float64Array(SAMPLE_PRICES);

      const stream = new HmaStream(period);
      const initResult = stream.init(data);

      expect(initResult.length).toBe(SAMPLE_PRICES.length);
      expect(stream.isReady()).toBe(true);

      const nextResult = stream.next(47.5);
      expect(nextResult).toBeDefined();
      expect(typeof nextResult).toBe("number");
    });

    it("streaming should match batch results", () => {
      const period = 9;
      const data = new Float64Array(SAMPLE_PRICES);

      const batchResult = hma(data, period);

      const stream = new HmaStream(period);
      const streamResult = stream.init(data);

      for (let i = 0; i < batchResult.length; i++) {
        if (Number.isNaN(batchResult[i])) {
          expect(Number.isNaN(streamResult[i])).toBe(true);
        } else {
          assertClose(streamResult[i], batchResult[i]);
        }
      }
    });

    it("should have less lag than SMA", () => {
      // Create a trending dataset
      const trending = new Float64Array([...Array(20)].map((_, i) => 100 + i));
      const period = 9;

      const hmaResult = hma(trending, period);
      const smaResult = sma(trending, period);

      // Get the last valid values
      const lastHma = hmaResult[hmaResult.length - 1];
      const lastSma = smaResult[smaResult.length - 1];
      const lastPrice = trending[trending.length - 1];

      // HMA should be closer to the current price than SMA (less lag)
      const hmaLag = Math.abs(lastHma - lastPrice);
      const smaLag = Math.abs(lastSma - lastPrice);

      expect(hmaLag).toBeLessThan(smaLag);
    });
  });

  describe("Ichimoku Cloud", () => {
    // Generate longer price data for Ichimoku (needs 52+ periods)
    const generateIchimokuData = (length: number) => {
      const highs: number[] = [];
      const lows: number[] = [];
      const closes: number[] = [];

      let basePrice = 100;
      for (let i = 0; i < length; i++) {
        const range = 2 + Math.random() * 2;
        const low = basePrice - range / 2;
        const high = basePrice + range / 2;
        const close = low + Math.random() * range;

        highs.push(high);
        lows.push(low);
        closes.push(close);

        basePrice += (Math.random() - 0.5) * 2;
      }

      return {
        highs: new Float64Array(highs),
        lows: new Float64Array(lows),
        closes: new Float64Array(closes),
      };
    };

    it("should calculate Ichimoku correctly with default periods (batch)", () => {
      const data = generateIchimokuData(60);
      const result = ichimoku(data.highs, data.lows, data.closes, 9, 26, 52);

      expect(result.tenkanSen.length).toBe(60);
      expect(result.kijunSen.length).toBe(60);
      expect(result.senkouSpanA.length).toBe(60);
      expect(result.senkouSpanB.length).toBe(60);
      expect(result.chikouSpan.length).toBe(60);

      // Tenkan-sen available from index 8 (period 9 - 1)
      expect(Number.isNaN(result.tenkanSen[7])).toBe(true);
      expect(Number.isNaN(result.tenkanSen[8])).toBe(false);

      // Kijun-sen available from index 25 (period 26 - 1)
      expect(Number.isNaN(result.kijunSen[24])).toBe(true);
      expect(Number.isNaN(result.kijunSen[25])).toBe(false);

      // Senkou Span B available from index 51 (period 52 - 1)
      expect(Number.isNaN(result.senkouSpanB[50])).toBe(true);
      expect(Number.isNaN(result.senkouSpanB[51])).toBe(false);

      // Chikou Span is just the close, always available
      for (let i = 0; i < 60; i++) {
        assertClose(result.chikouSpan[i], data.closes[i]);
      }
    });

    it("should work in streaming mode", () => {
      const data = generateIchimokuData(60);

      const stream = new IchimokuStream(9, 26, 52);
      const initResult = stream.init(data.highs, data.lows, data.closes);

      expect(initResult.tenkanSen.length).toBe(60);
      expect(stream.isReady()).toBe(true);

      const nextResult = stream.next(105, 100, 102);
      expect(nextResult).toBeDefined();
      expect(nextResult!.tenkanSen).toBeDefined();
      expect(nextResult!.kijunSen).toBeDefined();
    });

    it("streaming should match batch results", () => {
      const data = generateIchimokuData(60);

      const batchResult = ichimoku(
        data.highs,
        data.lows,
        data.closes,
        9,
        26,
        52
      );

      const stream = new IchimokuStream(9, 26, 52);
      const streamResult = stream.init(data.highs, data.lows, data.closes);

      for (let i = 0; i < 60; i++) {
        if (Number.isNaN(batchResult.tenkanSen[i])) {
          expect(Number.isNaN(streamResult.tenkanSen[i])).toBe(true);
        } else {
          assertClose(streamResult.tenkanSen[i], batchResult.tenkanSen[i]);
        }

        if (Number.isNaN(batchResult.kijunSen[i])) {
          expect(Number.isNaN(streamResult.kijunSen[i])).toBe(true);
        } else {
          assertClose(streamResult.kijunSen[i], batchResult.kijunSen[i]);
        }
      }
    });

    it("should work with custom periods", () => {
      const data = generateIchimokuData(30);
      const result = ichimoku(data.highs, data.lows, data.closes, 5, 10, 20);

      // Tenkan-sen available from index 4
      expect(Number.isNaN(result.tenkanSen[4])).toBe(false);

      // Senkou Span B available from index 19
      expect(Number.isNaN(result.senkouSpanB[19])).toBe(false);
    });
  });

  describe("ADX (Average Directional Index)", () => {
    const generateTrendingData = (length: number, direction: "up" | "down") => {
      const highs: number[] = [];
      const lows: number[] = [];
      const closes: number[] = [];

      let basePrice = 100;
      const trend = direction === "up" ? 0.5 : -0.5;

      for (let i = 0; i < length; i++) {
        const range = 1 + Math.random();
        const low = basePrice - range / 2;
        const high = basePrice + range / 2;
        const close = direction === "up" ? high - 0.2 : low + 0.2;

        highs.push(high);
        lows.push(low);
        closes.push(close);

        basePrice += trend;
      }

      return {
        highs: new Float64Array(highs),
        lows: new Float64Array(lows),
        closes: new Float64Array(closes),
      };
    };

    it("should calculate ADX correctly (batch)", () => {
      const data = generateTrendingData(40, "up");
      const period = 14;
      const result = adx(data.highs, data.lows, data.closes, period);

      expect(result.adx.length).toBe(40);
      expect(result.plusDi.length).toBe(40);
      expect(result.minusDi.length).toBe(40);

      // +DI and -DI available from index = period
      expect(Number.isNaN(result.plusDi[period - 1])).toBe(true);
      expect(Number.isNaN(result.plusDi[period])).toBe(false);

      // ADX available from index = 2 * period - 1
      const adxStart = 2 * period - 1;
      expect(Number.isNaN(result.adx[adxStart - 1])).toBe(true);
      expect(Number.isNaN(result.adx[adxStart])).toBe(false);

      // Values should be in 0-100 range
      for (let i = adxStart; i < result.adx.length; i++) {
        expect(result.adx[i]).toBeGreaterThanOrEqual(0);
        expect(result.adx[i]).toBeLessThanOrEqual(100);
        expect(result.plusDi[i]).toBeGreaterThanOrEqual(0);
        expect(result.plusDi[i]).toBeLessThanOrEqual(100);
        expect(result.minusDi[i]).toBeGreaterThanOrEqual(0);
        expect(result.minusDi[i]).toBeLessThanOrEqual(100);
      }
    });

    it("should show +DI > -DI in uptrend", () => {
      const data = generateTrendingData(40, "up");
      const result = adx(data.highs, data.lows, data.closes, 5);

      // In strong uptrend, +DI should be greater than -DI
      const lastIdx = result.plusDi.length - 1;
      expect(result.plusDi[lastIdx]).toBeGreaterThan(result.minusDi[lastIdx]);
    });

    it("should show -DI > +DI in downtrend", () => {
      const data = generateTrendingData(40, "down");
      const result = adx(data.highs, data.lows, data.closes, 5);

      // In strong downtrend, -DI should be greater than +DI
      const lastIdx = result.minusDi.length - 1;
      expect(result.minusDi[lastIdx]).toBeGreaterThan(result.plusDi[lastIdx]);
    });

    it("should work in streaming mode", () => {
      const data = generateTrendingData(40, "up");

      const stream = new AdxStream(14);
      const initResult = stream.init(data.highs, data.lows, data.closes);

      expect(initResult.adx.length).toBe(40);
      expect(stream.isReady()).toBe(true);

      const nextResult = stream.next(110, 108, 109);
      expect(nextResult).toBeDefined();
      expect(nextResult!.adx).toBeDefined();
      expect(nextResult!.plusDi).toBeDefined();
      expect(nextResult!.minusDi).toBeDefined();
    });

    it("streaming should match batch results", () => {
      const data = generateTrendingData(40, "up");

      const batchResult = adx(data.highs, data.lows, data.closes, 5);

      const stream = new AdxStream(5);
      const streamResult = stream.init(data.highs, data.lows, data.closes);

      for (let i = 0; i < 40; i++) {
        if (Number.isNaN(batchResult.adx[i])) {
          expect(Number.isNaN(streamResult.adx[i])).toBe(true);
        } else {
          assertClose(streamResult.adx[i], batchResult.adx[i]);
        }

        if (Number.isNaN(batchResult.plusDi[i])) {
          expect(Number.isNaN(streamResult.plusDi[i])).toBe(true);
        } else {
          assertClose(streamResult.plusDi[i], batchResult.plusDi[i]);
        }

        if (Number.isNaN(batchResult.minusDi[i])) {
          expect(Number.isNaN(streamResult.minusDi[i])).toBe(true);
        } else {
          assertClose(streamResult.minusDi[i], batchResult.minusDi[i]);
        }
      }
    });
  });

  describe("Linear Regression Channels", () => {
    it("should calculate linear regression correctly (batch)", () => {
      const data = new Float64Array(SAMPLE_PRICES);
      const period = 10;
      const result = linreg(data, period, 2.0);

      expect(result.value.length).toBe(SAMPLE_PRICES.length);
      expect(result.upper.length).toBe(SAMPLE_PRICES.length);
      expect(result.lower.length).toBe(SAMPLE_PRICES.length);
      expect(result.slope.length).toBe(SAMPLE_PRICES.length);
      expect(result.r.length).toBe(SAMPLE_PRICES.length);
      expect(result.rSquared.length).toBe(SAMPLE_PRICES.length);

      // First period-1 values should be NaN
      for (let i = 0; i < period - 1; i++) {
        expect(Number.isNaN(result.value[i])).toBe(true);
      }

      // Valid values after lookback
      for (let i = period - 1; i < result.value.length; i++) {
        expect(Number.isNaN(result.value[i])).toBe(false);
        expect(result.upper[i]).toBeGreaterThan(result.value[i]);
        expect(result.lower[i]).toBeLessThan(result.value[i]);
        expect(result.r[i]).toBeGreaterThanOrEqual(-1);
        expect(result.r[i]).toBeLessThanOrEqual(1);
        expect(result.rSquared[i]).toBeGreaterThanOrEqual(0);
        expect(result.rSquared[i]).toBeLessThanOrEqual(1);
      }
    });

    it("should return R=1 for perfect linear data", () => {
      // Perfect linear data: y = 2x + 10
      const linearData = new Float64Array(
        [...Array(20)].map((_, i) => 2 * i + 10)
      );
      const result = linreg(linearData, 10, 2.0);

      // R should be exactly 1 (or very close due to floating point)
      for (let i = 9; i < result.r.length; i++) {
        assertClose(result.r[i], 1.0, 1e-6);
        assertClose(result.rSquared[i], 1.0, 1e-6);
        assertClose(result.slope[i], 2.0, 1e-6);
      }
    });

    it("should return R=-1 for perfect negative linear data", () => {
      // Perfect negative linear data: y = -2x + 50
      const linearData = new Float64Array(
        [...Array(20)].map((_, i) => -2 * i + 50)
      );
      const result = linreg(linearData, 10, 2.0);

      // R should be exactly -1
      for (let i = 9; i < result.r.length; i++) {
        assertClose(result.r[i], -1.0, 1e-6);
        assertClose(result.slope[i], -2.0, 1e-6);
      }
    });

    it("should work in streaming mode", () => {
      const data = new Float64Array(SAMPLE_PRICES);

      const stream = new LinRegStream(10, 2.0);
      const initResult = stream.init(data);

      expect(initResult.value.length).toBe(SAMPLE_PRICES.length);
      expect(stream.isReady()).toBe(true);

      const nextResult = stream.next(47.5);
      expect(nextResult).toBeDefined();
      expect(nextResult!.value).toBeDefined();
      expect(nextResult!.r).toBeDefined();
      expect(nextResult!.slope).toBeDefined();
    });

    it("streaming should match batch results", () => {
      const data = new Float64Array(SAMPLE_PRICES);

      const batchResult = linreg(data, 10, 2.0);

      const stream = new LinRegStream(10, 2.0);
      const streamResult = stream.init(data);

      for (let i = 0; i < data.length; i++) {
        if (Number.isNaN(batchResult.value[i])) {
          expect(Number.isNaN(streamResult.value[i])).toBe(true);
        } else {
          assertClose(streamResult.value[i], batchResult.value[i]);
          assertClose(streamResult.slope[i], batchResult.slope[i]);
          assertClose(streamResult.r[i], batchResult.r[i]);
          assertClose(streamResult.upper[i], batchResult.upper[i]);
          assertClose(streamResult.lower[i], batchResult.lower[i]);
        }
      }
    });

    it("should respect numStdDev parameter", () => {
      const data = new Float64Array(SAMPLE_PRICES);

      const result1 = linreg(data, 10, 1.0);
      const result2 = linreg(data, 10, 2.0);

      // With 2 std devs, bands should be wider
      const idx = 15;
      const band1Width = result1.upper[idx] - result1.lower[idx];
      const band2Width = result2.upper[idx] - result2.lower[idx];

      assertClose(band2Width, band1Width * 2, 0.01);
    });
  });
});
