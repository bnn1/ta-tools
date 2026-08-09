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
  validateNumber,
  validateFrvpBar,
  validateFrvpSeries,
  validateHlcBar,
  validateHlcSeries,
  validateHlcvBar,
  validateHlcvSeries,
  validateOptions,
  validateFloat64Array,
  validatePriceSeries,
  validateTimestamp,
  validateTimestampedHlcvBar,
  validateTimestampedHlcvSeries,
  validateOutputArray,
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
  AdxOutput,
  AnchoredVwapStreamOptions,
  BBandsOptions,
  BBandsOutput,
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
  IchimokuOutput,
  IchimokuPoint,
  LinRegOptions,
  LinRegOutput,
  LinRegPoint,
  MacdOptions,
  MacdOutput,
  MacdPoint,
  PeriodOptions,
  PriceSeries,
  StochOptions,
  StochOutput,
  StochPoint,
  StochRsiOptions,
  StochRsiOutput,
  StochRsiPoint,
  TimestampedHlcvBar,
  TimestampedHlcvSeries,
} from "./types.js";

function optional<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function validateStreamOutput(
  value: Float64Array,
  length: number,
  name: string,
): Float64Array {
  return validateOutputArray(value, length, name);
}

function validateHistoryOutput(value: Float64Array, name: string): Float64Array {
  return validateFloat64Array(value, name);
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

  public init(series: PriceSeries, output: Float64Array): Float64Array {
    const data = validatePriceSeries(series);
    const result = validateStreamOutput(output, data.length, "output");
    this.inner.initInto(data, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateNumber(value, "value")));
  }

  public nextInto(value: number, output: Float64Array): boolean {
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(validateNumber(value, "value"), result);
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

  public init(series: PriceSeries, output: Float64Array): Float64Array {
    const data = validatePriceSeries(series);
    const result = validateStreamOutput(output, data.length, "output");
    this.inner.initInto(data, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateNumber(value, "value")));
  }

  public nextInto(value: number, output: Float64Array): boolean {
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(validateNumber(value, "value"), result);
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

  public init(series: PriceSeries, output: Float64Array): Float64Array {
    const data = validatePriceSeries(series);
    const result = validateStreamOutput(output, data.length, "output");
    this.inner.initInto(data, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateNumber(value, "value")));
  }

  public nextInto(value: number, output: Float64Array): boolean {
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(validateNumber(value, "value"), result);
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

  public init(series: PriceSeries, output: Float64Array): Float64Array {
    const data = validatePriceSeries(series);
    const result = validateStreamOutput(output, data.length, "output");
    this.inner.initInto(data, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateNumber(value, "value")));
  }

  public nextInto(value: number, output: Float64Array): boolean {
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(validateNumber(value, "value"), result);
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

  public init(series: PriceSeries, output: Float64Array): Float64Array {
    const data = validatePriceSeries(series);
    const result = validateStreamOutput(output, data.length, "output");
    this.inner.initInto(data, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateNumber(value, "value")));
  }

  public nextInto(value: number, output: Float64Array): boolean {
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(validateNumber(value, "value"), result);
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

  public init(series: PriceSeries, output: Float64Array): Float64Array {
    const data = validatePriceSeries(series);
    const result = validateStreamOutput(output, data.length, "output");
    this.inner.initInto(data, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): number | undefined {
    return optional(this.inner.next(validateNumber(value, "value")));
  }

  public nextInto(value: number, output: Float64Array): boolean {
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(validateNumber(value, "value"), result);
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

  public init(series: PriceSeries, output: MacdOutput): MacdOutput {
    const data = validatePriceSeries(series);
    output.macd = validateStreamOutput(output.macd, data.length, "output.macd");
    output.signal = validateStreamOutput(
      output.signal,
      data.length,
      "output.signal",
    );
    output.histogram = validateStreamOutput(
      output.histogram,
      data.length,
      "output.histogram",
    );
    this.inner.initInto(data, output.macd, output.signal, output.histogram);
    return output;
  }

  public history(): MacdOutput {
    const value = this.inner.history();
    return {
      macd: value.macd,
      signal: value.signal,
      histogram: value.histogram,
    };
  }

  public historyInto(output: MacdOutput): MacdOutput {
    output.macd = validateHistoryOutput(output.macd, "output.macd");
    output.signal = validateHistoryOutput(output.signal, "output.signal");
    output.histogram = validateHistoryOutput(
      output.histogram,
      "output.histogram",
    );
    this.inner.historyInto(output.macd, output.signal, output.histogram);
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): MacdPoint | undefined {
    const result = this.inner.next(validateNumber(value, "value"));
    return result === null ? undefined : mapMacdPoint(result);
  }

  public nextInto(value: number, output: MacdOutput): boolean {
    output.macd = validateStreamOutput(output.macd, 1, "output.macd");
    output.signal = validateStreamOutput(output.signal, 1, "output.signal");
    output.histogram = validateStreamOutput(
      output.histogram,
      1,
      "output.histogram",
    );
    return this.inner.nextInto(
      validateNumber(value, "value"),
      output.macd,
      output.signal,
      output.histogram,
    );
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

  public init(series: PriceSeries, output: BBandsOutput): BBandsOutput {
    const data = validatePriceSeries(series);
    output.upper = validateStreamOutput(output.upper, data.length, "output.upper");
    output.middle = validateStreamOutput(
      output.middle,
      data.length,
      "output.middle",
    );
    output.lower = validateStreamOutput(output.lower, data.length, "output.lower");
    output.percentB = validateStreamOutput(
      output.percentB,
      data.length,
      "output.percentB",
    );
    output.bandwidth = validateStreamOutput(
      output.bandwidth,
      data.length,
      "output.bandwidth",
    );
    this.inner.initInto(
      data,
      output.upper,
      output.middle,
      output.lower,
      output.percentB,
      output.bandwidth,
    );
    return output;
  }

  public history(): BBandsOutput {
    const value = this.inner.history();
    return {
      upper: value.upper,
      middle: value.middle,
      lower: value.lower,
      percentB: value.percentB,
      bandwidth: value.bandwidth,
    };
  }

  public historyInto(output: BBandsOutput): BBandsOutput {
    output.upper = validateHistoryOutput(output.upper, "output.upper");
    output.middle = validateHistoryOutput(output.middle, "output.middle");
    output.lower = validateHistoryOutput(output.lower, "output.lower");
    output.percentB = validateHistoryOutput(output.percentB, "output.percentB");
    output.bandwidth = validateHistoryOutput(output.bandwidth, "output.bandwidth");
    this.inner.historyInto(
      output.upper,
      output.middle,
      output.lower,
      output.percentB,
      output.bandwidth,
    );
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): BBandsPoint | undefined {
    const result = this.inner.next(validateNumber(value, "value"));
    return result === null ? undefined : mapBbandsPoint(result);
  }

  public nextInto(value: number, output: BBandsOutput): boolean {
    output.upper = validateStreamOutput(output.upper, 1, "output.upper");
    output.middle = validateStreamOutput(output.middle, 1, "output.middle");
    output.lower = validateStreamOutput(output.lower, 1, "output.lower");
    output.percentB = validateStreamOutput(
      output.percentB,
      1,
      "output.percentB",
    );
    output.bandwidth = validateStreamOutput(
      output.bandwidth,
      1,
      "output.bandwidth",
    );
    return this.inner.nextInto(
      validateNumber(value, "value"),
      output.upper,
      output.middle,
      output.lower,
      output.percentB,
      output.bandwidth,
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

  public init(series: HlcSeries, output: StochOutput): StochOutput {
    const values = validateHlcSeries(series);
    output.k = validateStreamOutput(output.k, values.high.length, "output.k");
    output.d = validateStreamOutput(output.d, values.high.length, "output.d");
    this.inner.initInto(
      values.high,
      values.low,
      values.close,
      output.k,
      output.d,
    );
    return output;
  }

  public history(): StochOutput {
    const value = this.inner.history();
    return { k: value.k, d: value.d };
  }

  public historyInto(output: StochOutput): StochOutput {
    output.k = validateHistoryOutput(output.k, "output.k");
    output.d = validateHistoryOutput(output.d, "output.d");
    this.inner.historyInto(output.k, output.d);
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(bar: HlcBar): StochPoint | undefined {
    const values = validateHlcBar(bar);
    const result = this.inner.next(values.high, values.low, values.close);
    return result === null ? undefined : mapStochPoint(result);
  }

  public nextInto(bar: HlcBar, output: StochOutput): boolean {
    const values = validateHlcBar(bar);
    output.k = validateStreamOutput(output.k, 1, "output.k");
    output.d = validateStreamOutput(output.d, 1, "output.d");
    return this.inner.nextInto(
      values.high,
      values.low,
      values.close,
      output.k,
      output.d,
    );
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

  public init(series: PriceSeries, output: StochRsiOutput): StochRsiOutput {
    const data = validatePriceSeries(series);
    output.k = validateStreamOutput(output.k, data.length, "output.k");
    output.d = validateStreamOutput(output.d, data.length, "output.d");
    this.inner.initInto(data, output.k, output.d);
    return output;
  }

  public history(): StochRsiOutput {
    const value = this.inner.history();
    return { k: value.k, d: value.d };
  }

  public historyInto(output: StochRsiOutput): StochRsiOutput {
    output.k = validateHistoryOutput(output.k, "output.k");
    output.d = validateHistoryOutput(output.d, "output.d");
    this.inner.historyInto(output.k, output.d);
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): StochRsiPoint | undefined {
    const result = this.inner.next(validateNumber(value, "value"));
    return result === null ? undefined : mapStochRsiPoint(result);
  }

  public nextInto(value: number, output: StochRsiOutput): boolean {
    output.k = validateStreamOutput(output.k, 1, "output.k");
    output.d = validateStreamOutput(output.d, 1, "output.d");
    return this.inner.nextInto(
      validateNumber(value, "value"),
      output.k,
      output.d,
    );
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

  public init(series: HlcSeries, output: Float64Array): Float64Array {
    const values = validateHlcSeries(series);
    const result = validateStreamOutput(output, values.high.length, "output");
    this.inner.initInto(values.high, values.low, values.close, result);
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(bar: HlcBar): number | undefined {
    const values = validateHlcBar(bar);
    return optional(this.inner.next(values.high, values.low, values.close));
  }

  public nextInto(bar: HlcBar, output: Float64Array): boolean {
    const values = validateHlcBar(bar);
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(values.high, values.low, values.close, result);
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

  public init(series: HlcvSeries, output: Float64Array): Float64Array {
    const values = validateHlcvSeries(series);
    const result = validateStreamOutput(output, values.high.length, "output");
    this.inner.initInto(
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
    );
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(bar: HlcvBar): number | undefined {
    const values = validateHlcvBar(bar);
    return optional(
      this.inner.next(values.high, values.low, values.close, values.volume),
    );
  }

  public nextInto(bar: HlcvBar, output: Float64Array): boolean {
    const values = validateHlcvBar(bar);
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
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

  public init(series: HlcvSeries, output: Float64Array): Float64Array {
    const values = validateHlcvSeries(series);
    const result = validateStreamOutput(output, values.high.length, "output");
    this.inner.initInto(
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
    );
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(bar: HlcvBar): number | undefined {
    const values = validateHlcvBar(bar);
    return optional(
      this.inner.next(values.high, values.low, values.close, values.volume),
    );
  }

  public nextInto(bar: HlcvBar, output: Float64Array): boolean {
    const values = validateHlcvBar(bar);
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
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

  public init(series: HlcSeries, output: AdxOutput): AdxOutput {
    const values = validateHlcSeries(series);
    output.adx = validateStreamOutput(output.adx, values.high.length, "output.adx");
    output.plusDi = validateStreamOutput(
      output.plusDi,
      values.high.length,
      "output.plusDi",
    );
    output.minusDi = validateStreamOutput(
      output.minusDi,
      values.high.length,
      "output.minusDi",
    );
    this.inner.initInto(
      values.high,
      values.low,
      values.close,
      output.adx,
      output.plusDi,
      output.minusDi,
    );
    return output;
  }

  public history(): AdxOutput {
    const value = this.inner.history();
    return {
      adx: value.adx,
      plusDi: value.plusDi,
      minusDi: value.minusDi,
    };
  }

  public historyInto(output: AdxOutput): AdxOutput {
    output.adx = validateHistoryOutput(output.adx, "output.adx");
    output.plusDi = validateHistoryOutput(output.plusDi, "output.plusDi");
    output.minusDi = validateHistoryOutput(output.minusDi, "output.minusDi");
    this.inner.historyInto(output.adx, output.plusDi, output.minusDi);
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(bar: HlcBar): AdxPoint | undefined {
    const values = validateHlcBar(bar);
    const result = this.inner.next(values.high, values.low, values.close);
    return result === null ? undefined : mapAdxPoint(result);
  }

  public nextInto(bar: HlcBar, output: AdxOutput): boolean {
    const values = validateHlcBar(bar);
    output.adx = validateStreamOutput(output.adx, 1, "output.adx");
    output.plusDi = validateStreamOutput(output.plusDi, 1, "output.plusDi");
    output.minusDi = validateStreamOutput(output.minusDi, 1, "output.minusDi");
    return this.inner.nextInto(
      values.high,
      values.low,
      values.close,
      output.adx,
      output.plusDi,
      output.minusDi,
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

  public init(series: HlcSeries, output: IchimokuOutput): IchimokuOutput {
    const values = validateHlcSeries(series);
    output.tenkanSen = validateStreamOutput(
      output.tenkanSen,
      values.high.length,
      "output.tenkanSen",
    );
    output.kijunSen = validateStreamOutput(
      output.kijunSen,
      values.high.length,
      "output.kijunSen",
    );
    output.senkouSpanA = validateStreamOutput(
      output.senkouSpanA,
      values.high.length,
      "output.senkouSpanA",
    );
    output.senkouSpanB = validateStreamOutput(
      output.senkouSpanB,
      values.high.length,
      "output.senkouSpanB",
    );
    output.chikouSpan = validateStreamOutput(
      output.chikouSpan,
      values.high.length,
      "output.chikouSpan",
    );
    this.inner.initInto(
      values.high,
      values.low,
      values.close,
      output.tenkanSen,
      output.kijunSen,
      output.senkouSpanA,
      output.senkouSpanB,
      output.chikouSpan,
    );
    return output;
  }

  public history(): IchimokuOutput {
    const value = this.inner.history();
    return {
      tenkanSen: value.tenkanSen,
      kijunSen: value.kijunSen,
      senkouSpanA: value.senkouSpanA,
      senkouSpanB: value.senkouSpanB,
      chikouSpan: value.chikouSpan,
    };
  }

  public historyInto(output: IchimokuOutput): IchimokuOutput {
    output.tenkanSen = validateHistoryOutput(output.tenkanSen, "output.tenkanSen");
    output.kijunSen = validateHistoryOutput(output.kijunSen, "output.kijunSen");
    output.senkouSpanA = validateHistoryOutput(
      output.senkouSpanA,
      "output.senkouSpanA",
    );
    output.senkouSpanB = validateHistoryOutput(
      output.senkouSpanB,
      "output.senkouSpanB",
    );
    output.chikouSpan = validateHistoryOutput(
      output.chikouSpan,
      "output.chikouSpan",
    );
    this.inner.historyInto(
      output.tenkanSen,
      output.kijunSen,
      output.senkouSpanA,
      output.senkouSpanB,
      output.chikouSpan,
    );
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(bar: HlcBar): IchimokuPoint | undefined {
    const values = validateHlcBar(bar);
    const result = this.inner.next(values.high, values.low, values.close);
    return result === null ? undefined : mapIchimokuPoint(result);
  }

  public nextInto(bar: HlcBar, output: IchimokuOutput): boolean {
    const values = validateHlcBar(bar);
    output.tenkanSen = validateStreamOutput(output.tenkanSen, 1, "output.tenkanSen");
    output.kijunSen = validateStreamOutput(output.kijunSen, 1, "output.kijunSen");
    output.senkouSpanA = validateStreamOutput(
      output.senkouSpanA,
      1,
      "output.senkouSpanA",
    );
    output.senkouSpanB = validateStreamOutput(
      output.senkouSpanB,
      1,
      "output.senkouSpanB",
    );
    output.chikouSpan = validateStreamOutput(
      output.chikouSpan,
      1,
      "output.chikouSpan",
    );
    return this.inner.nextInto(
      values.high,
      values.low,
      values.close,
      output.tenkanSen,
      output.kijunSen,
      output.senkouSpanA,
      output.senkouSpanB,
      output.chikouSpan,
    );
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

  public init(series: PriceSeries, output: LinRegOutput): LinRegOutput {
    const data = validatePriceSeries(series);
    output.value = validateStreamOutput(output.value, data.length, "output.value");
    output.upper = validateStreamOutput(output.upper, data.length, "output.upper");
    output.lower = validateStreamOutput(output.lower, data.length, "output.lower");
    output.slope = validateStreamOutput(output.slope, data.length, "output.slope");
    output.r = validateStreamOutput(output.r, data.length, "output.r");
    output.rSquared = validateStreamOutput(
      output.rSquared,
      data.length,
      "output.rSquared",
    );
    this.inner.initInto(
      data,
      output.value,
      output.upper,
      output.lower,
      output.slope,
      output.r,
      output.rSquared,
    );
    return output;
  }

  public history(): LinRegOutput {
    const value = this.inner.history();
    return {
      value: value.value,
      upper: value.upper,
      lower: value.lower,
      slope: value.slope,
      r: value.r,
      rSquared: value.rSquared,
    };
  }

  public historyInto(output: LinRegOutput): LinRegOutput {
    output.value = validateHistoryOutput(output.value, "output.value");
    output.upper = validateHistoryOutput(output.upper, "output.upper");
    output.lower = validateHistoryOutput(output.lower, "output.lower");
    output.slope = validateHistoryOutput(output.slope, "output.slope");
    output.r = validateHistoryOutput(output.r, "output.r");
    output.rSquared = validateHistoryOutput(output.rSquared, "output.rSquared");
    this.inner.historyInto(
      output.value,
      output.upper,
      output.lower,
      output.slope,
      output.r,
      output.rSquared,
    );
    return output;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
  }

  public next(value: number): LinRegPoint | undefined {
    const result = this.inner.next(validateNumber(value, "value"));
    return result === null ? undefined : mapLinRegPoint(result);
  }

  public nextInto(value: number, output: LinRegOutput): boolean {
    output.value = validateStreamOutput(output.value, 1, "output.value");
    output.upper = validateStreamOutput(output.upper, 1, "output.upper");
    output.lower = validateStreamOutput(output.lower, 1, "output.lower");
    output.slope = validateStreamOutput(output.slope, 1, "output.slope");
    output.r = validateStreamOutput(output.r, 1, "output.r");
    output.rSquared = validateStreamOutput(output.rSquared, 1, "output.rSquared");
    return this.inner.nextInto(
      validateNumber(value, "value"),
      output.value,
      output.upper,
      output.lower,
      output.slope,
      output.r,
      output.rSquared,
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

  public get numStdDev(): number {
    return this.inner.numStdDev;
  }
}

export class SessionVwapStream {
  private readonly inner = new NativeSessionVwapStream();

  public init(
    series: TimestampedHlcvSeries,
    output: Float64Array,
  ): Float64Array {
    const values = validateTimestampedHlcvSeries(series);
    const result = validateStreamOutput(output, values.timestamp.length, "output");
    this.inner.initInto(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
    );
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
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

  public nextInto(bar: TimestampedHlcvBar, output: Float64Array): boolean {
    const values = validateTimestampedHlcvBar(bar);
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
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

  public init(
    series: TimestampedHlcvSeries,
    output: Float64Array,
  ): Float64Array {
    const values = validateTimestampedHlcvSeries(series);
    const result = validateStreamOutput(output, values.timestamp.length, "output");
    this.inner.initInto(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
    );
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
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

  public nextInto(bar: TimestampedHlcvBar, output: Float64Array): boolean {
    const values = validateTimestampedHlcvBar(bar);
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
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

  public init(
    series: TimestampedHlcvSeries,
    output: Float64Array,
  ): Float64Array {
    const values = validateTimestampedHlcvSeries(series);
    const result = validateStreamOutput(output, values.timestamp.length, "output");
    this.inner.initInto(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
    );
    return result;
  }

  public history(): Float64Array {
    return this.inner.history();
  }

  public historyInto(output: Float64Array): Float64Array {
    const result = validateHistoryOutput(output, "output");
    this.inner.historyInto(result);
    return result;
  }

  public get historyLength(): number {
    return this.inner.historyLength;
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

  public nextInto(bar: TimestampedHlcvBar, output: Float64Array): boolean {
    const values = validateTimestampedHlcvBar(bar);
    const result = validateStreamOutput(output, 1, "output");
    return this.inner.nextInto(
      values.timestamp,
      values.high,
      values.low,
      values.close,
      values.volume,
      result,
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
