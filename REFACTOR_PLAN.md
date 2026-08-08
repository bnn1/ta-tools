# Node 26 ESM Build and NAPI Migration

## Decisions

- [ ] Target Node.js 26 and set `engines.node` to `>=26`.
- [ ] Publish ESM only; remove CommonJS output and `require` exports.
- [ ] Use `tsup` for bundling, source maps, and declaration generation.
- [ ] Remove standalone `tsc` commands and `tsc`-emitted JavaScript.
- [ ] Keep TypeScript only if required internally for declaration generation.
- [ ] Keep `ta-core` independent of Node and NAPI-RS.
- [ ] Treat this as a breaking, Node-only release.
- [ ] Use the latest compatible stable NAPI-RS 3.x toolchain unless registry and documentation checks at implementation time establish a newer stable major.
- [ ] Select the lowest Node-API level required by the binding design; do not infer the NAPI-RS version from Node 26 or Node-API v10.

## 1. Audit the Existing Implementation

- [x] Inventory every batch indicator, streaming indicator, output type, option, and public helper.
- [x] Review each `ta-core` implementation for correctness, complexity, allocation behavior, and batch/stream consistency.
- [x] Review existing Rust and JavaScript tests and identify missing edge-case coverage.
- [x] Classify each part of the WASM binding layer as:
  - [x] reusable behavior;
  - [x] obsolete WASM glue;
  - [x] duplicated conversion or validation logic;
  - [x] behavior that needs correction before migration.
- [x] Audit unchecked timestamp-to-`i64` casts and define explicit validation rules.
- [x] Audit synthetic OHLCV construction in FRVP and confirm which fields are genuinely required by the core algorithm.
- [x] Audit manual `JsValue`/`Reflect::set` output construction and define typed replacements.
- [x] Audit TypeScript non-null assertions and overloaded branches that can forward missing arguments at runtime.
- [x] Identify algorithms or APIs that should be refactored, removed, or redesigned instead of copied.
- [x] Produce a binding matrix for every indicator containing:
  - [x] the core implementation to retain or refactor;
  - [x] current behavior and test coverage;
  - [x] proposed native input and output shapes;
  - [x] validation and error behavior;
  - [x] expected allocation and copying costs;
  - [x] intentional breaking changes.
- [x] Do not start the complete native implementation until the binding matrix is settled.

## 2. Establish a Verified Baseline

- [x] Capture representative numerical results for every batch indicator.
- [x] Capture batch-versus-stream parity results for every streaming implementation.
- [x] Record NaN alignment and stream readiness behavior.
- [x] Record reset, reinitialization, and `current()` behavior.
- [x] Record invalid-parameter, empty-input, insufficient-data, and mismatched-length behavior.
- [x] Add missing characterization tests before changing behavior.
- [x] Record current WASM throughput, startup time, memory use, and package size.
- [x] Mark each captured behavior as intentional, defective, or obsolete.

## 3. Replace the JavaScript Build Pipeline

- [x] Add `tsup` and pin a version whose esbuild dependency recognizes Node 26.
- [x] Add an ESM-only `tsup` configuration with:
  - [x] `target: "node26"`;
  - [x] `format: ["esm"]`;
  - [x] source maps enabled;
  - [x] declaration generation enabled;
  - [x] clean output enabled;
  - [x] native loaders and platform packages externalized.
- [x] Remove the `build:ts` script and all direct `tsc` execution.
- [x] Remove `tsc` as a JavaScript emitter.
- [x] Keep a minimal TypeScript configuration only if declaration generation requires it.
- [x] Restrict development TypeScript executed directly by Node 26 to erasable syntax and explicit `type` imports.
- [x] Add scripts for clean, bundle, tests, benchmarks, and package validation.
    - [x] Add the native build script when the native crate is introduced.
- [x] Update package exports to expose only `dist/index.js` and `dist/index.d.ts`.
- [x] Remove CommonJS metadata, outputs, and documentation claims.
- [x] Make clean-checkout tests build required artifacts instead of relying on an existing `dist/` directory.

## 4. Create the Native Crate Architecture

- [x] Add a dedicated `ta-native` workspace crate.
- [x] Configure `ta-native` as a `cdylib` depending on `ta-core`.
- [x] Add mutually compatible stable versions of `napi`, `napi-derive`, `napi-build`, and `@napi-rs/cli`.
- [x] Add the NAPI-RS build script required by the selected stable release.
- [x] Keep all algorithms and shared financial types in `ta-core`.
- [x] Keep native conversion, validation, error mapping, and exports in `ta-native`.
- [x] Organize native bindings by indicator family instead of creating another monolithic bindings file.
- [x] Select the minimum Node-API feature level required by the implemented binding types.

## 5. Validate a Vertical Native Slice

- [x] Implement one scalar batch indicator through NAPI-RS (`sma`).
- [x] Implement its streaming class (`SmaStream`).
- [x] Implement one structured multi-series output (`macd`).
- [x] Validate `Float64Array` inputs and outputs.
- [x] Validate Rust error mapping to explicit JavaScript errors.
- [x] Validate stream ownership, garbage collection, and cleanup behavior.
- [x] Generate and load the ESM native loader under Node 26.
- [x] Confirm that `tsup` keeps the native loader external.
- [x] Confirm declaration generation exposes the intended public types without leaking internal generated names.
- [x] Benchmark boundary overhead before expanding the implementation.

## 6. Implement the Native Binding Surface

- [x] Implement each indicator according to the audit matrix, not by translating WASM bindings line by line.
- [x] Implement scalar-series indicators.
- [x] Implement multi-output series indicators.
- [x] Implement HLC indicators.
- [x] Implement OHLCV and VWAP indicators.
- [x] Implement pivot-point operations.
- [x] Implement FRVP operations and histogram output.
- [x] Implement all retained streaming calculators.
- [x] Reuse correct `ta-core` algorithms unchanged.
- [x] Refactor `ta-core` only where the audit identifies a concrete correctness, consistency, or performance problem.
- [x] Use typed NAPI objects instead of manual JavaScript property assembly.
- [x] Use `Float64Array` for columnar series inputs and outputs.
- [x] Preserve columnar FRVP histogram output unless the audit establishes a better representation.
- [x] Preserve NAPI-RS `Option` readiness values as native `null`; TypeScript facade normalization remains part of the API redesign/cutover.
- [x] Preserve intentional NaN alignment in batch outputs.
- [x] Rely on normal NAPI-RS object lifetime; do not expose WASM-style `free()` methods.

## 7. Redesign the TypeScript API

- [x] Define `Float64Array`-based series types.
- [x] Define explicit `HlcSeries` and `OhlcvSeries` records.
- [x] Define explicit HLC and OHLCV records for streaming updates.
- [x] Use options objects for periods, smoothing, anchors, variants, bins, and value-area settings.
- [x] Remove positional overloads.
- [x] Remove implicit `number[]` conversion.
- [x] Remove `Candle[]` conversion and optional defaulted candle fields.
- [x] Remove `toFloat64Array` and `extractOHLCV` from the public API.
- [x] Remove function `.stream()` properties and expose stream classes directly.
- [x] Retain `analyze()` only as a typed, backend-independent helper.
- [x] Validate array shapes and equal lengths at the boundary.
- [x] Validate finite numeric values where the algorithm requires them.
- [x] Validate integer and safe-range timestamps before converting to Rust `i64`.
- [x] Validate every configurable parameter before calculation.
- [x] Preserve explicit errors and avoid truncation, coercion, or fallback behavior.
- [x] Keep public declarations independent from generated native binding names.
- [x] Switch the public facade to the verified native backend while retaining WASM only for parity tests.
- [x] Normalize native stream readiness from `null` to public `undefined` and preserve batch `NaN` alignment.
- [x] Add focused native-backed API, stream, validation, declaration, and obsolete-export tests.

## 8. Cut Over from WASM

- [x] Switch the TypeScript facade to the verified NAPI backend. (Completed in task 7.)
- [x] Run native and WASM implementations against the captured baseline before removal. (Parity tests passed before the cutover.)
- [x] Resolve every numerical or behavioral difference explicitly. (No differences were found in the retained surface.)
- [x] Remove the WASM module from `ta-core`.
- [x] Remove `wasm-bindgen`, `js-sys`, `console_error_panic_hook`, and WASM test dependencies.
- [x] Remove WASM Cargo features and metadata.
- [x] Remove `wasm-pack` scripts and prerequisites.
- [x] Remove WASM-specific Cargo configuration.
- [x] Remove generated `pkg/` output from source and npm package contents.
- [x] Update package descriptions, keywords, files, and ignore rules for native output.

## 9. Build and Publish Native Packages

- [ ] Configure NAPI-RS platform packages and optional dependencies.
- [ ] Build Linux x64 glibc.
- [ ] Build Linux arm64 glibc.
- [ ] Build macOS x64.
- [ ] Build macOS arm64.
- [ ] Build Windows x64.
- [ ] Exclude musl and Windows ARM64 from the initial release.
- [ ] Ensure the root package contains the ESM facade and loader but not an unrelated platform binary.
- [ ] Publish platform packages before the root package.
- [ ] Validate package versions remain synchronized across all artifacts.
- [ ] Produce npm provenance for release artifacts.

## 10. Update CI and Release Automation

- [ ] Add Rust formatting and targeted core tests.
- [ ] Add a host-native NAPI build and integration test on pull requests.
- [ ] Add Node 26 package and ESM loading tests.
- [ ] Add declaration-generation validation.
- [ ] Add release jobs for each supported native target.
- [ ] Assemble platform artifacts through the NAPI-RS publishing workflow.
- [ ] Run `npm pack` and inspect package contents before publication.
- [ ] Install the packed package in a clean temporary project.
- [ ] Test unsupported-platform errors for clarity.
- [ ] Recreate or update CI/release workflow files without overwriting unrelated worktree changes.

## 11. Documentation and Release

- [ ] Update the README for Node 26 and Node-only support.
- [ ] Document the ESM-only package contract.
- [ ] Document supported operating systems and architectures.
- [ ] Document local Rust/native build prerequisites.
- [ ] Rewrite examples for typed-array records and explicit stream classes.
- [ ] Add a migration guide covering every removed helper and overload.
- [ ] Remove browser, Deno, Bun, WASM, CommonJS, and unverified zero-copy claims.
- [ ] Update the changelog with intentional behavior corrections and breaking API changes.
- [ ] Re-run benchmarks against the captured WASM baseline.
- [ ] Measure native boundary-copy overhead rather than assuming zero-copy behavior.
- [ ] Publish as a breaking release after all supported platform artifacts pass package smoke tests.

## Completion Criteria

- [ ] No CommonJS output or runtime path remains.
- [ ] No standalone `tsc` command remains.
- [x] No WASM runtime or generated `pkg/` output remains.
- [ ] Every retained indicator has batch, streaming, invalid-input, and parity coverage where applicable.
- [ ] Every changed or removed behavior is recorded in the audit matrix and migration guide.
- [ ] The packed package contains only intended ESM, declaration, loader, license, documentation, and native platform artifacts.
- [ ] The package installs and loads successfully under Node 26 on every supported platform.

## References

- [Node.js TypeScript support](https://nodejs.org/api/typescript.html)
- [Node-API version matrix](https://nodejs.org/api/n-api.html)
- [NAPI-RS CLI package](https://www.npmjs.com/package/%40napi-rs/cli)
