/**
 * ta-tools: High-performance technical analysis indicators
 *
 * This module provides a convenient TypeScript API around the WASM core.
 *
 * @example Batch Mode
 * ```typescript
 * import { sma, ema, rsi, atr, bbands } from 'ta-tools';
 *
 * // Works with number[] or Float64Array
 * const prices = [44.34, 44.09, 44.15, 43.61, 44.33];
 * const smaValues = sma(prices, 14);
 *
 * // OHLCV indicators accept Candle[] directly
 * const candles: Candle[] = [{ open: 100, high: 102, low: 99, close: 101, volume: 1000 }];
 * const atrValues = atr(candles, 14);
 * ```
 *
 * @example Streaming Mode
 * ```typescript
 * const rsiStream = rsi.stream(14);
 * rsiStream.init(historicalPrices);
 * const currentRsi = rsiStream.next(newPrice);
 * ```
 */

// =============================================================================
// Types
// =============================================================================

/**
 * OHLCV candle data structure.
 * Unified input type for all OHLCV-based indicators.
 */
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: number;
}

/** MACD output */
export interface MacdOutput {
  macd: Float64Array;
  signal: Float64Array;
  histogram: Float64Array;
}

/** Bollinger Bands output */
export interface BBandsOutput {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
  percentB: Float64Array;
  bandwidth: Float64Array;
}

/** Stochastic output */
export interface StochOutput {
  k: Float64Array;
  d: Float64Array;
}

/** ADX output */
export interface AdxOutput {
  adx: Float64Array;
  plusDI: Float64Array;
  minusDI: Float64Array;
}

/** Ichimoku Cloud output */
export interface IchimokuOutput {
  tenkan: Float64Array;
  kijun: Float64Array;
  senkouA: Float64Array;
  senkouB: Float64Array;
  chikou: Float64Array;
}

/** Linear Regression output */
export interface LinRegOutput {
  value: Float64Array;
  slope: Float64Array;
  intercept: Float64Array;
  r: Float64Array;
  rSquared: Float64Array;
  upperBand: Float64Array;
  lowerBand: Float64Array;
}

/** Pivot Points output */
export interface PivotOutput {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Converts number[] to Float64Array. Passes through Float64Array unchanged.
 */
export function toFloat64Array(data: number[] | Float64Array): Float64Array {
  if (data instanceof Float64Array) {
    return data;
  }
  return new Float64Array(data);
}

/**
 * Extracts OHLCV components from Candle array.
 */
export function extractOHLCV(candles: Candle[]): {
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
  time: Float64Array;
} {
  const len = candles.length;
  const open = new Float64Array(len);
  const high = new Float64Array(len);
  const low = new Float64Array(len);
  const close = new Float64Array(len);
  const volume = new Float64Array(len);
  const time = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const c = candles[i];
    open[i] = c.open;
    high[i] = c.high;
    low[i] = c.low;
    close[i] = c.close;
    volume[i] = c.volume ?? 0;
    time[i] = c.time ?? 0;
  }

  return { open, high, low, close, volume, time };
}

/**
 * Check if input is Candle array
 */
function isCandleArray(data: unknown): data is Candle[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  const first = data[0];
  return (
    typeof first === 'object' &&
    first !== null &&
    'open' in first &&
    'high' in first &&
    'low' in first &&
    'close' in first
  );
}

/**
 * Check if input is a price array (Float64Array or number[])
 */
function isPriceArray(data: unknown): data is PriceInput {
  return data instanceof Float64Array || (Array.isArray(data) && (data.length === 0 || typeof data[0] === 'number'));
}

// =============================================================================
// WASM Core Imports
// =============================================================================

import {
  // Batch functions
  sma as wasmSma,
  ema as wasmEma,
  wma as wasmWma,
  rsi as wasmRsi,
  macd as wasmMacd,
  bbands as wasmBbands,
  atr as wasmAtr,
  stochFast as wasmStochFast,
  stochSlow as wasmStochSlow,
  stochRsi as wasmStochRsi,
  cvd as wasmCvd,
  cvdOhlcv as wasmCvdOhlcv,
  sessionVwap as wasmSessionVwap,
  rollingVwap as wasmRollingVwap,
  anchoredVwap as wasmAnchoredVwap,
  anchoredVwapFromTimestamp as wasmAnchoredVwapFromTimestamp,
  pivotPoints as wasmPivotPoints,
  pivotPointsBatch as wasmPivotPointsBatch,
  frvp as wasmFrvp,
  mfi as wasmMfi,
  hma as wasmHma,
  ichimoku as wasmIchimoku,
  adx as wasmAdx,
  linreg as wasmLinreg,
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
  StochRsiStream,
  CvdStream,
  CvdOhlcvStream,
  SessionVwapStream,
  RollingVwapStream,
  AnchoredVwapStream,
  FrvpStream,
  MfiStream,
  HmaStream,
  IchimokuStream,
  AdxStream,
  LinRegStream,
  // Output types from WASM
  FrvpOutput,
  VolumeProfileRow,
} from '../pkg/ta_core.js';

// Re-export WASM types
export { FrvpOutput, VolumeProfileRow };

// Re-export streaming classes for advanced users
export {
  SmaStream,
  EmaStream,
  WmaStream,
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
  MfiStream,
  HmaStream,
  IchimokuStream,
  AdxStream,
  LinRegStream,
};

// =============================================================================
// Single-Input Indicators
// =============================================================================

type PriceInput = number[] | Float64Array;

/**
 * Simple Moving Average
 */
export function sma(data: PriceInput, period: number): Float64Array {
  return wasmSma(toFloat64Array(data), period);
}
sma.stream = (period: number) => new SmaStream(period);

/**
 * Exponential Moving Average
 */
export function ema(data: PriceInput, period: number): Float64Array {
  return wasmEma(toFloat64Array(data), period);
}
ema.stream = (period: number) => new EmaStream(period);

/**
 * Weighted Moving Average
 */
export function wma(data: PriceInput, period: number): Float64Array {
  return wasmWma(toFloat64Array(data), period);
}
wma.stream = (period: number) => new WmaStream(period);

/**
 * Relative Strength Index
 */
export function rsi(data: PriceInput, period: number): Float64Array {
  return wasmRsi(toFloat64Array(data), period);
}
rsi.stream = (period: number) => new RsiStream(period);

/**
 * Hull Moving Average
 */
export function hma(data: PriceInput, period: number): Float64Array {
  return wasmHma(toFloat64Array(data), period);
}
hma.stream = (period: number) => new HmaStream(period);

// =============================================================================
// Multi-Output Indicators
// =============================================================================

/**
 * Moving Average Convergence Divergence
 */
export function macd(
  data: PriceInput,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): MacdOutput {
  return wasmMacd(toFloat64Array(data), fastPeriod, slowPeriod, signalPeriod);
}
macd.stream = (fastPeriod: number, slowPeriod: number, signalPeriod: number) =>
  new MacdStream(fastPeriod, slowPeriod, signalPeriod);

/**
 * Bollinger Bands
 */
export function bbands(data: PriceInput, period: number, k: number): BBandsOutput {
  return wasmBbands(toFloat64Array(data), period, k);
}
bbands.stream = (period: number, k: number) => new BBandsStream(period, k);

/**
 * Stochastic RSI
 */
export function stochRsi(
  data: PriceInput,
  rsiPeriod: number,
  stochPeriod: number,
  kSmooth: number,
  dPeriod: number
): StochOutput {
  return wasmStochRsi(toFloat64Array(data), rsiPeriod, stochPeriod, kSmooth, dPeriod);
}
stochRsi.stream = (
  rsiPeriod: number,
  stochPeriod: number,
  kSmooth: number,
  dPeriod: number
) => new StochRsiStream(rsiPeriod, stochPeriod, kSmooth, dPeriod);

/**
 * Cumulative Volume Delta (from pre-computed deltas)
 */
export function cvd(deltas: PriceInput): Float64Array {
  return wasmCvd(toFloat64Array(deltas));
}
cvd.stream = () => new CvdStream();

/**
 * Linear Regression
 */
export function linreg(
  data: PriceInput,
  period: number,
  numStdDev: number = 2
): LinRegOutput {
  return wasmLinreg(toFloat64Array(data), period, numStdDev);
}
linreg.stream = (period: number) => new LinRegStream(period);

// =============================================================================
// OHLCV Indicators
// =============================================================================

type CandleInput = Candle[];
type HLCInput = { high: PriceInput; low: PriceInput; close: PriceInput };
type OHLCVInput = HLCInput & { open?: PriceInput; volume?: PriceInput; time?: PriceInput };

/**
 * Average True Range
 * @overload atr(candles, period) - Candle array input
 * @overload atr(highs, lows, closes, period) - Positional arrays (legacy)
 */
export function atr(
  inputOrHighs: CandleInput | HLCInput | PriceInput,
  periodOrLows?: number | PriceInput,
  closes?: PriceInput,
  periodArg?: number
): Float64Array {
  // Legacy positional API: atr(highs, lows, closes, period)
  if (isPriceArray(inputOrHighs) && isPriceArray(periodOrLows)) {
    const highs = inputOrHighs;
    const lows = periodOrLows;
    return wasmAtr(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes!),
      periodArg!
    );
  }
  // New object API: atr(candles, period) or atr({ high, low, close }, period)
  const input = inputOrHighs as CandleInput | HLCInput;
  const period = periodOrLows as number;
  if (isCandleArray(input)) {
    const { high, low, close } = extractOHLCV(input);
    return wasmAtr(high, low, close, period);
  }
  const { high, low, close } = input;
  return wasmAtr(toFloat64Array(high), toFloat64Array(low), toFloat64Array(close), period);
}
atr.stream = (period: number) => new AtrStream(period);

/**
 * Fast Stochastic Oscillator
 * @overload stochFast(candles, kPeriod, dPeriod) - Candle array input
 * @overload stochFast(highs, lows, closes, kPeriod, dPeriod) - Positional arrays (legacy)
 */
export function stochFast(
  inputOrHighs: CandleInput | HLCInput | PriceInput,
  kPeriodOrLows?: number | PriceInput,
  dPeriodOrCloses?: number | PriceInput,
  kPeriodArg?: number,
  dPeriodArg?: number
): StochOutput {
  // Legacy positional API: stochFast(highs, lows, closes, kPeriod, dPeriod)
  if (isPriceArray(inputOrHighs) && isPriceArray(kPeriodOrLows)) {
    const highs = inputOrHighs;
    const lows = kPeriodOrLows;
    const closes = dPeriodOrCloses as PriceInput;
    return wasmStochFast(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes),
      kPeriodArg!,
      dPeriodArg!
    );
  }
  // New object API: stochFast(candles, kPeriod, dPeriod)
  const input = inputOrHighs as CandleInput | HLCInput;
  const kPeriod = kPeriodOrLows as number;
  const dPeriod = dPeriodOrCloses as number;
  if (isCandleArray(input)) {
    const { high, low, close } = extractOHLCV(input);
    return wasmStochFast(high, low, close, kPeriod, dPeriod);
  }
  const { high, low, close } = input;
  return wasmStochFast(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    kPeriod,
    dPeriod
  );
}
stochFast.stream = (kPeriod: number, dPeriod: number) =>
  new StochFastStream(kPeriod, dPeriod);

/**
 * Slow Stochastic Oscillator
 * @overload stochSlow(candles, kPeriod, dPeriod, slowing) - Candle array input
 * @overload stochSlow(highs, lows, closes, kPeriod, dPeriod, slowing) - Positional arrays (legacy)
 */
export function stochSlow(
  inputOrHighs: CandleInput | HLCInput | PriceInput,
  kPeriodOrLows?: number | PriceInput,
  dPeriodOrCloses?: number | PriceInput,
  slowingOrKPeriod?: number,
  dPeriodArg?: number,
  slowingArg?: number
): StochOutput {
  // Legacy positional API: stochSlow(highs, lows, closes, kPeriod, dPeriod, slowing)
  if (isPriceArray(inputOrHighs) && isPriceArray(kPeriodOrLows)) {
    const highs = inputOrHighs;
    const lows = kPeriodOrLows;
    const closes = dPeriodOrCloses as PriceInput;
    return wasmStochSlow(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes),
      slowingOrKPeriod!,
      dPeriodArg!,
      slowingArg!
    );
  }
  // New object API: stochSlow(candles, kPeriod, dPeriod, slowing)
  const input = inputOrHighs as CandleInput | HLCInput;
  const kPeriod = kPeriodOrLows as number;
  const dPeriod = dPeriodOrCloses as number;
  const slowing = slowingOrKPeriod as number;
  if (isCandleArray(input)) {
    const { high, low, close } = extractOHLCV(input);
    return wasmStochSlow(high, low, close, kPeriod, dPeriod, slowing);
  }
  const { high, low, close } = input;
  return wasmStochSlow(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    kPeriod,
    dPeriod,
    slowing
  );
}
stochSlow.stream = (kPeriod: number, dPeriod: number, slowing: number) =>
  new StochSlowStream(kPeriod, dPeriod, slowing);

/**
 * Money Flow Index
 * @overload mfi(candles, period) - Candle array input
 * @overload mfi(highs, lows, closes, volumes, period) - Positional arrays (legacy)
 */
export function mfi(
  inputOrHighs: CandleInput | (HLCInput & { volume: PriceInput }) | PriceInput,
  periodOrLows?: number | PriceInput,
  closes?: PriceInput,
  volumes?: PriceInput,
  periodArg?: number
): Float64Array {
  // Legacy positional API: mfi(highs, lows, closes, volumes, period)
  if (isPriceArray(inputOrHighs) && isPriceArray(periodOrLows)) {
    const highs = inputOrHighs;
    const lows = periodOrLows;
    return wasmMfi(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes!),
      toFloat64Array(volumes!),
      periodArg!
    );
  }
  // New object API: mfi(candles, period) or mfi({ high, low, close, volume }, period)
  const input = inputOrHighs as CandleInput | (HLCInput & { volume: PriceInput });
  const period = periodOrLows as number;
  if (isCandleArray(input)) {
    const { high, low, close, volume } = extractOHLCV(input);
    return wasmMfi(high, low, close, volume, period);
  }
  const { high, low, close, volume } = input;
  return wasmMfi(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume),
    period
  );
}
mfi.stream = (period: number) => new MfiStream(period);

/**
 * Average Directional Index
 * @overload adx(candles, period) - Candle array input
 * @overload adx(highs, lows, closes, period) - Positional arrays (legacy)
 */
export function adx(
  inputOrHighs: CandleInput | HLCInput | PriceInput,
  periodOrLows?: number | PriceInput,
  closes?: PriceInput,
  periodArg?: number
): AdxOutput {
  // Legacy positional API: adx(highs, lows, closes, period)
  if (isPriceArray(inputOrHighs) && isPriceArray(periodOrLows)) {
    const highs = inputOrHighs;
    const lows = periodOrLows;
    return wasmAdx(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes!),
      periodArg!
    );
  }
  // New object API: adx(candles, period) or adx({ high, low, close }, period)
  const input = inputOrHighs as CandleInput | HLCInput;
  const period = periodOrLows as number;
  if (isCandleArray(input)) {
    const { high, low, close } = extractOHLCV(input);
    return wasmAdx(high, low, close, period);
  }
  const { high, low, close } = input;
  return wasmAdx(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    period
  );
}
adx.stream = (period: number) => new AdxStream(period);

/**
 * Ichimoku Cloud
 * @overload ichimoku(candles, tenkan?, kijun?, senkou?) - Candle array input
 * @overload ichimoku(highs, lows, closes, tenkan, kijun, senkou) - Positional arrays (legacy)
 */
export function ichimoku(
  inputOrHighs: CandleInput | HLCInput | PriceInput,
  tenkanOrLows?: number | PriceInput,
  kijunOrCloses?: number | PriceInput,
  senkouOrTenkan?: number,
  kijunPeriodArg?: number,
  senkouPeriodArg?: number
): IchimokuOutput {
  // Legacy positional API: ichimoku(highs, lows, closes, tenkan, kijun, senkou)
  if (isPriceArray(inputOrHighs) && isPriceArray(tenkanOrLows)) {
    const highs = inputOrHighs;
    const lows = tenkanOrLows;
    const closes = kijunOrCloses as PriceInput;
    const tenkanPeriod = senkouOrTenkan ?? 9;
    const kijunPeriod = kijunPeriodArg ?? 26;
    const senkouPeriod = senkouPeriodArg ?? 52;
    return wasmIchimoku(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes),
      tenkanPeriod,
      kijunPeriod,
      senkouPeriod
    );
  }
  // New object API: ichimoku(candles, tenkan?, kijun?, senkou?)
  const input = inputOrHighs as CandleInput | HLCInput;
  const tenkanPeriod = (tenkanOrLows as number) ?? 9;
  const kijunPeriod = (kijunOrCloses as number) ?? 26;
  const senkouPeriod = senkouOrTenkan ?? 52;
  if (isCandleArray(input)) {
    const { high, low, close } = extractOHLCV(input);
    return wasmIchimoku(high, low, close, tenkanPeriod, kijunPeriod, senkouPeriod);
  }
  const { high, low, close } = input;
  return wasmIchimoku(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    tenkanPeriod,
    kijunPeriod,
    senkouPeriod
  );
}
ichimoku.stream = (
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  senkouPeriod: number = 52
) => new IchimokuStream(tenkanPeriod, kijunPeriod, senkouPeriod);

/**
 * CVD from OHLCV (estimates delta from candle structure)
 * @overload cvdOhlcv(candles) - Candle array input
 * @overload cvdOhlcv(highs, lows, closes, volumes) - Positional arrays (legacy)
 */
export function cvdOhlcv(
  inputOrHighs: CandleInput | (HLCInput & { volume: PriceInput }) | PriceInput,
  lows?: PriceInput,
  closes?: PriceInput,
  volumes?: PriceInput
): Float64Array {
  // Legacy positional API: cvdOhlcv(highs, lows, closes, volumes)
  if (isPriceArray(inputOrHighs) && isPriceArray(lows)) {
    const highs = inputOrHighs;
    return wasmCvdOhlcv(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes!),
      toFloat64Array(volumes!)
    );
  }
  // New object API: cvdOhlcv(candles) or cvdOhlcv({ high, low, close, volume })
  const input = inputOrHighs as CandleInput | (HLCInput & { volume: PriceInput });
  if (isCandleArray(input)) {
    const { high, low, close, volume } = extractOHLCV(input);
    return wasmCvdOhlcv(high, low, close, volume);
  }
  const { high, low, close, volume } = input;
  return wasmCvdOhlcv(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume)
  );
}
cvdOhlcv.stream = () => new CvdOhlcvStream();

/**
 * Fixed Range Volume Profile
 * @overload frvp(candles, numBins?, valueAreaPercent?) - Candle array input
 * @overload frvp(highs, lows, closes, volumes, numBins?, valueAreaPercent?) - Positional arrays (legacy)
 */
export function frvp(
  inputOrHighs: CandleInput | (HLCInput & { volume: PriceInput }) | PriceInput,
  numBinsOrLows?: number | PriceInput,
  valueAreaPercentOrCloses?: number | PriceInput,
  volumesArg?: PriceInput,
  numBinsArg?: number,
  valueAreaPercentArg?: number
): FrvpOutput {
  // Legacy positional API: frvp(highs, lows, closes, volumes, numBins?, valueAreaPercent?)
  if (isPriceArray(inputOrHighs) && isPriceArray(numBinsOrLows)) {
    const highs = inputOrHighs;
    const lows = numBinsOrLows;
    const closes = valueAreaPercentOrCloses as PriceInput;
    const volumes = volumesArg!;
    const numBins = numBinsArg ?? 100;
    const valueAreaPercent = valueAreaPercentArg ?? 0.7;
    return wasmFrvp(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes),
      toFloat64Array(volumes),
      numBins,
      valueAreaPercent
    );
  }
  // New object API: frvp(candles, numBins?, valueAreaPercent?)
  const input = inputOrHighs as CandleInput | (HLCInput & { volume: PriceInput });
  const numBins = (numBinsOrLows as number) ?? 100;
  const valueAreaPercent = (valueAreaPercentOrCloses as number) ?? 0.7;
  if (isCandleArray(input)) {
    const { high, low, close, volume } = extractOHLCV(input);
    return wasmFrvp(high, low, close, volume, numBins, valueAreaPercent);
  }
  const { high, low, close, volume } = input;
  return wasmFrvp(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume),
    numBins,
    valueAreaPercent
  );
}
frvp.stream = (numBins: number = 100) => new FrvpStream(numBins);

// =============================================================================
// VWAP Indicators
// =============================================================================

type VwapCandleInput = Candle[] | OHLCVInput;

/**
 * Session VWAP (resets daily at UTC midnight)
 * @overload sessionVwap(candles) - Candle array input
 * @overload sessionVwap(timestamps, opens, highs, lows, closes, volumes) - Positional arrays (legacy)
 */
export function sessionVwap(
  inputOrTimestamps: VwapCandleInput | PriceInput,
  opens?: PriceInput,
  highs?: PriceInput,
  lows?: PriceInput,
  closes?: PriceInput,
  volumes?: PriceInput
): Float64Array {
  // Legacy positional API: sessionVwap(timestamps, opens, highs, lows, closes, volumes)
  if (isPriceArray(inputOrTimestamps) && isPriceArray(opens)) {
    const timestamps = inputOrTimestamps;
    return wasmSessionVwap(
      toFloat64Array(timestamps),
      toFloat64Array(opens),
      toFloat64Array(highs!),
      toFloat64Array(lows!),
      toFloat64Array(closes!),
      toFloat64Array(volumes!)
    );
  }
  // New object API: sessionVwap(candles) or sessionVwap({ time, open, high, low, close, volume })
  const input = inputOrTimestamps as VwapCandleInput;
  if (isCandleArray(input)) {
    const { time, open, high, low, close, volume } = extractOHLCV(input);
    return wasmSessionVwap(time, open, high, low, close, volume);
  }
  const { time, open, high, low, close, volume } = input;
  return wasmSessionVwap(
    toFloat64Array(time!),
    toFloat64Array(open!),
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume!)
  );
}
sessionVwap.stream = () => new SessionVwapStream();

/**
 * Rolling VWAP (sliding window)
 * @overload rollingVwap(candles, period) - Candle array input
 * @overload rollingVwap(timestamps, opens, highs, lows, closes, volumes, period) - Positional arrays (legacy)
 */
export function rollingVwap(
  inputOrTimestamps: VwapCandleInput | PriceInput,
  periodOrOpens?: number | PriceInput,
  highs?: PriceInput,
  lows?: PriceInput,
  closes?: PriceInput,
  volumes?: PriceInput,
  periodArg?: number
): Float64Array {
  // Legacy positional API: rollingVwap(timestamps, opens, highs, lows, closes, volumes, period)
  if (isPriceArray(inputOrTimestamps) && isPriceArray(periodOrOpens)) {
    const timestamps = inputOrTimestamps;
    const opens = periodOrOpens;
    return wasmRollingVwap(
      toFloat64Array(timestamps),
      toFloat64Array(opens),
      toFloat64Array(highs!),
      toFloat64Array(lows!),
      toFloat64Array(closes!),
      toFloat64Array(volumes!),
      periodArg!
    );
  }
  // New object API: rollingVwap(candles, period)
  const input = inputOrTimestamps as VwapCandleInput;
  const period = periodOrOpens as number;
  if (isCandleArray(input)) {
    const { time, open, high, low, close, volume } = extractOHLCV(input);
    return wasmRollingVwap(time, open, high, low, close, volume, period);
  }
  const { time, open, high, low, close, volume } = input;
  return wasmRollingVwap(
    toFloat64Array(time!),
    toFloat64Array(open!),
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume!),
    period
  );
}
rollingVwap.stream = (period: number) => new RollingVwapStream(period);

/**
 * Anchored VWAP (from specific index)
 * @overload anchoredVwap(candles, anchorIndex) - Candle array input
 * @overload anchoredVwap(timestamps, opens, highs, lows, closes, volumes, anchorIndex) - Positional arrays (legacy)
 */
export function anchoredVwap(
  inputOrTimestamps: VwapCandleInput | PriceInput,
  anchorIndexOrOpens?: number | PriceInput,
  highs?: PriceInput,
  lows?: PriceInput,
  closes?: PriceInput,
  volumes?: PriceInput,
  anchorIndexArg?: number
): Float64Array {
  // Legacy positional API: anchoredVwap(timestamps, opens, highs, lows, closes, volumes, anchorIndex)
  if (isPriceArray(inputOrTimestamps) && isPriceArray(anchorIndexOrOpens)) {
    const timestamps = inputOrTimestamps;
    const opens = anchorIndexOrOpens;
    return wasmAnchoredVwap(
      toFloat64Array(timestamps),
      toFloat64Array(opens),
      toFloat64Array(highs!),
      toFloat64Array(lows!),
      toFloat64Array(closes!),
      toFloat64Array(volumes!),
      anchorIndexArg!
    );
  }
  // New object API: anchoredVwap(candles, anchorIndex)
  const input = inputOrTimestamps as VwapCandleInput;
  const anchorIndex = anchorIndexOrOpens as number;
  if (isCandleArray(input)) {
    const { time, open, high, low, close, volume } = extractOHLCV(input);
    return wasmAnchoredVwap(time, open, high, low, close, volume, anchorIndex);
  }
  const { time, open, high, low, close, volume } = input;
  return wasmAnchoredVwap(
    toFloat64Array(time!),
    toFloat64Array(open!),
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume!),
    anchorIndex
  );
}

/**
 * Anchored VWAP (from timestamp)
 * @overload anchoredVwapFromTimestamp(candles, anchorTimestamp) - Candle array input
 * @overload anchoredVwapFromTimestamp(timestamps, opens, highs, lows, closes, volumes, anchorTimestamp) - Positional arrays (legacy)
 */
export function anchoredVwapFromTimestamp(
  inputOrTimestamps: VwapCandleInput | PriceInput,
  anchorTimestampOrOpens?: number | PriceInput,
  highs?: PriceInput,
  lows?: PriceInput,
  closes?: PriceInput,
  volumes?: PriceInput,
  anchorTimestampArg?: number
): Float64Array {
  // Legacy positional API: anchoredVwapFromTimestamp(timestamps, opens, highs, lows, closes, volumes, anchorTimestamp)
  if (isPriceArray(inputOrTimestamps) && isPriceArray(anchorTimestampOrOpens)) {
    const timestamps = inputOrTimestamps;
    const opens = anchorTimestampOrOpens;
    return wasmAnchoredVwapFromTimestamp(
      toFloat64Array(timestamps),
      toFloat64Array(opens),
      toFloat64Array(highs!),
      toFloat64Array(lows!),
      toFloat64Array(closes!),
      toFloat64Array(volumes!),
      anchorTimestampArg!
    );
  }
  // New object API: anchoredVwapFromTimestamp(candles, anchorTimestamp)
  const input = inputOrTimestamps as VwapCandleInput;
  const anchorTimestamp = anchorTimestampOrOpens as number;
  if (isCandleArray(input)) {
    const { time, open, high, low, close, volume } = extractOHLCV(input);
    return wasmAnchoredVwapFromTimestamp(time, open, high, low, close, volume, anchorTimestamp);
  }
  const { time, open, high, low, close, volume } = input;
  return wasmAnchoredVwapFromTimestamp(
    toFloat64Array(time!),
    toFloat64Array(open!),
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    toFloat64Array(volume!),
    anchorTimestamp
  );
}
anchoredVwapFromTimestamp.stream = (anchorTimestamp: number) =>
  AnchoredVwapStream.withAnchor(anchorTimestamp);

// =============================================================================
// Pivot Points
// =============================================================================

/**
 * Pivot Points (single candle)
 */
export function pivotPoints(
  high: number,
  low: number,
  close: number,
  variant: 'standard' | 'fibonacci' | 'woodie' = 'standard'
): PivotOutput {
  return wasmPivotPoints(high, low, close, variant);
}

/**
 * Pivot Points (batch)
 * @overload pivotPointsBatch(candles, variant?) - Candle array input
 * @overload pivotPointsBatch(highs, lows, closes, variant?) - Positional arrays (legacy)
 */
export function pivotPointsBatch(
  inputOrHighs: CandleInput | HLCInput | PriceInput,
  variantOrLows?: 'standard' | 'fibonacci' | 'woodie' | PriceInput,
  closes?: PriceInput,
  variantArg?: 'standard' | 'fibonacci' | 'woodie'
) {
  // Legacy positional API: pivotPointsBatch(highs, lows, closes, variant?)
  if (isPriceArray(inputOrHighs) && isPriceArray(variantOrLows)) {
    const highs = inputOrHighs;
    const lows = variantOrLows;
    const variant = variantArg ?? 'standard';
    return wasmPivotPointsBatch(
      toFloat64Array(highs),
      toFloat64Array(lows),
      toFloat64Array(closes!),
      variant
    );
  }
  // New object API: pivotPointsBatch(candles, variant?) or pivotPointsBatch({ high, low, close }, variant?)
  const input = inputOrHighs as CandleInput | HLCInput;
  const variant = (variantOrLows as 'standard' | 'fibonacci' | 'woodie') ?? 'standard';
  if (isCandleArray(input)) {
    const { high, low, close } = extractOHLCV(input);
    return wasmPivotPointsBatch(high, low, close, variant);
  }
  const { high, low, close } = input;
  return wasmPivotPointsBatch(
    toFloat64Array(high),
    toFloat64Array(low),
    toFloat64Array(close),
    variant
  );
}

// =============================================================================
// Multi-Indicator Analysis Helper
// =============================================================================

type IndicatorFn = (data: PriceInput | CandleInput) => unknown;
type IndicatorSpec = Record<string, IndicatorFn>;

/**
 * Run multiple indicators on the same data at once.
 *
 * @example
 * ```typescript
 * const result = analyze(prices, {
 *   sma20: (d) => sma(d, 20),
 *   rsi: (d) => rsi(d, 14),
 *   bbands: (d) => bbands(d, 20, 2),
 * });
 * result.sma20; // Float64Array
 * result.rsi;   // Float64Array
 * result.bbands; // { upper, middle, lower, ... }
 * ```
 */
export function analyze<T extends IndicatorSpec>(
  data: PriceInput | CandleInput,
  indicators: T
): { [K in keyof T]: ReturnType<T[K]> } {
  const result = {} as { [K in keyof T]: ReturnType<T[K]> };
  for (const [name, fn] of Object.entries(indicators)) {
    result[name as keyof T] = fn(data) as ReturnType<T[keyof T]>;
  }
  return result;
}
