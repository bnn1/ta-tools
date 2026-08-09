import { describe, expect, it } from "vitest";
import * as native from "../native/index.js";

function expectSeries(value: Float64Array, length: number): void {
  expect(value).toBeInstanceOf(Float64Array);
  expect(value).toHaveLength(length);
}

function makeInput(length = 64): {
  prices: Float64Array;
  highs: Float64Array;
  lows: Float64Array;
  closes: Float64Array;
  volumes: Float64Array;
  timestamps: Float64Array;
} {
  const prices = Float64Array.from(
    { length },
    (_, index) => 100 + index * 0.35 + Math.sin(index / 3),
  );
  const highs = Float64Array.from(
    prices,
    (value, index) => value + 1.5 + (index % 3) * 0.1,
  );
  const lows = Float64Array.from(
    prices,
    (value, index) => value - 1.5 - (index % 2) * 0.1,
  );
  const closes = Float64Array.from(prices);
  const volumes = Float64Array.from(
    { length },
    (_, index) => 1_000 + index * 17,
  );
  const timestamps = Float64Array.from(
    { length },
    (_, index) => index * 60_000,
  );

  return { prices, highs, lows, closes, volumes, timestamps };
}

describe("native binding surface", () => {
  it("exposes scalar and structured batch outputs", () => {
    const { prices, highs, lows, closes, volumes } = makeInput();
    const length = prices.length;

    for (const result of [
      native.sma(prices, 5),
      native.ema(prices, 5),
      native.wma(prices, 5),
      native.rsi(prices, 5),
      native.hma(prices, 7),
      native.cvd(volumes),
      native.atr(highs, lows, closes, 5),
      native.mfi(highs, lows, closes, volumes, 5),
      native.cvdOhlcv(highs, lows, closes, volumes),
    ]) {
      expectSeries(result, length);
    }

    const macd = native.macd(prices, 3, 8, 4);
    expectSeries(macd.macd, length);
    expectSeries(macd.signal, length);
    expectSeries(macd.histogram, length);

    const bbands = native.bbands(prices, 5, 2);
    expectSeries(bbands.upper, length);
    expectSeries(bbands.middle, length);
    expectSeries(bbands.lower, length);
    expectSeries(bbands.percentB, length);
    expectSeries(bbands.bandwidth, length);

    const stochFast = native.stochFast(highs, lows, closes, 5, 3);
    const stochSlow = native.stochSlow(highs, lows, closes, 5, 3, 3);
    const stochRsi = native.stochRsi(prices, 5, 5, 3, 3);
    for (const result of [stochFast, stochSlow, stochRsi]) {
      expectSeries(result.k, length);
      expectSeries(result.d, length);
    }

    const adx = native.adx(highs, lows, closes, 5);
    expectSeries(adx.adx, length);
    expectSeries(adx.plusDi, length);
    expectSeries(adx.minusDi, length);

    const ichimoku = native.ichimoku(highs, lows, closes, 3, 5, 8);
    expectSeries(ichimoku.tenkanSen, length);
    expectSeries(ichimoku.kijunSen, length);
    expectSeries(ichimoku.senkouSpanA, length);
    expectSeries(ichimoku.senkouSpanB, length);
    expectSeries(ichimoku.chikouSpan, length);

    const linreg = native.linreg(prices, 5, 2);
    expectSeries(linreg.value, length);
    expectSeries(linreg.upper, length);
    expectSeries(linreg.lower, length);
    expectSeries(linreg.slope, length);
    expectSeries(linreg.r, length);
    expectSeries(linreg.rSquared, length);
  });

  it("exposes VWAP, pivot, and FRVP batch outputs", () => {
    const { highs, lows, closes, volumes, timestamps } = makeInput();
    const length = highs.length;

    for (const result of [
      native.sessionVwap(timestamps, highs, lows, closes, volumes),
      native.rollingVwap(timestamps, highs, lows, closes, volumes, 5),
      native.anchoredVwap(timestamps, highs, lows, closes, volumes, 7),
      native.anchoredVwapFromTimestamp(
        timestamps,
        highs,
        lows,
        closes,
        volumes,
        timestamps[7],
      ),
    ]) {
      expectSeries(result, length);
    }

    const pivot = native.pivotPoints(110, 100, 105, "classic");
    expect(pivot).toEqual({
      pivot: expect.any(Number),
      r1: expect.any(Number),
      r2: expect.any(Number),
      r3: expect.any(Number),
      s1: expect.any(Number),
      s2: expect.any(Number),
      s3: expect.any(Number),
    });

    const pivotBatch = native.pivotPointsBatch(highs, lows, closes, "fib");
    for (const result of [
      pivotBatch.pivot,
      pivotBatch.r1,
      pivotBatch.r2,
      pivotBatch.r3,
      pivotBatch.s1,
      pivotBatch.s2,
      pivotBatch.s3,
    ]) {
      expectSeries(result, length);
    }

    const profile = native.frvp(highs, lows, volumes, 12, 0.7);
    expect(profile.histogram.prices).toHaveLength(12);
    expect(profile.histogram.volumes).toHaveLength(12);
    expect(profile.histogram.lows).toHaveLength(12);
    expect(profile.histogram.highs).toHaveLength(12);
    expect(Number.isFinite(profile.totalVolume)).toBe(true);
  });

  it("exposes native stream initialization and reset behavior", () => {
    const { prices, highs, lows, closes, volumes, timestamps } = makeInput();

    expectSeries(new native.SmaStream(5).init(prices), prices.length);
    expectSeries(new native.EmaStream(5).init(prices), prices.length);
    expectSeries(new native.WmaStream(5).init(prices), prices.length);
    expectSeries(new native.RsiStream(5).init(prices), prices.length);
    expectSeries(new native.HmaStream(7).init(prices), prices.length);
    expectSeries(new native.CvdStream().init(volumes), prices.length);
    expectSeries(
      new native.AtrStream(5).init(highs, lows, closes),
      prices.length,
    );
    expectSeries(
      new native.MfiStream(5).init(highs, lows, closes, volumes),
      prices.length,
    );
    expectSeries(
      new native.CvdOhlcvStream().init(highs, lows, closes, volumes),
      prices.length,
    );

    const macd = new native.MacdStream(3, 8, 4).init(prices);
    expect(macd).toHaveLength(prices.length);
    expect(macd[0]).toEqual({
      macd: expect.any(Number),
      signal: expect.any(Number),
      histogram: expect.any(Number),
    });

    const bbands = new native.BBandsStream(5, 2).init(prices);
    expect(bbands).toHaveLength(prices.length);
    expect(bbands[0]).toEqual({
      upper: expect.any(Number),
      middle: expect.any(Number),
      lower: expect.any(Number),
      percentB: expect.any(Number),
      bandwidth: expect.any(Number),
    });

    const stoch = new native.StochSlowStream(5, 3, 3).init(
      highs,
      lows,
      closes,
    );
    expect(stoch).toHaveLength(prices.length);
    expect(stoch[0]).toEqual({ k: expect.any(Number), d: expect.any(Number) });

    const stochRsi = new native.StochRsiStream(5, 5, 3, 3).init(prices);
    expect(stochRsi).toHaveLength(prices.length);
    expect(stochRsi[0]).toEqual({ k: expect.any(Number), d: expect.any(Number) });

    const adx = new native.AdxStream(5).init(highs, lows, closes);
    expect(adx).toHaveLength(prices.length);
    expect(adx[0]).toEqual({
      adx: expect.any(Number),
      plusDi: expect.any(Number),
      minusDi: expect.any(Number),
    });

    const ichimoku = new native.IchimokuStream(3, 5, 8).init(
      highs,
      lows,
      closes,
    );
    expect(ichimoku).toHaveLength(prices.length);
    expect(ichimoku[0]).toEqual({
      tenkanSen: expect.any(Number),
      kijunSen: expect.any(Number),
      senkouSpanA: expect.any(Number),
      senkouSpanB: expect.any(Number),
      chikouSpan: expect.any(Number),
    });

    const linreg = new native.LinRegStream(5, 2).init(prices);
    expect(linreg).toHaveLength(prices.length);
    expect(linreg[0]).toEqual({
      value: expect.any(Number),
      upper: expect.any(Number),
      lower: expect.any(Number),
      slope: expect.any(Number),
      r: expect.any(Number),
      rSquared: expect.any(Number),
    });

    expectSeries(
      new native.SessionVwapStream().init(
        timestamps,
        highs,
        lows,
        closes,
        volumes,
      ),
      prices.length,
    );
    expectSeries(
      new native.RollingVwapStream(5).init(
        timestamps,
        highs,
        lows,
        closes,
        volumes,
      ),
      prices.length,
    );
    expectSeries(
      new native.AnchoredVwapStream().init(
        timestamps,
        highs,
        lows,
        closes,
        volumes,
      ),
      prices.length,
    );

    const profile = new native.FrvpStream(12).init(highs, lows, volumes);
    expect(profile).not.toBeNull();

    const stream = new native.SmaStream(3);
    expect(stream.next(1)).toBeNull();
    expect(stream.next(2)).toBeNull();
    expect(stream.next(3)).toBe(2);
    expect(stream.isReady()).toBe(true);
    stream.reset();
    expect(stream.isReady()).toBe(false);
    expect("free" in stream).toBe(false);
  });

  it("rejects invalid native-boundary inputs", () => {
    const { prices, highs, lows, closes, volumes } = makeInput(4);

    expect(() => native.atr(highs, lows.subarray(0, 3), closes, 2)).toThrow(
      /length/,
    );
    expect(() => native.ema(new Float64Array([1, Number.NaN]), 2)).toThrow(
      /finite/,
    );
    expect(() =>
      native.sessionVwap(
        Float64Array.from([0, 0.5]),
        highs.subarray(0, 2),
        lows.subarray(0, 2),
        closes.subarray(0, 2),
        volumes.subarray(0, 2),
      ),
    ).toThrow(/timestamps/);
    expect(() =>
      native.frvp(
        new Float64Array([1]),
        new Float64Array([2]),
        new Float64Array([1]),
      ),
    ).toThrow(/greater than or equal/);
    expect(() => native.pivotPoints(1, 0, 0.5, "unknown")).toThrow(/variant/);
    expect(() =>
      native.stoch(highs, lows, closes, 2, 2, 3, "unknown"),
    ).toThrow(/stochType/);
    expect(() => native.sma(prices, 0)).toThrow(/Invalid parameter/);
    expect(() => native.smaInto(prices, 2, new Float64Array(2))).toThrow(
      /expected/,
    );
    expect(() => native.smaInto(prices, 2, prices)).toThrow(/overlaps input/);

    const stream = new native.SessionVwapStream();
    expect(stream.current()).toBeNull();
    expect(stream.next(0, 2, 1, 1.5, 10)).toBeCloseTo(1.5, 11);
    stream.reset();
    expect(stream.current()).toBeNull();
    expect("free" in stream).toBe(false);
  });
});
