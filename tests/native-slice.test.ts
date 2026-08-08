import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SmaStream as NativeSmaStream,
  macd as nativeMacd,
  sma as nativeSma,
} from "../native/index.js";
import { SmaStream } from "../dist/index.js";

describe("native vertical slice", () => {
  it("loads the ESM binding and returns typed SMA output", () => {
    const data = new Float64Array([1, 2, 4, 8, 16, 32]);
    const result = nativeSma(data, 3);

    expect(result).toBeInstanceOf(Float64Array);
    expect(result).toHaveLength(data.length);
    expect(result[2]).toBe(7 / 3);
  });

  it("returns structured typed-array MACD output", () => {
    const data = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = nativeMacd(data, 2, 4, 2);

    expect(result.macd).toBeInstanceOf(Float64Array);
    expect(result.signal).toBeInstanceOf(Float64Array);
    expect(result.histogram).toBeInstanceOf(Float64Array);
    expect(result.macd).toHaveLength(data.length);
    expect(result.signal).toHaveLength(data.length);
    expect(result.histogram).toHaveLength(data.length);
  });

  it("accepts only Float64Array inputs and maps Rust errors explicitly", () => {
    const numberArray = [1, 2, 3] as unknown as Float64Array;

    expect(() => nativeSma(numberArray, 2)).toThrow();
    expect(() => nativeSma(new Float64Array([1, Number.NaN]), 2)).toThrow(
      /data\[1\] must be finite/,
    );
    expect(() => nativeSma(new Float64Array([1, 2]), 0)).toThrow(
      /Invalid parameter/,
    );
    expect(() => nativeMacd(new Float64Array([1, 2]), 4, 2, 2)).toThrow(
      /Invalid parameter/,
    );

    const stream = new NativeSmaStream(2);
    expect(() => stream.next(Number.POSITIVE_INFINITY)).toThrow(
      /must be finite/,
    );
  });

  it("keeps native stream readiness and reset behavior explicit", () => {
    const stream = new NativeSmaStream(3);

    expect(stream.period).toBe(3);
    expect(stream.next(1)).toBeNull();
    expect(stream.next(2)).toBeNull();
    expect(stream.next(3)).toBe(2);
    expect(stream.isReady()).toBe(true);

    stream.reset();

    expect(stream.isReady()).toBe(false);
    expect(stream.next(1)).toBeNull();
    expect("free" in stream).toBe(false);
  });

  it("normalizes native unavailable values in the public facade", () => {
    const stream = new SmaStream({ period: 2 });

    expect(stream.next(1)).toBeUndefined();
    expect(stream.next(2)).toBe(1.5);
  });

  it("supports normal native ownership and garbage collection", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const stream = new NativeSmaStream(14);
      stream.init(
        new Float64Array([
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
        ]),
      );
    }

    const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
    gc?.();

    expect(nativeSma(new Float64Array([1, 2, 3]), 2).length).toBe(3);
  });

  it("keeps native implementation details out of public declarations", () => {
    const declaration = readFileSync(
      new URL("../dist/index.d.ts", import.meta.url),
      "utf8",
    );
    const bundle = readFileSync(
      new URL("../dist/index.js", import.meta.url),
      "utf8",
    );

    expect(declaration).toMatch(/declare class SmaStream/);
    expect(declaration).toMatch(/interface MacdOutput/);
    expect(declaration).not.toMatch(/NativeSmaStreamHandle|NativeMacdOutput/);
    expect(declaration).not.toContain("native/index");
    expect(bundle).toContain('from "../native/index.js"');
    expect(bundle).not.toContain("pkg/ta_core");
  });
});
