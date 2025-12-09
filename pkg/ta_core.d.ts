/* tslint:disable */
/* eslint-disable */

export class AdxStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array): any;
  /**
   * Create a new streaming ADX calculator.
   */
  constructor(period: number);
  /**
   * Process next bar.
   */
  next(high: number, low: number, close: number): WasmAdxOutput | undefined;
  /**
   * Reset the calculator.
   */
  reset(): void;
  /**
   * Get current values.
   */
  current(): WasmAdxOutput | undefined;
  /**
   * Check if ready.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class AnchoredVwapStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Anchor at the next candle received.
   */
  anchorNow(): void;
  /**
   * Set the anchor timestamp. VWAP will start accumulating from this point.
   */
  setAnchor(timestamp: number): void;
  /**
   * Create a new streaming Anchored VWAP calculator with a specific anchor timestamp.
   */
  static withAnchor(anchor_timestamp: number): AnchoredVwapStream;
  /**
   * Initialize with historical OHLCV data.
   * Returns array of VWAP values.
   */
  init(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;
  /**
   * Get the anchor timestamp if set.
   */
  anchorTimestamp(): number | undefined;
  /**
   * Get cumulative volume.
   */
  cumulativeVolume(): number;
  /**
   * Get cumulative typical price × volume.
   */
  cumulativeTpVolume(): number;
  /**
   * Create a new streaming Anchored VWAP calculator.
   * Use `setAnchor()` or `anchorNow()` to set the anchor point.
   */
  constructor();
  /**
   * Process next candle. Returns VWAP value or undefined if before anchor.
   */
  next(timestamp: number, open: number, high: number, low: number, close: number, volume: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current VWAP value without consuming a new candle.
   */
  current(): number | undefined;
  /**
   * Check if calculator has been anchored and is producing values.
   */
  isReady(): boolean;
}

export class AtrStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical OHLC data.
   * Takes three arrays: highs, lows, closes.
   * Returns array of ATR values.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array): Float64Array;
  /**
   * Create a new streaming ATR calculator.
   */
  constructor(period: number);
  /**
   * Process next bar. Takes high, low, close.
   * Returns ATR or undefined if not ready.
   */
  next(high: number, low: number, close: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current ATR value without consuming a new bar.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class BBandsStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Returns object with arrays.
   */
  init(data: Float64Array): any;
  /**
   * Create a new streaming Bollinger Bands calculator.
   */
  constructor(period: number, k: number);
  /**
   * Process next value. Returns BBands output or undefined if not ready.
   */
  next(value: number): WasmBBandsOutput | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the K multiplier.
   */
  readonly k: number;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class CvdOhlcvStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical OHLCV data.
   * Takes four arrays: highs, lows, closes, volumes.
   * Returns array of CVD values.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;
  /**
   * Create a new streaming CVD calculator for OHLCV data.
   */
  constructor();
  /**
   * Process next bar. Takes high, low, close, volume.
   * Returns CVD value or undefined if not ready.
   */
  next(high: number, low: number, close: number, volume: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current CVD value without consuming a new bar.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
}

export class CvdStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical delta values.
   * Returns array of CVD values.
   */
  init(deltas: Float64Array): Float64Array;
  /**
   * Create a new streaming CVD calculator.
   */
  constructor();
  /**
   * Process next delta value. Returns CVD value or undefined if NaN input.
   */
  next(delta: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current CVD value without consuming a new delta.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
}

export class EmaStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Returns array of EMA values.
   */
  init(data: Float64Array): Float64Array;
  /**
   * Create a new streaming EMA calculator.
   */
  constructor(period: number);
  /**
   * Process next value. Returns EMA or undefined if not ready.
   */
  next(value: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current EMA value without consuming a new value.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the smoothing multiplier.
   */
  readonly multiplier: number;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class FrvpOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Volume at POC
   */
  readonly pocVolume: number;
  /**
   * Highest price in the range
   */
  readonly rangeHigh: number;
  /**
   * Total volume in the range
   */
  readonly totalVolume: number;
  /**
   * Volume within the Value Area
   */
  readonly valueAreaVolume: number;
  /**
   * Point of Control - price level with highest volume
   */
  readonly poc: number;
  /**
   * Value Area High - upper boundary of value area
   */
  readonly vah: number;
  /**
   * Value Area Low - lower boundary of value area
   */
  readonly val: number;
  /**
   * Get histogram as a JavaScript object with arrays
   */
  readonly histogram: any;
  /**
   * Lowest price in the range
   */
  readonly rangeLow: number;
}

export class FrvpStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical OHLCV data.
   *
   * @param highs - Array of high prices
   * @param lows - Array of low prices
   * @param closes - Array of close prices
   * @param volumes - Array of volumes
   * @returns FRVP output for the entire range
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): FrvpOutput | undefined;
  /**
   * Create a new streaming FRVP calculator.
   *
   * @param numBins - Number of price bins (rows) in histogram
   * @param valueAreaPercent - Optional percentage of volume for value area (0.0-1.0, default 0.70)
   */
  constructor(num_bins: number, value_area_percent?: number | null);
  /**
   * Process next candle.
   *
   * @param high - High price
   * @param low - Low price
   * @param close - Close price
   * @param volume - Volume
   * @returns Updated FRVP output or undefined if not ready
   */
  next(high: number, low: number, close: number, volume: number): FrvpOutput | undefined;
  /**
   * Clear all candles from the buffer.
   */
  clear(): void;
  /**
   * Reset the calculator and clear all candles.
   */
  reset(): void;
  /**
   * Check if calculator has been initialized with data.
   */
  isReady(): boolean;
  /**
   * Get the number of candles in the buffer.
   */
  readonly candleCount: number;
  /**
   * Get the number of price bins.
   */
  readonly numBins: number;
}

export class HmaStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data.
   */
  init(data: Float64Array): Float64Array;
  /**
   * Create a new streaming HMA calculator.
   */
  constructor(period: number);
  /**
   * Process next value.
   */
  next(value: number): number | undefined;
  /**
   * Reset the calculator.
   */
  reset(): void;
  /**
   * Check if ready.
   */
  isReady(): boolean;
  /**
   * Get the half period.
   */
  readonly halfPeriod: number;
  /**
   * Get the sqrt period.
   */
  readonly sqrtPeriod: number;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class IchimokuStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array): any;
  /**
   * Create a new streaming Ichimoku calculator with default periods (9, 26, 52).
   */
  constructor(tenkan_period?: number | null, kijun_period?: number | null, senkou_b_period?: number | null);
  /**
   * Process next bar.
   */
  next(high: number, low: number, close: number): WasmIchimokuOutput | undefined;
  /**
   * Reset the calculator.
   */
  reset(): void;
  /**
   * Check if ready.
   */
  isReady(): boolean;
  /**
   * Get the Kijun-sen period.
   */
  readonly kijunPeriod: number;
  /**
   * Get the Tenkan-sen period.
   */
  readonly tenkanPeriod: number;
  /**
   * Get the Senkou Span B period.
   */
  readonly senkouBPeriod: number;
}

export class LinRegStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data.
   */
  init(data: Float64Array): any;
  /**
   * Create a new streaming Linear Regression calculator.
   */
  constructor(period: number, num_std_dev?: number | null);
  /**
   * Process next value.
   */
  next(value: number): WasmLinRegOutput | undefined;
  /**
   * Reset the calculator.
   */
  reset(): void;
  /**
   * Check if ready.
   */
  isReady(): boolean;
  /**
   * Get the number of standard deviations.
   */
  readonly numStdDev: number;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class MacdStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Returns array of MACD outputs as JS object.
   */
  init(data: Float64Array): any;
  /**
   * Create a new streaming MACD calculator.
   */
  constructor(fast_period: number, slow_period: number, signal_period: number);
  /**
   * Process next value. Returns MACD output or undefined if not ready.
   */
  next(value: number): WasmMacdOutput | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the fast period.
   */
  readonly fastPeriod: number;
  /**
   * Get the slow period.
   */
  readonly slowPeriod: number;
  /**
   * Get the signal period.
   */
  readonly signalPeriod: number;
}

export class MfiStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical OHLCV data.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;
  /**
   * Create a new streaming MFI calculator.
   */
  constructor(period: number);
  /**
   * Process next bar.
   */
  next(high: number, low: number, close: number, volume: number): number | undefined;
  /**
   * Reset the calculator.
   */
  reset(): void;
  /**
   * Get current MFI value.
   */
  current(): number | undefined;
  /**
   * Check if ready.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class RollingVwapStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical OHLCV data.
   * Returns array of VWAP values.
   */
  init(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;
  /**
   * Create a new streaming Rolling VWAP calculator.
   */
  constructor(period: number);
  /**
   * Process next candle. Returns VWAP value or undefined if not ready.
   */
  next(timestamp: number, open: number, high: number, low: number, close: number, volume: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current VWAP value without consuming a new candle.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class RsiStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Returns array of RSI values.
   */
  init(data: Float64Array): Float64Array;
  /**
   * Create a new streaming RSI calculator.
   */
  constructor(period: number);
  /**
   * Process next value. Returns RSI or undefined if not ready.
   */
  next(value: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current RSI value without consuming a new value.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class SessionVwapStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical OHLCV data.
   * Returns array of VWAP values.
   */
  init(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;
  /**
   * Get cumulative volume.
   */
  cumulativeVolume(): number;
  /**
   * Get cumulative typical price × volume.
   */
  cumulativeTpVolume(): number;
  /**
   * Create a new streaming Session VWAP calculator.
   */
  constructor();
  /**
   * Process next candle. Returns VWAP value.
   */
  next(timestamp: number, open: number, high: number, low: number, close: number, volume: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Get current VWAP value without consuming a new candle.
   */
  current(): number | undefined;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
}

export class SmaStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Returns array of SMA values.
   */
  init(data: Float64Array): Float64Array;
  /**
   * Create a new streaming SMA calculator.
   */
  constructor(period: number);
  /**
   * Process next value. Returns SMA or undefined if not ready.
   */
  next(value: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

export class StochFastStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Takes parallel arrays of highs, lows, closes.
   * Returns array of Stochastic outputs as JS object with k and d arrays.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array): any;
  /**
   * Create a new streaming Fast Stochastic calculator.
   */
  constructor(k_period: number, d_period: number);
  /**
   * Process next bar. Takes high, low, close.
   * Returns Stochastic output or undefined if not ready.
   */
  next(high: number, low: number, close: number): WasmStochOutput | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the D period.
   */
  readonly dPeriod: number;
  /**
   * Get the K period.
   */
  readonly kPeriod: number;
}

export class StochRsiStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data.
   * Returns an object with `k` and `d` arrays.
   */
  init(data: Float64Array): any;
  /**
   * Create a new streaming Stochastic RSI calculator.
   */
  constructor(rsi_period: number, stoch_period: number, k_smooth: number, d_period: number);
  /**
   * Process next value. Returns Stochastic RSI output or undefined if not ready.
   */
  next(value: number): WasmStochRsiOutput | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the RSI period.
   */
  readonly rsiPeriod: number;
  /**
   * Get the stochastic lookback period.
   */
  readonly stochPeriod: number;
  /**
   * Get the D period.
   */
  readonly dPeriod: number;
  /**
   * Get the K smoothing period.
   */
  readonly kSmooth: number;
}

export class StochSlowStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Takes parallel arrays of highs, lows, closes.
   * Returns array of Stochastic outputs as JS object with k and d arrays.
   */
  init(highs: Float64Array, lows: Float64Array, closes: Float64Array): any;
  /**
   * Create a new streaming Slow Stochastic calculator.
   */
  constructor(k_period: number, d_period: number, slowing: number);
  /**
   * Process next bar. Takes high, low, close.
   * Returns Stochastic output or undefined if not ready.
   */
  next(high: number, low: number, close: number): WasmStochOutput | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the slowing period.
   */
  readonly slowing: number;
  /**
   * Get the D period.
   */
  readonly dPeriod: number;
  /**
   * Get the K period.
   */
  readonly kPeriod: number;
}

export class VolumeProfileRow {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Lower bound of the price bin
   */
  readonly low: number;
  /**
   * Upper bound of the price bin
   */
  readonly high: number;
  /**
   * Price level (center of the bin)
   */
  readonly price: number;
  /**
   * Volume at this price level
   */
  readonly volume: number;
}

export class WasmAdxOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * ADX value (0-100)
   */
  readonly adx: number;
  /**
   * +DI value (0-100)
   */
  readonly plusDi: number;
  /**
   * -DI value (0-100)
   */
  readonly minusDi: number;
}

export class WasmBBandsOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Lower band value
   */
  readonly lower: number;
  /**
   * Upper band value
   */
  readonly upper: number;
  /**
   * Middle band (SMA) value
   */
  readonly middle: number;
  /**
   * Bandwidth value
   */
  readonly bandwidth: number;
  /**
   * %B indicator value
   */
  readonly percentB: number;
}

export class WasmIchimokuOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Tenkan-sen (Conversion Line)
   */
  readonly tenkanSen: number;
  /**
   * Chikou Span (Lagging Span)
   */
  readonly chikouSpan: number;
  /**
   * Senkou Span A (Leading Span A)
   */
  readonly senkouSpanA: number;
  /**
   * Senkou Span B (Leading Span B)
   */
  readonly senkouSpanB: number;
  /**
   * Kijun-sen (Base Line)
   */
  readonly kijunSen: number;
}

export class WasmLinRegOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Pearson's R (-1 to 1)
   */
  readonly r: number;
  /**
   * Lower channel
   */
  readonly lower: number;
  /**
   * Slope
   */
  readonly slope: number;
  /**
   * Upper channel
   */
  readonly upper: number;
  /**
   * Regression value
   */
  readonly value: number;
  /**
   * R-squared (0 to 1)
   */
  readonly rSquared: number;
}

export class WasmMacdOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * MACD line value
   */
  readonly macd: number;
  /**
   * Signal line value
   */
  readonly signal: number;
  /**
   * Histogram value
   */
  readonly histogram: number;
}

export class WasmPivotPointsOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * First resistance level
   */
  readonly r1: number;
  /**
   * Second resistance level
   */
  readonly r2: number;
  /**
   * Third resistance level
   */
  readonly r3: number;
  /**
   * First support level
   */
  readonly s1: number;
  /**
   * Second support level
   */
  readonly s2: number;
  /**
   * Third support level
   */
  readonly s3: number;
  /**
   * The pivot point (central level)
   */
  readonly pivot: number;
}

export class WasmStochOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * %D line value (0-100) - signal line
   */
  readonly d: number;
  /**
   * %K line value (0-100)
   */
  readonly k: number;
}

export class WasmStochRsiOutput {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * %D line value (0-100) - signal line
   */
  readonly d: number;
  /**
   * %K line value (0-100)
   */
  readonly k: number;
}

export class WmaStream {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Initialize with historical data. Returns array of WMA values.
   */
  init(data: Float64Array): Float64Array;
  /**
   * Create a new streaming WMA calculator.
   */
  constructor(period: number);
  /**
   * Process next value. Returns WMA or undefined if not ready.
   */
  next(value: number): number | undefined;
  /**
   * Reset the calculator to initial state.
   */
  reset(): void;
  /**
   * Check if calculator has enough data to produce values.
   */
  isReady(): boolean;
  /**
   * Get the period.
   */
  readonly period: number;
}

/**
 * Calculate ADX for arrays of high, low, and close prices.
 *
 * Returns an object with `adx`, `plusDi`, and `minusDi` arrays.
 */
export function adx(highs: Float64Array, lows: Float64Array, closes: Float64Array, period: number): any;

/**
 * Calculate Anchored VWAP starting from a specific index.
 *
 * Takes OHLCV arrays and anchor index, returns VWAP values.
 */
export function anchoredVwap(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array, anchor_index: number): Float64Array;

/**
 * Calculate Anchored VWAP starting from a specific timestamp.
 *
 * Takes OHLCV arrays and anchor timestamp (Unix ms), returns VWAP values.
 */
export function anchoredVwapFromTimestamp(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array, anchor_timestamp: number): Float64Array;

/**
 * Calculate ATR for arrays of high, low, and close prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function atr(highs: Float64Array, lows: Float64Array, closes: Float64Array, period: number): Float64Array;

/**
 * Calculate Bollinger Bands for an array of prices.
 *
 * Returns an object with `upper`, `middle`, `lower`, `percentB`, and `bandwidth` arrays.
 */
export function bbands(data: Float64Array, period: number, k: number): any;

/**
 * Calculate CVD from pre-computed delta values.
 *
 * Delta = buy_volume - sell_volume for each bar.
 * CVD is the running sum of deltas.
 *
 * Returns Float64Array of cumulative volume delta values.
 */
export function cvd(deltas: Float64Array): Float64Array;

/**
 * Calculate CVD from OHLCV data using volume approximation.
 *
 * Approximates buy/sell volume using the formula:
 * - buy_ratio = (close - low) / (high - low)
 * - buy_volume = volume * buy_ratio
 * - sell_volume = volume * (1 - buy_ratio)
 * - delta = buy_volume - sell_volume
 *
 * Returns Float64Array of cumulative volume delta values.
 */
export function cvdOhlcv(highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;

/**
 * Calculate EMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function ema(data: Float64Array, period: number): Float64Array;

/**
 * Calculate Fixed Range Volume Profile.
 *
 * Takes OHLCV arrays and returns volume profile with POC, VAH, VAL.
 *
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of close prices
 * @param volumes - Array of volumes
 * @param numBins - Number of price bins (rows) in histogram (default 100)
 * @param valueAreaPercent - Percentage of volume for value area (0.0-1.0, default 0.70)
 */
export function frvp(highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array, num_bins?: number | null, value_area_percent?: number | null): FrvpOutput;

/**
 * Calculate HMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function hma(data: Float64Array, period: number): Float64Array;

/**
 * Calculate Ichimoku Cloud for arrays of high, low, and close prices.
 *
 * Returns an object with arrays for each component.
 */
export function ichimoku(highs: Float64Array, lows: Float64Array, closes: Float64Array, tenkan_period: number, kijun_period: number, senkou_b_period: number): any;

/**
 * Initialize panic hook for better error messages in WASM.
 */
export function init(): void;

/**
 * Calculate Linear Regression Channels for an array of prices.
 *
 * Returns an object with arrays for value, upper, lower, slope, r, and rSquared.
 */
export function linreg(data: Float64Array, period: number, num_std_dev?: number | null): any;

/**
 * Calculate MACD for an array of prices.
 *
 * Returns an object with `macd`, `signal`, and `histogram` arrays.
 */
export function macd(data: Float64Array, fast_period: number, slow_period: number, signal_period: number): any;

/**
 * Calculate MFI for arrays of high, low, close, and volume prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function mfi(highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array, period: number): Float64Array;

/**
 * Calculate Pivot Points from a single candle (high, low, close).
 *
 * Returns an object with pivot, r1, r2, r3, s1, s2, s3 properties.
 *
 * @param high - The high price of the period
 * @param low - The low price of the period
 * @param close - The close price of the period
 * @param variant - 'standard', 'fibonacci', or 'woodie'
 */
export function pivotPoints(high: number, low: number, close: number, variant: string): WasmPivotPointsOutput;

/**
 * Calculate Pivot Points for arrays of (highs, lows, closes).
 *
 * Returns an object with arrays for each level: pivot, r1, r2, r3, s1, s2, s3.
 *
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of close prices
 * @param variant - 'standard', 'fibonacci', or 'woodie'
 */
export function pivotPointsBatch(highs: Float64Array, lows: Float64Array, closes: Float64Array, variant: string): any;

/**
 * Calculate Rolling VWAP with a sliding window.
 *
 * Takes OHLCV arrays and period, returns VWAP values.
 */
export function rollingVwap(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array, period: number): Float64Array;

/**
 * Calculate RSI for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function rsi(data: Float64Array, period: number): Float64Array;

/**
 * Calculate Session VWAP (resets daily at UTC midnight).
 *
 * Takes OHLCV arrays and returns VWAP values.
 */
export function sessionVwap(timestamps: Float64Array, opens: Float64Array, highs: Float64Array, lows: Float64Array, closes: Float64Array, volumes: Float64Array): Float64Array;

/**
 * Calculate SMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function sma(data: Float64Array, period: number): Float64Array;

/**
 * Calculate Fast Stochastic for arrays of high, low, and close prices.
 *
 * Returns an object with `k` and `d` arrays.
 */
export function stochFast(highs: Float64Array, lows: Float64Array, closes: Float64Array, k_period: number, d_period: number): any;

/**
 * Calculate Stochastic RSI for an array of prices.
 *
 * Returns an object with `k` and `d` arrays.
 */
export function stochRsi(data: Float64Array, rsi_period: number, stoch_period: number, k_smooth: number, d_period: number): any;

/**
 * Calculate Slow Stochastic for arrays of high, low, and close prices.
 *
 * Returns an object with `k` and `d` arrays.
 */
export function stochSlow(highs: Float64Array, lows: Float64Array, closes: Float64Array, k_period: number, d_period: number, slowing: number): any;

/**
 * Calculate WMA for an array of prices.
 *
 * Returns Float64Array with NaN for insufficient data points.
 */
export function wma(data: Float64Array, period: number): Float64Array;
