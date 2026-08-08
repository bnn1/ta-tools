import { bench, describe } from "vitest";
import {
  FrvpStream,
  MacdStream,
  SmaStream,
  atr,
  frvp,
  macd,
  sessionVwap,
  sma,
} from "../dist/index.js";

function makeFixture(length: number): {
  prices: { values: Float64Array };
  hlc: { high: Float64Array; low: Float64Array; close: Float64Array };
  timestamped: {
    timestamp: Float64Array;
    high: Float64Array;
    low: Float64Array;
    close: Float64Array;
    volume: Float64Array;
  };
  frvp: { high: Float64Array; low: Float64Array; volume: Float64Array };
} {
  const prices = Float64Array.from(
    { length },
    (_, index) => 100 + index * 0.01 + Math.sin(index / 17),
  );
  const high = Float64Array.from(prices, (value) => value + 1);
  const low = Float64Array.from(prices, (value) => value - 1);
  const volume = Float64Array.from(
    { length },
    (_, index) => 1_000 + (index % 100),
  );
  const timestamp = Float64Array.from(
    { length },
    (_, index) => index * 60_000,
  );

  return {
    prices: { values: prices },
    hlc: { high, low, close: prices },
    timestamped: { timestamp, high, low, close: prices, volume },
    frvp: { high, low, volume },
  };
}

const fixture = makeFixture(100_000);

describe("native-backed batch indicators", () => {
  bench("SMA · 100k values", () => {
    sma(fixture.prices, { period: 14 });
  });

  bench("MACD · 100k values", () => {
    macd(fixture.prices, {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      signalType: "ema",
    });
  });

  bench("ATR · 100k bars", () => {
    atr(fixture.hlc, { period: 14 });
  });

  bench("Session VWAP · 100k bars", () => {
    sessionVwap(fixture.timestamped);
  });

  bench("FRVP · 100k bars / 100 bins", () => {
    frvp(fixture.frvp, { numBins: 100, valueAreaPercent: 0.7 });
  });
});

describe("native-backed streaming indicators", () => {
  const smaStream = new SmaStream({ period: 14 });
  smaStream.init(fixture.prices);
  bench("SMA · single next", () => {
    smaStream.next(101);
  });

  const macdStream = new MacdStream({
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    signalType: "ema",
  });
  macdStream.init(fixture.prices);
  bench("MACD · single next", () => {
    macdStream.next(101);
  });

  const frvpStream = new FrvpStream({
    numBins: 100,
    valueAreaPercent: 0.7,
  });
  frvpStream.init(fixture.frvp);
  bench("FRVP · single next", () => {
    frvpStream.next({ high: 102, low: 100, volume: 1_000 });
  });
});
