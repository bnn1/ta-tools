/**
 * ta-tools: High-performance technical analysis indicators
 *
 * This module re-exports the WASM-generated bindings with ergonomic TypeScript API.
 *
 * @example Batch Mode
 * ```typescript
 * import { sma, ema, wma, rsi, macd, bbands, atr, stochFast, stochSlow } from 'ta-tools';
 *
 * const prices = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
 * const smaResult = sma(prices, 3);
 * const emaResult = ema(prices, 3);
 * const wmaResult = wma(prices, 3);
 * const rsiResult = rsi(prices, 14);
 * const macdResult = macd(prices, 12, 26, 9); // { macd, signal, histogram }
 * const bbandsResult = bbands(prices, 20, 2.0); // { upper, middle, lower, percentB, bandwidth }
 * 
 * // ATR requires high, low, close arrays
 * const atrResult = atr(highs, lows, closes, 14);
 * 
 * // Stochastic Oscillator requires high, low, close arrays
 * const fastStoch = stochFast(highs, lows, closes, 14, 3); // { k, d }
 * const slowStoch = stochSlow(highs, lows, closes, 14, 3, 3); // { k, d }
 * ```
 *
 * @example Streaming Mode
 * ```typescript
 * import { SmaStream, EmaStream, WmaStream, RsiStream, MacdStream, BBandsStream, AtrStream, StochFastStream, StochSlowStream } from 'ta-tools';
 *
 * const smaStream = new SmaStream(14);
 * smaStream.init(historicalPrices);
 *
 * // O(1) updates for each new tick
 * const newSma = smaStream.next(newPrice);
 * 
 * // ATR streaming
 * const atrStream = new AtrStream(14);
 * atrStream.init(highs, lows, closes);
 * const newAtr = atrStream.next(newHigh, newLow, newClose);
 * 
 * // Stochastic streaming
 * const stochStream = new StochFastStream(14, 3);
 * stochStream.init(highs, lows, closes);
 * const { k, d } = stochStream.next(newHigh, newLow, newClose);
 * ```
 */

// Re-export everything from the WASM package
export {
  // Batch functions
  sma,
  ema,
  wma,
  rsi,
  macd,
  bbands,
  atr,
  stochFast,
  stochSlow,
  // Streaming classes
  SmaStream,
  EmaStream,
  WmaStream,
  RsiStream,
  MacdStream,
  BBandsStream,
  AtrStream,
  StochFastStream,
  StochSlowStream,
} from '../pkg/ta_core.js';
