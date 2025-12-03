import { bench, describe } from 'vitest';
import { sma, ema, rsi, SmaStream, EmaStream, RsiStream } from '../dist/index.js';
import {
  sma as ftiSma,
  ema as ftiEma,
  rsi as ftiRsi,
  SMA as FtiSmaStream,
  EMA as FtiEmaStream,
  RSI as FtiRsiStream,
} from 'fast-technical-indicators';

// Generate test data
const generatePrices = (count: number): number[] => {
  const prices: number[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    price += (Math.random() - 0.5) * 2;
    prices.push(price);
  }
  return prices;
};

const SMALL_DATA = generatePrices(100);
const MEDIUM_DATA = generatePrices(1_000);
const LARGE_DATA = generatePrices(10_000);
const XLARGE_DATA = generatePrices(100_000);

const SMALL_F64 = new Float64Array(SMALL_DATA);
const MEDIUM_F64 = new Float64Array(MEDIUM_DATA);
const LARGE_F64 = new Float64Array(LARGE_DATA);
const XLARGE_F64 = new Float64Array(XLARGE_DATA);

describe('SMA Batch Performance', () => {
  describe('Small dataset (100 items)', () => {
    bench('ta-tools (WASM)', () => {
      sma(SMALL_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiSma({ period: 14, values: SMALL_DATA });
    });
  });

  describe('Medium dataset (1,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      sma(MEDIUM_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiSma({ period: 14, values: MEDIUM_DATA });
    });
  });

  describe('Large dataset (10,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      sma(LARGE_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiSma({ period: 14, values: LARGE_DATA });
    });
  });

  describe('XLarge dataset (100,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      sma(XLARGE_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiSma({ period: 14, values: XLARGE_DATA });
    });
  });
});

describe('EMA Batch Performance', () => {
  describe('Large dataset (10,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      ema(LARGE_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiEma({ period: 14, values: LARGE_DATA });
    });
  });

  describe('XLarge dataset (100,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      ema(XLARGE_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiEma({ period: 14, values: XLARGE_DATA });
    });
  });
});

describe('RSI Batch Performance', () => {
  describe('Large dataset (10,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      rsi(LARGE_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiRsi({ period: 14, values: LARGE_DATA });
    });
  });

  describe('XLarge dataset (100,000 items)', () => {
    bench('ta-tools (WASM)', () => {
      rsi(XLARGE_F64, 14);
    });

    bench('fast-technical-indicators', () => {
      ftiRsi({ period: 14, values: XLARGE_DATA });
    });
  });
});

describe('Streaming Performance (O(1) verification)', () => {
  describe('SMA Streaming - single next() call', () => {
    const taStream = new SmaStream(14);
    taStream.init(LARGE_F64);

    const ftiStream = new FtiSmaStream({ period: 14, values: LARGE_DATA });

    bench('ta-tools (WASM)', () => {
      taStream.next(100.5);
    });

    bench('fast-technical-indicators', () => {
      ftiStream.nextValue(100.5);
    });
  });

  describe('EMA Streaming - single next() call', () => {
    const taStream = new EmaStream(14);
    taStream.init(LARGE_F64);

    const ftiStream = new FtiEmaStream({ period: 14, values: LARGE_DATA });

    bench('ta-tools (WASM)', () => {
      taStream.next(100.5);
    });

    bench('fast-technical-indicators', () => {
      ftiStream.nextValue(100.5);
    });
  });

  describe('RSI Streaming - single next() call', () => {
    const taStream = new RsiStream(14);
    taStream.init(LARGE_F64);

    const ftiStream = new FtiRsiStream({ period: 14, values: LARGE_DATA });

    bench('ta-tools (WASM)', () => {
      taStream.next(100.5);
    });

    bench('fast-technical-indicators', () => {
      ftiStream.nextValue(100.5);
    });
  });
});
