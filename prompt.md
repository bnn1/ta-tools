You're hired by a Crypto Hedge fund to create a blazing fast and open source indicators library for Node.js. Here're the requirements:

---
# Requirements.md

## ta-tools
This document serves as the unified and comprehensive specification for the **"ta-tools"** Technical Analysis suite, detailing both the architectural constraints and the required functional scope.

---

ta-tools: Master Specification

### 1. Core Architectural Requirements & Constraints

The primary objective is to leverage Rust's speed and memory safety to eliminate calculation lag and garbage collection stutters currently experienced with JavaScript-based technical analysis libraries in high-frequency data environments.

#### 1.1 Language & Distribution

*   **Language:** Rust (Stable channel).
*   **Compilation Target:** WebAssembly (`wasm-pack`) optimized for size and speed.
*   **Distribution:** NPM package containing the WASM binary and automatically generated TypeScript definition files (`.d.ts`).

#### 1.2 Dual Calculation Modes (Batch and Stream)

The library must support two distinct, highly optimized calculation modes to cater to all use cases:

1.  **Historical/Batch Mode (Stateless):** For backtesting, chart initialization, and calculating indicators over large, static arrays of OHLCV data. This mode should be optimized for throughput and accept flat `Float64Arrays`.
2.  **Streaming Mode (Stateful):** For real-time updates on live market data, utilizing the $O(1)$ incremental calculation logic (see 1.4).

#### 1.3 Data Handling & Precision

*   **Input Data Structure:** The library must accept a stream or array of OHLCV (Open, High, Low, Close, Volume) data.
*   **Zero-Copy / Low-Overhead:** Data passing between JS and WASM memory must be highly optimized. We mandate passing flat **`Float64Arrays`** over arrays of objects to minimize serialization overhead.
*   **Precision:** All internal calculations must utilize **64-bit floating-point precision (`f64`)** to avoid cumulative rounding errors, which are unacceptable at institutional scale.

#### 1.4 Streaming Architecture (Crucial for Live Feeds)

We require a **Stateful Struct** approach to support real-time updates efficiently.

*   **Stateful Design:** Indicators must be initialized once (e.g., `RsiStream(14)`).
*   **Historical Initialization:** The stateful struct must support an `init_history(data)` method to quickly calculate the initial history and establish the state necessary for subsequent real-time updates.
*   **Incremental Calculation:** After initialization, real-time updates must be handled by a dedicated `.next(value)` method.
*   **Performance Target:** New tick updates must be calculated in **$O(1)$ time complexity** (incremental calculation) rather than re-calculating the entire data array on every new tick.

### 2. Quality & Reliability Standards

#### 2.1 Robustness

*   **Null/Gap Handling:** Graceful handling of data gaps, missing values, or insufficient periods. The output must handle `NaN` or `None`/`null` gracefully without crashing the Rust core.
*   **Clippy Standards:** Rust source code must adhere to standard best practices and be well-documented.

### 3. Functional Scope: The Indicators

We require a tiered implementation focusing on the indicators most critical for professional desk traders and high-frequency analysis.

#### Tier A: Core indicators

| Indicator | Requirements |
| :--- | :--- |
| **FRVP (Fixed Range Volume Profile)** | **Fixed Range Volume Profile** is required. Given a slice of candles, return the **Point of Control (POC)**, **Value Area High (VAH)**, and **Value Area Low (VAL)**. Outputs must be price histograms (volume by price level). |
| **RSI** | **Relative Strength Index.** |
| **Moving Averages** | **SMA, EMA, WMA.** |
| **MACD** | Moving Average Convergence Divergence. Must support custom input to specify the type of moving average used for the signal line (SMA vs. EMA). |
| **VWAP** | Must support three modes: **Standard Session VWAP** (resets daily/session), **Rolling VWAP** (customizable window), and **Anchored VWAP** (ability to calculate VWAP starting from a specific timestamp/index). |
| **Pivot Points** | Must support **Standard, Fibonacci, and Woodie** variants. The calculation logic must **auto-detect** daily, weekly, or monthly boundaries based on the input data timestamps. |
| **CVD** | **Cumulative Volume Delta.** Requires access to aggregated buy/sell volume data streams. |
| **Stochastic Oscillator** | Must support both **Fast** and **Slow** variants. |
| **Stochastic RSI** |  |

#### Tier B: Additional indicators

| Indicator | Requirements |
| :--- | :--- |
| **Bollinger Bands** | Standard calculation with configurable standard deviations (Volatility). |
| **MFI** | **Money Flow Index.** |
| **HMA** | **Hull Moving Average** (essential for lag reduction in scalping strategies). |
| **Ichimoku Cloud** | Full calculation suite: Tenkan Sen, Kijun Sen, Senkou Span A, Senkou Span B, and Chikou Span. |
| **ADX** | **Average Directional Index** (for filtering ranging vs. trending market conditions). |
| **Linear Regression Channels** | Requires calculation of the channel centerline with standard deviation bands. Output must also include **Pearson's R** correlation coefficient. |

#### 4. API Usage & Developer Experience (DX)

The resulting TypeScript API must be clear, intuitive, and support both stateless batch mode and stateful streaming mode.

We will leave underlying Rust API design to professionals - You.

---

Your code will be meticulously reviewed, you're expected to write a professional-grade, SSS-tier code that will be used by financial institutions all around the world. 

As an expert software engineer, you know that "professional-grade, SSS-tier code" doesn't mean "complex" or "overengineered". It means "smart", "simple" and "powerful".
