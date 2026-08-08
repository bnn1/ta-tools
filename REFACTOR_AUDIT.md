# Refactor Audit

Status: complete for the initial audit, native vertical slice, complete native binding surface, native-backed TypeScript API redesign, and WASM cutover. Platform publishing remains.

## Scope and evidence

- The workspace contains 18 indicator modules in `crates/ta-core`.
- `ta-core` has batch and streaming implementations for the retained indicator families.
- The former `crates/ta-core/src/wasm/bindings.rs` was a 3,089-line WASM conversion/export layer; it was removed during the cutover after parity verification.
- `js/index.ts` is a 1,007-line facade combining overload resolution, coercion, validation, backend calls, and public exports.
- Existing JavaScript integration tests import `dist/index.js`; `dist/` is build output and is not present in a clean checkout until a build runs.
- The generated WASM glue copies typed-array inputs into WASM memory. The existing zero-copy claim is therefore not established and must be removed or measured.

Initial baseline verification completed during the audit:

```text
cargo test -p ta-core --lib
168 passed, 0 failed
```

The Rust modules contain substantial unit coverage, including batch/stream parity, reset behavior, invalid parameters, and length checks in the applicable indicators. The JavaScript suite contains broad numerical integration coverage, and the first native-boundary contract now covers SMA, SmaStream, and MACD.

## Baseline characterization results

The characterization additions brought the Rust library baseline to:

```text
cargo test -p ta-core --lib
175 passed, 0 failed
```

`cargo fmt --all -- --check` also passes.

The added tests establish these behaviors:

| Area | Result | Classification |
| --- | --- | --- |
| Session VWAP at the Unix epoch boundary | A timestamp of `-1` ms and `0` ms are different UTC days | Corrected: `div_euclid` replaces truncating division |
| FRVP high/low/volume inputs | Non-finite used values are rejected | Corrected: returns `InvalidParameter` |
| FRVP candle range | `high < low` is rejected | Corrected: returns `InvalidParameter` |
| Session, rolling, and anchored VWAP streams | Readiness, `current()`, and reset behavior are explicit | Intentional baseline behavior |
| FRVP stream | Empty initialization, reinitialization, batch parity, reset, and post-reset updates are covered | Intentional baseline behavior |
| Leading unavailable batch values | VWAP stream initialization represents unavailable values as `NaN`, while `next()`/`current()` use `Option` | Intentional core behavior; native API should normalize this deliberately |

The existing per-indicator tests cover representative batch calculations and, for the retained streaming families, batch/stream parity, invalid parameters, empty or insufficient data, mismatched lengths where applicable, and reset or continuation behavior. The new anchored VWAP parity assertion closes the remaining VWAP batch/stream coverage gap.

### WASM performance and artifact baseline

An isolated release WASM build was measured on Node `v26.4.0`, Linux `x86_64`, using deterministic 100,000-element inputs. The generated WASM package was 392,279 bytes total:

| Artifact | Size |
| --- | ---: |
| `ta_core_bg.wasm` | 195,644 bytes |
| `ta_core.js` | 142,349 bytes |
| declarations and package metadata | 54,286 bytes |

The fresh-process loader measurement was 3.33 ms for `require()` plus WASM instantiation. Representative batch throughput was:

| Operation | Iterations | Mean per call | Calls per second |
| --- | ---: | ---: | ---: |
| SMA, 100k values | 50 | 0.586 ms | 1,705 |
| MACD, 100k values | 20 | 2.648 ms | 378 |
| Session VWAP, 100k candles | 20 | 1.916 ms | 522 |
| FRVP, 100k candles / 100 bins | 5 | 22.883 ms | 44 |

Process RSS was recorded during the run, but it is not a reliable isolated WASM-memory measurement because Node garbage collection and the generated glue allocations are included. The native migration must repeat the remaining cases with a deterministic harness and separately measure boundary-copy overhead.

### Current Vitest benchmark run

The current JavaScript-facing baseline was also run with:

```text
pnpm run bench
pnpm exec vitest bench --outputJson=benchmark-results.json
```

Environment: Node `v26.4.0`, Vitest `4.1.10`, tsup `8.5.1`, Linux `x86_64`. The benchmark generates random inputs, so exact values vary between runs. The complete report, including percentiles and competitor results, is recorded in [`benchmark-results.json`](./benchmark-results.json).

The following table records the `ta-tools (WASM)` mean for the 100,000-value batch and single-update stream cases from that run:

| Indicator | 100k batch | Streaming |
| --- | ---: | ---: |
| SMA | 2,420.99 ops/s · 0.4131 ms | 815,730.49 ops/s · 0.0012 ms |
| EMA | 2,713.35 ops/s · 0.3685 ms | 811,175.99 ops/s · 0.0012 ms |
| RSI | 745.27 ops/s · 1.3418 ms | 818,128.57 ops/s · 0.0012 ms |
| WMA | 2,496.66 ops/s · 0.4005 ms | 812,054.98 ops/s · 0.0012 ms |
| MACD | 443.42 ops/s · 2.2552 ms | 552,951.62 ops/s · 0.0018 ms |
| Bollinger Bands | 335.75 ops/s · 2.9784 ms | 546,925.36 ops/s · 0.0018 ms |
| ATR | 705.06 ops/s · 1.4183 ms | 789,881.82 ops/s · 0.0013 ms |
| Stochastic | 101.43 ops/s · 9.8587 ms | 532,112.52 ops/s · 0.0019 ms |
| MFI | 373.22 ops/s · 2.6794 ms | 752,696.83 ops/s · 0.0013 ms |
| ADX | 304.62 ops/s · 3.2828 ms | 513,789.48 ops/s · 0.0019 ms |
| StochRSI | 72.32 ops/s · 13.8283 ms | 475,495.02 ops/s · 0.0021 ms |
| HMA | 662.26 ops/s · 1.5100 ms | 760,512.93 ops/s · 0.0013 ms |
| Ichimoku | 22.39 ops/s · 44.6609 ms | 486,735.13 ops/s · 0.0021 ms |
| Linear Regression | 131.41 ops/s · 7.6099 ms | 505,468.19 ops/s · 0.0020 ms |
| Session VWAP | 537.76 ops/s · 1.8596 ms | 378,790.62 ops/s · 0.0026 ms |
| Rolling VWAP | 374.37 ops/s · 2.6712 ms | 392,661.71 ops/s · 0.0025 ms |
| Anchored VWAP | 500.23 ops/s · 1.9991 ms | — |
| CVD | 627.65 ops/s · 1.5933 ms | 760,989.56 ops/s · 0.0013 ms |
| Pivot Points (standard) | 186.64 ops/s · 5.3578 ms | — |
| FRVP | 305.57 ops/s · 3.2725 ms | 2,841.91 ops/s · 0.3519 ms |

The FRVP streaming case is an append-and-recalculate benchmark, not equivalent to the O(1) scalar stream cases. The current benchmark file does not include every stream class, notably anchored VWAP and pivot points, so those remain batch-only measurements here.

### Native vertical-slice benchmark

The first NAPI-RS slice was benchmarked with deterministic 100,000-value input using:

```text
pnpm exec vitest bench tests/native-slice.bench.ts --outputJson=native-benchmark-results.json
```

The complete report is recorded in [`native-benchmark-results.json`](./native-benchmark-results.json). These are direct native-versus-WASM calls in the same process; the native figures include Rust-to-JavaScript result conversion and allocation.

| Operation | NAPI-RS native | WASM |
| --- | ---: | ---: |
| SMA, 100k values | 1,887.79 ops/s · 0.5297 ms | 2,640.98 ops/s · 0.3786 ms |
| SMA, empty input | 531,875.66 ops/s · 0.0019 ms | 603,843.95 ops/s · 0.0017 ms |
| MACD, 100k values | 462.84 ops/s · 2.1606 ms | 445.32 ops/s · 2.2456 ms |
| SmaStream single update | 664,347.41 ops/s · 0.0015 ms | 764,127.29 ops/s · 0.0013 ms |

The SMA and stream results show measurable native boundary cost, while MACD is within the run's benchmark variance and slightly faster in this sample. These numbers are a comparison baseline, not a performance gate.

The generated ESM loader is kept external to the `tsup` bundle and loads the host native artifact under Node 26. NAPI-RS emits Rust `Option<f64>` as JavaScript `null`; the TypeScript facade normalizes stream readiness to `undefined`, while batch initialization preserves intentional `NaN` alignment.

The public facade consumes the complete native surface. The native-vs-WASM parity suite passed before the WASM runtime was removed; WASM is no longer part of the source tree or package contents.

### Complete native binding surface

Task 6 is implemented in `crates/ta-native` and verified with the generated NAPI-RS loader:

- scalar series: SMA, EMA, WMA, RSI, HMA, and direct-delta CVD, including streams;
- structured series: MACD (EMA/SMA signal modes), Bollinger Bands, Stochastic RSI, ADX, Ichimoku, and linear regression, including streams;
- HLC/HLCV families: ATR, fast/slow Stochastic, MFI, ADX, Ichimoku, and both CVD variants, including streams;
- timestamped VWAP: session, rolling, anchored-by-index, anchored-by-timestamp, and all three stream classes;
- pivot points and fixed-range volume profile with typed histogram columns and a minimal high/low/volume input;
- boundary checks for typed arrays, equal lengths, finite values, safe integer timestamps, invalid ranges, variants, and modes.

Before removal, the native surface test compared batch and stream initialization against the existing WASM implementations and found no numerical or behavioral differences. The retained native-only contract covers reset/readiness, invalid inputs, structured typed outputs, FRVP histogram shape, and the absence of WASM-style `free()` methods. Rust core coverage stands at 175 passing unit tests. NAPI-RS `Option<T>` intentionally appears as JavaScript `null` in the generated raw binding; the TypeScript facade normalizes that to `undefined` for stream consumers.

### Native-backed TypeScript facade

Task 7 is implemented in `js/` and verified with targeted Vitest coverage:

- Public inputs are typed records containing `Float64Array` columns: `PriceSeries`, `HlcSeries`, `HlcvSeries`, timestamped HLCV records, and minimal FRVP records.
- Every configurable batch and stream operation uses an options object. Stochastic modes are unified behind `stoch()` with an explicit `fast`/`slow` option.
- The public runtime routes through `native/index.js`; generated NAPI declarations remain private to the facade and the loader stays external to `tsup`.
- Stream classes are exported directly, accept typed records, return `undefined` before readiness, and do not expose `.free()` or function `.stream()` helpers.
- Positional overloads, `number[]`, `Candle[]`, implicit candle defaults, `toFloat64Array`, and `extractOHLCV` are removed.
- Boundary validation rejects non-`Float64Array` columns, mismatched lengths, non-finite values, unsafe timestamps, invalid options, invalid anchors, and invalid FRVP ranges.
- Canonical native output names are public, including `plusDi`, `minusDi`, `tenkanSen`, `senkouSpanA`, and linear-regression bands.

Verification completed with:

```text
pnpm run build:js
pnpm exec vitest run tests/integration.test.ts tests/native-slice.test.ts
pnpm exec vitest run tests/native-surface.test.ts
```

The targeted suite passed 15 tests across three files. The full legacy integration suite was replaced because it exercised the intentionally removed overload and WASM facade contract.

The updated native-facade benchmark also runs successfully on deterministic 100,000-element inputs. This smoke run measured 1,557.59 ops/s for SMA, 624.98 ops/s for MACD, 240.90 ops/s for session VWAP, and 411.54 ops/s for FRVP; these values include native boundary conversion and are recorded for comparison, not as performance gates.

### WASM cutover

Task 8 removed the retired WASM path after the native surface had been compared with the captured implementation. The parity checks found no numerical or behavioral differences in the retained indicators. The cutover removed:

- `crates/ta-core/src/wasm` and all WASM-only Rust dependencies, features, and metadata;
- the `wasm-pack` build script, helper script, and target-specific Cargo configuration;
- tracked generated `pkg/` glue and the WASM binary;
- parity-only WASM imports from the JavaScript tests and benchmark.

The package now lists only the ESM facade, generated NAPI loader/declarations, documentation, and license in its root tarball. Platform binaries and platform package dependencies remain part of task 9.

Verification completed with:

```text
cargo check --offline -p ta-core -p ta-native
cargo fmt --all -- --check
cargo test --offline -p ta-core --lib             # 175 passed
pnpm run build:native
pnpm run build:js
pnpm exec vitest run tests/integration.test.ts tests/native-slice.test.ts tests/native-surface.test.ts
pnpm pack --dry-run
```

The targeted Vitest suite passed 15 tests, and the pack dry-run contains no `pkg/` or WASM artifact.

## Findings

### Core algorithms

The default disposition is to retain the existing `ta-core` algorithms. Rewriting them during the WASM-to-NAPI migration would combine a backend change with numerical behavior changes and make regressions difficult to isolate.

The core layer is already the right ownership boundary for indicator calculations and shared financial types. It should receive only additive or targeted changes backed by a failing characterization test.

Items requiring a decision or targeted coverage before implementation:

- Session VWAP converts timestamps to UTC-day buckets using `div_euclid`, with negative timestamps around the Unix epoch covered by characterization tests.
- Several price-based paths do not explicitly define behavior for non-finite values. Boundary validation should reject non-finite inputs where required, and the decision should be reflected in tests and documentation.
- Stream readiness is explicit: raw NAPI-RS `Option<T>` values are `null`, the public facade exposes `undefined`, and batch initialization preserves intentional `NaN` alignment.
- FRVP and linear-regression streaming work are not generally O(1) per update. FRVP recalculates over its data, and linear regression recalculates over its active period. Documentation and benchmarks must reflect the real costs.

### WASM binding layer

The WASM bindings contain reusable orchestration concepts, but the binding implementation itself should not be ported line by line.

The following patterns must be removed from the native boundary:

- unchecked JavaScript-number-to-`i64` timestamp casts;
- synthetic OHLCV values used to satisfy an overly broad core input type;
- repeated `JsValue`/`Reflect::set` construction for multi-output results;
- WASM-specific memory and `.free()` lifecycle behavior;
- conversion and validation duplicated across batch and stream exports.

FRVP is the clearest case where the existing binding did more than the algorithm needs. The core calculation reads high, low, and volume; the native design now uses `FrvpBar` and does not manufacture timestamp/open/close values. The existing core `OHLCV` API remains for compatibility, with a shared calculation path for the native-facing bar.

### TypeScript facade

Before task 7, the facade had useful numerical API coverage, but its overload-heavy design made malformed runtime calls easier to accept than the types suggest:

- many branches rely on non-null assertions such as `closes!`, `periodArg!`, and `volumes!`;
- candle detection inspects only the first element;
- missing candle volume or timestamp values can default to zero;
- `number[]` and `Candle[]` coercion is mixed with backend dispatch;
- streaming is exposed through function `.stream()` properties;
- generated WASM types leak into the public API.

The native facade is now a typed boundary using explicit typed-array series records and options objects. Runtime checks reject malformed shape, mismatched lengths, non-finite values where disallowed, and unsafe timestamps with explicit errors. It exposes native-backed stream classes directly and uses structured typed outputs rather than preserving the old overload matrix.

### Existing behavior worth preserving deliberately

- Intentional leading `NaN` alignment in batch indicator outputs.
- Explicit errors for invalid parameters, empty input, insufficient data, and mismatched series lengths where the core already enforces them.
- Batch/stream numerical parity for the existing supported indicators.
- Pivot aliases only if compatibility requires them; the new API should otherwise expose canonical variant names.
- Core support for MACD signal types and stochastic fast/slow modes is retained explicitly in the native surface.

## Binding matrix

The matrix is the implementation contract for the native binding. “Retain” refers to the core algorithm, not to the existing WASM export shape.

| Indicator family | Core disposition | Proposed native input/output | Validation and cost notes | Intentional API decision |
| --- | --- | --- | --- | --- |
| SMA, EMA, WMA, RSI, HMA | Retain | `Float64Array` series plus options; `Float64Array` result; direct stream class | Validate period and finite/length requirements; one output column | Remove positional overloads and implicit array conversion |
| MACD | Retain | Series plus options; structured `{ macd, signal, histogram }` typed output | Preserve leading alignment; avoid per-value JS object allocation | Decide whether to expose core `Ema`/`Sma` signal mode |
| Bollinger Bands | Retain | Series plus options; structured `{ middle, upper, lower }` output | Validate period and deviation; preserve alignment | Replace WASM object assembly with typed native result |
| Stochastic fast/slow | Retain | HLC series plus explicit mode/options; `{ k, d }` output | Equal-length HLC validation; preserve mode semantics | Unify separate WASM exports behind one explicit mode |
| Stochastic RSI | Retain | Series plus options; `{ k, d }` output | Validate nested periods and alignment | Use options instead of positional period overloads |
| ATR | Retain | HLC series plus options; `Float64Array` result | Equal-length validation and period checks | Do not require unused OHLCV fields |
| MFI | Retain | HLCV series plus options; `Float64Array` result | Equal-length validation and period checks | Use the smallest required record shape |
| ADX | Retain | HLC series plus options; structured output | Equal-length validation; preserve readiness alignment | Typed multi-series result |
| Ichimoku | Retain | HLC series plus options; structured output | Validate periods and equal lengths | Typed multi-series result |
| CVD delta | Retain | Close/volume or delta-oriented series as appropriate; result | Validate shape and finite values | Keep direct-delta and HLCV variants explicit |
| CVD OHLCV | Retain | HLCV series plus options; result | No timestamp/open requirement in the algorithm | Avoid forcing a full OHLCV record |
| Session, rolling, and anchored VWAP | Retain pending timestamp test | Timestamped HLCV records; result and stream classes | Validate integer safe-range timestamps and equal lengths; benchmark copying | Define negative-epoch and unavailable-value semantics |
| Pivot points | Retain | HLC series plus canonical variant/options; structured output | Core already validates equal lengths and variants | Decide whether legacy aliases remain |
| FRVP | Retain algorithm; refactor adapter | Minimal high/low/volume bars; typed histogram/summary output | Avoid synthetic OHLCV; document/retest O(n) update behavior | Preserve columnar histogram unless a measured better shape exists |
| Money flow / volume profile outputs | Retain applicable core logic | Typed arrays or structured columnar result | Avoid repeated JS property mutation | Keep output field names stable only where useful |
| Linear regression | Retain | Series plus options; structured result | Make default standard-deviation setting explicit; stream is O(period) | Expose options rather than hidden default positional argument |

## Required characterization coverage before native work

- Negative timestamps around the Unix epoch for session VWAP.
- Non-finite values and invalid ranges for FRVP and other price-sensitive inputs.
- Empty, insufficient, and mismatched-length inputs at the eventual native boundary.
- Batch versus stream parity, reset, reinitialization, and `current()` behavior for every retained stream.
- `undefined` versus `NaN` behavior when a stream is not ready.
- Structured output field names and leading-value alignment.

## Implementation order

1. Add the characterization tests above and record any intentional corrections. **Complete.**
2. Implement one scalar indicator and one stream as a vertical NAPI slice. **Complete for SMA.**
3. Add one structured multi-output indicator and measure native boundary overhead. **Complete for MACD.**
4. Implement the remaining indicators by matrix family, keeping conversion and validation in `ta-native`. **Complete.**
5. Compare native results with the captured WASM/TypeScript baseline before removing WASM. **Complete.**

## Audit conclusion

The migration retains the tested `ta-core` algorithms, replaces the WASM binding layer, and exposes explicit Node 26 ESM-native types. The old WASM file and its overload/coercion behavior were implementation details, not a compatibility target. The SMA/SmaStream/MACD slice confirms the NAPI-RS loader, typed-array contracts, error mapping, stream ownership model, declaration boundary, and initial performance trade-offs. Platform-specific package assembly remains for the next phase.
