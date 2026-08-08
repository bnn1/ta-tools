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

describe("native-backed TypeScript API", () => {
  it("routes every batch family through the native surface", () => {
    const fixture = makeFixture();
    const period = { period: 5 };

    expectSeriesClose(
      api.sma(fixture.prices, period),
      native.sma(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.ema(fixture.prices, period),
      native.ema(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.wma(fixture.prices, period),
      native.wma(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.rsi(fixture.prices, period),
      native.rsi(fixture.prices.values, 5),
    );
    expectSeriesClose(
      api.hma(fixture.prices, { period: 7 }),
      native.hma(fixture.prices.values, 7),
    );
    expectSeriesClose(
      api.cvd(fixture.prices),
      native.cvd(fixture.prices.values),
    );

    const macdOptions = {
      fastPeriod: 3,
      slowPeriod: 8,
      signalPeriod: 4,
      signalType: "ema" as const,
    };
    const macd = api.macd(fixture.prices, macdOptions);
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

    const bbands = api.bbands(fixture.prices, { period: 5, k: 2 });
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
    const stoch = api.stoch(fixture.hlc, stochOptions);
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
    const stochRsi = api.stochRsi(fixture.prices, stochRsiOptions);
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
      api.atr(fixture.hlc, period),
      native.atr(fixture.hlc.high, fixture.hlc.low, fixture.hlc.close, 5),
    );
    expectSeriesClose(
      api.mfi(fixture.hlcv, period),
      native.mfi(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
        5,
      ),
    );
    expectSeriesClose(
      api.cvdOhlcv(fixture.hlcv),
      native.cvdOhlcv(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
      ),
    );

    const adx = api.adx(fixture.hlc, period);
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
    const ichimoku = api.ichimoku(fixture.hlc, ichimokuOptions);
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
    const linreg = api.linreg(fixture.prices, linregOptions);
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
      api.sessionVwap(fixture.timestamped),
      native.sessionVwap(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
      ),
    );
    expectSeriesClose(
      api.rollingVwap(fixture.timestamped, period),
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
      api.anchoredVwap(fixture.timestamped, { anchorIndex: 7 }),
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
      api.anchoredVwapFromTimestamp(fixture.timestamped, {
        anchorTimestamp: fixture.timestamped.timestamp[7],
      }),
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
    const pivotBatch = api.pivotPointsBatch(fixture.hlc, pivotOptions);
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
      smaStream.init(fixture.prices),
      native.sma(fixture.prices.values, 3),
    );
    smaStream.reset();
    expect(smaStream.isReady()).toBe(false);

    expectSeriesClose(
      new api.EmaStream({ period: 5 }).init(fixture.prices),
      new native.EmaStream(5).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.WmaStream({ period: 5 }).init(fixture.prices),
      new native.WmaStream(5).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.RsiStream({ period: 5 }).init(fixture.prices),
      new native.RsiStream(5).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.HmaStream({ period: 7 }).init(fixture.prices),
      new native.HmaStream(7).init(fixture.prices.values),
    );
    expectSeriesClose(
      new api.CvdStream().init(fixture.prices),
      new native.CvdStream().init(fixture.prices.values),
    );

    const macdOptions = {
      fastPeriod: 3,
      slowPeriod: 8,
      signalPeriod: 4,
      signalType: "ema" as const,
    };
    expectPointArrays(
      new api.MacdStream(macdOptions).init(fixture.prices),
      new native.MacdStream(
        macdOptions.fastPeriod,
        macdOptions.slowPeriod,
        macdOptions.signalPeriod,
        macdOptions.signalType,
      ).init(fixture.prices.values),
    );
    expectPointArrays(
      new api.BBandsStream({ period: 5, k: 2 }).init(fixture.prices),
      new native.BBandsStream(5, 2).init(fixture.prices.values),
    );
    expectPointArrays(
      new api.StochStream({
        type: "slow",
        kPeriod: 5,
        dPeriod: 3,
        slowing: 3,
      }).init(fixture.hlc),
      new native.StochStream(5, 3, 3, "slow").init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectPointArrays(
      new api.StochRsiStream({
        rsiPeriod: 5,
        stochPeriod: 5,
        kSmooth: 3,
        dPeriod: 3,
      }).init(fixture.prices),
      new native.StochRsiStream(5, 5, 3, 3).init(fixture.prices.values),
    );
    expectPointArrays(
      new api.AdxStream({ period: 5 }).init(fixture.hlc),
      new native.AdxStream(5).init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectPointArrays(
      new api.IchimokuStream({
        tenkanPeriod: 3,
        kijunPeriod: 5,
        senkouBPeriod: 8,
      }).init(fixture.hlc),
      new native.IchimokuStream(3, 5, 8).init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectPointArrays(
      new api.LinRegStream({ period: 5, numStdDev: 2 }).init(fixture.prices),
      new native.LinRegStream(5, 2).init(fixture.prices.values),
    );

    expectSeriesClose(
      new api.AtrStream({ period: 5 }).init(fixture.hlc),
      new native.AtrStream(5).init(
        fixture.hlc.high,
        fixture.hlc.low,
        fixture.hlc.close,
      ),
    );
    expectSeriesClose(
      new api.MfiStream({ period: 5 }).init(fixture.hlcv),
      new native.MfiStream(5).init(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
      ),
    );
    expectSeriesClose(
      new api.CvdOhlcvStream().init(fixture.hlcv),
      new native.CvdOhlcvStream().init(
        fixture.hlcv.high,
        fixture.hlcv.low,
        fixture.hlcv.close,
        fixture.hlcv.volume,
      ),
    );
    expectSeriesClose(
      new api.SessionVwapStream().init(fixture.timestamped),
      new native.SessionVwapStream().init(
        fixture.timestamped.timestamp,
        fixture.timestamped.high,
        fixture.timestamped.low,
        fixture.timestamped.close,
        fixture.timestamped.volume,
      ),
    );
    expectSeriesClose(
      new api.RollingVwapStream({ period: 5 }).init(fixture.timestamped),
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

  it("rejects obsolete inputs and malformed boundary data", () => {
    const fixture = makeFixture(8);
    const arrayInput = [1, 2, 3] as unknown as api.PriceSeries;

    expect(() => api.sma(arrayInput, { period: 2 })).toThrow(TypeError);
    expect(() =>
      api.atr(
        {
          high: fixture.hlc.high,
          low: fixture.hlc.low.subarray(0, 3),
          close: fixture.hlc.close,
        },
        { period: 2 },
      ),
    ).toThrow(/length/);
    expect(() =>
      api.sma({ values: new Float64Array([1, Number.NaN]) }, { period: 2 }),
    ).toThrow(/finite/);
    expect(() =>
      api.sessionVwap({
        ...fixture.timestamped,
        timestamp: Float64Array.from([0.5, ...fixture.timestamped.timestamp.slice(1)]),
      }),
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
    expect(() => api.sma(fixture.prices, { period: 0 })).toThrow(RangeError);
    expect(() =>
      api.macd(fixture.prices, {
        fastPeriod: 3,
        slowPeriod: 8,
        signalPeriod: 4,
        signalType: "invalid" as "ema",
      }),
    ).toThrow(/signalType/);
    expect(() =>
      api.anchoredVwap(fixture.timestamped, { anchorIndex: 99 }),
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
      sma: (series) => api.sma(series, { period: 5 }),
      rsi: (series) => api.rsi(series, { period: 5 }),
    });

    expectSeriesClose(result.sma, api.sma(fixture.prices, { period: 5 }));
    expectSeriesClose(result.rsi, api.rsi(fixture.prices, { period: 5 }));
  });
});
