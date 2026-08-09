import type {
  FrvpBar,
  FrvpSeries,
  HlcBar,
  HlcSeries,
  HlcvBar,
  HlcvSeries,
  PriceSeries,
  TimestampedHlcvBar,
  TimestampedHlcvSeries,
  PivotVariant,
} from "./types.js";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown, name: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }

  return value as UnknownRecord;
}

export function requiredOption(
  options: UnknownRecord,
  key: string,
  name: string,
): unknown {
  if (!Object.prototype.hasOwnProperty.call(options, key)) {
    throw new TypeError(`${name}.${key} is required`);
  }

  return options[key];
}

export function validateOptions(value: unknown, name: string): UnknownRecord {
  return asRecord(value, name);
}

export function validateFloat64Array(value: unknown, name: string): Float64Array {
  if (!(value instanceof Float64Array)) {
    throw new TypeError(`${name} must be a Float64Array`);
  }
  return value;
}

export function validateOutputArray(
  value: unknown,
  length: number,
  name: string,
): Float64Array {
  if (!(value instanceof Float64Array)) {
    throw new TypeError(`${name} must be a Float64Array`);
  }
  if (value.length !== length) {
    throw new RangeError(`${name} has length ${value.length}, expected ${length}`);
  }
  return value;
}

export function validatePriceSeries(value: unknown): Float64Array {
  const series = asRecord(value, "series");
  return validateFloat64Array(series.values, "series.values");
}

export function validateHlcSeries(value: unknown): HlcSeries {
  const series = asRecord(value, "series");
  const high = validateFloat64Array(series.high, "series.high");
  const low = validateFloat64Array(series.low, "series.low");
  const close = validateFloat64Array(series.close, "series.close");
  validateSameLength([
    ["series.high", high],
    ["series.low", low],
    ["series.close", close],
  ]);

  return { high, low, close };
}

export function validateHlcvSeries(value: unknown): HlcvSeries {
  const series = asRecord(value, "series");
  const { high, low, close } = validateHlcSeries(value);
  const volume = validateFloat64Array(series.volume, "series.volume");
  validateSameLength([
    ["series.high", high],
    ["series.volume", volume],
  ]);

  return { high, low, close, volume };
}

export function validateTimestampedHlcvSeries(
  value: unknown,
): TimestampedHlcvSeries {
  const series = asRecord(value, "series");
  const { high, low, close, volume } = validateHlcvSeries(value);
  const timestamp = validateFloat64Array(series.timestamp, "series.timestamp");
  validateSameLength([
    ["series.high", high],
    ["series.timestamp", timestamp],
  ]);

  return { timestamp, high, low, close, volume };
}

export function validateFrvpSeries(value: unknown): FrvpSeries {
  const series = asRecord(value, "series");
  const high = validateFloat64Array(series.high, "series.high");
  const low = validateFloat64Array(series.low, "series.low");
  const volume = validateFloat64Array(series.volume, "series.volume");
  validateSameLength([
    ["series.high", high],
    ["series.low", low],
    ["series.volume", volume],
  ]);
  return { high, low, volume };
}

export function validateNumber(value: unknown, name: string): number {
  if (typeof value !== "number") {
    throw new TypeError(`${name} must be a number`);
  }
  return value;
}

export function validateHlcBar(value: unknown, name = "bar"): HlcBar {
  const bar = asRecord(value, name);
  return {
    high: validateNumber(bar.high, `${name}.high`),
    low: validateNumber(bar.low, `${name}.low`),
    close: validateNumber(bar.close, `${name}.close`),
  };
}

export function validateHlcvBar(value: unknown, name = "bar"): HlcvBar {
  const bar = asRecord(value, name);
  const { high, low, close } = validateHlcBar(value, name);
  return {
    high,
    low,
    close,
    volume: validateNumber(bar.volume, `${name}.volume`),
  };
}

export function validateTimestampedHlcvBar(
  value: unknown,
  name = "bar",
): TimestampedHlcvBar {
  const bar = asRecord(value, name);
  const { high, low, close, volume } = validateHlcvBar(value, name);
  const timestamp = validateNumber(bar.timestamp, `${name}.timestamp`);
  return { timestamp, high, low, close, volume };
}

export function validateFrvpBar(value: unknown, name = "bar"): FrvpBar {
  const bar = asRecord(value, name);
  const high = validateNumber(bar.high, `${name}.high`);
  const low = validateNumber(bar.low, `${name}.low`);
  const volume = validateNumber(bar.volume, `${name}.volume`);
  return { high, low, volume };
}

export function validateFiniteNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

export function validateTimestamp(value: number, name: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer timestamp`);
  }
  return value;
}

export function validateTimestampValue(value: unknown, name: string): number {
  return validateTimestamp(
    validateFiniteNumber(value, name),
    name,
  );
}

export function validatePositiveInteger(value: unknown, name: string): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return value;
}

export function validateNonNegativeNumber(value: unknown, name: string): number {
  const number = validateFiniteNumber(value, name);
  if (number < 0) {
    throw new RangeError(`${name} must be non-negative`);
  }
  return number;
}

export function validateFraction(value: unknown, name: string): number {
  const number = validateFiniteNumber(value, name);
  if (number < 0 || number > 1) {
    throw new RangeError(`${name} must be between 0 and 1`);
  }
  return number;
}

export function validateAnchorIndex(value: unknown, length: number): number {
  const index = validatePositiveOrZeroInteger(value, "options.anchorIndex");
  if (index >= length) {
    throw new RangeError(
      `options.anchorIndex must be less than series length ${length}`,
    );
  }
  return index;
}

export function validatePositiveOrZeroInteger(
  value: unknown,
  name: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  return value;
}

export function validateSignalType(value: unknown): "ema" | "sma" {
  if (value !== "ema" && value !== "sma") {
    throw new RangeError(`options.signalType must be "ema" or "sma"`);
  }
  return value;
}

export function validatePivotVariant(value: unknown): PivotVariant {
  if (
    value !== "standard" &&
    value !== "fibonacci" &&
    value !== "woodie"
  ) {
    throw new RangeError(
      `options.variant must be "standard", "fibonacci", or "woodie"`,
    );
  }
  return value;
}

export function validateSameLength(
  columns: ReadonlyArray<readonly [string, Float64Array]>,
): void {
  const first = columns[0];
  if (first === undefined) {
    return;
  }

  for (const [name, column] of columns.slice(1)) {
    if (column.length !== first[1].length) {
      throw new RangeError(
        `${name} has length ${column.length}, expected ${first[1].length}`,
      );
    }
  }
}
