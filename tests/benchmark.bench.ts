import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { bench, describe } from "vitest";
import * as napi from "../dist/index.js";
import {
  ADX as SignalsAdx,
  ATR as SignalsAtr,
  BollingerBands as SignalsBollingerBands,
  EMA as SignalsEma,
  HMA as SignalsHma,
  LinearRegression as SignalsLinearRegression,
  MACD as SignalsMacd,
  MFI as SignalsMfi,
  RSI as SignalsRsi,
  SMA as SignalsSma,
  StochasticOscillator as SignalsStochastic,
  StochasticRSI as SignalsStochasticRsi,
  VWAP as SignalsVwap,
  WMA as SignalsWma,
} from "trading-signals";

const require = createRequire(import.meta.url);
const fast = require("fast-technical-indicators") as typeof import("fast-technical-indicators");
const indicatorTs = require("indicatorts") as typeof import("indicatorts");

interface WasmPriceStream {
  init(data: Float64Array): unknown;
  next(value: number): unknown;
}

interface WasmHlcStream {
  init(high: Float64Array, low: Float64Array, close: Float64Array): unknown;
  next(high: number, low: number, close: number): unknown;
}

interface WasmHlcvStream {
  init(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
  ): unknown;
  next(high: number, low: number, close: number, volume: number): unknown;
}

interface WasmTimestampedStream {
  init(
    timestamp: Float64Array,
    open: Float64Array,
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
  ): unknown;
  next(
    timestamp: number,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
  ): unknown;
}

interface WasmAnchoredStream extends WasmTimestampedStream {}

interface WasmFrvpStream {
  init(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
  ): unknown;
  next(high: number, low: number, close: number, volume: number): unknown;
}

interface WasmLibrary {
  init(): void;
  sma(data: Float64Array, period: number): unknown;
  ema(data: Float64Array, period: number): unknown;
  wma(data: Float64Array, period: number): unknown;
  rsi(data: Float64Array, period: number): unknown;
  hma(data: Float64Array, period: number): unknown;
  cvd(data: Float64Array): unknown;
  macd(
    data: Float64Array,
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number,
  ): unknown;
  bbands(data: Float64Array, period: number, k: number): unknown;
  stochFast(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    kPeriod: number,
    dPeriod: number,
  ): unknown;
  stochSlow(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    kPeriod: number,
    dPeriod: number,
    slowing: number,
  ): unknown;
  stochRsi(
    data: Float64Array,
    rsiPeriod: number,
    stochPeriod: number,
    kSmooth: number,
    dPeriod: number,
  ): unknown;
  atr(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    period: number,
  ): unknown;
  mfi(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
    period: number,
  ): unknown;
  cvdOhlcv(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
  ): unknown;
  adx(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    period: number,
  ): unknown;
  ichimoku(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    tenkanPeriod: number,
    kijunPeriod: number,
    senkouBPeriod: number,
  ): unknown;
  linreg(data: Float64Array, period: number, numStdDev?: number): unknown;
  sessionVwap(
    timestamp: Float64Array,
    open: Float64Array,
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
  ): unknown;
  rollingVwap(
    timestamp: Float64Array,
    open: Float64Array,
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
    period: number,
  ): unknown;
  anchoredVwap(
    timestamp: Float64Array,
    open: Float64Array,
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
    anchorIndex: number,
  ): unknown;
  anchoredVwapFromTimestamp(
    timestamp: Float64Array,
    open: Float64Array,
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
    anchorTimestamp: number,
  ): unknown;
  pivotPointsBatch(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    variant: string,
  ): unknown;
  pivotPoints(high: number, low: number, close: number, variant: string): unknown;
  frvp(
    high: Float64Array,
    low: Float64Array,
    close: Float64Array,
    volume: Float64Array,
    numBins?: number,
    valueAreaPercent?: number,
  ): unknown;
  SmaStream: new (period: number) => WasmPriceStream;
  EmaStream: new (period: number) => WasmPriceStream;
  WmaStream: new (period: number) => WasmPriceStream;
  RsiStream: new (period: number) => WasmPriceStream;
  HmaStream: new (period: number) => WasmPriceStream;
  CvdStream: new () => WasmPriceStream;
  MacdStream: new (
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number,
  ) => WasmPriceStream;
  BBandsStream: new (period: number, k: number) => WasmPriceStream;
  StochFastStream: new (kPeriod: number, dPeriod: number) => WasmHlcStream;
  StochSlowStream: new (
    kPeriod: number,
    dPeriod: number,
    slowing: number,
  ) => WasmHlcStream;
  StochRsiStream: new (
    rsiPeriod: number,
    stochPeriod: number,
    kSmooth: number,
    dPeriod: number,
  ) => WasmPriceStream;
  AtrStream: new (period: number) => WasmHlcStream;
  MfiStream: new (period: number) => WasmHlcvStream;
  CvdOhlcvStream: new () => WasmHlcvStream;
  AdxStream: new (period: number) => WasmHlcStream;
  IchimokuStream: new (
    tenkanPeriod: number,
    kijunPeriod: number,
    senkouBPeriod: number,
  ) => WasmHlcStream;
  LinRegStream: new (period: number, numStdDev?: number) => WasmPriceStream;
  SessionVwapStream: new () => WasmTimestampedStream;
  RollingVwapStream: new (period: number) => WasmTimestampedStream;
  AnchoredVwapStream: {
    new (): WasmAnchoredStream;
    withAnchor(anchorTimestamp: number): WasmAnchoredStream;
  };
  FrvpStream: new (
    numBins: number,
    valueAreaPercent?: number,
  ) => WasmFrvpStream;
}

const wasm = require("./wasm-loader.cjs") as WasmLibrary;
wasm.init();

interface Dataset {
  label: string;
  size: number;
  prices: { values: Float64Array };
  priceValues: number[];
  hlc: { high: Float64Array; low: Float64Array; close: Float64Array };
  highValues: number[];
  lowValues: number[];
  closeValues: number[];
  hlcv: {
    high: Float64Array;
    low: Float64Array;
    close: Float64Array;
    volume: Float64Array;
  };
  volumeValues: number[];
  timestamped: {
    timestamp: Float64Array;
    high: Float64Array;
    low: Float64Array;
    close: Float64Array;
    volume: Float64Array;
  };
  open: Float64Array;
  timestamps: Float64Array;
  candles: Array<{ high: number; low: number; close: number }>;
  volumeCandles: Array<{
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  anchorIndex: number;
  anchorTimestamp: number;
}

function makeDataset(size: number): Dataset {
  const prices = Float64Array.from(
    { length: size },
    (_, index) => 100 + index * 0.01 + Math.sin(index / 17),
  );
  const high = Float64Array.from(
    prices,
    (value, index) => value + 1 + (index % 3) * 0.05,
  );
  const low = Float64Array.from(
    prices,
    (value, index) => value - 1 - (index % 2) * 0.05,
  );
  const volume = Float64Array.from(
    { length: size },
    (_, index) => 1_000 + (index % 100),
  );
  const timestamp = Float64Array.from(
    { length: size },
    (_, index) => 1_704_067_200_000 + index * 500,
  );
  const open = Float64Array.from(prices, (value) => value - 0.1);
  const priceValues = Array.from(prices);
  const highValues = Array.from(high);
  const lowValues = Array.from(low);
  const closeValues = priceValues.slice();
  const volumeValues = Array.from(volume);
  const candles = highValues.map((value, index) => ({
    high: value,
    low: lowValues[index],
    close: closeValues[index],
  }));
  const volumeCandles = candles.map((candle, index) => ({
    ...candle,
    volume: volumeValues[index],
  }));
  const anchorIndex = Math.floor(size / 2);

  return {
    label: `${size / 1_000}k`,
    size,
    prices: { values: prices },
    priceValues,
    hlc: { high, low, close: prices },
    highValues,
    lowValues,
    closeValues,
    hlcv: { high, low, close: prices, volume },
    volumeValues,
    timestamped: {
      timestamp,
      high,
      low,
      close: prices,
      volume,
    },
    open,
    timestamps: timestamp,
    candles,
    volumeCandles,
    anchorIndex,
    anchorTimestamp: timestamp[anchorIndex],
  };
}

const datasets = [makeDataset(1_000), makeDataset(10_000), makeDataset(100_000)];

type BenchmarkOperation = readonly [name: string, operation: () => void];

const PREFLIGHT_ENV = "TA_TOOLS_BENCH_PREFLIGHT";
const HARD_TIMEOUT_MS = 5_000;
const HARD_CAP_OPTIONS = {
  // Tinybench always runs at least `iterations`; the child preflight is the hard cap.
  time: 0,
  iterations: 1,
  warmupTime: 0,
  warmupIterations: 0,
} as const;
const preflightMode = process.env[PREFLIGHT_ENV] !== undefined;
const preflightCases = new Map<string, readonly BenchmarkOperation[]>();

interface BatchCase {
  indicator: string;
  dataset: Dataset;
  operations: readonly BenchmarkOperation[];
}

const batchCases: BatchCase[] = [];

interface PreflightRequest {
  indicator: string;
  datasetLabel: string;
  library: string;
}

interface PreflightResult {
  status: "passed" | "timed-out" | "failed";
  label?: string;
}

function preflightKey(indicator: string, datasetLabel: string): string {
  return `${indicator}::${datasetLabel}`;
}

function preflightOperationKey(
  indicator: string,
  datasetLabel: string,
  library: string,
): string {
  return `${preflightKey(indicator, datasetLabel)}::${library}`;
}

function parsePreflightRequest(raw: string): PreflightRequest {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null) {
    throw new Error("Benchmark preflight request must be an object");
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.indicator !== "string" ||
    typeof record.datasetLabel !== "string" ||
    typeof record.library !== "string"
  ) {
    throw new Error("Benchmark preflight request has invalid fields");
  }

  return {
    indicator: record.indicator,
    datasetLabel: record.datasetLabel,
    library: record.library,
  };
}

function runPreflight(): never {
  const rawRequest = process.env[PREFLIGHT_ENV];
  if (!rawRequest) {
    throw new Error("Benchmark preflight mode requires a request");
  }

  const request = parsePreflightRequest(rawRequest);
  const operations = preflightCases.get(
    preflightKey(request.indicator, request.datasetLabel),
  );
  if (!operations) {
    throw new Error(
      `No benchmark preflight case found for ${request.indicator} ${request.datasetLabel}`,
    );
  }

  const operation = operations.find(([name]) => name === request.library);
  if (!operation) {
    throw new Error(
      `No benchmark preflight library found for ${request.indicator} ${request.datasetLabel}: ${request.library}`,
    );
  }

  operation[1]();
  process.exit(0);
}

function preflightFailureLabel(
  stderr: string,
  status: number | null,
  signal: string | null,
): string {
  const detail =
    stderr.split("\n").find((line) => line.includes("Error")) ??
    (signal ? `signal ${signal}` : `exit status ${status}`);
  return `FAILED during preflight (${detail.trim()})`;
}

function runPreflightChild(
  indicator: string,
  dataset: Dataset,
  library: string,
): Promise<PreflightResult> {
  return new Promise((resolve) => {
    const child = spawn(
    process.execPath,
    ["--experimental-strip-types", fileURLToPath(import.meta.url)],
    {
      env: {
        ...process.env,
        [PREFLIGHT_ENV]: JSON.stringify({
          indicator,
          datasetLabel: dataset.label,
          library,
        }),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
    );
    let stderr = "";
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = (result: PreflightResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", (error: Error) => {
      finish({
        status: "failed",
        label: `FAILED during preflight (${error.message})`,
      });
    });
    child.once("exit", (status, signal) => {
      if (status === 0) {
        finish({ status: "passed" });
        return;
      }

      finish({
        status: "failed",
        label: preflightFailureLabel(stderr, status, signal),
      });
    });

    timeout = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ status: "timed-out", label: "TIMED OUT (>5s)" });
    }, HARD_TIMEOUT_MS);
  });
}

async function preflightLargeBatchCases(
  cases: readonly BatchCase[],
): Promise<Map<string, string>> {
  const pending = cases.flatMap((batchCase) =>
    batchCase.dataset.size === 100_000
      ? batchCase.operations.map(([library]) => ({
          ...batchCase,
          library,
        }))
      : [],
  );
  const skips = new Map<string, string>();
  const concurrency = Math.min(4, pending.length);
  let next = 0;

  process.stderr.write(
    `[bench] preflighting ${pending.length} 100k batch cases with a 5s watchdog...\n`,
  );

  async function worker(): Promise<void> {
    while (next < pending.length) {
      const index = next;
      next += 1;
      const item = pending[index];
      const result = await runPreflightChild(
        item.indicator,
        item.dataset,
        item.library,
      );
      if (result.status !== "passed" && result.label) {
        skips.set(
          preflightOperationKey(item.indicator, item.dataset.label, item.library),
          result.label,
        );
        process.stderr.write(
          `[bench] batch · ${item.indicator} · ${item.dataset.label} · ${item.library}: ${result.label}\n`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, () => worker()),
  );
  return skips;
}

function measure(operation: () => unknown): () => void {
  return () => {
    void operation();
  };
}

function registerBatch(
  indicator: string,
  build: (dataset: Dataset) => readonly BenchmarkOperation[],
): void {
  for (const dataset of datasets) {
    const operations = build(dataset);
    if (preflightMode) {
      preflightCases.set(preflightKey(indicator, dataset.label), operations);
      continue;
    }
    batchCases.push({ indicator, dataset, operations });
  }
}

function registerBatchSuites(
  cases: readonly BatchCase[],
  preflightSkips: ReadonlyMap<string, string>,
): void {
  for (const { indicator, dataset, operations } of cases) {
    describe(`batch · ${indicator} · ${dataset.label} values`, () => {
      for (const [name, operation] of operations) {
        const skipReason = preflightSkips.get(
          preflightOperationKey(indicator, dataset.label, name),
        );
        if (skipReason) {
          bench.skip(`${name} · ${skipReason}`, operation);
        } else if (dataset.size === 100_000) {
          bench(name, operation, HARD_CAP_OPTIONS);
        } else {
          bench(name, operation);
        }
      }
    });
  }
}

interface SignalIndicator<Input> {
  updates(inputs: readonly Input[], replace?: boolean): unknown;
  add(input: Input): unknown;
}

function signalBatch<Input>(
  factory: () => SignalIndicator<Input>,
  inputs: readonly Input[],
): void {
  void factory().updates(inputs);
}

function primeSignal<Input>(
  indicator: SignalIndicator<Input>,
  inputs: readonly Input[],
): void {
  void indicator.updates(inputs);
}

function signalMacd(): SignalIndicator<number> {
  return new SignalsMacd(
    new SignalsEma(12),
    new SignalsEma(26),
    new SignalsEma(9),
  );
}

const priceBatch = (
  native: (dataset: Dataset) => unknown,
  wasmOperation: (dataset: Dataset) => unknown,
  fastOperation?: (dataset: Dataset) => unknown,
  indicatortsOperation?: (dataset: Dataset) => unknown,
  signalsFactory?: () => SignalIndicator<number>,
): ((dataset: Dataset) => readonly BenchmarkOperation[]) => {
  return (dataset) => {
    const operations: BenchmarkOperation[] = [
      ["ta-tools (NAPI)", measure(() => native(dataset))],
      ["ta-tools (WASM)", measure(() => wasmOperation(dataset))],
    ];
    if (fastOperation) {
      operations.push(["fast-technical-indicators", measure(() => fastOperation(dataset))]);
    }
    if (indicatortsOperation) {
      operations.push(["indicatorts", measure(() => indicatortsOperation(dataset))]);
    }
    if (signalsFactory) {
      operations.push([
        "trading-signals",
        measure(() => signalBatch(signalsFactory, dataset.priceValues)),
      ]);
    }
    return operations;
  };
};

registerBatch(
  "SMA",
  priceBatch(
    (d) => napi.sma(d.prices, { period: 14 }),
    (d) => wasm.sma(d.prices.values, 14),
    (d) => fast.sma({ period: 14, values: d.priceValues }),
    (d) => indicatorTs.sma(d.priceValues, { period: 14 }),
    () => new SignalsSma(14),
  ),
);

registerBatch(
  "EMA",
  priceBatch(
    (d) => napi.ema(d.prices, { period: 14 }),
    (d) => wasm.ema(d.prices.values, 14),
    (d) => fast.ema({ period: 14, values: d.priceValues }),
    (d) => indicatorTs.ema(d.priceValues, { period: 14 }),
    () => new SignalsEma(14),
  ),
);

registerBatch(
  "WMA",
  priceBatch(
    (d) => napi.wma(d.prices, { period: 14 }),
    (d) => wasm.wma(d.prices.values, 14),
    (d) => fast.wma({ period: 14, values: d.priceValues }),
    undefined,
    () => new SignalsWma(14),
  ),
);

registerBatch(
  "RSI",
  priceBatch(
    (d) => napi.rsi(d.prices, { period: 14 }),
    (d) => wasm.rsi(d.prices.values, 14),
    (d) => fast.rsi({ period: 14, values: d.priceValues }),
    (d) => indicatorTs.rsi(d.priceValues, { period: 14 }),
    () => new SignalsRsi(14),
  ),
);

registerBatch(
  "HMA",
  priceBatch(
    (d) => napi.hma(d.prices, { period: 14 }),
    (d) => wasm.hma(d.prices.values, 14),
    undefined,
    undefined,
    () => new SignalsHma(14),
  ),
);

registerBatch("CVD", (dataset) => [
  ["ta-tools (NAPI)", measure(() => napi.cvd(dataset.prices))],
  ["ta-tools (WASM)", measure(() => wasm.cvd(dataset.prices.values))],
]);

registerBatch("MACD · EMA signal", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() =>
      napi.macd(d.prices, {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        signalType: "ema",
      }),
    ),
  ],
  ["ta-tools (WASM)", measure(() => wasm.macd(d.prices.values, 12, 26, 9))],
  [
    "fast-technical-indicators",
    measure(() =>
      fast.macd({
        values: d.priceValues,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      }),
    ),
  ],
  [
    "indicatorts",
    measure(() => indicatorTs.macd(d.priceValues, { fast: 12, slow: 26, signal: 9 })),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(signalMacd, d.priceValues)),
  ],
]);

registerBatch("MACD · SMA signal", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() =>
      napi.macd(d.prices, {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        signalType: "sma",
      }),
    ),
  ],
  [
    "fast-technical-indicators",
    measure(() =>
      fast.macd({
        values: d.priceValues,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: true,
      }),
    ),
  ],
]);

registerBatch(
  "Bollinger Bands",
  priceBatch(
    (d) => napi.bbands(d.prices, { period: 20, k: 2 }),
    (d) => wasm.bbands(d.prices.values, 20, 2),
    (d) => fast.bollingerbands({ period: 20, stdDev: 2, values: d.priceValues }),
    (d) => indicatorTs.bb(d.priceValues, { period: 20 }),
    () => new SignalsBollingerBands(20, 2),
  ),
);

registerBatch("Stochastic · fast", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() => napi.stoch(d.hlc, { type: "fast", kPeriod: 14, dPeriod: 3 })),
  ],
  [
    "ta-tools (WASM)",
    measure(() => wasm.stochFast(d.hlc.high, d.hlc.low, d.hlc.close, 14, 3)),
  ],
  [
    "fast-technical-indicators",
    measure(() =>
      fast.stochastic({
        period: 14,
        signalPeriod: 3,
        high: d.highValues,
        low: d.lowValues,
        close: d.closeValues,
      }),
    ),
  ],
  [
    "indicatorts",
    measure(() =>
      indicatorTs.stoch(d.highValues, d.lowValues, d.closeValues, {
        kPeriod: 14,
        dPeriod: 3,
      }),
    ),
  ],
  [
    "trading-signals",
    measure(() =>
      signalBatch(
        () =>
          new SignalsStochastic({
            kPeriod: 14,
            dPeriod: 3,
            kSlowingPeriod: 1,
          }),
        d.candles,
      ),
    ),
  ],
]);

registerBatch("Stochastic · slow", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() =>
      napi.stoch(d.hlc, {
        type: "slow",
        kPeriod: 14,
        dPeriod: 3,
        slowing: 3,
      }),
    ),
  ],
  [
    "ta-tools (WASM)",
    measure(() => wasm.stochSlow(d.hlc.high, d.hlc.low, d.hlc.close, 14, 3, 3)),
  ],
  [
    "trading-signals",
    measure(() =>
      signalBatch(
        () =>
          new SignalsStochastic({
            kPeriod: 14,
            dPeriod: 3,
            kSlowingPeriod: 3,
          }),
        d.candles,
      ),
    ),
  ],
]);

registerBatch("Stochastic RSI", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() =>
      napi.stochRsi(d.prices, {
        rsiPeriod: 14,
        stochPeriod: 14,
        kSmooth: 3,
        dPeriod: 3,
      }),
    ),
  ],
  [
    "ta-tools (WASM)",
    measure(() => wasm.stochRsi(d.prices.values, 14, 14, 3, 3)),
  ],
  [
    "fast-technical-indicators",
    measure(() =>
      fast.stochasticrsi({
        values: d.priceValues,
        rsiPeriod: 14,
        stochasticPeriod: 14,
        kPeriod: 3,
        dPeriod: 3,
      }),
    ),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(() => new SignalsStochasticRsi(14), d.priceValues)),
  ],
]);

registerBatch("ATR", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.atr(d.hlc, { period: 14 }))],
  ["ta-tools (WASM)", measure(() => wasm.atr(d.hlc.high, d.hlc.low, d.hlc.close, 14))],
  [
    "fast-technical-indicators",
    measure(() => fast.atr({ period: 14, high: d.highValues, low: d.lowValues, close: d.closeValues })),
  ],
  [
    "indicatorts",
    measure(() => indicatorTs.atr(d.highValues, d.lowValues, d.closeValues, { period: 14 })),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(() => new SignalsAtr(14), d.candles)),
  ],
]);

registerBatch("MFI", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.mfi(d.hlcv, { period: 14 }))],
  [
    "ta-tools (WASM)",
    measure(() => wasm.mfi(d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume, 14)),
  ],
  [
    "fast-technical-indicators",
    measure(() =>
      fast.mfi({
        period: 14,
        high: d.highValues,
        low: d.lowValues,
        close: d.closeValues,
        volume: d.volumeValues,
      }),
    ),
  ],
  [
    "indicatorts",
    measure(() =>
      indicatorTs.mfi(d.highValues, d.lowValues, d.closeValues, d.volumeValues, {
        period: 14,
      }),
    ),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(() => new SignalsMfi(14), d.volumeCandles)),
  ],
]);

registerBatch("CVD · OHLCV", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.cvdOhlcv(d.hlcv))],
  [
    "ta-tools (WASM)",
    measure(() => wasm.cvdOhlcv(d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume)),
  ],
]);

registerBatch("ADX", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.adx(d.hlc, { period: 14 }))],
  ["ta-tools (WASM)", measure(() => wasm.adx(d.hlc.high, d.hlc.low, d.hlc.close, 14))],
  [
    "fast-technical-indicators",
    measure(() => fast.adx({ period: 14, high: d.highValues, low: d.lowValues, close: d.closeValues })),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(() => new SignalsAdx(14), d.candles)),
  ],
]);

registerBatch("Ichimoku", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() =>
      napi.ichimoku(d.hlc, {
        tenkanPeriod: 9,
        kijunPeriod: 26,
        senkouBPeriod: 52,
      }),
    ),
  ],
  [
    "ta-tools (WASM)",
    measure(() => wasm.ichimoku(d.hlc.high, d.hlc.low, d.hlc.close, 9, 26, 52)),
  ],
  [
    "fast-technical-indicators",
    measure(() =>
      fast.ichimokukinkouhyou({
        high: d.highValues,
        low: d.lowValues,
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
      }),
    ),
  ],
  [
    "indicatorts",
    measure(() =>
      indicatorTs.ichimokuCloud(d.highValues, d.lowValues, d.closeValues, {
        short: 9,
        medium: 26,
        long: 52,
        close: 26,
      }),
    ),
  ],
]);

registerBatch("Linear Regression", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.linreg(d.prices, { period: 14, numStdDev: 2 }))],
  ["ta-tools (WASM)", measure(() => wasm.linreg(d.prices.values, 14, 2))],
  [
    "fast-technical-indicators",
    measure(() => fast.linearregression({ period: 14, values: d.priceValues })),
  ],
  [
    "indicatorts · moving least square",
    measure(() =>
      indicatorTs.movingLinearRegressionUsingLeastSquare(
        14,
        Array.from({ length: d.size }, (_, index) => index),
        d.priceValues,
      ),
    ),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(() => new SignalsLinearRegression(14), d.priceValues)),
  ],
]);

registerBatch("Session VWAP · one session", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.sessionVwap(d.timestamped))],
  [
    "ta-tools (WASM)",
    measure(() =>
      wasm.sessionVwap(
        d.timestamps,
        d.open,
        d.hlc.high,
        d.hlc.low,
        d.hlc.close,
        d.hlcv.volume,
      ),
    ),
  ],
  [
    "fast-technical-indicators",
    measure(() => fast.vwap({ high: d.highValues, low: d.lowValues, close: d.closeValues, volume: d.volumeValues })),
  ],
  [
    "indicatorts · close/volume VWAP",
    measure(() => indicatorTs.vwap(d.closeValues, d.volumeValues, { period: d.size })),
  ],
  [
    "trading-signals",
    measure(() => signalBatch(() => new SignalsVwap(), d.volumeCandles)),
  ],
]);

registerBatch("Rolling VWAP", (d) => [
  ["ta-tools (NAPI)", measure(() => napi.rollingVwap(d.timestamped, { period: 14 }))],
  [
    "ta-tools (WASM)",
    measure(() =>
      wasm.rollingVwap(
        d.timestamps,
        d.open,
        d.hlc.high,
        d.hlc.low,
        d.hlc.close,
        d.hlcv.volume,
        14,
      ),
    ),
  ],
  [
    "indicatorts · close/volume rolling",
    measure(() => indicatorTs.vwap(d.closeValues, d.volumeValues, { period: 14 })),
  ],
]);

registerBatch("Anchored VWAP · index", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() => napi.anchoredVwap(d.timestamped, { anchorIndex: d.anchorIndex })),
  ],
  [
    "ta-tools (WASM)",
    measure(() =>
      wasm.anchoredVwap(
        d.timestamps,
        d.open,
        d.hlc.high,
        d.hlc.low,
        d.hlc.close,
        d.hlcv.volume,
        d.anchorIndex,
      ),
    ),
  ],
]);

registerBatch("Anchored VWAP · timestamp", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() =>
      napi.anchoredVwapFromTimestamp(d.timestamped, {
        anchorTimestamp: d.anchorTimestamp,
      }),
    ),
  ],
  [
    "ta-tools (WASM)",
    measure(() =>
      wasm.anchoredVwapFromTimestamp(
        d.timestamps,
        d.open,
        d.hlc.high,
        d.hlc.low,
        d.hlc.close,
        d.hlcv.volume,
        d.anchorTimestamp,
      ),
    ),
  ],
]);

for (const variant of ["standard", "fibonacci", "woodie"] as const) {
  registerBatch(`Pivot Points Batch · ${variant}`, (d) => [
    [
      "ta-tools (NAPI)",
      measure(() => napi.pivotPointsBatch(d.hlc, { variant })),
    ],
    [
      "ta-tools (WASM)",
      measure(() => wasm.pivotPointsBatch(d.hlc.high, d.hlc.low, d.hlc.close, variant)),
    ],
    [
      "fast-technical-indicators",
      measure(() =>
        fast.pivotpoints({
          high: d.highValues,
          low: d.lowValues,
          close: d.closeValues,
          type: variant,
        }),
      ),
    ],
  ]);
}

registerBatch("FRVP · 100 bins", (d) => [
  [
    "ta-tools (NAPI)",
    measure(() => napi.frvp(d.hlcv, { numBins: 100, valueAreaPercent: 0.7 })),
  ],
  [
    "ta-tools (WASM)",
    measure(() => wasm.frvp(d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume, 100, 0.7)),
  ],
  [
    "fast-technical-indicators · volumeprofile",
    measure(() =>
      fast.volumeprofile({
        open: Array.from(d.open),
        high: d.highValues,
        low: d.lowValues,
        close: d.closeValues,
        volume: d.volumeValues,
        noOfBars: 100,
      }),
    ),
  ],
]);

if (preflightMode) {
  runPreflight();
}

const preflightSkips = await preflightLargeBatchCases(batchCases);
registerBatchSuites(batchCases, preflightSkips);

if (!preflightMode) {
  describe("scalar · Pivot Points", () => {
    for (const variant of ["standard", "fibonacci", "woodie"] as const) {
      bench(`ta-tools (NAPI) · ${variant}`, () => {
        void napi.pivotPoints({ high: 102, low: 100, close: 101 }, { variant });
      });
      bench(`ta-tools (WASM) · ${variant}`, () => {
        void wasm.pivotPoints(102, 100, 101, variant);
      });
    }
  });
}

function registerStreaming(
  indicator: string,
  build: (dataset: Dataset) => readonly BenchmarkOperation[],
): void {
  if (preflightMode) {
    return;
  }

  for (const dataset of datasets) {
    describe(`streaming · ${indicator} · initialized with ${dataset.label}`, () => {
      for (const [name, operation] of build(dataset)) {
        if (dataset.size === 100_000) {
          bench(name, operation, HARD_CAP_OPTIONS);
        } else {
          bench(name, operation);
        }
      }
    });
  }
}

function nativePriceStream(
  dataset: Dataset,
  create: () => { init(series: { values: Float64Array }): unknown; next(value: number): unknown },
): { stream: ReturnType<typeof create>; next: () => unknown } {
  const stream = create();
  stream.init(dataset.prices);
  return { stream, next: () => stream.next(101) };
}

function nativeHlcStream(
  dataset: Dataset,
  create: () => { init(series: Dataset["hlc"]): unknown; next(bar: { high: number; low: number; close: number }): unknown },
): { stream: ReturnType<typeof create>; next: () => unknown } {
  const stream = create();
  stream.init(dataset.hlc);
  return {
    stream,
    next: () => stream.next({ high: 102, low: 100, close: 101 }),
  };
}

function nativeHlcvStream(
  dataset: Dataset,
  create: () => {
    init(series: Dataset["hlcv"]): unknown;
    next(bar: { high: number; low: number; close: number; volume: number }): unknown;
  },
): { stream: ReturnType<typeof create>; next: () => unknown } {
  const stream = create();
  stream.init(dataset.hlcv);
  return {
    stream,
    next: () => stream.next({ high: 102, low: 100, close: 101, volume: 1_000 }),
  };
}

function signalPriceStream<Input>(
  factory: () => SignalIndicator<Input>,
  inputs: readonly Input[],
  next: Input,
): () => unknown {
  const indicator = factory();
  primeSignal(indicator, inputs);
  return () => indicator.add(next);
}

registerStreaming("SMA", (d) => {
  const native = nativePriceStream(d, () => new napi.SmaStream({ period: 14 }));
  const old = new wasm.SmaStream(14);
  old.init(d.prices.values);
  const fastStream = new fast.SMA({ period: 14, values: d.priceValues });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(signalPriceStream(() => new SignalsSma(14), d.priceValues, 101))],
  ];
});

registerStreaming("EMA", (d) => {
  const native = nativePriceStream(d, () => new napi.EmaStream({ period: 14 }));
  const old = new wasm.EmaStream(14);
  old.init(d.prices.values);
  const fastStream = new fast.EMA({ period: 14, values: d.priceValues });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(signalPriceStream(() => new SignalsEma(14), d.priceValues, 101))],
  ];
});

registerStreaming("WMA", (d) => {
  const native = nativePriceStream(d, () => new napi.WmaStream({ period: 14 }));
  const old = new wasm.WmaStream(14);
  old.init(d.prices.values);
  const fastStream = new fast.WMA({ period: 14, values: d.priceValues });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(signalPriceStream(() => new SignalsWma(14), d.priceValues, 101))],
  ];
});

registerStreaming("RSI", (d) => {
  const native = nativePriceStream(d, () => new napi.RsiStream({ period: 14 }));
  const old = new wasm.RsiStream(14);
  old.init(d.prices.values);
  const fastStream = new fast.RSI({ period: 14, values: d.priceValues });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(signalPriceStream(() => new SignalsRsi(14), d.priceValues, 101))],
  ];
});

registerStreaming("HMA", (d) => {
  const native = nativePriceStream(d, () => new napi.HmaStream({ period: 14 }));
  const old = new wasm.HmaStream(14);
  old.init(d.prices.values);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["trading-signals", measure(signalPriceStream(() => new SignalsHma(14), d.priceValues, 101))],
  ];
});

registerStreaming("CVD", (d) => {
  const native = nativePriceStream(d, () => new napi.CvdStream());
  const old = new wasm.CvdStream();
  old.init(d.prices.values);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
  ];
});

registerStreaming("MACD · EMA signal", (d) => {
  const native = nativePriceStream(d, () =>
    new napi.MacdStream({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      signalType: "ema",
    }),
  );
  const old = new wasm.MacdStream(12, 26, 9);
  old.init(d.prices.values);
  const fastStream = new fast.MACD({
    values: d.priceValues,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(signalPriceStream(signalMacd, d.priceValues, 101))],
  ];
});

registerStreaming("MACD · SMA signal", (d) => {
  const native = nativePriceStream(d, () =>
    new napi.MacdStream({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      signalType: "sma",
    }),
  );
  const fastStream = new fast.MACD({
    values: d.priceValues,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: true,
  });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
  ];
});

registerStreaming("Bollinger Bands", (d) => {
  const native = nativePriceStream(d, () => new napi.BBandsStream({ period: 20, k: 2 }));
  const old = new wasm.BBandsStream(20, 2);
  old.init(d.prices.values);
  const fastStream = new fast.BollingerBands({ period: 20, stdDev: 2, values: d.priceValues });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(signalPriceStream(() => new SignalsBollingerBands(20, 2), d.priceValues, 101))],
  ];
});

registerStreaming("Stochastic · fast", (d) => {
  const native = nativeHlcStream(d, () => new napi.StochStream({ type: "fast", kPeriod: 14, dPeriod: 3 }));
  const old = new wasm.StochFastStream(14, 3);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close);
  const fastStream = new fast.Stochastic({
    period: 14,
    signalPeriod: 3,
    high: d.highValues,
    low: d.lowValues,
    close: d.closeValues,
  });
  const signalsStream = new SignalsStochastic({ kPeriod: 14, dPeriod: 3, kSlowingPeriod: 1 });
  primeSignal(signalsStream, d.candles);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(102, 100, 101))],
    ["trading-signals", measure(() => signalsStream.add({ high: 102, low: 100, close: 101 }))],
  ];
});

registerStreaming("Stochastic · slow", (d) => {
  const native = nativeHlcStream(d, () => new napi.StochStream({ type: "slow", kPeriod: 14, dPeriod: 3, slowing: 3 }));
  const old = new wasm.StochSlowStream(14, 3, 3);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close);
  const signalsStream = new SignalsStochastic({ kPeriod: 14, dPeriod: 3, kSlowingPeriod: 3 });
  primeSignal(signalsStream, d.candles);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101))],
    ["trading-signals", measure(() => signalsStream.add({ high: 102, low: 100, close: 101 }))],
  ];
});

registerStreaming("Stochastic RSI", (d) => {
  const native = nativePriceStream(d, () => new napi.StochRsiStream({ rsiPeriod: 14, stochPeriod: 14, kSmooth: 3, dPeriod: 3 }));
  const old = new wasm.StochRsiStream(14, 14, 3, 3);
  old.init(d.prices.values);
  const fastStream = new fast.StochasticRSI({
    values: d.priceValues,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3,
  });
  const signalsStream = new SignalsStochasticRsi(14);
  primeSignal(signalsStream, d.priceValues);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(() => signalsStream.add(101))],
  ];
});

registerStreaming("ATR", (d) => {
  const native = nativeHlcStream(d, () => new napi.AtrStream({ period: 14 }));
  const old = new wasm.AtrStream(14);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close);
  const fastStream = new fast.ATR({ period: 14, high: d.highValues, low: d.lowValues, close: d.closeValues });
  const signalsStream = new SignalsAtr(14);
  primeSignal(signalsStream, d.candles);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(102, 100, 101))],
    ["trading-signals", measure(() => signalsStream.add({ high: 102, low: 100, close: 101 }))],
  ];
});

registerStreaming("MFI", (d) => {
  const native = nativeHlcvStream(d, () => new napi.MfiStream({ period: 14 }));
  const old = new wasm.MfiStream(14);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume);
  const fastStream = new fast.MFI({ period: 14, high: d.highValues, low: d.lowValues, close: d.closeValues, volume: d.volumeValues });
  const signalsStream = new SignalsMfi(14);
  primeSignal(signalsStream, d.volumeCandles);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101, 1_000))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(102, 100, 101, 1_000))],
    ["trading-signals", measure(() => signalsStream.add({ high: 102, low: 100, close: 101, volume: 1_000 }))],
  ];
});

registerStreaming("CVD · OHLCV", (d) => {
  const native = nativeHlcvStream(d, () => new napi.CvdOhlcvStream());
  const old = new wasm.CvdOhlcvStream();
  old.init(d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101, 1_000))],
  ];
});

registerStreaming("ADX", (d) => {
  const native = nativeHlcStream(d, () => new napi.AdxStream({ period: 14 }));
  const old = new wasm.AdxStream(14);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close);
  const fastStream = new fast.ADX({ period: 14, high: d.highValues, low: d.lowValues, close: d.closeValues });
  const signalsStream = new SignalsAdx(14);
  primeSignal(signalsStream, d.candles);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(102, 100, 101))],
    ["trading-signals", measure(() => signalsStream.add({ high: 102, low: 100, close: 101 }))],
  ];
});

registerStreaming("Ichimoku", (d) => {
  const native = nativeHlcStream(d, () => new napi.IchimokuStream({ tenkanPeriod: 9, kijunPeriod: 26, senkouBPeriod: 52 }));
  const old = new wasm.IchimokuStream(9, 26, 52);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close);
  const fastStream = new fast.IchimokuCloud({
    high: d.highValues,
    low: d.lowValues,
    conversionPeriod: 9,
    basePeriod: 26,
    spanPeriod: 52,
    displacement: 26,
  });
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(102, 100))],
  ];
});

registerStreaming("Linear Regression", (d) => {
  const native = nativePriceStream(d, () => new napi.LinRegStream({ period: 14, numStdDev: 2 }));
  const old = new wasm.LinRegStream(14, 2);
  old.init(d.prices.values);
  const fastStream = new fast.LinearRegression({ period: 14, values: d.priceValues });
  const signalsStream = new SignalsLinearRegression(14);
  primeSignal(signalsStream, d.priceValues);
  return [
    ["ta-tools (NAPI)", measure(native.next)],
    ["ta-tools (WASM)", measure(() => old.next(101))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(101))],
    ["trading-signals", measure(() => signalsStream.add(101))],
  ];
});

registerStreaming("Session VWAP", (d) => {
  const native = new napi.SessionVwapStream();
  native.init(d.timestamped);
  const old = new wasm.SessionVwapStream();
  old.init(d.timestamps, d.open, d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume);
  const fastStream = new fast.VWAP({ high: d.highValues, low: d.lowValues, close: d.closeValues, volume: d.volumeValues });
  const signalsStream = new SignalsVwap();
  primeSignal(signalsStream, d.volumeCandles);
  return [
    ["ta-tools (NAPI)", measure(() => native.next({ timestamp: d.timestamps[d.size - 1] + 500, high: 102, low: 100, close: 101, volume: 1_000 }))],
    ["ta-tools (WASM)", measure(() => old.next(d.timestamps[d.size - 1] + 500, 100.9, 102, 100, 101, 1_000))],
    ["fast-technical-indicators", measure(() => fastStream.nextValue(102, 100, 101, 1_000))],
    ["trading-signals", measure(() => signalsStream.add({ high: 102, low: 100, close: 101, volume: 1_000 }))],
  ];
});

registerStreaming("Rolling VWAP", (d) => {
  const native = new napi.RollingVwapStream({ period: 14 });
  native.init(d.timestamped);
  const old = new wasm.RollingVwapStream(14);
  old.init(d.timestamps, d.open, d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume);
  return [
    ["ta-tools (NAPI)", measure(() => native.next({ timestamp: d.timestamps[d.size - 1] + 500, high: 102, low: 100, close: 101, volume: 1_000 }))],
    ["ta-tools (WASM)", measure(() => old.next(d.timestamps[d.size - 1] + 500, 100.9, 102, 100, 101, 1_000))],
  ];
});

registerStreaming("Anchored VWAP", (d) => {
  const native = new napi.AnchoredVwapStream({ anchorTimestamp: d.anchorTimestamp });
  native.init(d.timestamped);
  const old = wasm.AnchoredVwapStream.withAnchor(d.anchorTimestamp);
  old.init(d.timestamps, d.open, d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume);
  return [
    ["ta-tools (NAPI)", measure(() => native.next({ timestamp: d.timestamps[d.size - 1] + 500, high: 102, low: 100, close: 101, volume: 1_000 }))],
    ["ta-tools (WASM)", measure(() => old.next(d.timestamps[d.size - 1] + 500, 100.9, 102, 100, 101, 1_000))],
  ];
});

registerStreaming("FRVP · append/recalculate", (d) => {
  const native = new napi.FrvpStream({ numBins: 100, valueAreaPercent: 0.7 });
  native.init({ high: d.hlc.high, low: d.hlc.low, volume: d.hlcv.volume });
  const old = new wasm.FrvpStream(100, 0.7);
  old.init(d.hlc.high, d.hlc.low, d.hlc.close, d.hlcv.volume);
  return [
    ["ta-tools (NAPI)", measure(() => native.next({ high: 102, low: 100, volume: 1_000 }))],
    ["ta-tools (WASM)", measure(() => old.next(102, 100, 101, 1_000))],
  ];
});
