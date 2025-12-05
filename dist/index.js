/**
 * ta-tools: High-performance technical analysis indicators
 *
 * This module re-exports the WASM-generated bindings with ergonomic TypeScript API.
 *
 * @example Batch Mode
 * ```typescript
 * import { sma, ema, wma, rsi, macd, bbands, atr, stochFast, stochSlow, stochRsi, cvd, cvdOhlcv, frvp } from 'ta-tools';
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
 *
 * // CVD from pre-computed deltas
 * const cvdResult = cvd(deltas);
 *
 * // CVD from OHLCV data (estimates buy/sell volume from candle structure)
 * const cvdOhlcvResult = cvdOhlcv(highs, lows, closes, volumes);
 *
 * // VWAP - Session, Rolling, and Anchored
 * const sessionVwapResult = sessionVwap(timestamps, opens, highs, lows, closes, volumes);
 * const rollingVwapResult = rollingVwap(timestamps, opens, highs, lows, closes, volumes, 20);
 * const anchoredVwapResult = anchoredVwap(timestamps, opens, highs, lows, closes, volumes, 5);
 * const anchoredVwapFromTsResult = anchoredVwapFromTimestamp(timestamps, opens, highs, lows, closes, volumes, 1700000000000);
 *
 * // Fixed Range Volume Profile
 * const frvpResult = frvp(highs, lows, closes, volumes, 100, 0.70);
 * console.log(frvpResult.poc);  // Point of Control
 * console.log(frvpResult.vah);  // Value Area High
 * console.log(frvpResult.val);  // Value Area Low
 * console.log(frvpResult.histogram); // { prices, volumes, lows, highs }
 * ```
 *
 * @example Streaming Mode
 * ```typescript
 * import { SmaStream, EmaStream, WmaStream, RsiStream, MacdStream, BBandsStream, AtrStream, StochFastStream, StochSlowStream, CvdStream, CvdOhlcvStream, FrvpStream } from 'ta-tools';
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
 *
 * // CVD streaming
 * const cvdStream = new CvdStream();
 * cvdStream.init(deltas);
 * const newCvd = cvdStream.next(newDelta);
 *
 * // CVD OHLCV streaming
 * const cvdOhlcvStream = new CvdOhlcvStream();
 * cvdOhlcvStream.init(highs, lows, closes, volumes);
 * const newCvdOhlcv = cvdOhlcvStream.next(newHigh, newLow, newClose, newVolume);
 *
 * // VWAP streaming
 * const sessionVwapStream = new SessionVwapStream();
 * sessionVwapStream.init(timestamps, opens, highs, lows, closes, volumes);
 * const newSessionVwap = sessionVwapStream.next(timestamp, open, high, low, close, volume);
 *
 * const rollingVwapStream = new RollingVwapStream(20);
 * rollingVwapStream.init(timestamps, opens, highs, lows, closes, volumes);
 * const newRollingVwap = rollingVwapStream.next(timestamp, open, high, low, close, volume);
 *
 * const anchoredVwapStream = AnchoredVwapStream.withAnchor(1700000000000);
 * anchoredVwapStream.init(timestamps, opens, highs, lows, closes, volumes);
 * const newAnchoredVwap = anchoredVwapStream.next(timestamp, open, high, low, close, volume);
 *
 * // FRVP streaming
 * const frvpStream = new FrvpStream(100); // 100 price bins
 * frvpStream.init(highs, lows, closes, volumes);
 * const frvpOutput = frvpStream.next(newHigh, newLow, newClose, newVolume);
 * ```
 */
// Re-export everything from the WASM package
export { 
// Batch functions
sma, ema, wma, rsi, macd, bbands, atr, stochFast, stochSlow, stochRsi, cvd, cvdOhlcv, sessionVwap, rollingVwap, anchoredVwap, anchoredVwapFromTimestamp, pivotPoints, pivotPointsBatch, frvp, 
// Tier B batch functions
mfi, hma, ichimoku, adx, linreg, 
// Streaming classes
SmaStream, EmaStream, WmaStream, RsiStream, MacdStream, BBandsStream, AtrStream, StochFastStream, StochSlowStream, StochRsiStream, CvdStream, CvdOhlcvStream, SessionVwapStream, RollingVwapStream, AnchoredVwapStream, FrvpStream, 
// Tier B streaming classes
MfiStream, HmaStream, IchimokuStream, AdxStream, LinRegStream, 
// Output types
FrvpOutput, VolumeProfileRow, } from '../pkg/ta_core.js';
