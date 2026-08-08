export interface PriceSeries {
  values: Float64Array;
}

export interface HlcSeries {
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
}

export interface HlcvSeries extends HlcSeries {
  volume: Float64Array;
}

export interface TimestampedHlcvSeries extends HlcvSeries {
  timestamp: Float64Array;
}

export interface OhlcvSeries extends TimestampedHlcvSeries {
  open: Float64Array;
}

export interface HlcBar {
  high: number;
  low: number;
  close: number;
}

export interface HlcvBar extends HlcBar {
  volume: number;
}

export interface TimestampedHlcvBar extends HlcvBar {
  timestamp: number;
}

export interface OhlcvBar extends TimestampedHlcvBar {
  open: number;
}

export interface FrvpSeries {
  high: Float64Array;
  low: Float64Array;
  volume: Float64Array;
}

export interface FrvpBar {
  high: number;
  low: number;
  volume: number;
}

export interface PeriodOptions {
  period: number;
}

export interface MacdOptions {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  signalType: "ema" | "sma";
}

export interface BBandsOptions {
  period: number;
  k: number;
}

export type StochOptions =
  | {
      type: "fast";
      kPeriod: number;
      dPeriod: number;
    }
  | {
      type: "slow";
      kPeriod: number;
      dPeriod: number;
      slowing: number;
    };

export interface StochRsiOptions {
  rsiPeriod: number;
  stochPeriod: number;
  kSmooth: number;
  dPeriod: number;
}

export interface IchimokuOptions {
  tenkanPeriod: number;
  kijunPeriod: number;
  senkouBPeriod: number;
}

export interface LinRegOptions {
  period: number;
  numStdDev: number;
}

export interface FrvpOptions {
  numBins: number;
  valueAreaPercent: number;
}

export type PivotVariant = "standard" | "fibonacci" | "woodie";

export interface PivotOptions {
  variant: PivotVariant;
}

export interface AnchorIndexOptions {
  anchorIndex: number;
}

export interface AnchorTimestampOptions {
  anchorTimestamp: number;
}

export interface AnchoredVwapStreamOptions {
  anchorTimestamp?: number;
}

export interface MacdOutput {
  macd: Float64Array;
  signal: Float64Array;
  histogram: Float64Array;
}

export interface BBandsOutput {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
  percentB: Float64Array;
  bandwidth: Float64Array;
}

export interface StochOutput {
  k: Float64Array;
  d: Float64Array;
}

export interface StochRsiOutput {
  k: Float64Array;
  d: Float64Array;
}

export interface AdxOutput {
  adx: Float64Array;
  plusDi: Float64Array;
  minusDi: Float64Array;
}

export interface IchimokuOutput {
  tenkanSen: Float64Array;
  kijunSen: Float64Array;
  senkouSpanA: Float64Array;
  senkouSpanB: Float64Array;
  chikouSpan: Float64Array;
}

export interface LinRegOutput {
  value: Float64Array;
  upper: Float64Array;
  lower: Float64Array;
  slope: Float64Array;
  r: Float64Array;
  rSquared: Float64Array;
}

export interface PivotOutput {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface PivotBatchOutput {
  pivot: Float64Array;
  r1: Float64Array;
  r2: Float64Array;
  r3: Float64Array;
  s1: Float64Array;
  s2: Float64Array;
  s3: Float64Array;
}

export interface FrvpHistogram {
  prices: Float64Array;
  volumes: Float64Array;
  lows: Float64Array;
  highs: Float64Array;
}

export interface FrvpOutput {
  poc: number;
  vah: number;
  val: number;
  totalVolume: number;
  pocVolume: number;
  valueAreaVolume: number;
  rangeHigh: number;
  rangeLow: number;
  histogram: FrvpHistogram;
}

export interface MacdPoint {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BBandsPoint {
  upper: number;
  middle: number;
  lower: number;
  percentB: number;
  bandwidth: number;
}

export interface StochPoint {
  k: number;
  d: number;
}

export interface StochRsiPoint {
  k: number;
  d: number;
}

export interface AdxPoint {
  adx: number;
  plusDi: number;
  minusDi: number;
}

export interface IchimokuPoint {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikouSpan: number;
}

export interface LinRegPoint {
  value: number;
  upper: number;
  lower: number;
  slope: number;
  r: number;
  rSquared: number;
}

export type SeriesInput =
  | PriceSeries
  | HlcSeries
  | HlcvSeries
  | TimestampedHlcvSeries
  | OhlcvSeries
  | FrvpSeries;

export type IndicatorSpec<Input, Output = unknown> = Record<
  string,
  (input: Input) => Output
>;
