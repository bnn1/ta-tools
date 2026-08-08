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

export function sma(series: PriceSeries, options: PeriodOptions): Float64Array {
  return native.sma(validatePriceSeries(series), periodOption(options));
}

export function ema(series: PriceSeries, options: PeriodOptions): Float64Array {
  return native.ema(validatePriceSeries(series), periodOption(options));
}

export function wma(series: PriceSeries, options: PeriodOptions): Float64Array {
  return native.wma(validatePriceSeries(series), periodOption(options));
}

export function rsi(series: PriceSeries, options: PeriodOptions): Float64Array {
  return native.rsi(validatePriceSeries(series), periodOption(options));
}

export function hma(series: PriceSeries, options: PeriodOptions): Float64Array {
  return native.hma(validatePriceSeries(series), periodOption(options));
}

export function cvd(series: PriceSeries): Float64Array {
  return native.cvd(validatePriceSeries(series));
}

export function macd(
  series: PriceSeries,
  options: import("./types.js").MacdOptions,
): MacdOutput {
  const values = macdOptions(options);
  return native.macd(
    validatePriceSeries(series),
    values.fastPeriod,
    values.slowPeriod,
    values.signalPeriod,
    values.signalType,
  );
}

export function bbands(
  series: PriceSeries,
  options: import("./types.js").BBandsOptions,
): BBandsOutput {
  const values = bbandsOptions(options);
  return native.bbands(validatePriceSeries(series), values.period, values.k);
}

export function stoch(
  series: HlcSeries,
  options: StochOptions,
): StochOutput {
  const data = validateHlcSeries(series);
  const values = stochOptions(options);
  return native.stoch(
    data.high,
    data.low,
    data.close,
    values.kPeriod,
    values.dPeriod,
    values.type === "slow" ? values.slowing : 3,
    values.type,
  );
}

export function stochRsi(
  series: PriceSeries,
  options: StochRsiOptions,
): StochRsiOutput {
  const values = stochRsiOptions(options);
  return native.stochRsi(
    validatePriceSeries(series),
    values.rsiPeriod,
    values.stochPeriod,
    values.kSmooth,
    values.dPeriod,
  );
}

export function atr(series: HlcSeries, options: PeriodOptions): Float64Array {
  const data = validateHlcSeries(series);
  return native.atr(
    data.high,
    data.low,
    data.close,
    periodOption(options),
  );
}

export function mfi(series: HlcvSeries, options: PeriodOptions): Float64Array {
  const data = validateHlcvSeries(series);
  return native.mfi(
    data.high,
    data.low,
    data.close,
    data.volume,
    periodOption(options),
  );
}

export function cvdOhlcv(series: HlcvSeries): Float64Array {
  const data = validateHlcvSeries(series);
  return native.cvdOhlcv(data.high, data.low, data.close, data.volume);
}

export function adx(series: HlcSeries, options: PeriodOptions): AdxOutput {
  const data = validateHlcSeries(series);
  return native.adx(
    data.high,
    data.low,
    data.close,
    periodOption(options),
  );
}

export function ichimoku(
  series: HlcSeries,
  options: import("./types.js").IchimokuOptions,
): IchimokuOutput {
  const data = validateHlcSeries(series);
  const values = ichimokuOptions(options);
  return native.ichimoku(
    data.high,
    data.low,
    data.close,
    values.tenkanPeriod,
    values.kijunPeriod,
    values.senkouBPeriod,
  );
}

export function linreg(
  series: PriceSeries,
  options: import("./types.js").LinRegOptions,
): LinRegOutput {
  const values = linregOptions(options);
  return native.linreg(
    validatePriceSeries(series),
    values.period,
    values.numStdDev,
  );
}

export function sessionVwap(
  series: TimestampedHlcvSeries,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  return native.sessionVwap(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
  );
}

export function rollingVwap(
  series: TimestampedHlcvSeries,
  options: PeriodOptions,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  return native.rollingVwap(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    periodOption(options),
  );
}

export function anchoredVwap(
  series: TimestampedHlcvSeries,
  options: AnchorIndexOptions,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  const record = validateOptions(options, "options");
  const anchorIndex = validateAnchorIndex(
    requiredOption(record, "anchorIndex", "options"),
    data.timestamp.length,
  );
  return native.anchoredVwap(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    anchorIndex,
  );
}

export function anchoredVwapFromTimestamp(
  series: TimestampedHlcvSeries,
  options: AnchorTimestampOptions,
): Float64Array {
  const data = validateTimestampedHlcvSeries(series);
  const record = validateOptions(options, "options");
  const anchorTimestamp = validateTimestampValue(
    requiredOption(record, "anchorTimestamp", "options"),
    "options.anchorTimestamp",
  );
  return native.anchoredVwapFromTimestamp(
    data.timestamp,
    data.high,
    data.low,
    data.close,
    data.volume,
    anchorTimestamp,
  );
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
): PivotBatchOutput {
  const data = validateHlcSeries(series);
  const record = validateOptions(options, "options");
  const variant = validatePivotVariant(
    requiredOption(record, "variant", "options"),
  );
  return native.pivotPointsBatch(
    data.high,
    data.low,
    data.close,
    variant,
  );
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
