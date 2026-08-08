import {
  requiredOption,
  validateFraction,
  validateNonNegativeNumber,
  validateOptions,
  validatePositiveInteger,
  validateSignalType,
} from "./validation.js";
import type {
  BBandsOptions,
  FrvpOptions,
  IchimokuOptions,
  LinRegOptions,
  MacdOptions,
  StochOptions,
  StochRsiOptions,
} from "./types.js";

export function periodOption(options: unknown): number {
  const record = validateOptions(options, "options");
  return validatePositiveInteger(
    requiredOption(record, "period", "options"),
    "options.period",
  );
}

export function macdOptions(options: unknown): MacdOptions {
  const record = validateOptions(options, "options");
  return {
    fastPeriod: validatePositiveInteger(
      requiredOption(record, "fastPeriod", "options"),
      "options.fastPeriod",
    ),
    slowPeriod: validatePositiveInteger(
      requiredOption(record, "slowPeriod", "options"),
      "options.slowPeriod",
    ),
    signalPeriod: validatePositiveInteger(
      requiredOption(record, "signalPeriod", "options"),
      "options.signalPeriod",
    ),
    signalType: validateSignalType(
      requiredOption(record, "signalType", "options"),
    ),
  };
}

export function bbandsOptions(options: unknown): BBandsOptions {
  const record = validateOptions(options, "options");
  return {
    period: validatePositiveInteger(
      requiredOption(record, "period", "options"),
      "options.period",
    ),
    k: validateNonNegativeNumber(
      requiredOption(record, "k", "options"),
      "options.k",
    ),
  };
}

export function stochOptions(options: unknown): StochOptions {
  const record = validateOptions(options, "options");
  const type = requiredOption(record, "type", "options");
  const kPeriod = validatePositiveInteger(
    requiredOption(record, "kPeriod", "options"),
    "options.kPeriod",
  );
  const dPeriod = validatePositiveInteger(
    requiredOption(record, "dPeriod", "options"),
    "options.dPeriod",
  );

  if (type === "fast") {
    return { type, kPeriod, dPeriod };
  }
  if (type === "slow") {
    return {
      type,
      kPeriod,
      dPeriod,
      slowing: validatePositiveInteger(
        requiredOption(record, "slowing", "options"),
        "options.slowing",
      ),
    };
  }
  throw new RangeError(`options.type must be "fast" or "slow"`);
}

export function stochRsiOptions(options: unknown): StochRsiOptions {
  const record = validateOptions(options, "options");
  return {
    rsiPeriod: validatePositiveInteger(
      requiredOption(record, "rsiPeriod", "options"),
      "options.rsiPeriod",
    ),
    stochPeriod: validatePositiveInteger(
      requiredOption(record, "stochPeriod", "options"),
      "options.stochPeriod",
    ),
    kSmooth: validatePositiveInteger(
      requiredOption(record, "kSmooth", "options"),
      "options.kSmooth",
    ),
    dPeriod: validatePositiveInteger(
      requiredOption(record, "dPeriod", "options"),
      "options.dPeriod",
    ),
  };
}

export function ichimokuOptions(options: unknown): IchimokuOptions {
  const record = validateOptions(options, "options");
  return {
    tenkanPeriod: validatePositiveInteger(
      requiredOption(record, "tenkanPeriod", "options"),
      "options.tenkanPeriod",
    ),
    kijunPeriod: validatePositiveInteger(
      requiredOption(record, "kijunPeriod", "options"),
      "options.kijunPeriod",
    ),
    senkouBPeriod: validatePositiveInteger(
      requiredOption(record, "senkouBPeriod", "options"),
      "options.senkouBPeriod",
    ),
  };
}

export function linregOptions(options: unknown): LinRegOptions {
  const record = validateOptions(options, "options");
  return {
    period: validatePositiveInteger(
      requiredOption(record, "period", "options"),
      "options.period",
    ),
    numStdDev: validateNonNegativeNumber(
      requiredOption(record, "numStdDev", "options"),
      "options.numStdDev",
    ),
  };
}

export function frvpOptions(options: unknown): FrvpOptions {
  const record = validateOptions(options, "options");
  return {
    numBins: validatePositiveInteger(
      requiredOption(record, "numBins", "options"),
      "options.numBins",
    ),
    valueAreaPercent: validateFraction(
      requiredOption(record, "valueAreaPercent", "options"),
      "options.valueAreaPercent",
    ),
  };
}
