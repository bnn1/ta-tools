//! WASM bindings for JavaScript interop.
//!
//! Provides both batch (stateless) functions and streaming (stateful) classes.

use wasm_bindgen::prelude::*;

use crate::indicators::{
    Adx, AdxBar, AdxOutput, AdxStream, Atr, AtrBar, AtrStream, BBands, BBandsOutput, BBandsStream,
    Cvd, CvdBar, CvdOhlcv, CvdOhlcvStream, CvdStream, Ema, EmaStream, Frvp, FrvpOutput, FrvpStream,
    Hma, HmaStream, Ichimoku, IchimokuBar, IchimokuOutput, IchimokuStream, LinReg, LinRegOutput,
    LinRegStream, Macd, MacdOutput, MacdStream, Mfi, MfiBar, MfiStream, PivotPoints,
    PivotPointsOutput, PivotPointsVariant, Rsi, RsiStream, Sma, SmaStream, Stoch, StochBar,
    StochOutput, StochStream, StochType, StochRsi, StochRsiOutput, StochRsiStream, Wma, WmaStream,
    SessionVwap, SessionVwapStream, RollingVwap, RollingVwapStream, AnchoredVwap,
    AnchoredVwapStream, VolumeProfileRow,
};
use crate::traits::{Indicator, StreamingIndicator};
use crate::types::OHLCV;

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

// ============================================================================
// Stochastic RSI
// ============================================================================

/// Stochastic RSI output returned to JavaScript.
#[wasm_bindgen]
pub struct WasmStochRsiOutput {
    k_val: f64,
    d_val: f64,
}

#[wasm_bindgen]
impl WasmStochRsiOutput {
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

impl From<StochRsiOutput> for WasmStochRsiOutput {
    fn from(output: StochRsiOutput) -> Self {
        Self {
            k_val: output.k,
            d_val: output.d,
        }
    }
}

/// Calculate Stochastic RSI for an array of prices.
///
/// Returns an object with `k` and `d` arrays.
#[wasm_bindgen(js_name = "stochRsi")]
pub fn stoch_rsi_batch(
    data: &[f64],
    rsi_period: usize,
    stoch_period: usize,
    k_smooth: usize,
    d_period: usize,
) -> Result<JsValue, JsError> {
    let indicator = StochRsi::new(rsi_period, stoch_period, k_smooth, d_period)
        .map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(data)
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

/// Streaming Stochastic RSI calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "StochRsiStream")]
pub struct WasmStochRsiStream {
    inner: StochRsiStream,
}

#[wasm_bindgen(js_class = "StochRsiStream")]
impl WasmStochRsiStream {
    /// Create a new streaming Stochastic RSI calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(
        rsi_period: usize,
        stoch_period: usize,
        k_smooth: usize,
        d_period: usize,
    ) -> Result<WasmStochRsiStream, JsError> {
        let inner = StochRsiStream::new(rsi_period, stoch_period, k_smooth, d_period)
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data.
    /// Returns an object with `k` and `d` arrays.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .init(data)
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

    /// Process next value. Returns Stochastic RSI output or undefined if not ready.
    pub fn next(&mut self, value: f64) -> Option<WasmStochRsiOutput> {
        self.inner.next(value).map(WasmStochRsiOutput::from)
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

    /// Get the RSI period.
    #[wasm_bindgen(getter, js_name = "rsiPeriod")]
    pub fn rsi_period(&self) -> usize {
        self.inner.rsi_period()
    }

    /// Get the stochastic lookback period.
    #[wasm_bindgen(getter, js_name = "stochPeriod")]
    pub fn stoch_period(&self) -> usize {
        self.inner.stoch_period()
    }

    /// Get the K smoothing period.
    #[wasm_bindgen(getter, js_name = "kSmooth")]
    pub fn k_smooth(&self) -> usize {
        self.inner.k_smooth()
    }

    /// Get the D period.
    #[wasm_bindgen(getter, js_name = "dPeriod")]
    pub fn d_period(&self) -> usize {
        self.inner.d_period()
    }
}

// ============================================================================
// Cumulative Volume Delta (CVD)
// ============================================================================

/// Calculate CVD from pre-computed delta values.
///
/// Delta = buy_volume - sell_volume for each bar.
/// CVD is the running sum of deltas.
///
/// Returns Float64Array of cumulative volume delta values.
#[wasm_bindgen(js_name = "cvd")]
pub fn cvd_batch(deltas: &[f64]) -> Result<Vec<f64>, JsError> {
    let cvd = Cvd::new();
    cvd.calculate(deltas).map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate CVD from OHLCV data using volume approximation.
///
/// Approximates buy/sell volume using the formula:
/// - buy_ratio = (close - low) / (high - low)
/// - buy_volume = volume * buy_ratio
/// - sell_volume = volume * (1 - buy_ratio)
/// - delta = buy_volume - sell_volume
///
/// Returns Float64Array of cumulative volume delta values.
#[wasm_bindgen(js_name = "cvdOhlcv")]
pub fn cvd_ohlcv_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Vec<f64>, JsError> {
    if highs.len() != lows.len() || highs.len() != closes.len() || highs.len() != volumes.len() {
        return Err(JsError::new(
            "highs, lows, closes, and volumes must have the same length",
        ));
    }

    let bars: Vec<CvdBar> = highs
        .iter()
        .zip(lows.iter())
        .zip(closes.iter())
        .zip(volumes.iter())
        .map(|(((&h, &l), &c), &v)| (h, l, c, v))
        .collect();

    let cvd = CvdOhlcv::new();
    cvd.calculate(&bars).map_err(|e| JsError::new(&e.to_string()))
}

/// Streaming CVD calculator for pre-computed delta values.
#[wasm_bindgen(js_name = "CvdStream")]
pub struct WasmCvdStream {
    inner: CvdStream,
}

#[wasm_bindgen(js_class = "CvdStream")]
impl WasmCvdStream {
    /// Create a new streaming CVD calculator.
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmCvdStream {
        Self {
            inner: CvdStream::new(),
        }
    }

    /// Initialize with historical delta values.
    /// Returns array of CVD values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, deltas: &[f64]) -> Result<Vec<f64>, JsError> {
        self.inner.init(deltas).map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next delta value. Returns CVD value or undefined if NaN input.
    pub fn next(&mut self, delta: f64) -> Option<f64> {
        self.inner.next(delta)
    }

    /// Get current CVD value without consuming a new delta.
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
}

/// Streaming CVD calculator for OHLCV data.
#[wasm_bindgen(js_name = "CvdOhlcvStream")]
pub struct WasmCvdOhlcvStream {
    inner: CvdOhlcvStream,
}

#[wasm_bindgen(js_class = "CvdOhlcvStream")]
impl WasmCvdOhlcvStream {
    /// Create a new streaming CVD calculator for OHLCV data.
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmCvdOhlcvStream {
        Self {
            inner: CvdOhlcvStream::new(),
        }
    }

    /// Initialize with historical OHLCV data.
    /// Takes four arrays: highs, lows, closes, volumes.
    /// Returns array of CVD values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Vec<f64>, JsError> {
        if highs.len() != lows.len() || highs.len() != closes.len() || highs.len() != volumes.len()
        {
            return Err(JsError::new(
                "highs, lows, closes, and volumes must have the same length",
            ));
        }

        let bars: Vec<CvdBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .zip(volumes.iter())
            .map(|(((&h, &l), &c), &v)| (h, l, c, v))
            .collect();

        self.inner.init(&bars).map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next bar. Takes high, low, close, volume.
    /// Returns CVD value or undefined if not ready.
    pub fn next(&mut self, high: f64, low: f64, close: f64, volume: f64) -> Option<f64> {
        self.inner.next((high, low, close, volume))
    }

    /// Get current CVD value without consuming a new bar.
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
}

// ============================================================================
// VWAP (Volume Weighted Average Price)
// ============================================================================

/// Helper function to convert OHLCV arrays into Vec<OHLCV>.
fn arrays_to_ohlcv(
    timestamps: &[f64],
    opens: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Vec<OHLCV>, JsError> {
    let len = timestamps.len();
    if opens.len() != len
        || highs.len() != len
        || lows.len() != len
        || closes.len() != len
        || volumes.len() != len
    {
        return Err(JsError::new(
            "All OHLCV arrays must have the same length",
        ));
    }

    Ok(timestamps
        .iter()
        .zip(opens.iter())
        .zip(highs.iter())
        .zip(lows.iter())
        .zip(closes.iter())
        .zip(volumes.iter())
        .map(|(((((t, o), h), l), c), v)| OHLCV::new(*t as i64, *o, *h, *l, *c, *v))
        .collect())
}

/// Calculate Session VWAP (resets daily at UTC midnight).
///
/// Takes OHLCV arrays and returns VWAP values.
#[wasm_bindgen(js_name = "sessionVwap")]
pub fn session_vwap_batch(
    timestamps: &[f64],
    opens: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Vec<f64>, JsError> {
    let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
    let vwap = SessionVwap::new();
    vwap.calculate(&candles)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate Rolling VWAP with a sliding window.
///
/// Takes OHLCV arrays and period, returns VWAP values.
#[wasm_bindgen(js_name = "rollingVwap")]
pub fn rolling_vwap_batch(
    timestamps: &[f64],
    opens: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    period: usize,
) -> Result<Vec<f64>, JsError> {
    let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
    let vwap = RollingVwap::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    vwap.calculate(&candles)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate Anchored VWAP starting from a specific index.
///
/// Takes OHLCV arrays and anchor index, returns VWAP values.
#[wasm_bindgen(js_name = "anchoredVwap")]
pub fn anchored_vwap_batch(
    timestamps: &[f64],
    opens: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_index: usize,
) -> Result<Vec<f64>, JsError> {
    let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
    let vwap = AnchoredVwap::new(anchor_index);
    vwap.calculate(&candles)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Calculate Anchored VWAP starting from a specific timestamp.
///
/// Takes OHLCV arrays and anchor timestamp (Unix ms), returns VWAP values.
#[wasm_bindgen(js_name = "anchoredVwapFromTimestamp")]
pub fn anchored_vwap_from_timestamp_batch(
    timestamps: &[f64],
    opens: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_timestamp: f64,
) -> Result<Vec<f64>, JsError> {
    let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
    let vwap = AnchoredVwap::from_timestamp(&candles, anchor_timestamp as i64)
        .ok_or_else(|| JsError::new("No candle found at or after anchor timestamp"))?;
    vwap.calculate(&candles)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Streaming Session VWAP calculator (resets daily at UTC midnight).
#[wasm_bindgen(js_name = "SessionVwapStream")]
pub struct WasmSessionVwapStream {
    inner: SessionVwapStream,
}

#[wasm_bindgen(js_class = "SessionVwapStream")]
impl WasmSessionVwapStream {
    /// Create a new streaming Session VWAP calculator.
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmSessionVwapStream {
        Self {
            inner: SessionVwapStream::new(),
        }
    }

    /// Initialize with historical OHLCV data.
    /// Returns array of VWAP values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        timestamps: &[f64],
        opens: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Vec<f64>, JsError> {
        let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
        self.inner
            .init(&candles)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next candle. Returns VWAP value.
    pub fn next(
        &mut self,
        timestamp: f64,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Option<f64> {
        let candle = OHLCV::new(timestamp as i64, open, high, low, close, volume);
        self.inner.next(candle)
    }

    /// Get current VWAP value without consuming a new candle.
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    /// Get cumulative typical price × volume.
    #[wasm_bindgen(js_name = "cumulativeTpVolume")]
    pub fn cumulative_tp_volume(&self) -> f64 {
        self.inner.cumulative_tp_volume()
    }

    /// Get cumulative volume.
    #[wasm_bindgen(js_name = "cumulativeVolume")]
    pub fn cumulative_volume(&self) -> f64 {
        self.inner.cumulative_volume()
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
}

/// Streaming Rolling VWAP calculator with sliding window.
#[wasm_bindgen(js_name = "RollingVwapStream")]
pub struct WasmRollingVwapStream {
    inner: RollingVwapStream,
}

#[wasm_bindgen(js_class = "RollingVwapStream")]
impl WasmRollingVwapStream {
    /// Create a new streaming Rolling VWAP calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmRollingVwapStream, JsError> {
        let inner = RollingVwapStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical OHLCV data.
    /// Returns array of VWAP values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        timestamps: &[f64],
        opens: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Vec<f64>, JsError> {
        let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
        self.inner
            .init(&candles)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next candle. Returns VWAP value or undefined if not ready.
    pub fn next(
        &mut self,
        timestamp: f64,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Option<f64> {
        let candle = OHLCV::new(timestamp as i64, open, high, low, close, volume);
        self.inner.next(candle)
    }

    /// Get current VWAP value without consuming a new candle.
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

/// Streaming Anchored VWAP calculator.
#[wasm_bindgen(js_name = "AnchoredVwapStream")]
pub struct WasmAnchoredVwapStream {
    inner: AnchoredVwapStream,
}

#[wasm_bindgen(js_class = "AnchoredVwapStream")]
impl WasmAnchoredVwapStream {
    /// Create a new streaming Anchored VWAP calculator.
    /// Use `setAnchor()` or `anchorNow()` to set the anchor point.
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmAnchoredVwapStream {
        Self {
            inner: AnchoredVwapStream::new(),
        }
    }

    /// Create a new streaming Anchored VWAP calculator with a specific anchor timestamp.
    #[wasm_bindgen(js_name = "withAnchor")]
    pub fn with_anchor(anchor_timestamp: f64) -> WasmAnchoredVwapStream {
        Self {
            inner: AnchoredVwapStream::with_anchor(anchor_timestamp as i64),
        }
    }

    /// Set the anchor timestamp. VWAP will start accumulating from this point.
    #[wasm_bindgen(js_name = "setAnchor")]
    pub fn set_anchor(&mut self, timestamp: f64) {
        self.inner.set_anchor(timestamp as i64);
    }

    /// Anchor at the next candle received.
    #[wasm_bindgen(js_name = "anchorNow")]
    pub fn anchor_now(&mut self) {
        self.inner.anchor_now();
    }

    /// Initialize with historical OHLCV data.
    /// Returns array of VWAP values.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        timestamps: &[f64],
        opens: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Vec<f64>, JsError> {
        let candles = arrays_to_ohlcv(timestamps, opens, highs, lows, closes, volumes)?;
        self.inner
            .init(&candles)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next candle. Returns VWAP value or undefined if before anchor.
    pub fn next(
        &mut self,
        timestamp: f64,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Option<f64> {
        let candle = OHLCV::new(timestamp as i64, open, high, low, close, volume);
        self.inner.next(candle)
    }

    /// Get current VWAP value without consuming a new candle.
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    /// Get the anchor timestamp if set.
    #[wasm_bindgen(js_name = "anchorTimestamp")]
    pub fn anchor_timestamp(&self) -> Option<f64> {
        self.inner.anchor_timestamp().map(|t| t as f64)
    }

    /// Get cumulative typical price × volume.
    #[wasm_bindgen(js_name = "cumulativeTpVolume")]
    pub fn cumulative_tp_volume(&self) -> f64 {
        self.inner.cumulative_tp_volume()
    }

    /// Get cumulative volume.
    #[wasm_bindgen(js_name = "cumulativeVolume")]
    pub fn cumulative_volume(&self) -> f64 {
        self.inner.cumulative_volume()
    }

    /// Reset the calculator to initial state.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has been anchored and is producing values.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }
}

// ============================================================================
// Pivot Points
// ============================================================================

/// Pivot Points output returned to JavaScript.
#[wasm_bindgen]
pub struct WasmPivotPointsOutput {
    pivot_val: f64,
    r1_val: f64,
    r2_val: f64,
    r3_val: f64,
    s1_val: f64,
    s2_val: f64,
    s3_val: f64,
}

#[wasm_bindgen]
impl WasmPivotPointsOutput {
    /// The pivot point (central level)
    #[wasm_bindgen(getter)]
    pub fn pivot(&self) -> f64 {
        self.pivot_val
    }

    /// First resistance level
    #[wasm_bindgen(getter)]
    pub fn r1(&self) -> f64 {
        self.r1_val
    }

    /// Second resistance level
    #[wasm_bindgen(getter)]
    pub fn r2(&self) -> f64 {
        self.r2_val
    }

    /// Third resistance level
    #[wasm_bindgen(getter)]
    pub fn r3(&self) -> f64 {
        self.r3_val
    }

    /// First support level
    #[wasm_bindgen(getter)]
    pub fn s1(&self) -> f64 {
        self.s1_val
    }

    /// Second support level
    #[wasm_bindgen(getter)]
    pub fn s2(&self) -> f64 {
        self.s2_val
    }

    /// Third support level
    #[wasm_bindgen(getter)]
    pub fn s3(&self) -> f64 {
        self.s3_val
    }
}

impl From<PivotPointsOutput> for WasmPivotPointsOutput {
    fn from(output: PivotPointsOutput) -> Self {
        Self {
            pivot_val: output.pivot,
            r1_val: output.r1,
            r2_val: output.r2,
            r3_val: output.r3,
            s1_val: output.s1,
            s2_val: output.s2,
            s3_val: output.s3,
        }
    }
}

/// Helper to convert variant string to enum
fn parse_pivot_variant(variant: &str) -> Result<PivotPointsVariant, JsError> {
    match variant.to_lowercase().as_str() {
        "standard" | "classic" => Ok(PivotPointsVariant::Standard),
        "fibonacci" | "fib" => Ok(PivotPointsVariant::Fibonacci),
        "woodie" | "woodies" => Ok(PivotPointsVariant::Woodie),
        _ => Err(JsError::new(&format!(
            "Invalid pivot point variant: '{}'. Use 'standard', 'fibonacci', or 'woodie'",
            variant
        ))),
    }
}

/// Calculate Pivot Points from a single candle (high, low, close).
///
/// Returns an object with pivot, r1, r2, r3, s1, s2, s3 properties.
///
/// @param high - The high price of the period
/// @param low - The low price of the period
/// @param close - The close price of the period
/// @param variant - 'standard', 'fibonacci', or 'woodie'
#[wasm_bindgen(js_name = "pivotPoints")]
pub fn pivot_points_single(
    high: f64,
    low: f64,
    close: f64,
    variant: &str,
) -> Result<WasmPivotPointsOutput, JsError> {
    let pp_variant = parse_pivot_variant(variant)?;
    let pp = PivotPoints::new(pp_variant);
    let result = pp.calculate_single(high, low, close);
    Ok(WasmPivotPointsOutput::from(result))
}

/// Calculate Pivot Points for arrays of (highs, lows, closes).
///
/// Returns an object with arrays for each level: pivot, r1, r2, r3, s1, s2, s3.
///
/// @param highs - Array of high prices
/// @param lows - Array of low prices
/// @param closes - Array of close prices
/// @param variant - 'standard', 'fibonacci', or 'woodie'
#[wasm_bindgen(js_name = "pivotPointsBatch")]
pub fn pivot_points_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    variant: &str,
) -> Result<JsValue, JsError> {
    let pp_variant = parse_pivot_variant(variant)?;
    let pp = PivotPoints::new(pp_variant);
    let results: Vec<PivotPointsOutput> = pp
        .calculate((highs, lows, closes))
        .map_err(|e| JsError::new(&e.to_string()))?;

    // Convert to separate arrays for JS
    let pivots: Vec<f64> = results.iter().map(|r| r.pivot).collect();
    let r1s: Vec<f64> = results.iter().map(|r| r.r1).collect();
    let r2s: Vec<f64> = results.iter().map(|r| r.r2).collect();
    let r3s: Vec<f64> = results.iter().map(|r| r.r3).collect();
    let s1s: Vec<f64> = results.iter().map(|r| r.s1).collect();
    let s2s: Vec<f64> = results.iter().map(|r| r.s2).collect();
    let s3s: Vec<f64> = results.iter().map(|r| r.s3).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("pivot"),
        &js_sys::Float64Array::from(&pivots[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set pivot property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("r1"),
        &js_sys::Float64Array::from(&r1s[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set r1 property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("r2"),
        &js_sys::Float64Array::from(&r2s[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set r2 property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("r3"),
        &js_sys::Float64Array::from(&r3s[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set r3 property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("s1"),
        &js_sys::Float64Array::from(&s1s[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set s1 property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("s2"),
        &js_sys::Float64Array::from(&s2s[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set s2 property"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("s3"),
        &js_sys::Float64Array::from(&s3s[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set s3 property"))?;

    Ok(obj.into())
}

// ============================================================================
// Fixed Range Volume Profile (FRVP)
// ============================================================================

/// Single row in the volume profile histogram returned to JavaScript.
#[wasm_bindgen(js_name = "VolumeProfileRow")]
pub struct WasmVolumeProfileRow {
    price_val: f64,
    volume_val: f64,
    low_val: f64,
    high_val: f64,
}

#[wasm_bindgen(js_class = "VolumeProfileRow")]
impl WasmVolumeProfileRow {
    /// Price level (center of the bin)
    #[wasm_bindgen(getter)]
    pub fn price(&self) -> f64 {
        self.price_val
    }

    /// Volume at this price level
    #[wasm_bindgen(getter)]
    pub fn volume(&self) -> f64 {
        self.volume_val
    }

    /// Lower bound of the price bin
    #[wasm_bindgen(getter)]
    pub fn low(&self) -> f64 {
        self.low_val
    }

    /// Upper bound of the price bin
    #[wasm_bindgen(getter)]
    pub fn high(&self) -> f64 {
        self.high_val
    }
}

impl From<VolumeProfileRow> for WasmVolumeProfileRow {
    fn from(row: VolumeProfileRow) -> Self {
        Self {
            price_val: row.price,
            volume_val: row.volume,
            low_val: row.low,
            high_val: row.high,
        }
    }
}

/// FRVP output returned to JavaScript.
#[wasm_bindgen(js_name = "FrvpOutput")]
pub struct WasmFrvpOutput {
    poc_val: f64,
    vah_val: f64,
    val_val: f64,
    total_volume_val: f64,
    poc_volume_val: f64,
    value_area_volume_val: f64,
    range_high_val: f64,
    range_low_val: f64,
    histogram_prices: Vec<f64>,
    histogram_volumes: Vec<f64>,
    histogram_lows: Vec<f64>,
    histogram_highs: Vec<f64>,
}

#[wasm_bindgen(js_class = "FrvpOutput")]
impl WasmFrvpOutput {
    /// Point of Control - price level with highest volume
    #[wasm_bindgen(getter)]
    pub fn poc(&self) -> f64 {
        self.poc_val
    }

    /// Value Area High - upper boundary of value area
    #[wasm_bindgen(getter)]
    pub fn vah(&self) -> f64 {
        self.vah_val
    }

    /// Value Area Low - lower boundary of value area
    #[wasm_bindgen(getter)]
    pub fn val(&self) -> f64 {
        self.val_val
    }

    /// Total volume in the range
    #[wasm_bindgen(getter, js_name = "totalVolume")]
    pub fn total_volume(&self) -> f64 {
        self.total_volume_val
    }

    /// Volume at POC
    #[wasm_bindgen(getter, js_name = "pocVolume")]
    pub fn poc_volume(&self) -> f64 {
        self.poc_volume_val
    }

    /// Volume within the Value Area
    #[wasm_bindgen(getter, js_name = "valueAreaVolume")]
    pub fn value_area_volume(&self) -> f64 {
        self.value_area_volume_val
    }

    /// Highest price in the range
    #[wasm_bindgen(getter, js_name = "rangeHigh")]
    pub fn range_high(&self) -> f64 {
        self.range_high_val
    }

    /// Lowest price in the range
    #[wasm_bindgen(getter, js_name = "rangeLow")]
    pub fn range_low(&self) -> f64 {
        self.range_low_val
    }

    /// Get histogram as a JavaScript object with arrays
    #[wasm_bindgen(getter)]
    pub fn histogram(&self) -> JsValue {
        let obj = js_sys::Object::new();
        let _ = js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("prices"),
            &js_sys::Float64Array::from(&self.histogram_prices[..]).into(),
        );
        let _ = js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("volumes"),
            &js_sys::Float64Array::from(&self.histogram_volumes[..]).into(),
        );
        let _ = js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("lows"),
            &js_sys::Float64Array::from(&self.histogram_lows[..]).into(),
        );
        let _ = js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("highs"),
            &js_sys::Float64Array::from(&self.histogram_highs[..]).into(),
        );
        obj.into()
    }
}

impl From<FrvpOutput> for WasmFrvpOutput {
    fn from(output: FrvpOutput) -> Self {
        let histogram_prices: Vec<f64> = output.histogram.iter().map(|r| r.price).collect();
        let histogram_volumes: Vec<f64> = output.histogram.iter().map(|r| r.volume).collect();
        let histogram_lows: Vec<f64> = output.histogram.iter().map(|r| r.low).collect();
        let histogram_highs: Vec<f64> = output.histogram.iter().map(|r| r.high).collect();

        Self {
            poc_val: output.poc,
            vah_val: output.vah,
            val_val: output.val,
            total_volume_val: output.total_volume,
            poc_volume_val: output.poc_volume,
            value_area_volume_val: output.value_area_volume,
            range_high_val: output.range_high,
            range_low_val: output.range_low,
            histogram_prices,
            histogram_volumes,
            histogram_lows,
            histogram_highs,
        }
    }
}

/// Calculate Fixed Range Volume Profile.
///
/// Takes OHLCV arrays and returns volume profile with POC, VAH, VAL.
///
/// @param highs - Array of high prices
/// @param lows - Array of low prices
/// @param closes - Array of close prices
/// @param volumes - Array of volumes
/// @param numBins - Number of price bins (rows) in histogram (default 100)
/// @param valueAreaPercent - Percentage of volume for value area (0.0-1.0, default 0.70)
#[wasm_bindgen(js_name = "frvp")]
pub fn frvp_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    num_bins: Option<usize>,
    value_area_percent: Option<f64>,
) -> Result<WasmFrvpOutput, JsError> {
    let len = highs.len();
    if lows.len() != len || closes.len() != len || volumes.len() != len {
        return Err(JsError::new(
            "highs, lows, closes, and volumes must have the same length",
        ));
    }

    // Build OHLCV from arrays (using dummy timestamp and open)
    let candles: Vec<OHLCV> = highs
        .iter()
        .zip(lows.iter())
        .zip(closes.iter())
        .zip(volumes.iter())
        .enumerate()
        .map(|(i, (((&h, &l), &c), &v))| OHLCV::new(i as i64, l, h, l, c, v))
        .collect();

    let num_bins = num_bins.unwrap_or(100);
    let value_area_percent = value_area_percent.unwrap_or(0.70);

    let frvp = Frvp::with_value_area(num_bins, value_area_percent)
        .map_err(|e| JsError::new(&e.to_string()))?;

    let result = frvp
        .calculate(&candles)
        .map_err(|e| JsError::new(&e.to_string()))?;

    Ok(WasmFrvpOutput::from(result))
}

/// Streaming FRVP calculator for real-time updates.
#[wasm_bindgen(js_name = "FrvpStream")]
pub struct WasmFrvpStream {
    inner: FrvpStream,
}

#[wasm_bindgen(js_class = "FrvpStream")]
impl WasmFrvpStream {
    /// Create a new streaming FRVP calculator.
    ///
    /// @param numBins - Number of price bins (rows) in histogram
    /// @param valueAreaPercent - Optional percentage of volume for value area (0.0-1.0, default 0.70)
    #[wasm_bindgen(constructor)]
    pub fn new(num_bins: usize, value_area_percent: Option<f64>) -> Result<WasmFrvpStream, JsError> {
        let inner = match value_area_percent {
            Some(pct) => FrvpStream::with_value_area(num_bins, pct),
            None => FrvpStream::new(num_bins),
        }
        .map_err(|e| JsError::new(&e.to_string()))?;

        Ok(Self { inner })
    }

    /// Initialize with historical OHLCV data.
    ///
    /// @param highs - Array of high prices
    /// @param lows - Array of low prices
    /// @param closes - Array of close prices
    /// @param volumes - Array of volumes
    /// @returns FRVP output for the entire range
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Option<WasmFrvpOutput>, JsError> {
        let len = highs.len();
        if lows.len() != len || closes.len() != len || volumes.len() != len {
            return Err(JsError::new(
                "highs, lows, closes, and volumes must have the same length",
            ));
        }

        let candles: Vec<OHLCV> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .zip(volumes.iter())
            .enumerate()
            .map(|(i, (((&h, &l), &c), &v))| OHLCV::new(i as i64, l, h, l, c, v))
            .collect();

        let results = self
            .inner
            .init(&candles)
            .map_err(|e| JsError::new(&e.to_string()))?;

        Ok(results.into_iter().next().map(WasmFrvpOutput::from))
    }

    /// Process next candle.
    ///
    /// @param high - High price
    /// @param low - Low price
    /// @param close - Close price
    /// @param volume - Volume
    /// @returns Updated FRVP output or undefined if not ready
    pub fn next(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Option<WasmFrvpOutput> {
        let candle = OHLCV::new(0, low, high, low, close, volume);
        self.inner.next(candle).map(WasmFrvpOutput::from)
    }

    /// Reset the calculator and clear all candles.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if calculator has been initialized with data.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the number of price bins.
    #[wasm_bindgen(getter, js_name = "numBins")]
    pub fn num_bins(&self) -> usize {
        self.inner.num_bins()
    }


    /// Get the number of candles in the buffer.
    #[wasm_bindgen(getter, js_name = "candleCount")]
    pub fn candle_count(&self) -> usize {
        self.inner.candle_count()
    }

    /// Clear all candles from the buffer.
    pub fn clear(&mut self) {
        self.inner.clear();
    }
}

// ============================================================================
// MFI (Money Flow Index)
// ============================================================================

/// Calculate MFI for arrays of high, low, close, and volume prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "mfi")]
pub fn mfi_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    period: usize,
) -> Result<Vec<f64>, JsError> {
    let indicator = Mfi::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(&(&highs, &lows, &closes, &volumes))
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Streaming MFI calculator for real-time O(1) updates.
#[wasm_bindgen(js_name = "MfiStream")]
pub struct WasmMfiStream {
    inner: MfiStream,
}

#[wasm_bindgen(js_class = "MfiStream")]
impl WasmMfiStream {
    /// Create a new streaming MFI calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmMfiStream, JsError> {
        let inner = MfiStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical OHLCV data.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Vec<f64>, JsError> {
        if highs.len() != lows.len() || lows.len() != closes.len() || closes.len() != volumes.len()
        {
            return Err(JsError::new(
                "highs, lows, closes, and volumes must have the same length",
            ));
        }

        let bars: Vec<MfiBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .zip(volumes.iter())
            .map(|(((&h, &l), &c), &v)| (h, l, c, v))
            .collect();

        self.inner
            .init(&bars)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next bar.
    pub fn next(&mut self, high: f64, low: f64, close: f64, volume: f64) -> Option<f64> {
        self.inner.next((high, low, close, volume))
    }

    /// Get current MFI value.
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    /// Reset the calculator.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if ready.
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
// HMA (Hull Moving Average)
// ============================================================================

/// Calculate HMA for an array of prices.
///
/// Returns Float64Array with NaN for insufficient data points.
#[wasm_bindgen(js_name = "hma")]
pub fn hma_batch(data: &[f64], period: usize) -> Result<Vec<f64>, JsError> {
    let indicator = Hma::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))
}

/// Streaming HMA calculator for real-time updates.
#[wasm_bindgen(js_name = "HmaStream")]
pub struct WasmHmaStream {
    inner: HmaStream,
}

#[wasm_bindgen(js_class = "HmaStream")]
impl WasmHmaStream {
    /// Create a new streaming HMA calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmHmaStream, JsError> {
        let inner = HmaStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<Vec<f64>, JsError> {
        self.inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Process next value.
    pub fn next(&mut self, value: f64) -> Option<f64> {
        self.inner.next(value)
    }

    /// Reset the calculator.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if ready.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }

    /// Get the half period.
    #[wasm_bindgen(getter, js_name = "halfPeriod")]
    pub fn half_period(&self) -> usize {
        self.inner.half_period()
    }

    /// Get the sqrt period.
    #[wasm_bindgen(getter, js_name = "sqrtPeriod")]
    pub fn sqrt_period(&self) -> usize {
        self.inner.sqrt_period()
    }
}

// ============================================================================
// Ichimoku Cloud
// ============================================================================

/// Ichimoku output for WASM.
#[wasm_bindgen]
pub struct WasmIchimokuOutput {
    tenkan_sen_val: f64,
    kijun_sen_val: f64,
    senkou_span_a_val: f64,
    senkou_span_b_val: f64,
    chikou_span_val: f64,
}

#[wasm_bindgen]
impl WasmIchimokuOutput {
    /// Tenkan-sen (Conversion Line)
    #[wasm_bindgen(getter, js_name = "tenkanSen")]
    pub fn tenkan_sen(&self) -> f64 {
        self.tenkan_sen_val
    }

    /// Kijun-sen (Base Line)
    #[wasm_bindgen(getter, js_name = "kijunSen")]
    pub fn kijun_sen(&self) -> f64 {
        self.kijun_sen_val
    }

    /// Senkou Span A (Leading Span A)
    #[wasm_bindgen(getter, js_name = "senkouSpanA")]
    pub fn senkou_span_a(&self) -> f64 {
        self.senkou_span_a_val
    }

    /// Senkou Span B (Leading Span B)
    #[wasm_bindgen(getter, js_name = "senkouSpanB")]
    pub fn senkou_span_b(&self) -> f64 {
        self.senkou_span_b_val
    }

    /// Chikou Span (Lagging Span)
    #[wasm_bindgen(getter, js_name = "chikouSpan")]
    pub fn chikou_span(&self) -> f64 {
        self.chikou_span_val
    }
}

impl From<IchimokuOutput> for WasmIchimokuOutput {
    fn from(o: IchimokuOutput) -> Self {
        Self {
            tenkan_sen_val: o.tenkan_sen,
            kijun_sen_val: o.kijun_sen,
            senkou_span_a_val: o.senkou_span_a,
            senkou_span_b_val: o.senkou_span_b,
            chikou_span_val: o.chikou_span,
        }
    }
}

/// Calculate Ichimoku Cloud for arrays of high, low, and close prices.
///
/// Returns an object with arrays for each component.
#[wasm_bindgen(js_name = "ichimoku")]
pub fn ichimoku_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    tenkan_period: usize,
    kijun_period: usize,
    senkou_b_period: usize,
) -> Result<JsValue, JsError> {
    let indicator = Ichimoku::new(tenkan_period, kijun_period, senkou_b_period)
        .map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(&(&highs, &lows, &closes))
        .map_err(|e| JsError::new(&e.to_string()))?;

    let tenkan: Vec<f64> = results.iter().map(|r| r.tenkan_sen).collect();
    let kijun: Vec<f64> = results.iter().map(|r| r.kijun_sen).collect();
    let senkou_a: Vec<f64> = results.iter().map(|r| r.senkou_span_a).collect();
    let senkou_b: Vec<f64> = results.iter().map(|r| r.senkou_span_b).collect();
    let chikou: Vec<f64> = results.iter().map(|r| r.chikou_span).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("tenkanSen"),
        &js_sys::Float64Array::from(&tenkan[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set tenkanSen"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("kijunSen"),
        &js_sys::Float64Array::from(&kijun[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set kijunSen"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("senkouSpanA"),
        &js_sys::Float64Array::from(&senkou_a[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set senkouSpanA"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("senkouSpanB"),
        &js_sys::Float64Array::from(&senkou_b[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set senkouSpanB"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("chikouSpan"),
        &js_sys::Float64Array::from(&chikou[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set chikouSpan"))?;

    Ok(obj.into())
}

/// Streaming Ichimoku Cloud calculator.
#[wasm_bindgen(js_name = "IchimokuStream")]
pub struct WasmIchimokuStream {
    inner: IchimokuStream,
}

#[wasm_bindgen(js_class = "IchimokuStream")]
impl WasmIchimokuStream {
    /// Create a new streaming Ichimoku calculator with default periods (9, 26, 52).
    #[wasm_bindgen(constructor)]
    pub fn new(
        tenkan_period: Option<usize>,
        kijun_period: Option<usize>,
        senkou_b_period: Option<usize>,
    ) -> Result<WasmIchimokuStream, JsError> {
        let inner = IchimokuStream::new(
            tenkan_period.unwrap_or(9),
            kijun_period.unwrap_or(26),
            senkou_b_period.unwrap_or(52),
        )
        .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<JsValue, JsError> {
        if highs.len() != lows.len() || lows.len() != closes.len() {
            return Err(JsError::new(
                "highs, lows, and closes must have the same length",
            ));
        }

        let bars: Vec<IchimokuBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        let results = self
            .inner
            .init(&bars)
            .map_err(|e| JsError::new(&e.to_string()))?;

        let tenkan: Vec<f64> = results.iter().map(|r| r.tenkan_sen).collect();
        let kijun: Vec<f64> = results.iter().map(|r| r.kijun_sen).collect();
        let senkou_a: Vec<f64> = results.iter().map(|r| r.senkou_span_a).collect();
        let senkou_b: Vec<f64> = results.iter().map(|r| r.senkou_span_b).collect();
        let chikou: Vec<f64> = results.iter().map(|r| r.chikou_span).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("tenkanSen"),
            &js_sys::Float64Array::from(&tenkan[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set tenkanSen"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("kijunSen"),
            &js_sys::Float64Array::from(&kijun[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set kijunSen"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("senkouSpanA"),
            &js_sys::Float64Array::from(&senkou_a[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set senkouSpanA"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("senkouSpanB"),
            &js_sys::Float64Array::from(&senkou_b[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set senkouSpanB"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("chikouSpan"),
            &js_sys::Float64Array::from(&chikou[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set chikouSpan"))?;

        Ok(obj.into())
    }

    /// Process next bar.
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Option<WasmIchimokuOutput> {
        self.inner.next((high, low, close)).map(WasmIchimokuOutput::from)
    }

    /// Reset the calculator.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if ready.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the Tenkan-sen period.
    #[wasm_bindgen(getter, js_name = "tenkanPeriod")]
    pub fn tenkan_period(&self) -> usize {
        self.inner.tenkan_period()
    }

    /// Get the Kijun-sen period.
    #[wasm_bindgen(getter, js_name = "kijunPeriod")]
    pub fn kijun_period(&self) -> usize {
        self.inner.kijun_period()
    }

    /// Get the Senkou Span B period.
    #[wasm_bindgen(getter, js_name = "senkouBPeriod")]
    pub fn senkou_b_period(&self) -> usize {
        self.inner.senkou_b_period()
    }
}

// ============================================================================
// ADX (Average Directional Index)
// ============================================================================

/// ADX output for WASM.
#[wasm_bindgen]
pub struct WasmAdxOutput {
    adx_val: f64,
    plus_di_val: f64,
    minus_di_val: f64,
}

#[wasm_bindgen]
impl WasmAdxOutput {
    /// ADX value (0-100)
    #[wasm_bindgen(getter)]
    pub fn adx(&self) -> f64 {
        self.adx_val
    }

    /// +DI value (0-100)
    #[wasm_bindgen(getter, js_name = "plusDi")]
    pub fn plus_di(&self) -> f64 {
        self.plus_di_val
    }

    /// -DI value (0-100)
    #[wasm_bindgen(getter, js_name = "minusDi")]
    pub fn minus_di(&self) -> f64 {
        self.minus_di_val
    }
}

impl From<AdxOutput> for WasmAdxOutput {
    fn from(o: AdxOutput) -> Self {
        Self {
            adx_val: o.adx,
            plus_di_val: o.plus_di,
            minus_di_val: o.minus_di,
        }
    }
}

/// Calculate ADX for arrays of high, low, and close prices.
///
/// Returns an object with `adx`, `plusDi`, and `minusDi` arrays.
#[wasm_bindgen(js_name = "adx")]
pub fn adx_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: usize,
) -> Result<JsValue, JsError> {
    let indicator = Adx::new(period).map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(&(&highs, &lows, &closes))
        .map_err(|e| JsError::new(&e.to_string()))?;

    let adx_vals: Vec<f64> = results.iter().map(|r| r.adx).collect();
    let plus_di: Vec<f64> = results.iter().map(|r| r.plus_di).collect();
    let minus_di: Vec<f64> = results.iter().map(|r| r.minus_di).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("adx"),
        &js_sys::Float64Array::from(&adx_vals[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set adx"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("plusDi"),
        &js_sys::Float64Array::from(&plus_di[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set plusDi"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("minusDi"),
        &js_sys::Float64Array::from(&minus_di[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set minusDi"))?;

    Ok(obj.into())
}

/// Streaming ADX calculator.
#[wasm_bindgen(js_name = "AdxStream")]
pub struct WasmAdxStream {
    inner: AdxStream,
}

#[wasm_bindgen(js_class = "AdxStream")]
impl WasmAdxStream {
    /// Create a new streaming ADX calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize) -> Result<WasmAdxStream, JsError> {
        let inner = AdxStream::new(period).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<JsValue, JsError> {
        if highs.len() != lows.len() || lows.len() != closes.len() {
            return Err(JsError::new(
                "highs, lows, and closes must have the same length",
            ));
        }

        let bars: Vec<AdxBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        let results = self
            .inner
            .init(&bars)
            .map_err(|e| JsError::new(&e.to_string()))?;

        let adx_vals: Vec<f64> = results.iter().map(|r| r.adx).collect();
        let plus_di: Vec<f64> = results.iter().map(|r| r.plus_di).collect();
        let minus_di: Vec<f64> = results.iter().map(|r| r.minus_di).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("adx"),
            &js_sys::Float64Array::from(&adx_vals[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set adx"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("plusDi"),
            &js_sys::Float64Array::from(&plus_di[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set plusDi"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("minusDi"),
            &js_sys::Float64Array::from(&minus_di[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set minusDi"))?;

        Ok(obj.into())
    }

    /// Process next bar.
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Option<WasmAdxOutput> {
        self.inner.next((high, low, close)).map(WasmAdxOutput::from)
    }

    /// Get current values.
    pub fn current(&self) -> Option<WasmAdxOutput> {
        self.inner.current().map(WasmAdxOutput::from)
    }

    /// Reset the calculator.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if ready.
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
// Linear Regression Channels
// ============================================================================

/// Linear Regression output for WASM.
#[wasm_bindgen]
pub struct WasmLinRegOutput {
    value_val: f64,
    upper_val: f64,
    lower_val: f64,
    slope_val: f64,
    r_val: f64,
    r_squared_val: f64,
}

#[wasm_bindgen]
impl WasmLinRegOutput {
    /// Regression value
    #[wasm_bindgen(getter)]
    pub fn value(&self) -> f64 {
        self.value_val
    }

    /// Upper channel
    #[wasm_bindgen(getter)]
    pub fn upper(&self) -> f64 {
        self.upper_val
    }

    /// Lower channel
    #[wasm_bindgen(getter)]
    pub fn lower(&self) -> f64 {
        self.lower_val
    }

    /// Slope
    #[wasm_bindgen(getter)]
    pub fn slope(&self) -> f64 {
        self.slope_val
    }

    /// Pearson's R (-1 to 1)
    #[wasm_bindgen(getter)]
    pub fn r(&self) -> f64 {
        self.r_val
    }

    /// R-squared (0 to 1)
    #[wasm_bindgen(getter, js_name = "rSquared")]
    pub fn r_squared(&self) -> f64 {
        self.r_squared_val
    }
}

impl From<LinRegOutput> for WasmLinRegOutput {
    fn from(o: LinRegOutput) -> Self {
        Self {
            value_val: o.value,
            upper_val: o.upper,
            lower_val: o.lower,
            slope_val: o.slope,
            r_val: o.r,
            r_squared_val: o.r_squared,
        }
    }
}

/// Calculate Linear Regression Channels for an array of prices.
///
/// Returns an object with arrays for value, upper, lower, slope, r, and rSquared.
#[wasm_bindgen(js_name = "linreg")]
pub fn linreg_batch(
    data: &[f64],
    period: usize,
    num_std_dev: Option<f64>,
) -> Result<JsValue, JsError> {
    let indicator =
        LinReg::new(period, num_std_dev.unwrap_or(2.0)).map_err(|e| JsError::new(&e.to_string()))?;
    let results = indicator
        .calculate(data)
        .map_err(|e| JsError::new(&e.to_string()))?;

    let values: Vec<f64> = results.iter().map(|r| r.value).collect();
    let upper: Vec<f64> = results.iter().map(|r| r.upper).collect();
    let lower: Vec<f64> = results.iter().map(|r| r.lower).collect();
    let slope: Vec<f64> = results.iter().map(|r| r.slope).collect();
    let r: Vec<f64> = results.iter().map(|r| r.r).collect();
    let r_squared: Vec<f64> = results.iter().map(|r| r.r_squared).collect();

    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("value"),
        &js_sys::Float64Array::from(&values[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set value"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("upper"),
        &js_sys::Float64Array::from(&upper[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set upper"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("lower"),
        &js_sys::Float64Array::from(&lower[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set lower"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("slope"),
        &js_sys::Float64Array::from(&slope[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set slope"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("r"),
        &js_sys::Float64Array::from(&r[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set r"))?;
    js_sys::Reflect::set(
        &obj,
        &JsValue::from_str("rSquared"),
        &js_sys::Float64Array::from(&r_squared[..]).into(),
    )
    .map_err(|_| JsError::new("Failed to set rSquared"))?;

    Ok(obj.into())
}

/// Streaming Linear Regression calculator.
#[wasm_bindgen(js_name = "LinRegStream")]
pub struct WasmLinRegStream {
    inner: LinRegStream,
}

#[wasm_bindgen(js_class = "LinRegStream")]
impl WasmLinRegStream {
    /// Create a new streaming Linear Regression calculator.
    #[wasm_bindgen(constructor)]
    pub fn new(period: usize, num_std_dev: Option<f64>) -> Result<WasmLinRegStream, JsError> {
        let inner = LinRegStream::new(period, num_std_dev.unwrap_or(2.0))
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Self { inner })
    }

    /// Initialize with historical data.
    #[wasm_bindgen(js_name = "init")]
    pub fn init_history(&mut self, data: &[f64]) -> Result<JsValue, JsError> {
        let results = self
            .inner
            .init(data)
            .map_err(|e| JsError::new(&e.to_string()))?;

        let values: Vec<f64> = results.iter().map(|r| r.value).collect();
        let upper: Vec<f64> = results.iter().map(|r| r.upper).collect();
        let lower: Vec<f64> = results.iter().map(|r| r.lower).collect();
        let slope: Vec<f64> = results.iter().map(|r| r.slope).collect();
        let r: Vec<f64> = results.iter().map(|r| r.r).collect();
        let r_squared: Vec<f64> = results.iter().map(|r| r.r_squared).collect();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("value"),
            &js_sys::Float64Array::from(&values[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set value"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("upper"),
            &js_sys::Float64Array::from(&upper[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set upper"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("lower"),
            &js_sys::Float64Array::from(&lower[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set lower"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("slope"),
            &js_sys::Float64Array::from(&slope[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set slope"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("r"),
            &js_sys::Float64Array::from(&r[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set r"))?;
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("rSquared"),
            &js_sys::Float64Array::from(&r_squared[..]).into(),
        )
        .map_err(|_| JsError::new("Failed to set rSquared"))?;

        Ok(obj.into())
    }

    /// Process next value.
    pub fn next(&mut self, value: f64) -> Option<WasmLinRegOutput> {
        self.inner.next(value).map(WasmLinRegOutput::from)
    }

    /// Reset the calculator.
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Check if ready.
    #[wasm_bindgen(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    /// Get the period.
    #[wasm_bindgen(getter)]
    pub fn period(&self) -> usize {
        self.inner.period()
    }

    /// Get the number of standard deviations.
    #[wasm_bindgen(getter, js_name = "numStdDev")]
    pub fn num_std_dev(&self) -> f64 {
        self.inner.num_std_dev()
    }
}
