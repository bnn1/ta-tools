import { describe, expect, it } from "vitest";
import * as native from "../native/index.js";
import * as api from "../dist/index.js";

interface InputFixture {
  prices: api.PriceSeries;
  hlc: api.HlcSeries;
  hlcv: api.HlcvSeries;
  timestamped: api.TimestampedHlcvSeries;
  frvp: api.FrvpSeries;
}

function makeFixture(length = 64): InputFixture {
  const prices = Float64Array.from(
    { length },
    (_, index) => 100 + index * 0.35 + Math.sin(index / 3),
  );
  const high = Float64Array.from(
    prices,
    (value, index) => value + 1.5 + (index % 3) * 0.1,
  );
  const low = Float64Array.from(
    prices,
    (value, index) => value - 1.5 - (index % 2) * 0.1,
  );
  const volume = Float64Array.from(
    { length },
    (_, index) => 1_000 + index * 17,
  );
  const timestamp = Float64Array.from(
    { length },
    (_, index) => index * 60_000,
  );

  return {
    prices: { values: prices },
    hlc: { high, low, close: prices },
    hlcv: { high, low, close: prices, volume },
    timestamped: { timestamp, high, low, close: prices, volume },
    frvp: { high, low, volume },
  };
}

function expectSeriesClose(
  actual: Float64Array,
  expected: Float64Array,
): void {
  expect(actual).toBeInstanceOf(Float64Array);
  expect(actual.length).toBe(expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    if (Number.isNaN(expected[index])) {
      expect(Number.isNaN(actual[index])).toBe(true);
    } else {
      expect(actual[index]).toBeCloseTo(expected[index], 11);
    }
  }
}

function expectPointArrays<T extends Record<string, number>>(
  actual: readonly T[],
  expected: readonly T[],
): void {
  expect(actual.length).toBe(expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    const actualPoint = actual[index];
    const expectedPoint = expected[index];
    for (const key of Object.keys(expectedPoint) as Array<keyof T>) {
      const actualValue = actualPoint[key];
      const expectedValue = expectedPoint[key];
      if (Number.isNaN(expectedValue)) {
        expect(Number.isNaN(actualValue)).toBe(true);
      } else {
        expect(actualValue).toBeCloseTo(expectedValue, 11);
      }
    }
  }
}

function expectColumnPoints(
  actual: Record<string, Float64Array>,
  expected: readonly Record<string, number>[],
): void {
  const columns = Object.values(actual);
  expect(columns.length).toBeGreaterThan(0);
  expect(columns[0]).toHaveLength(expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    for (const key of Object.keys(expected[index])) {
      const actualValue = actual[key][index];
      const expectedValue = expected[index][key];
      if (Number.isNaN(expectedValue)) {
        expect(Number.isNaN(actualValue)).toBe(true);
      } else {
        expect(actualValue).toBeCloseTo(expectedValue, 11);
      }
    }
  }
}

function scalarOutput(length: number): Float64Array {
  return new Float64Array(length);
}

function appendScalar(value: Float64Array, next: number): Float64Array {
  const result = new Float64Array(value.length + 1);
  result.set(value);
  result[value.length] = next;
  return result;
}

function macdOutput(length: number): api.MacdOutput {
  return {
    macd: scalarOutput(length),
    signal: scalarOutput(length),
    histogram: scalarOutput(length),
  };
}

function bbandsOutput(length: number): api.BBandsOutput {
  return {
    upper: scalarOutput(length),
    middle: scalarOutput(length),
    lower: scalarOutput(length),
    percentB: scalarOutput(length),
    bandwidth: scalarOutput(length),
  };
}

function stochOutput(length: number): api.StochOutput {
  return { k: scalarOutput(length), d: scalarOutput(length) };
}

function stochRsiOutput(length: number): api.StochRsiOutput {
  return { k: scalarOutput(length), d: scalarOutput(length) };
}

function adxOutput(length: number): api.AdxOutput {
  return {
    adx: scalarOutput(length),
    plusDi: scalarOutput(length),
    minusDi: scalarOutput(length),
  };
}

function ichimokuOutput(length: number): api.IchimokuOutput {
  return {
    tenkanSen: scalarOutput(length),
    kijunSen: scalarOutput(length),
    senkouSpanA: scalarOutput(length),
    senkouSpanB: scalarOutput(length),
    chikouSpan: scalarOutput(length),
  };
}

function linregOutput(length: number): api.LinRegOutput {
  return {
    value: scalarOutput(length),
    upper: scalarOutput(length),
    lower: scalarOutput(length),
    slope: scalarOutput(length),
    r: scalarOutput(length),
    rSquared: scalarOutput(length),
  };
}

function pivotBatchOutput(length: number): api.PivotBatchOutput {
  return {
    pivot: scalarOutput(length),
    r1: scalarOutput(length),
    r2: scalarOutput(length),
    r3: scalarOutput(length),
    s1: scalarOutput(length),
    s2: scalarOutput(length),
    s3: scalarOutput(length),
  };
}

describe("native-backed TypeScript API", () => {
  it("routes every batch family through the native surface", () => {
    const fixture = makeFixture();
    const period = { period: 5 };

    expectSeriesClose(
      api.sma(fixture.prices, period, scalarOutput(fixture.prices.values.length)),
      native.sma(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.ema(fixture.prices, period, scalarOutput(fixture.prices.values.length)),
      native.ema(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.wma(fixture.prices, period, scalarOutput(fixture.prices.values.length)),
      native.wma(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.rsi(fixture.prices, period, scalarOutput(fixture.prices.values.length)),
      native.rsi(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.hma(fixture.prices, { period: 7 }, scalarOutput(fixture.prices.values.length)),
      native.hma(fixture.prices.values, 7),
    );
    expectSeriesClose(
      api.cvd(fixture.prices, scalarOutput(fixture.prices.values.length)),
      native.cvd(fixture.prices.values),
    );

    const macdOptions = {
      fastPeriod: 3,
      slowPeriod: 8,
      signalPeriod: 4,
      signalType: "ema" as const,
    };
    const macd = api.macd(
      fixture.prices,
      macdOptions,
      macdOutput(fixture.prices.values.length),
    );
    const nativeMacd = native.macd(
      fixture.prices.values,
      macdOptions.fastPeriod,
      macdOptions.slowPeriod,
      macdOptions.signalPeriod,
      macdOptions.signalType,
    );
    expectSeriesClose(macd.macd, nativeMacd.macd);
    expectSeriesClose(macd.signal, nativeMacd.signal);
    expectSeriesClose(macd.histogram, nativeMacd.histogram);

    const bbands = api.bbands(
      fixture.prices,
      { period: 5, k: 2 },
      bbandsOutput(fixture.prices.values.length),
    );
    const nativeBbands = native.bbands(fixture.prices.values, 5, 2);
    expectSeriesClose(bbands.upper, nativeBbands.upper);
    expectSeriesClose(bbands.middle, nativeBbands.middle);
    expectSeriesClose(bbands.lower, nativeBbands.lower);
    expectSeriesClose(bbands.percentB, nativeBbands.percentB);
    expectSeriesClose(bbands.bandwidth, nativeBbands.bandwidth);

    const stochOptions = {
      type: "slow" as const,
      kPeriod: 5,
      dPeriod: 3,
      slowing: 3,
    };
    const stoch = api.stoch(
      fixture.hlc,
      stochOptions,
      stochOutput(fixture.hlc.high.length),
    );
    const nativeStoch = native.stoch(
      fixture.hlc.high,
      fixture.hlc.low,
      fixture.hlc.close,
      stochOptions.kPeriod,
      stochOptions.dPeriod,
      stochOptions.slowing,
      stochOptions.type,
    );
    expectSeriesClose(stoch.k, nativeStoch.k);
    expectSeriesClose(stoch.d, nativeStoch.d);

    const stochRsiOptions = {
      rsiPeriod: 5,
      stochPeriod: 5,
      kSmooth: 3,
      dPeriod: 3,
    };
    const stochRsi = api.stochRsi(
      fixture.prices,
      stochRsiOptions,
      stochRsiOutput(fixture.prices.values.length),
    );
    const nativeStochRsi = native.stochRsi(
      fixture.prices.values,
      stochRsiOptions.rsiPeriod,
      stochRsiOptions.stochPeriod,
      stochRsiOptions.kSmooth,
      stochRsiOptions.dPeriod,
    );
    expectSeriesClose(stochRsi.k, nativeStochRsi.k);
    expectSeriesClose(stochRsi.d, nativeStochRsi.d);

    expectSeriesClose(
      api.atr(fixture.hlc, period, scalarOutput(fixture.hlc.high.length)),
      native.atr(fixture.hlc.high, fixture.hlc.low, fixture.hlc.close, 5),
    );
    expectSeriesClose(
      api.mfi(fixture.hlcv, period, scalarOutput(fixture.hlcv.high.length)),
      native.mfi(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
        5,
      ),
    );
    expectSeriesClose(
      api.cvdOhlcv(fixture.hlcv, scalarOutput(fixture.hlcv.high.length)),
      native.cvdOhlcv(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
      ),
    );

    const adx = api.adx(
      fixture.hlc,
      period,
      adxOutput(fixture.hlc.high.length),
    );
    const nativeAdx = native.adx(
      fixture.hlc.high,
      fixture.hlc.low,
      fixture.hlc.close,
      5,
    );
    expectSeriesClose(adx.adx, nativeAdx.adx);
    expectSeriesClose(adx.plusDi, nativeAdx.plusDi);
    expectSeriesClose(adx.minusDi, nativeAdx.minusDi);

    const ichimokuOptions = {
      tenkanPeriod: 3,
      kijunPeriod: 5,
      senkouBPeriod: 8,
    };
    const ichimoku = api.ichimoku(
      fixture.hlc,
      ichimokuOptions,
      ichimokuOutput(fixture.hlc.high.length),
    );
    const nativeIchimoku = native.ichimoku(
      fixture.hlc.high,
      fixture.hlc.low,
      fixture.hlc.close,
      ichimokuOptions.tenkanPeriod,
      ichimokuOptions.kijunPeriod,
      ichimokuOptions.senkouBPeriod,
    );
    expectSeriesClose(ichimoku.tenkanSen, nativeIchimoku.tenkanSen);
    expectSeriesClose(ichimoku.kijunSen, nativeIchimoku.kijunSen);
    expectSeriesClose(ichimoku.senkouSpanA, nativeIchimoku.senkouSpanA);
    expectSeriesClose(ichimoku.senkouSpanB, nativeIchimoku.senkouSpanB);
    expectSeriesClose(ichimoku.chikouSpan, nativeIchimoku.chikouSpan);

    const linregOptions = { period: 5, numStdDev: 2 };
    const linreg = api.linreg(
      fixture.prices,
      linregOptions,
      linregOutput(fixture.prices.values.length),
    );
    const nativeLinreg = native.linreg(
      fixture.prices.values,
      linregOptions.period,
      linregOptions.numStdDev,
    );
    expectSeriesClose(linreg.value, nativeLinreg.value);
    expectSeriesClose(linreg.upper, nativeLinreg.upper);
    expectSeriesClose(linreg.lower, nativeLinreg.lower);
    expectSeriesClose(linreg.slope, nativeLinreg.slope);
    expectSeriesClose(linreg.r, nativeLinreg.r);
    expectSeriesClose(linreg.rSquared, nativeLinreg.rSquared);

    expectSeriesClose(
      api.sessionVwap(
        fixture.timestamped,
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      native.sessionVwap(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
      ),
    );
    expectSeriesClose(
      api.rollingVwap(
        fixture.timestamped,
        period,
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      native.rollingVwap(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
        5,
      ),
    );
    expectSeriesClose(
      api.anchoredVwap(
        fixture.timestamped,
        { anchorIndex: 7 },
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      native.anchoredVwap(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
        7,
      ),
    );
    expectSeriesClose(
      api.anchoredVwapFromTimestamp(
        fixture.timestamped,
        { anchorTimestamp: fixture.timestamped.timestamp[7] },
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      native.anchoredVwapFromTimestamp(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
        fixture.timestamped.timestamp[7],
      ),
    );

    const pivotOptions = { variant: "fibonacci" as const };
    expect(
      api.pivotPoints(
        { high: 110, low: 100, close: 105 },
        { variant: "standard" },
      ),
    ).toEqual(
      native.pivotPoints(110, 100, 105, "standard"),
    );
    const pivotBatch = api.pivotPointsBatch(
      fixture.hlc,
      pivotOptions,
      pivotBatchOutput(fixture.hlc.high.length),
    );
    const nativePivotBatch = native.pivotPointsBatch(
      fixture.hlc.high,
      fixture.hlc.low,
      fixture.hlc.close,
      pivotOptions.variant,
    );
    expectSeriesClose(pivotBatch.pivot, nativePivotBatch.pivot);
    expectSeriesClose(pivotBatch.r1, nativePivotBatch.r1);
    expectSeriesClose(pivotBatch.r2, nativePivotBatch.r2);
    expectSeriesClose(pivotBatch.r3, nativePivotBatch.r3);
    expectSeriesClose(pivotBatch.s1, nativePivotBatch.s1);
    expectSeriesClose(pivotBatch.s2, nativePivotBatch.s2);
    expectSeriesClose(pivotBatch.s3, nativePivotBatch.s3);

    const frvp = api.frvp(fixture.frvp, {
      numBins: 12,
      valueAreaPercent: 0.7,
    });
    const nativeFrvp = native.frvp(
      fixture.frvp.high,
      fixture.frvp.low,
      fixture.frvp.volume,
      12,
      0.7,
    );
    expect(frvp).toEqual(nativeFrvp);
  });

  it("exposes direct stream classes with typed records and undefined readiness", () => {
    const fixture = makeFixture();

    const smaStream = new api.SmaStream({ period: 3 });
    expect(smaStream.next(1)).toBeUndefined();
    expect(smaStream.next(2)).toBeUndefined();
    expect(smaStream.next(3)).toBe(2);
    expectSeriesClose(
      smaStream.init(fixture.prices, scalarOutput(fixture.prices.values.length)),
      native.sma(fixture.prices.values, 3),
    );
    smaStream.reset();
    expect(smaStream.isReady()).toBe(false);

    expectSeriesClose(
      new api.EmaStream({ period: 5 }).init(
        fixture.prices,
        scalarOutput(fixture.prices.values.length),
      ),
      new native.EmaStream(5).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.WmaStream({ period: 5 }).init(
        fixture.prices,
        scalarOutput(fixture.prices.values.length),
      ),
      new native.WmaStream(5).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.RsiStream({ period: 5 }).init(
        fixture.prices,
        scalarOutput(fixture.prices.values.length),
      ),
      new native.RsiStream(5).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.HmaStream({ period: 7 }).init(
        fixture.prices,
        scalarOutput(fixture.prices.values.length),
      ),
      new native.HmaStream(7).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.CvdStream().init(
        fixture.prices,
        scalarOutput(fixture.prices.values.length),
      ),
      new native.CvdStream().init(fixture.prices.values),
    );

    const macdOptions = {
      fastPeriod: 3,
      slowPeriod: 8,
      signalPeriod: 4,
      signalType: "ema" as const,
    };
    expectColumnPoints(
      new api.MacdStream(macdOptions).init(
        fixture.prices,
        macdOutput(fixture.prices.values.length),
      ),
      new native.MacdStream(
        macdOptions.fastPeriod,
        macdOptions.slowPeriod,
        macdOptions.signalPeriod,
        macdOptions.signalType,
      ).init(fixture.prices.values),
    );
    expectColumnPoints(
      new api.BBandsStream({ period: 5, k: 2 }).init(
        fixture.prices,
        bbandsOutput(fixture.prices.values.length),
      ),
      new native.BBandsStream(5, 2).init(fixture.prices.values),
    );
    expectColumnPoints(
      new api.StochStream({
        type: "slow",
        kPeriod: 5,
        dPeriod: 3,
        slowing: 3,
      }).init(fixture.hlc, stochOutput(fixture.hlc.high.length)),
      new native.StochStream(5, 3, 3, "slow").init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectColumnPoints(
      new api.StochRsiStream({
        rsiPeriod: 5,
        stochPeriod: 5,
        kSmooth: 3,
        dPeriod: 3,
      }).init(fixture.prices, stochRsiOutput(fixture.prices.values.length)),
      new native.StochRsiStream(5, 5, 3, 3).init(fixture.prices.values),
    );
    expectColumnPoints(
      new api.AdxStream({ period: 5 }).init(
        fixture.hlc,
        adxOutput(fixture.hlc.high.length),
      ),
      new native.AdxStream(5).init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectColumnPoints(
      new api.IchimokuStream({
        tenkanPeriod: 3,
        kijunPeriod: 5,
        senkouBPeriod: 8,
      }).init(fixture.hlc, ichimokuOutput(fixture.hlc.high.length)),
      new native.IchimokuStream(3, 5, 8).init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectColumnPoints(
      new api.LinRegStream({ period: 5, numStdDev: 2 }).init(
        fixture.prices,
        linregOutput(fixture.prices.values.length),
      ),
      new native.LinRegStream(5, 2).init(fixture.prices.values),
    );

    expectSeriesClose(
      new api.AtrStream({ period: 5 }).init(
        fixture.hlc,
        scalarOutput(fixture.hlc.high.length),
      ),
      new native.AtrStream(5).init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectSeriesClose(
      new api.MfiStream({ period: 5 }).init(
        fixture.hlcv,
        scalarOutput(fixture.hlcv.high.length),
      ),
      new native.MfiStream(5).init(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
      ),
    );
    expectSeriesClose(
      new api.CvdOhlcvStream().init(
        fixture.hlcv,
        scalarOutput(fixture.hlcv.high.length),
      ),
      new native.CvdOhlcvStream().init(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
      ),
    );
    expectSeriesClose(
      new api.SessionVwapStream().init(
        fixture.timestamped,
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      new native.SessionVwapStream().init(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
      ),
    );
    expectSeriesClose(
      new api.RollingVwapStream({ period: 5 }).init(
        fixture.timestamped,
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      new native.RollingVwapStream(5).init(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
      ),
    );
    expectSeriesClose(
      new api.AnchoredVwapStream({ anchorTimestamp: 7 * 60_000 }).init(
        fixture.timestamped,
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
      native.AnchoredVwapStream.withAnchor(7 * 60_000).init(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
      ),
    );

    const publicFrvp = new api.FrvpStream({
      numBins: 12,
      valueAreaPercent: 0.7,
    }).init(fixture.frvp);
    const rawFrvp = new native.FrvpStream(12, 0.7).init(
      fixture.frvp.high,
      fixture.frvp.low,
      fixture.frvp.volume,
    );
    expect(publicFrvp).toEqual(rawFrvp);
  });

  it("reuses caller-owned batch and stream buffers", () => {
    const fixture = makeFixture(16);
    const output = scalarOutput(fixture.prices.values.length);
    expect(api.sma(fixture.prices, { period: 5 }, output)).toBe(output);
    expect(Number.isFinite(output[4])).toBe(true);

    const stream = new api.SmaStream({ period: 5 });
    const history = scalarOutput(fixture.prices.values.length);
    expect(stream.init(fixture.prices, history)).toBe(history);
    const nextOutput = scalarOutput(1);
    expect(stream.nextInto(101, nextOutput)).toBe(true);
    expect(Number.isFinite(nextOutput[0])).toBe(true);

    const structured = macdOutput(fixture.prices.values.length);
    expect(
      api.macd(
        fixture.prices,
        { fastPeriod: 3, slowPeriod: 8, signalPeriod: 4, signalType: "ema" },
        structured,
      ),
    ).toBe(structured);
    expect(structured.macd).toHaveLength(fixture.prices.values.length);

    expect(() =>
      api.sma(fixture.prices, { period: 5 }, scalarOutput(15)),
    ).toThrow(/expected 16/);
  });

  it("exposes complete native stream history and reusable history buffers", () => {
    const fixture = makeFixture(12);
    const stream = new api.SmaStream({ period: 4 });
    const initialized = scalarOutput(fixture.prices.values.length);
    stream.init(fixture.prices, initialized);

    const next = scalarOutput(1);
    expect(stream.nextInto(101, next)).toBe(true);
    const expected = appendScalar(initialized, next[0]);
    expect(stream.historyLength).toBe(expected.length);
    expectSeriesClose(stream.history(), expected);

    const reusable = scalarOutput(stream.historyLength);
    expect(stream.historyInto(reusable)).toBe(reusable);
    expectSeriesClose(reusable, expected);
    expect(() => stream.historyInto(scalarOutput(expected.length - 1))).toThrow(
      /expected/,
    );

    initialized[0] = -1;
    expect(Number.isNaN(stream.history()[0])).toBe(true);
    stream.reset();
    expect(stream.historyLength).toBe(0);
    expect(stream.history()).toHaveLength(0);

    const macd = new api.MacdStream({
      fastPeriod: 3,
      slowPeriod: 6,
      signalPeriod: 3,
      signalType: "ema",
    });
    const initializedMacd = macdOutput(fixture.prices.values.length);
    macd.init(fixture.prices, initializedMacd);
    const nextMacd = macdOutput(1);
    expect(macd.nextInto(101, nextMacd)).toBe(true);
    const macdHistory = macd.history();
    expect(macd.historyLength).toBe(macdHistory.macd.length);
    expectSeriesClose(
      macdHistory.macd,
      appendScalar(initializedMacd.macd, nextMacd.macd[0]),
    );
    expectSeriesClose(
      macdHistory.signal,
      appendScalar(initializedMacd.signal, nextMacd.signal[0]),
    );
    expectSeriesClose(
      macdHistory.histogram,
      appendScalar(initializedMacd.histogram, nextMacd.histogram[0]),
    );

    const reusableMacd = macdOutput(macdHistory.macd.length);
    expect(macd.historyInto(reusableMacd)).toBe(reusableMacd);
    expectSeriesClose(reusableMacd.macd, macdHistory.macd);
    expectSeriesClose(reusableMacd.signal, macdHistory.signal);
    expectSeriesClose(reusableMacd.histogram, macdHistory.histogram);
  });

  it("rejects obsolete inputs and malformed boundary data", () => {
    const fixture = makeFixture(8);
    const arrayInput = [1, 2, 3] as unknown as api.PriceSeries;

    expect(() =>
      api.sma(arrayInput, { period: 2 }, scalarOutput(3)),
    ).toThrow(TypeError);
    expect(() =>
      api.atr(
        {
          high: fixture.hlc.high,
          low: fixture.hlc.low.subarray(0, 3),
          close: fixture.hlc.close,
        },
        { period: 2 },
        scalarOutput(8),
      ),
    ).toThrow(/length/);
    expect(() =>
      api.sma(
        { values: new Float64Array([1, Number.NaN]) },
        { period: 2 },
        scalarOutput(2),
      ),
    ).toThrow(/finite/);
    expect(() =>
      api.sessionVwap({
        ...fixture.timestamped,
        timestamp: Float64Array.from([0.5, ...fixture.timestamped.timestamp.slice(1)]),
      }, scalarOutput(fixture.timestamped.timestamp.length)),
    ).toThrow(/safe integer/);
    expect(() =>
      api.frvp(
        {
          high: new Float64Array([1]),
          low: new Float64Array([2]),
          volume: new Float64Array([1]),
        },
        { numBins: 2, valueAreaPercent: 0.7 },
      ),
    ).toThrow(/greater than or equal/);
    expect(() =>
      api.sma(
        fixture.prices,
        { period: 0 },
        scalarOutput(fixture.prices.values.length),
      ),
    ).toThrow(RangeError);
    expect(() =>
      api.macd(fixture.prices, {
        fastPeriod: 3,
        slowPeriod: 8,
        signalPeriod: 4,
        signalType: "invalid" as "ema",
      }, macdOutput(fixture.prices.values.length)),
    ).toThrow(/signalType/);
    expect(() =>
      api.anchoredVwap(
        fixture.timestamped,
        { anchorIndex: 99 },
        scalarOutput(fixture.timestamped.timestamp.length),
      ),
    ).toThrow(/anchorIndex/);

    expect(Object.prototype.hasOwnProperty.call(api, "toFloat64Array")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(api, "extractOHLCV")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(api, "stochFast")).toBe(false);
    expect("stream" in api.sma).toBe(false);
    expect("free" in new api.SmaStream({ period: 2 })).toBe(false);
  });

  it("keeps analyze typed and backend-independent", () => {
    const fixture = makeFixture();
    const result = api.analyze(fixture.prices, {
      sma: (series) =>
        api.sma(series, { period: 5 }, scalarOutput(series.values.length)),
      rsi: (series) =>
        api.rsi(series, { period: 5 }, scalarOutput(series.values.length)),
    });

    expectSeriesClose(
      result.sma,
      api.sma(
        fixture.prices,
        { period: 5 },
        scalarOutput(fixture.prices.values.length),
      ),
    );
    expectSeriesClose(
      result.rsi,
      api.rsi(
        fixture.prices,
        { period: 5 },
        scalarOutput(fixture.prices.values.length),
      ),
    );
  });
});
