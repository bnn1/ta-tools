import * as native from "../native/index.js";
import {
  frvpOptions,
  ichimokuOptions,
  linregOptions,
  macdOptions,
  periodOption,
  stochOptions,
  stochRsiOptions,
  bbandsOptions,
} from "./options.js";
import {
  requiredOption,
  validateAnchorIndex,
  validateFiniteNumber,
  validateFrvpSeries,
  validateHlcBar,
  validateHlcSeries,
  validateHlcvSeries,
  validatePivotVariant,
  validatePriceSeries,
  validateTimestamp,
  validateTimestampedHlcvSeries,
  validateTimestampValue,
  validateOptions,
  validateOutputArray,
} from "./validation.js";
import * as streams from "./streams.js";
import type {
  AdxOutput,
  AnchorIndexOptions,
  AnchorTimestampOptions,
  BBandsOutput,
  FrvpOutput,
  FrvpOptions,
  FrvpSeries,
  HlcBar,
  HlcSeries,
  HlcvSeries,
  IchimokuOutput,
  LinRegOutput,
  MacdOutput,
  PivotBatchOutput,
  PivotOptions,
  PivotOutput,
  PeriodOptions,
  PriceSeries,
  SeriesInput,
  StochOptions,
  StochOutput,
  StochRsiOptions,
  StochRsiOutput,
  TimestampedHlcvSeries,
  IndicatorSpec,
} from "./types.js";

export * from "./types.js";
export {
  AdxStream,
  AnchoredVwapStream,
  AtrStream,
  BBandsStream,
  CvdOhlcvStream,
  CvdStream,
  EmaStream,
  FrvpStream,
  HmaStream,
  IchimokuStream,
  LinRegStream,
  MacdStream,
  MfiStream,
  RollingVwapStream,
  RsiStream,
  SessionVwapStream,
  SmaStream,
  StochRsiStream,
  StochStream,
  WmaStream,
} from "./streams.js";

function outputArray(
  value: Float64Array,
  length: number,
  name: string,
): Float64Array {
  return validateOutputArray(value, length, name);
}

export function sma(
  series: PriceSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validatePriceSeries(series);
  const result = outputArray(output, data.length, "output");
  native.smaInto(data, periodOption(options), result);
  return result;
}

export function ema(
  series: PriceSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validatePriceSeries(series);
  const result = outputArray(output, data.length, "output");
  native.emaInto(data, periodOption(options), result);
  return result;
}

export function wma(
  series: PriceSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validatePriceSeries(series);
  const result = outputArray(output, data.length, "output");
  native.wmaInto(data, periodOption(options), result);
  return result;
}

export function rsi(
  series: PriceSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validatePriceSeries(series);
  const result = outputArray(output, data.length, "output");
  native.rsiInto(data, periodOption(options), result);
  return result;
}

export function hma(
  series: PriceSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validatePriceSeries(series);
  const result = outputArray(output, data.length, "output");
  native.hmaInto(data, periodOption(options), result);
  return result;
}

export function cvd(series: PriceSeries, output: Float64Array): Float64Array {
  const data = validatePriceSeries(series);
  const result = outputArray(output, data.length, "output");
  native.cvdInto(data, result);
  return result;
}

export function macd(
  series: PriceSeries,
  options: import("./types.js").MacdOptions,
  output: MacdOutput,
): MacdOutput {
  const values = macdOptions(options);
  const data = validatePriceSeries(series);
  const result = output;
  result.macd = validateOutputArray(result.macd, data.length, "output.macd");
  result.signal = validateOutputArray(result.signal, data.length, "output.signal");
  result.histogram = validateOutputArray(
    result.histogram,
    data.length,
    "output.histogram",
  );
  native.macdInto(
    data,
    values.fastPeriod,
    values.slowPeriod,
    values.signalPeriod,
    values.signalType,
    result.macd,
    result.signal,
    result.histogram,
  );
  return result;
}

export function bbands(
  series: PriceSeries,
  options: import("./types.js").BBandsOptions,
  output: BBandsOutput,
): BBandsOutput {
  const values = bbandsOptions(options);
  const data = validatePriceSeries(series);
  const result = output;
  result.upper = validateOutputArray(result.upper, data.length, "output.upper");
  result.middle = validateOutputArray(result.middle, data.length, "output.middle");
  result.lower = validateOutputArray(result.lower, data.length, "output.lower");
  result.percentB = validateOutputArray(
    result.percentB,
    data.length,
    "output.percentB",
  );
  result.bandwidth = validateOutputArray(
    result.bandwidth,
    data.length,
    "output.bandwidth",
  );
  native.bbandsInto(
    data,
    values.period,
    values.k,
    result.upper,
    result.middle,
    result.lower,
    result.percentB,
    result.bandwidth,
  );
  return result;
}

export function stoch(
  series: HlcSeries,
  options: StochOptions,
  output: StochOutput,
): StochOutput {
  const data = validateHlcSeries(series);
  const values = stochOptions(options);
  const result = output;
  result.k = validateOutputArray(result.k, data.high.length, "output.k");
  result.d = validateOutputArray(result.d, data.high.length, "output.d");
  native.stochInto(
    data.high,
    data.low,
    data.close,
    values.kPeriod,
    values.dPeriod,
    values.type === "slow" ? values.slowing : 3,
    values.type,
    result.k,
    result.d,
  );
  return result;
}

export function stochRsi(
  series: PriceSeries,
  options: StochRsiOptions,
  output: StochRsiOutput,
): StochRsiOutput {
  const values = stochRsiOptions(options);
  const data = validatePriceSeries(series);
  const result = output;
  result.k = validateOutputArray(result.k, data.length, "output.k");
  result.d = validateOutputArray(result.d, data.length, "output.d");
  native.stochRsiInto(
    data,
    values.rsiPeriod,
    values.stochPeriod,
    values.kSmooth,
    values.dPeriod,
    result.k,
    result.d,
  );
  return result;
}

export function atr(
  series: HlcSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validateHlcSeries(series);
  const result = outputArray(output, data.high.length, "output");
  native.atrInto(
    data.high,
    data.low,
    data.close,
    periodOption(options),
    result,
  );
  return result;
}

export function mfi(
  series: HlcvSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validateHlcvSeries(series);
  const result = outputArray(output, data.high.length, "output");
  native.mfiInto(
    data.high,
    data.low,
    data.close,
    data.volume,
    periodOption(options),
    result,
  );
  return result;
}

export function cvdOhlcv(
  series: HlcvSeries,
  output: Float64Array,
): Float64Array {
  const data = validateHlcvSeries(series);
  const result = outputArray(output, data.high.length, "output");
  native.cvdOhlcvInto(data.high, data.low, data.close, data.volume, result);
  return result;
}

export function adx(
  series: HlcSeries,
  options: PeriodOptions,
  output: AdxOutput,
): AdxOutput {
  const data = validateHlcSeries(series);
  const result = output;
  result.adx = validateOutputArray(result.adx, data.high.length, "output.adx");
  result.plusDi = validateOutputArray(
    result.plusDi,
    data.high.length,
    "output.plusDi",
  );
  result.minusDi = validateOutputArray(
    result.minusDi,
    data.high.length,
    "output.minusDi",
  );
  native.adxInto(
    data.high,
    data.low,
    data.close,
    periodOption(options),
    result.adx,
    result.plusDi,
    result.minusDi,
  );
  return result;
}

export function ichimoku(
  series: HlcSeries,
  options: import("./types.js").IchimokuOptions,
  output: IchimokuOutput,
): IchimokuOutput {
  const data = validateHlcSeries(series);
  const values = ichimokuOptions(options);
  const result = output;
  result.tenkanSen = validateOutputArray(
    result.tenkanSen,
    data.high.length,
    "output.tenkanSen",
  );
  result.kijunSen = validateOutputArray(
    result.kijunSen,
    data.high.length,
    "output.kijunSen",
  );
  result.senkouSpanA = validateOutputArray(
    result.senkouSpanA,
    data.high.length,
    "output.senkouSpanA",
  );
  result.senkouSpanB = validateOutputArray(
    result.senkouSpanB,
    data.high.length,
    "output.senkouSpanB",
  );
  result.chikouSpan = validateOutputArray(
    result.chikouSpan,
    data.high.length,
    "output.chikouSpan",
  );
  native.ichimokuInto(
    data.high,
    data.low,
    data.close,
    values.tenkanPeriod,
    values.kijunPeriod,
    values.senkouBPeriod,
    result.tenkanSen,
    result.kijunSen,
    result.senkouSpanA,
    result.senkouSpanB,
    result.chikouSpan,
  );
  return result;
}

export function linreg(
  series: PriceSeries,
  options: import("./types.js").LinRegOptions,
  output: LinRegOutput,
): LinRegOutput {
  const values = linregOptions(options);
  const data = validatePriceSeries(series);
  const result = output;
  result.value = validateOutputArray(result.value, data.length, "output.value");
  result.upper = validateOutputArray(result.upper, data.length, "output.upper");
  result.lower = validateOutputArray(result.lower, data.length, "output.lower");
  result.slope = validateOutputArray(result.slope, data.length, "output.slope");
  result.r = validateOutputArray(result.r, data.length, "output.r");
  result.rSquared = validateOutputArray(
    result.rSquared,
    data.length,
    "output.rSquared",
  );
  native.linregInto(
    data,
    values.period,
    values.numStdDev,
    result.value,
    result.upper,
    result.lower,
    result.slope,
    result.r,
    result.rSquared,
  );
  return result;
}

export function sessionVwap(
  series: TimestampedHlcvSeries,
  output: Float64Array,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  const result = outputArray(output, data.timestamp.length, "output");
  native.sessionVwapInto(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    result,
  );
  return result;
}

export function rollingVwap(
  series: TimestampedHlcvSeries,
  options: PeriodOptions,
  output: Float64Array,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  const result = outputArray(output, data.timestamp.length, "output");
  native.rollingVwapInto(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    periodOption(options),
    result,
  );
  return result;
}

export function anchoredVwap(
  series: TimestampedHlcvSeries,
  options: AnchorIndexOptions,
  output: Float64Array,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  const record = validateOptions(options, "options");
  const anchorIndex = validateAnchorIndex(
    requiredOption(record, "anchorIndex", "options"),
    data.timestamp.length,
  );
  const result = outputArray(output, data.timestamp.length, "output");
  native.anchoredVwapInto(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    anchorIndex,
    result,
  );
  return result;
}

export function anchoredVwapFromTimestamp(
  series: TimestampedHlcvSeries,
  options: AnchorTimestampOptions,
  output: Float64Array,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  const record = validateOptions(options, "options");
  const anchorTimestamp = validateTimestampValue(
    requiredOption(record, "anchorTimestamp", "options"),
    "options.anchorTimestamp",
  );
  const result = outputArray(output, data.timestamp.length, "output");
  native.anchoredVwapFromTimestampInto(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    anchorTimestamp,
    result,
  );
  return result;
}

export function pivotPoints(
  bar: HlcBar,
  options: PivotOptions,
): PivotOutput {
  const values = validateHlcBar(bar);
  const record = validateOptions(options, "options");
  const variant = validatePivotVariant(
    requiredOption(record, "variant", "options"),
  );
  return native.pivotPoints(values.high, values.low, values.close, variant);
}

export function pivotPointsBatch(
  series: HlcSeries,
  options: PivotOptions,
  output: PivotBatchOutput,
): PivotBatchOutput {
  const data = validateHlcSeries(series);
  const record = validateOptions(options, "options");
  const variant = validatePivotVariant(
    requiredOption(record, "variant", "options"),
  );
  const result = output;
  result.pivot = validateOutputArray(result.pivot, data.high.length, "output.pivot");
  result.r1 = validateOutputArray(result.r1, data.high.length, "output.r1");
  result.r2 = validateOutputArray(result.r2, data.high.length, "output.r2");
  result.r3 = validateOutputArray(result.r3, data.high.length, "output.r3");
  result.s1 = validateOutputArray(result.s1, data.high.length, "output.s1");
  result.s2 = validateOutputArray(result.s2, data.high.length, "output.s2");
  result.s3 = validateOutputArray(result.s3, data.high.length, "output.s3");
  native.pivotPointsBatchInto(
    data.high,
    data.low,
    data.close,
    variant,
    result.pivot,
    result.r1,
    result.r2,
    result.r3,
    result.s1,
    result.s2,
    result.s3,
  );
  return result;
}

export function frvp(
  series: FrvpSeries,
  options: FrvpOptions,
): FrvpOutput {
  const data = validateFrvpSeries(series);
  const values = frvpOptions(options);
  return native.frvp(
    data.high,
    data.low,
    data.volume,
    values.numBins,
    values.valueAreaPercent,
  );
}

export function analyze<
  Input extends SeriesInput,
  Spec extends IndicatorSpec<Input>,
>(
  data: Input,
  indicators: Spec,
): { [Key in keyof Spec]: ReturnType<Spec[Key]> } {
  const result = {} as { [Key in keyof Spec]: ReturnType<Spec[Key]> };
  for (const key of Object.keys(indicators) as Array<keyof Spec>) {
    const indicator = indicators[key];
    if (typeof indicator !== "function") {
      throw new TypeError(`indicators.${String(key)} must be a function`);
    }
    result[key] = indicator(data) as ReturnType<Spec[typeof key]>;
  }
  return result;
}

export type { SeriesInput };
