import {
  AdxStream as NativeAdxStream,
  AnchoredVwapStream as NativeAnchoredVwapStream,
  AtrStream as NativeAtrStream,
  BBandsStream as NativeBBandsStream,
  CvdOhlcvStream as NativeCvdOhlcvStream,
  CvdStream as NativeCvdStream,
  EmaStream as NativeEmaStream,
  FrvpStream as NativeFrvpStream,
  HmaStream as NativeHmaStream,
  IchimokuStream as NativeIchimokuStream,
  LinRegStream as NativeLinRegStream,
  MacdStream as NativeMacdStream,
  MfiStream as NativeMfiStream,
  RollingVwapStream as NativeRollingVwapStream,
  RsiStream as NativeRsiStream,
  SessionVwapStream as NativeSessionVwapStream,
  SmaStream as NativeSmaStream,
  StochRsiStream as NativeStochRsiStream,
  StochStream as NativeStochStream,
  WmaStream as NativeWmaStream,
} from "../native/index.js";
import {
  requiredOption,
  validateFiniteNumber,
  validateFrvpBar,
  validateFrvpSeries,
  validateHlcBar,
  validateHlcSeries,
  validateHlcvBar,
  validateHlcvSeries,
  validateOptions,
  validatePriceSeries,
  validateTimestamp,
  validateTimestampedHlcvBar,
  validateTimestampedHlcvSeries,
} from "./validation.js";
import {
  bbandsOptions,
  frvpOptions,
  ichimokuOptions,
  linregOptions,
  macdOptions,
  periodOption,
  stochOptions,
  stochRsiOptions,
} from "./options.js";
import type {
  AdxPoint,
  AnchoredVwapStreamOptions,
  BBandsOptions,
  BBandsPoint,
  FrvpBar,
  FrvpOptions,
  FrvpOutput,
  FrvpSeries,
  HlcBar,
  HlcSeries,
  HlcvBar,
  HlcvSeries,
  IchimokuOptions,
  IchimokuPoint,
  LinRegOptions,
  LinRegPoint,
  MacdOptions,
  MacdPoint,
  PeriodOptions,
  PriceSeries,
  StochOptions,
  StochPoint,
  StochRsiOptions,
  StochRsiPoint,
  TimestampedHlcvBar,
  TimestampedHlcvSeries,
} from "./types.js";

function optional<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function mapFrvpOutput(value: FrvpOutput): FrvpOutput {
  return {
    poc: value.poc,
    vah: value.vah,
    val: value.val,
    totalVolume: value.totalVolume,
    pocVolume: value.pocVolume,
    valueAreaVolume: value.valueAreaVolume,
    rangeHigh: value.rangeHigh,
    rangeLow: value.rangeLow,
    histogram: {
      prices: value.histogram.prices,
      volumes: value.histogram.volumes,
      lows: value.histogram.lows,
      highs: value.histogram.highs,
    },
  };
}

function mapMacdPoint(value: MacdPoint): MacdPoint {
  return { macd: value.macd, signal: value.signal, histogram: value.histogram };
}

function mapBbandsPoint(value: BBandsPoint): BBandsPoint {
  return {
    upper: value.upper,
    middle: value.middle,
    lower: value.lower,
    percentB: value.percentB,
    bandwidth: value.bandwidth,
  };
}

function mapStochPoint(value: StochPoint): StochPoint {
  return { k: value.k, d: value.d };
}

function mapStochRsiPoint(value: StochRsiPoint): StochRsiPoint {
  return { k: value.k, d: value.d };
}

function mapAdxPoint(value: AdxPoint): AdxPoint {
  return { adx: value.adx, plusDi: value.plusDi, minusDi: value.minusDi };
}

function mapIchimokuPoint(value: IchimokuPoint): IchimokuPoint {
  return {
    tenkanSen: value.tenkanSen,
    kijunSen: value.kijunSen,
    senkouSpanA: value.senkouSpanA,
    senkouSpanB: value.senkouSpanB,
    chikouSpan: value.chikouSpan,
  };
}

function mapLinRegPoint(value: LinRegPoint): LinRegPoint {
  return {
    value: value.value,
    upper: value.upper,
    lower: value.lower,
    slope: value.slope,
    r: value.r,
    rSquared: value.rSquared,
  };
}

export class SmaStream {
  private readonly inner: NativeSmaStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeSmaStream(periodOption(options));
  }

  public init(series: PriceSeries): Float64Array {
    return this.inner.init(validatePriceSeries(series));
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateFiniteNumber(value, "value")));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }
}

export class EmaStream {
  private readonly inner: NativeEmaStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeEmaStream(periodOption(options));
  }

  public init(series: PriceSeries): Float64Array {
    return this.inner.init(validatePriceSeries(series));
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateFiniteNumber(value, "value")));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public get multiplier(): number {
    return this.inner.multiplier;
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }
}

export class WmaStream {
  private readonly inner: NativeWmaStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeWmaStream(periodOption(options));
  }

  public init(series: PriceSeries): Float64Array {
    return this.inner.init(validatePriceSeries(series));
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateFiniteNumber(value, "value")));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }
}

export class RsiStream {
  private readonly inner: NativeRsiStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeRsiStream(periodOption(options));
  }

  public init(series: PriceSeries): Float64Array {
    return this.inner.init(validatePriceSeries(series));
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateFiniteNumber(value, "value")));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }
}

export class HmaStream {
  private readonly inner: NativeHmaStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeHmaStream(periodOption(options));
  }

  public init(series: PriceSeries): Float64Array {
    return this.inner.init(validatePriceSeries(series));
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateFiniteNumber(value, "value")));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public get halfPeriod(): number {
    return this.inner.halfPeriod;
  }

  public get sqrtPeriod(): number {
    return this.inner.sqrtPeriod;
  }
}

export class CvdStream {
  private readonly inner = new NativeCvdStream();

  public init(series: PriceSeries): Float64Array {
    return this.inner.init(validatePriceSeries(series));
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateFiniteNumber(value, "value")));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }
}

export class MacdStream {
  private readonly inner: NativeMacdStream;

  public constructor(options: MacdOptions) {
    const values = macdOptions(options);
    this.inner = new NativeMacdStream(
      values.fastPeriod,
      values.slowPeriod,
      values.signalPeriod,
      values.signalType,
    );
  }

  public init(series: PriceSeries): MacdPoint[] {
    return this.inner.init(validatePriceSeries(series)).map(mapMacdPoint);
  }

  public next(value: number): MacdPoint | undefined {
    const result = this.inner.next(validateFiniteNumber(value, "value"));
    return result === null ? undefined : mapMacdPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get fastPeriod(): number {
    return this.inner.fastPeriod;
  }

  public get slowPeriod(): number {
    return this.inner.slowPeriod;
  }

  public get signalPeriod(): number {
    return this.inner.signalPeriod;
  }
}

export class BBandsStream {
  private readonly inner: NativeBBandsStream;

  public constructor(options: BBandsOptions) {
    const values = bbandsOptions(options);
    this.inner = new NativeBBandsStream(values.period, values.k);
  }

  public init(series: PriceSeries): BBandsPoint[] {
    return this.inner.init(validatePriceSeries(series)).map(mapBbandsPoint);
  }

  public next(value: number): BBandsPoint | undefined {
    const result = this.inner.next(validateFiniteNumber(value, "value"));
    return result === null ? undefined : mapBbandsPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public get k(): number {
    return this.inner.k;
  }
}

export class StochStream {
  private readonly inner: NativeStochStream;

  public constructor(options: StochOptions) {
    const values = stochOptions(options);
    this.inner = new NativeStochStream(
      values.kPeriod,
      values.dPeriod,
      values.type === "slow" ? values.slowing : 3,
      values.type,
    );
  }

  public init(series: HlcSeries): StochPoint[] {
    const values = validateHlcSeries(series);
    return this.inner.init(values.high, values.low, values.close).map(mapStochPoint);
  }

  public next(bar: HlcBar): StochPoint | undefined {
    const values = validateHlcBar(bar);
    const result = this.inner.next(values.high, values.low, values.close);
    return result === null ? undefined : mapStochPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get kPeriod(): number {
    return this.inner.kPeriod;
  }

  public get dPeriod(): number {
    return this.inner.dPeriod;
  }

  public get slowing(): number {
    return this.inner.slowing;
  }
}

export class StochRsiStream {
  private readonly inner: NativeStochRsiStream;

  public constructor(options: StochRsiOptions) {
    const values = stochRsiOptions(options);
    this.inner = new NativeStochRsiStream(
      values.rsiPeriod,
      values.stochPeriod,
      values.kSmooth,
      values.dPeriod,
    );
  }

  public init(series: PriceSeries): StochRsiPoint[] {
    return this.inner.init(validatePriceSeries(series)).map(mapStochRsiPoint);
  }

  public next(value: number): StochRsiPoint | undefined {
    const result = this.inner.next(validateFiniteNumber(value, "value"));
    return result === null ? undefined : mapStochRsiPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get rsiPeriod(): number {
    return this.inner.rsiPeriod;
  }

  public get stochPeriod(): number {
    return this.inner.stochPeriod;
  }

  public get kSmooth(): number {
    return this.inner.kSmooth;
  }

  public get dPeriod(): number {
    return this.inner.dPeriod;
  }
}

export class AtrStream {
  private readonly inner: NativeAtrStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeAtrStream(periodOption(options));
  }

  public init(series: HlcSeries): Float64Array {
    const values = validateHlcSeries(series);
    return this.inner.init(values.high, values.low, values.close);
  }

  public next(bar: HlcBar): number | undefined {
    const values = validateHlcBar(bar);
    return optional(this.inner.next(values.high, values.low, values.close));
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }
}

export class MfiStream {
  private readonly inner: NativeMfiStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeMfiStream(periodOption(options));
  }

  public init(series: HlcvSeries): Float64Array {
    const values = validateHlcvSeries(series);
    return this.inner.init(values.high, values.low, values.close, values.volume);
  }

  public next(bar: HlcvBar): number | undefined {
    const values = validateHlcvBar(bar);
    return optional(
      this.inner.next(values.high, values.low, values.close, values.volume),
    );
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }
}

export class CvdOhlcvStream {
  private readonly inner = new NativeCvdOhlcvStream();

  public init(series: HlcvSeries): Float64Array {
    const values = validateHlcvSeries(series);
    return this.inner.init(values.high, values.low, values.close, values.volume);
  }

  public next(bar: HlcvBar): number | undefined {
    const values = validateHlcvBar(bar);
    return optional(
      this.inner.next(values.high, values.low, values.close, values.volume),
    );
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }
}

export class AdxStream {
  private readonly inner: NativeAdxStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeAdxStream(periodOption(options));
  }

  public init(series: HlcSeries): AdxPoint[] {
    const values = validateHlcSeries(series);
    return this.inner
      .init(values.high, values.low, values.close)
      .map(mapAdxPoint);
  }

  public next(bar: HlcBar): AdxPoint | undefined {
    const values = validateHlcBar(bar);
    const result = this.inner.next(values.high, values.low, values.close);
    return result === null ? undefined : mapAdxPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public current(): AdxPoint | undefined {
    const result = this.inner.current();
    return result === null ? undefined : mapAdxPoint(result);
  }
}

export class IchimokuStream {
  private readonly inner: NativeIchimokuStream;

  public constructor(options: IchimokuOptions) {
    const values = ichimokuOptions(options);
    this.inner = new NativeIchimokuStream(
      values.tenkanPeriod,
      values.kijunPeriod,
      values.senkouBPeriod,
    );
  }

  public init(series: HlcSeries): IchimokuPoint[] {
    const values = validateHlcSeries(series);
    return this.inner
      .init(values.high, values.low, values.close)
      .map(mapIchimokuPoint);
  }

  public next(bar: HlcBar): IchimokuPoint | undefined {
    const values = validateHlcBar(bar);
    const result = this.inner.next(values.high, values.low, values.close);
    return result === null ? undefined : mapIchimokuPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get tenkanPeriod(): number {
    return this.inner.tenkanPeriod;
  }

  public get kijunPeriod(): number {
    return this.inner.kijunPeriod;
  }

  public get senkouBPeriod(): number {
    return this.inner.senkouBPeriod;
  }
}

export class LinRegStream {
  private readonly inner: NativeLinRegStream;

  public constructor(options: LinRegOptions) {
    const values = linregOptions(options);
    this.inner = new NativeLinRegStream(values.period, values.numStdDev);
  }

  public init(series: PriceSeries): LinRegPoint[] {
    return this.inner.init(validatePriceSeries(series)).map(mapLinRegPoint);
  }

  public next(value: number): LinRegPoint | undefined {
    const result = this.inner.next(validateFiniteNumber(value, "value"));
    return result === null ? undefined : mapLinRegPoint(result);
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }

  public get numStdDev(): number {
    return this.inner.numStdDev;
  }
}

export class SessionVwapStream {
  private readonly inner = new NativeSessionVwapStream();

  public init(series: TimestampedHlcvSeries): Float64Array {
    const values = validateTimestampedHlcvSeries(series);
    return this.inner.init(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
    );
  }

  public next(bar: TimestampedHlcvBar): number | undefined {
    const values = validateTimestampedHlcvBar(bar);
    return optional(
      this.inner.next(
        values.timestamp,
        values.high,
        values.low,
        values.close,
        values.volume,
      ),
    );
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }

  public cumulativeTpVolume(): number {
    return this.inner.cumulativeTpVolume();
  }

  public cumulativeVolume(): number {
    return this.inner.cumulativeVolume();
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }
}

export class RollingVwapStream {
  private readonly inner: NativeRollingVwapStream;

  public constructor(options: PeriodOptions) {
    this.inner = new NativeRollingVwapStream(periodOption(options));
  }

  public init(series: TimestampedHlcvSeries): Float64Array {
    const values = validateTimestampedHlcvSeries(series);
    return this.inner.init(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
    );
  }

  public next(bar: TimestampedHlcvBar): number | undefined {
    const values = validateTimestampedHlcvBar(bar);
    return optional(
      this.inner.next(
        values.timestamp,
        values.high,
        values.low,
        values.close,
        values.volume,
      ),
    );
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get period(): number {
    return this.inner.period;
  }
}

export class AnchoredVwapStream {
  private readonly inner: NativeAnchoredVwapStream;

  public constructor(options: AnchoredVwapStreamOptions = {}) {
    const record = validateOptions(options, "options");
    if (Object.prototype.hasOwnProperty.call(record, "anchorTimestamp")) {
      const timestamp = validateTimestamp(
        validateFiniteNumber(
          requiredOption(record, "anchorTimestamp", "options"),
          "options.anchorTimestamp",
        ),
        "options.anchorTimestamp",
      );
      this.inner = NativeAnchoredVwapStream.withAnchor(timestamp);
    } else {
      this.inner = new NativeAnchoredVwapStream();
    }
  }

  public static withAnchor(options: {
    anchorTimestamp: number;
  }): AnchoredVwapStream {
    return new AnchoredVwapStream(options);
  }

  public setAnchor(timestamp: number): void {
    this.inner.setAnchor(validateTimestamp(timestamp, "timestamp"));
  }

  public anchorNow(): void {
    this.inner.anchorNow();
  }

  public init(series: TimestampedHlcvSeries): Float64Array {
    const values = validateTimestampedHlcvSeries(series);
    return this.inner.init(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
    );
  }

  public next(bar: TimestampedHlcvBar): number | undefined {
    const values = validateTimestampedHlcvBar(bar);
    return optional(
      this.inner.next(
        values.timestamp,
        values.high,
        values.low,
        values.close,
        values.volume,
      ),
    );
  }

  public current(): number | undefined {
    return optional(this.inner.current());
  }

  public anchorTimestamp(): number | undefined {
    return optional(this.inner.anchorTimestamp());
  }

  public cumulativeTpVolume(): number {
    return this.inner.cumulativeTpVolume();
  }

  public cumulativeVolume(): number {
    return this.inner.cumulativeVolume();
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }
}

export class FrvpStream {
  private readonly inner: NativeFrvpStream;

  public constructor(options: FrvpOptions) {
    const values = frvpOptions(options);
    this.inner = new NativeFrvpStream(values.numBins, values.valueAreaPercent);
  }

  public init(series: FrvpSeries): FrvpOutput | undefined {
    const values = validateFrvpSeries(series);
    const result = this.inner.init(values.high, values.low, values.volume);
    return result === null ? undefined : mapFrvpOutput(result);
  }

  public next(bar: FrvpBar): FrvpOutput | undefined {
    const values = validateFrvpBar(bar);
    const result = this.inner.next(values.high, values.low, values.volume);
    return result === null ? undefined : mapFrvpOutput(result);
  }

  public clear(): void {
    this.inner.clear();
  }

  public reset(): void {
    this.inner.reset();
  }

  public isReady(): boolean {
    return this.inner.isReady();
  }

  public get numBins(): number {
    return this.inner.numBins;
  }

  public get candleCount(): number {
    return this.inner.candleCount;
  }
}
