//! WASM bindings for JavaScript interop.
//!
//! Provides both batch (stateless) functions and streaming (stateful) classes.

use wasm_bindgen::prelude::*;

use crate::indicators::{
    Atr, AtrBar, AtrStream, BBands, BBandsOutput, BBandsStream, Ema, EmaStream, Macd,
    MacdOutput, MacdStream, Rsi, RsiStream, Sma, SmaStream, Stoch, StochBar, StochOutput,
    StochStream, StochType, Wma, WmaStream,
};
use crate::traits::{Indicator, StreamingIndicator};

// ============================================================================
// Initialization
// ============================================================================

/// Initialize panic hook for better error messages in WASM.
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "wasm")]
    console_error_panic_hook::set_once();
}

// ============================================================================
// Batch Functions (Stateless)
// ============================================================================

/// Calculate SMA for an array of prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "sma")]
pub fn sma_batch(data: &[f64], period: usize) -> Result<Vec<f64>, JsError> {
    let indicator = Sma::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate EMA for an array of prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "ema")]
pub fn ema_batch(data: &[f64], period: usize) -> Result<Vec<f64>, JsError> {
    let indicator = Ema::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate RSI for an array of prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "rsi")]
pub fn rsi_batch(data: &[f64], period: usize) -> Result<Vec<f64>, JsError> {
    let indicator = Rsi::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate WMA for an array of prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "wma")]
pub fn wma_batch(data: &[f64], period: usize) -> Result<Vec<f64>, JsError> {
    let indicator = Wma::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// MACD output returned from JavaScript.
#[wasm_bindgen]
pub struct WasmMacdOutput {
    macd_val: f64,
    signal_val: f64,
    histogram_val: f64,
}

#[wasm_bindgen]
impl WasmMacdOutput {
    /// MACD line value
    #[wasm_bindgen(getter)]
    pub fn macd(&self) -> f64 {
        self.macd_val
    }

    /// Signal line value
    #[wasm_bindgen(getter)]
    pub fn signal(&self) -> f64 {
        self.signal_val
    }

    /// Histogram value
    #[wasm_bindgen(getter)]
    pub fn histogram(&self) -> f64 {
        self.histogram_val
    }
}

impl From<MacdOutput> for WasmMacdOutput {
    fn from(output: MacdOutput) -> Self {
        Self {
            macd_val: output.macd,
            signal_val: output.signal,
            histogram_val: output.histogram,
        }
    }
}

/// Calculate MACD for an array of prices.
///
/// Returns an object with `macd`, `signal`, and `histogram` arrays.
#[wasm_bindgen(js_name = "macd")]
pub fn macd_batch(
    data: &[f64],
    fast_period: usize,
    slow_period: usize,
    signal_period: usize,
) -> Result<JsValue, JsError> {
    let indicator =
        Macd::new(fast_period, slow_period, signal_period).map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))?;

    // Convert to separate arrays for JS
    let macd_line: Vec<f64> = results.iter().map(|r| r.macd).collect();
    let signal_line: Vec<f64> = results.iter().map(|r| r.signal).collect();
    let histogram: Vec<f64> = results.iter().map(|r| r.histogram).collect();

    // Return as JS object with three arrays
    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("macd"),
        &js_sys::Float64Array::from(&macd_line[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set macd property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("signal"),
        &js_sys::Float64Array::from(&signal_line[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set signal property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("histogram"),
        &js_sys::Float64Array::from(&histogram[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set histogram property"))?;

    Ok(obj.into())
}

/// Calculate Bollinger Bands for an array of prices.
///
/// Returns an object with `upper`, `middle`, `lower`, `percentB`, and `bandwidth` arrays.
#[wasm_bindgen(js_name = "bbands")]
pub fn bbands_batch(data: &[f64], period: usize, k: f64) -> Result<JsValue, JsError> {
    let indicator = BBands::new(period, k).map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))?;

    // Convert to separate arrays for JS
    let upper: Vec<f64> = results.iter().map(|r| r.upper).collect();
    let middle: Vec<f64> = results.iter().map(|r| r.middle).collect();
    let lower: Vec<f64> = results.iter().map(|r| r.lower).collect();
    let percent_b: Vec<f64> = results.iter().map(|r| r.percent_b).collect();
    let bandwidth: Vec<f64> = results.iter().map(|r| r.bandwidth).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("upper"),
        &js_sys::Float64Array::from(&upper[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set upper property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("middle"),
        &js_sys::Float64Array::from(&middle[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set middle property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("lower"),
        &js_sys::Float64Array::from(&lower[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set lower property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("percentB"),
        &js_sys::Float64Array::from(&percent_b[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set percentB property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("bandwidth"),
        &js_sys::Float64Array::from(&bandwidth[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set bandwidth property"))?;

    Ok(obj.into())
}

/// Calculate ATR for arrays of high, low, and close prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "atr")]
pub fn atr_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: usize,
) -> Result<Vec<f64>, JsError> {
    let indicator = Atr::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(&(&highs, &lows, &closes))
        .map_err(|e| JsError::new(&e.to_string()))
}

// ============================================================================
// Streaming Classes (Stateful)
// ============================================================================

/// Streaming SMA calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "SmaStream")]
pub struct WasmSmaStream {
    inner: SmaStream,
}

#[wasm_bindgen(js_class = "SmaStream")]
impl WasmSmaStream {
    /// Create a new streaming SMA calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmSmaStream, JsError> {
        let inner = SmaStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Returns array of SMA values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<Vec<f64>, JsError> {
        self.inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next value. Returns SMA or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<f64> {
        self.inner.next(value)
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }
}

/// Streaming EMA calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "EmaStream")]
pub struct WasmEmaStream {
    inner: EmaStream,
}

#[wasm_bindgen(js_class = "EmaStream")]
impl WasmEmaStream {
    /// Create a new streaming EMA calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmEmaStream, JsError> {
        let inner = EmaStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Returns array of EMA values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<Vec<f64>, JsError> {
        self.inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next value. Returns EMA or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<f64> {
        self.inner.next(value)
    }

    /// Get current EMA value without consuming a new value.
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }

    /// Get the smoothing multiplier.
    #[wasm_bindgen(getter)]
    pub fn multiplier(&self) -> f64 {
        self.inner.multiplier()
    }
}

/// Streaming RSI calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "RsiStream")]
pub struct WasmRsiStream {
    inner: RsiStream,
}

#[wasm_bindgen(js_class = "RsiStream")]
impl WasmRsiStream {
    /// Create a new streaming RSI calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmRsiStream, JsError> {
        let inner = RsiStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Returns array of RSI values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<Vec<f64>, JsError> {
        self.inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next value. Returns RSI or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<f64> {
        self.inner.next(value)
    }

    /// Get current RSI value without consuming a new value.
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }
}

/// Streaming WMA calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "WmaStream")]
pub struct WasmWmaStream {
    inner: WmaStream,
}

#[wasm_bindgen(js_class = "WmaStream")]
impl WasmWmaStream {
    /// Create a new streaming WMA calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmWmaStream, JsError> {
        let inner = WmaStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Returns array of WMA values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<Vec<f64>, JsError> {
        self.inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next value. Returns WMA or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<f64> {
        self.inner.next(value)
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }
}

/// Streaming MACD calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "MacdStream")]
pub struct WasmMacdStream {
    inner: MacdStream,
}

#[wasm_bindgen(js_class = "MacdStream")]
impl WasmMacdStream {
    /// Create a new streaming MACD calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(
        fast_period: usize,
        slow_period: usize,
        signal_period: usize,
    ) -> Result<WasmMacdStream, JsError> {
        let inner = MacdStream::new(fast_period, slow_period, signal_period)
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Returns array of MACD outputs as JS object.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))?;

        // Convert to separate arrays for JS
        let macd_line: Vec<f64> = results.iter().map(|r| r.macd).collect();
        let signal_line: Vec<f64> = results.iter().map(|r| r.signal).collect();
        let histogram: Vec<f64> = results.iter().map(|r| r.histogram).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("macd"),
            &js_sys::Float64Array::from(&macd_line[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set macd property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("signal"),
            &js_sys::Float64Array::from(&signal_line[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set signal property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("histogram"),
            &js_sys::Float64Array::from(&histogram[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set histogram property"))?;

        Ok(obj.into())
    }

    /// Process next value. Returns MACD output or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<WasmMacdOutput> {
        self.inner.next(value).map(WasmMacdOutput::from)
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the fast period.
    #[wasm_bindgen(getter, js_name = "fastPeriod")]
    pub fn fast_period(&self) -> usize {
        self.inner.fast_period()
    }

    /// Get the slow period.
    #[wasm_bindgen(getter, js_name = "slowPeriod")]
    pub fn slow_period(&self) -> usize {
        self.inner.slow_period()
    }

    /// Get the signal period.
    #[wasm_bindgen(getter, js_name = "signalPeriod")]
    pub fn signal_period(&self) -> usize {
        self.inner.signal_period()
    }
}

/// Bollinger Bands output for streaming mode.
#[wasm_bindgen]
pub struct WasmBBandsOutput {
    upper_val: f64,
    middle_val: f64,
    lower_val: f64,
    percent_b_val: f64,
    bandwidth_val: f64,
}

#[wasm_bindgen]
impl WasmBBandsOutput {
    /// Upper band value
    #[wasm_bindgen(getter)]
    pub fn upper(&self) -> f64 {
        self.upper_val
    }

    /// Middle band (SMA) value
    #[wasm_bindgen(getter)]
    pub fn middle(&self) -> f64 {
        self.middle_val
    }

    /// Lower band value
    #[wasm_bindgen(getter)]
    pub fn lower(&self) -> f64 {
        self.lower_val
    }

    /// %B indicator value
    #[wasm_bindgen(getter, js_name = "percentB")]
    pub fn percent_b(&self) -> f64 {
        self.percent_b_val
    }

    /// Bandwidth value
    #[wasm_bindgen(getter)]
    pub fn bandwidth(&self) -> f64 {
        self.bandwidth_val
    }
}

impl From<BBandsOutput> for WasmBBandsOutput {
    fn from(output: BBandsOutput) -> Self {
        Self {
            upper_val: output.upper,
            middle_val: output.middle,
            lower_val: output.lower,
            percent_b_val: output.percent_b,
            bandwidth_val: output.bandwidth,
        }
    }
}

/// Streaming Bollinger Bands calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "BBandsStream")]
pub struct WasmBBandsStream {
    inner: BBandsStream,
}

#[wasm_bindgen(js_class = "BBandsStream")]
impl WasmBBandsStream {
    /// Create a new streaming Bollinger Bands calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize, k: f64) -> Result<WasmBBandsStream, JsError> {
        let inner =
            BBandsStream::new(period, k).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Returns object with arrays.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))?;

        // Convert to separate arrays for JS
        let upper: Vec<f64> = results.iter().map(|r| r.upper).collect();
        let middle: Vec<f64> = results.iter().map(|r| r.middle).collect();
        let lower: Vec<f64> = results.iter().map(|r| r.lower).collect();
        let percent_b: Vec<f64> = results.iter().map(|r| r.percent_b).collect();
        let bandwidth: Vec<f64> = results.iter().map(|r| r.bandwidth).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("upper"),
            &js_sys::Float64Array::from(&upper[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set upper property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("middle"),
            &js_sys::Float64Array::from(&middle[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set middle property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("lower"),
            &js_sys::Float64Array::from(&lower[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set lower property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("percentB"),
            &js_sys::Float64Array::from(&percent_b[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set percentB property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("bandwidth"),
            &js_sys::Float64Array::from(&bandwidth[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set bandwidth property"))?;

        Ok(obj.into())
    }

    /// Process next value. Returns BBands output or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<WasmBBandsOutput> {
        self.inner.next(value).map(WasmBBandsOutput::from)
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }

    /// Get the K multiplier.
    #[wasm_bindgen(getter)]
    pub fn k(&self) -> f64 {
        self.inner.k()
    }
}

/// Streaming ATR calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "AtrStream")]
pub struct WasmAtrStream {
    inner: AtrStream,
}

#[wasm_bindgen(js_class = "AtrStream")]
impl WasmAtrStream {
    /// Create a new streaming ATR calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmAtrStream, JsError> {
        let inner = AtrStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical OHLC data.
    /// Takes three arrays: highs, lows, closes.
    /// Returns array of ATR values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<Vec<f64>, JsError> {
        if highs.len() != lows.len() || lows.len() != closes.len() {
            return Err(JsError::new(
                "highs, lows, and closes must have the same length",
            ));
        }

        let bars: Vec<AtrBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        self.inner
            .init(&bars)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next bar. Takes high, low, close.
    /// Returns ATR or undefined if not ready.
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Option<f64> {
        self.inner.next((high, low, close))
    }

    /// Get current ATR value without consuming a new bar.
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }
}

// ============================================================================
// Stochastic Oscillator
// ============================================================================

/// Stochastic output returned to JavaScript.
#[wasm_bindgen]
pub struct WasmStochOutput {
    k_val: f64,
    d_val: f64,
}

#[wasm_bindgen]
impl WasmStochOutput {
    /// %K line value (0-100)
    #[wasm_bindgen(getter)]
    pub fn k(&self) -> f64 {
        self.k_val
    }

    /// %D line value (0-100) - signal line
    #[wasm_bindgen(getter)]
    pub fn d(&self) -> f64 {
        self.d_val
    }
}

impl From<StochOutput> for WasmStochOutput {
    fn from(output: StochOutput) -> Self {
        Self {
            k_val: output.k,
            d_val: output.d,
        }
    }
}

/// Calculate Fast Stochastic for arrays of high, low, and close prices.
///
/// Returns an object with `k` and `d` arrays.
#[wasm_bindgen(js_name = "stochFast")]
pub fn stoch_fast_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: usize,
    d_period: usize,
) -> Result<JsValue, JsError> {
    let indicator =
        Stoch::new(k_period, d_period, StochType::Fast).map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(&(&highs, &lows, &closes))
        .map_err(|e| JsError::new(&e.to_string()))?;

    // Convert to separate arrays for JS
    let k_line: Vec<f64> = results.iter().map(|r| r.k).collect();
    let d_line: Vec<f64> = results.iter().map(|r| r.d).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("k"),
        &js_sys::Float64Array::from(&k_line[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set k property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("d"),
        &js_sys::Float64Array::from(&d_line[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set d property"))?;

    Ok(obj.into())
}

/// Calculate Slow Stochastic for arrays of high, low, and close prices.
///
/// Returns an object with `k` and `d` arrays.
#[wasm_bindgen(js_name = "stochSlow")]
pub fn stoch_slow_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: usize,
    d_period: usize,
    slowing: usize,
) -> Result<JsValue, JsError> {
    let indicator = Stoch::new_with_slowing(k_period, d_period, slowing, StochType::Slow)
        .map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(&(&highs, &lows, &closes))
        .map_err(|e| JsError::new(&e.to_string()))?;

    // Convert to separate arrays for JS
    let k_line: Vec<f64> = results.iter().map(|r| r.k).collect();
    let d_line: Vec<f64> = results.iter().map(|r| r.d).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("k"),
        &js_sys::Float64Array::from(&k_line[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set k property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("d"),
        &js_sys::Float64Array::from(&d_line[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set d property"))?;

    Ok(obj.into())
}

/// Streaming Fast Stochastic calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "StochFastStream")]
pub struct WasmStochFastStream {
    inner: StochStream,
}

#[wasm_bindgen(js_class = "StochFastStream")]
impl WasmStochFastStream {
    /// Create a new streaming Fast Stochastic calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(k_period: usize, d_period: usize) -> Result<WasmStochFastStream, JsError> {
        let inner = StochStream::new(k_period, d_period, StochType::Fast)
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Takes parallel arrays of highs, lows, closes.
    /// Returns array of Stochastic outputs as JS object with k and d arrays.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<JsValue, JsError> {
        if highs.len() != lows.len() || highs.len() != closes.len() {
            return Err(JsError::new(
                "highs, lows, and closes must have the same length",
            ));
        }

        let bars: Vec<StochBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        let results = self
            .inner
            .init(&bars)
            .map_err(|e| JsError::new(&e.to_string()))?;

        // Convert to separate arrays for JS
        let k_line: Vec<f64> = results.iter().map(|r| r.k).collect();
        let d_line: Vec<f64> = results.iter().map(|r| r.d).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("k"),
            &js_sys::Float64Array::from(&k_line[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set k property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("d"),
            &js_sys::Float64Array::from(&d_line[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set d property"))?;

        Ok(obj.into())
    }

    /// Process next bar. Takes high, low, close.
    /// Returns Stochastic output or undefined if not ready.
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Option<WasmStochOutput> {
        self.inner.next((high, low, close)).map(WasmStochOutput::from)
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the K period.
    #[wasm_bindgen(getter, js_name = "kPeriod")]
    pub fn k_period(&self) -> usize {
        self.inner.k_period()
    }

    /// Get the D period.
    #[wasm_bindgen(getter, js_name = "dPeriod")]
    pub fn d_period(&self) -> usize {
        self.inner.d_period()
    }
}

/// Streaming Slow Stochastic calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "StochSlowStream")]
pub struct WasmStochSlowStream {
    inner: StochStream,
}

#[wasm_bindgen(js_class = "StochSlowStream")]
impl WasmStochSlowStream {
    /// Create a new streaming Slow Stochastic calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(
        k_period: usize,
        d_period: usize,
        slowing: usize,
    ) -> Result<WasmStochSlowStream, JsError> {
        let inner = StochStream::new_with_slowing(k_period, d_period, slowing, StochType::Slow)
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data. Takes parallel arrays of highs, lows, closes.
    /// Returns array of Stochastic outputs as JS object with k and d arrays.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<JsValue, JsError> {
        if highs.len() != lows.len() || highs.len() != closes.len() {
            return Err(JsError::new(
                "highs, lows, and closes must have the same length",
            ));
        }

        let bars: Vec<StochBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        let results = self
            .inner
            .init(&bars)
            .map_err(|e| JsError::new(&e.to_string()))?;

        // Convert to separate arrays for JS
        let k_line: Vec<f64> = results.iter().map(|r| r.k).collect();
        let d_line: Vec<f64> = results.iter().map(|r| r.d).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("k"),
            &js_sys::Float64Array::from(&k_line[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set k property"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("d"),
            &js_sys::Float64Array::from(&d_line[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set d property"))?;

        Ok(obj.into())
    }

    /// Process next bar. Takes high, low, close.
    /// Returns Stochastic output or undefined if not ready.
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Option<WasmStochOutput> {
        self.inner.next((high, low, close)).map(WasmStochOutput::from)
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has enough data to produce values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the K period.
    #[wasm_bindgen(getter, js_name = "kPeriod")]
    pub fn k_period(&self) -> usize {
        self.inner.k_period()
    }

    /// Get the D period.
    #[wasm_bindgen(getter, js_name = "dPeriod")]
    pub fn d_period(&self) -> usize {
        self.inner.d_period()
    }

    /// Get the slowing period.
    #[wasm_bindgen(getter)]
    pub fn slowing(&self) -> usize {
        self.inner.slowing()
    }
}