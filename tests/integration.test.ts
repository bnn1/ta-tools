import { describe, it, expect, beforeAll } from 'vitest';
import { sma, ema, rsi, macd, bbands, atr, stochFast, stochSlow, SmaStream, EmaStream, RsiStream, MacdStream, BBandsStream, AtrStream, StochFastStream, StochSlowStream } from '../dist/index.js';
import {
  sma as ftiSma,
  ema as ftiEma,
  rsi as ftiRsi,
  macd as ftiMacd,
  bollingerbands as ftiBBands,
  atr as ftiAtr,
} from 'fast-technical-indicators';

// Sample price data for testing
const SAMPLE_PRICES = [
  44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08,
  45.89, 46.03, 46.83, 47.69, 46.49, 46.26, 47.09, 46.66,
  46.80, 46.23, 46.38, 46.33, 46.55, 45.88, 47.82, 47.23
];

const TOLERANCE = 0.01; // Allow 0.01 difference for floating point comparisons

function assertClose(actual: number, expected: number, tolerance = TOLERANCE) {
  if (Number.isNaN(expected)) {
    expect(Number.isNaN(actual)).toBe(true);
  } else {
    expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
  }
}

describe('ta-tools Integration Tests', () => {
  describe('SMA', () => {
    it('should calculate SMA correctly (batch)', () => {
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
      const expectedFirst = SAMPLE_PRICES.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      assertClose(result[9], expectedFirst);
    });

    it('should match fast-technical-indicators SMA results', () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      const ourResult = sma(data, period);
      const ftiResult = ftiSma({ period, values: SAMPLE_PRICES });

      // fast-technical-indicators returns only valid values (no NaN prefix)
      // Our result has NaN for first (period-1) values
      const ourValidResults = Array.from(ourResult).filter(v => !Number.isNaN(v));

      expect(ourValidResults.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        assertClose(ourValidResults[i], ftiResult[i]);
      }
    });

    it('should work in streaming mode', () => {
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
      expect(typeof nextResult).toBe('number');
    });

    it('streaming should match batch results', () => {
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

  describe('EMA', () => {
    it('should calculate EMA correctly (batch)', () => {
      const period = 10;
      const data = new Float64Array(SAMPLE_PRICES);
      const result = ema(data, period);

      expect(result.length).toBe(data.length);

      // First (period-1) values should be NaN
      for (let i = 0; i < period - 1; i++) {
        expect(Number.isNaN(result[i])).toBe(true);
      }

      // Value at index (period-1) should be the SMA (seed value)
      const expectedSeed = SAMPLE_PRICES.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      assertClose(result[9], expectedSeed);
    });

    it('should match fast-technical-indicators EMA results', () => {
      const period = 5;
      const data = new Float64Array(SAMPLE_PRICES);

      const ourResult = ema(data, period);
      const ftiResult = ftiEma({ period, values: SAMPLE_PRICES });

      const ourValidResults = Array.from(ourResult).filter(v => !Number.isNaN(v));

      expect(ourValidResults.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        assertClose(ourValidResults[i], ftiResult[i]);
      }
    });

    it('streaming should match batch results', () => {
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

  describe('RSI', () => {
    it('should calculate RSI correctly (batch)', () => {
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

    it('should match fast-technical-indicators RSI results (within tolerance)', () => {
      const period = 14;
      const data = new Float64Array(SAMPLE_PRICES);

      const ourResult = rsi(data, period);
      const ftiResult = ftiRsi({ period, values: SAMPLE_PRICES });

      const ourValidResults = Array.from(ourResult).filter(v => !Number.isNaN(v));

      // RSI implementations can vary slightly due to Wilder vs EMA smoothing
      // We check that they're in the same ballpark (within 5%)
      expect(ourValidResults.length).toBe(ftiResult.length);

      for (let i = 0; i < ftiResult.length; i++) {
        // RSI values should be relatively close (within 5 points)
        expect(Math.abs(ourValidResults[i] - ftiResult[i])).toBeLessThan(5);
      }
    });

    it('streaming should match batch results', () => {
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

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const data = new Float64Array([]);
      const smaResult = sma(data, 5);
      expect(smaResult.length).toBe(0);
    });

    it('should handle data shorter than period', () => {
      const data = new Float64Array([1, 2, 3]);
      const result = sma(data, 10);
      expect(result.length).toBe(3);
      expect(result.every(v => Number.isNaN(v))).toBe(true);
    });

    it('should throw on invalid period', () => {
      const data = new Float64Array([1, 2, 3, 4, 5]);
      expect(() => sma(data, 0)).toThrow();
    });
  });

  describe('MACD', () => {
    // Use more data for MACD since it needs slow period (26) + signal period (9) = 35 values minimum
    const MACD_PRICES = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03,
      46.83, 47.69, 46.49, 46.26, 47.09, 46.66, 46.80, 46.23, 46.38, 46.33,
      46.55, 45.88, 47.82, 47.23, 47.45, 46.90, 47.30, 46.78, 47.12, 46.99,
      47.55, 48.10, 47.89, 48.35, 48.20, 48.75, 48.50, 49.10, 48.80, 49.25,
    ];

    it('should calculate MACD correctly (batch)', () => {
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

    it('should match fast-technical-indicators MACD results', () => {
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
        if (!Number.isNaN(ourResult.macd[i]) && !Number.isNaN(ourResult.signal[i])) {
          ourMacdValid.push(ourResult.macd[i]);
          ourSignalValid.push(ourResult.signal[i]);
          ourHistogramValid.push(ourResult.histogram[i]);
        }
      }

      // fast-technical-indicators returns array of {MACD, signal?, histogram?} objects
      // Filter to only complete results (with signal)
      const ftiComplete = ftiResult.filter(r => r.signal !== undefined);

      expect(ourMacdValid.length).toBe(ftiComplete.length);

      // Values should match closely
      for (let i = 0; i < ftiComplete.length; i++) {
        assertClose(ourMacdValid[i], ftiComplete[i].MACD!);
        assertClose(ourSignalValid[i], ftiComplete[i].signal!);
        assertClose(ourHistogramValid[i], ftiComplete[i].histogram!);
      }
    });

    it('streaming should match batch results', () => {
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

    it('should throw on invalid parameters', () => {
      const data = new Float64Array(MACD_PRICES);
      expect(() => macd(data, 0, 26, 9)).toThrow();
      expect(() => macd(data, 26, 12, 9)).toThrow(); // fast >= slow
    });
  });

  describe('Bollinger Bands', () => {
    // Use enough data for the default period (20)
    const BBANDS_PRICES = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03,
      46.83, 47.69, 46.49, 46.26, 47.09, 46.66, 46.80, 46.23, 46.38, 46.33,
      46.55, 45.88, 47.82, 47.23, 47.45, 46.90, 47.30, 46.78, 47.12, 46.99,
    ];

    it('should calculate Bollinger Bands correctly (batch)', () => {
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

    it('should match fast-technical-indicators Bollinger Bands results', () => {
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

    it('streaming should match batch results', () => {
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

    it('should throw on invalid parameters', () => {
      const data = new Float64Array(BBANDS_PRICES);
      expect(() => bbands(data, 0, 2.0)).toThrow();
      expect(() => bbands(data, 20, 0)).toThrow();
      expect(() => bbands(data, 20, -1)).toThrow();
    });
  });

  describe('ATR', () => {
    // Sample OHLC data for ATR testing
    const HIGHS = [
      48.70, 48.72, 48.90, 48.87, 48.82, 49.05, 49.20, 49.35, 49.92, 50.19,
      50.12, 49.66, 49.88, 50.19, 50.36, 50.57, 50.65, 50.43, 49.63, 50.33,
    ];
    const LOWS = [
      47.79, 48.14, 48.39, 48.37, 48.24, 48.64, 48.94, 48.86, 49.50, 49.87,
      49.20, 48.90, 49.43, 49.73, 49.26, 50.09, 50.30, 49.21, 48.98, 49.61,
    ];
    const CLOSES = [
      48.16, 48.61, 48.75, 48.63, 48.74, 49.03, 49.07, 49.32, 49.91, 50.13,
      49.53, 49.50, 49.75, 50.03, 50.31, 50.52, 50.41, 49.34, 49.37, 50.23,
    ];

    it('should calculate ATR correctly (batch)', () => {
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

    it('should produce values in expected range compared to fast-technical-indicators', () => {
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
      const ourValid = Array.from(ourResult).filter(v => !Number.isNaN(v));
      
      expect(ourValid.length).toBeGreaterThan(0);
      expect(ftiResult.length).toBeGreaterThan(0);

      // ATR values should be in similar range (within 20%)
      // Different implementations may seed the first ATR differently
      const ourLast = ourValid[ourValid.length - 1];
      const ftiLast = ftiResult[ftiResult.length - 1] as number;
      const pctDiff = Math.abs(ourLast - ftiLast) / ftiLast;
      expect(pctDiff).toBeLessThan(0.2);
    });

    it('streaming should match batch results', () => {
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

    it('should throw on invalid parameters', () => {
      const highs = new Float64Array(HIGHS);
      const lows = new Float64Array(LOWS);
      const closes = new Float64Array(CLOSES);
      expect(() => atr(highs, lows, closes, 0)).toThrow();
    });

    it('should throw on mismatched array lengths', () => {
      const highs = new Float64Array([1, 2, 3]);
      const lows = new Float64Array([0.5, 1.5]); // Different length
      const closes = new Float64Array([0.8, 1.8, 2.8]);
      expect(() => atr(highs, lows, closes, 2)).toThrow();
    });
  });

  describe('Stochastic Oscillator', () => {
    // Longer price series for stochastic (validated OHLC data)
    const STOCH_HIGHS = [
      127.01, 127.62, 126.59, 127.35, 128.17, 128.43, 127.37, 126.42, 126.90, 126.85,
      125.65, 125.72, 127.16, 127.72, 128.22, 128.27, 128.09, 128.27, 127.74, 128.77
    ];
    const STOCH_LOWS = [
      125.36, 126.16, 124.93, 126.09, 126.82, 126.48, 126.03, 124.83, 126.39, 125.72,
      124.56, 124.57, 125.07, 126.86, 126.63, 126.80, 126.71, 126.13, 125.92, 126.36
    ];
    const STOCH_CLOSES = [
      126.90, 127.16, 125.30, 126.53, 127.79, 128.01, 127.11, 125.44, 126.70, 126.25,
      125.09, 125.52, 126.74, 127.35, 127.91, 128.01, 127.59, 127.59, 127.01, 127.88
    ];

    it('should calculate Fast Stochastic correctly (batch)', () => {
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

    it('should calculate Slow Stochastic correctly (batch)', () => {
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

    it('Fast Stochastic streaming should match batch results', () => {
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

    it('Slow Stochastic streaming should match batch results', () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);
      const kPeriod = 5;
      const dPeriod = 3;
      const slowing = 3;

      const batchResult = stochSlow(highs, lows, closes, kPeriod, dPeriod, slowing);
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

    it('streaming should continue with O(1) updates', () => {
      const highs = new Float64Array(STOCH_HIGHS.slice(0, 10));
      const lows = new Float64Array(STOCH_LOWS.slice(0, 10));
      const closes = new Float64Array(STOCH_CLOSES.slice(0, 10));

      const stream = new StochFastStream(5, 3);
      stream.init(highs, lows, closes);

      expect(stream.isReady()).toBe(true);

      // Add remaining data points one by one
      for (let i = 10; i < STOCH_HIGHS.length; i++) {
        const output = stream.next(STOCH_HIGHS[i], STOCH_LOWS[i], STOCH_CLOSES[i]);
        expect(output).toBeDefined();
        expect(output!.k).toBeGreaterThanOrEqual(0);
        expect(output!.k).toBeLessThanOrEqual(100);
      }
    });

    it('should throw on invalid parameters', () => {
      const highs = new Float64Array(STOCH_HIGHS);
      const lows = new Float64Array(STOCH_LOWS);
      const closes = new Float64Array(STOCH_CLOSES);
      
      expect(() => stochFast(highs, lows, closes, 0, 3)).toThrow();
      expect(() => stochFast(highs, lows, closes, 5, 0)).toThrow();
      expect(() => stochSlow(highs, lows, closes, 5, 3, 0)).toThrow();
    });

    it('should throw on mismatched array lengths', () => {
      const highs = new Float64Array([1, 2, 3]);
      const lows = new Float64Array([0.5, 1.5]); // Different length
      const closes = new Float64Array([0.8, 1.8, 2.8]);
      expect(() => stochFast(highs, lows, closes, 2, 2)).toThrow();
    });
  });
});
