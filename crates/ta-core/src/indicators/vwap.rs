//! Volume Weighted Average Price (VWAP) indicator.
//!
//! VWAP is the ratio of cumulative typical price × volume to cumulative volume.
//! It provides a benchmark for the average price weighted by trading activity.
//!
//! # Formula
//! ```text
//! Typical Price = (High + Low + Close) / 3
//! VWAP = Σ(Typical Price × Volume) / Σ(Volume)
//! ```
//!
//! # Modes
//! - **Session VWAP**: Resets at the start of each trading day (UTC)
//! - **Rolling VWAP**: Uses a sliding window of N bars
//! - **Anchored VWAP**: Calculates from a specific starting index
//!
//! # Example (Session VWAP - Batch)
//! ```
//! use ta_core::indicators::vwap::SessionVwap;
//! use ta_core::traits::Indicator;
//! use ta_core::types::OHLCV;
//!
//! let vwap = SessionVwap::new();
//! let candles = vec![
//!     OHLCV::new(1700000000000, 100.0, 105.0, 99.0, 102.0, 1000.0),
//!     OHLCV::new(1700000060000, 102.0, 106.0, 101.0, 104.0, 1500.0),
//! ];
//! let result = vwap.calculate(&candles).unwrap();
//! ```
//!
//! # Example (Rolling VWAP - Streaming)
//! ```
//! use ta_core::indicators::vwap::RollingVwapStream;
//! use ta_core::traits::StreamingIndicator;
//! use ta_core::types::OHLCV;
//!
//! let mut vwap = RollingVwapStream::new(20).unwrap();
//! let candles = vec![
//!     OHLCV::new(1700000000000, 100.0, 105.0, 99.0, 102.0, 1000.0),
//!     // ... more candles
//! ];
//! vwap.init(&candles).unwrap();
//! let new_vwap = vwap.next(OHLCV::new(1700001200000, 103.0, 107.0, 102.0, 105.0, 2000.0));
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult, VwapBar, OHLCV};

// ============================================================================
// Constants
// ============================================================================

/// Milliseconds in one day (24 hours)
const MS_PER_DAY: i64 = 86_400_000;

// ============================================================================
// Helper Functions
// ============================================================================

/// Get the UTC day number from a Unix timestamp in milliseconds.
/// This is used to detect session boundaries.
#[inline]
fn utc_day(timestamp_ms: i64) -> i64 {
    timestamp_ms.div_euclid(MS_PER_DAY)
}

trait VwapInput {
    fn timestamp(&self) -> i64;
    fn high(&self) -> f64;
    fn low(&self) -> f64;
    fn close(&self) -> f64;
    fn volume(&self) -> f64;
}

impl VwapInput for OHLCV {
    fn timestamp(&self) -> i64 {
        self.timestamp
    }

    fn high(&self) -> f64 {
        self.high
    }

    fn low(&self) -> f64 {
        self.low
    }

    fn close(&self) -> f64 {
        self.close
    }

    fn volume(&self) -> f64 {
        self.volume
    }
}

impl VwapInput for VwapBar {
    fn timestamp(&self) -> i64 {
        self.timestamp
    }

    fn high(&self) -> f64 {
        self.high
    }

    fn low(&self) -> f64 {
        self.low
    }

    fn close(&self) -> f64 {
        self.close
    }

    fn volume(&self) -> f64 {
        self.volume
    }
}

/// Calculate typical price for a VWAP input bar.
#[inline]
fn typical_price<T: VwapInput>(bar: &T) -> f64 {
    (bar.high() + bar.low() + bar.close()) / 3.0
}

// ============================================================================
// Session VWAP (Daily Reset)
// ============================================================================

/// Session VWAP calculator for batch operations.
///
/// Resets at the start of each UTC day.
#[derive(Debug, Clone, Default)]
pub struct SessionVwap;

impl SessionVwap {
    /// Creates a new Session VWAP calculator.
    #[must_use]
    pub const fn new() -> Self {
        Self
    }

    /// Calculates VWAP from native timestamped HLCV bars.
    pub fn calculate_bars(&self, data: &[VwapBar]) -> IndicatorResult<Vec<f64>> {
        calculate_session(data)
    }
}

impl Indicator<&[OHLCV], Vec<f64>> for SessionVwap {
    fn calculate(&self, data: &[OHLCV]) -> IndicatorResult<Vec<f64>> {
        calculate_session(data)
    }
}

fn calculate_session<T: VwapInput>(data: &[T]) -> IndicatorResult<Vec<f64>> {
    if data.is_empty() {
        return Ok(vec![]);
    }

    let mut result = Vec::with_capacity(data.len());
    let mut cum_tp_vol = 0.0;
    let mut cum_vol = 0.0;
    let mut current_day = utc_day(data[0].timestamp());

    for bar in data {
        let day = utc_day(bar.timestamp());

        if day != current_day {
            cum_tp_vol = 0.0;
            cum_vol = 0.0;
            current_day = day;
        }

        let tp = typical_price(bar);
        cum_tp_vol += tp * bar.volume();
        cum_vol += bar.volume();

        if cum_vol > 0.0 {
            result.push(cum_tp_vol / cum_vol);
        } else {
            result.push(f64::NAN);
        }
    }

    Ok(result)
}

/// Streaming Session VWAP calculator for real-time O(1) updates.
///
/// Resets at the start of each UTC day.
#[derive(Debug, Clone)]
pub struct SessionVwapStream {
    cum_tp_vol: f64,
    cum_vol: f64,
    current_day: i64,
    initialized: bool,
}

impl Default for SessionVwapStream {
    fn default() -> Self {
        Self::new()
    }
}

impl SessionVwapStream {
    /// Creates a new streaming Session VWAP calculator.
    #[must_use]
    pub const fn new() -> Self {
        Self {
            cum_tp_vol: 0.0,
            cum_vol: 0.0,
            current_day: 0,
            initialized: false,
        }
    }

    /// Returns the current VWAP value without consuming a new candle.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.initialized && self.cum_vol > 0.0 {
            Some(self.cum_tp_vol / self.cum_vol)
        } else {
            None
        }
    }

    /// Returns the current cumulative typical price × volume.
    #[must_use]
    pub fn cumulative_tp_volume(&self) -> f64 {
        self.cum_tp_vol
    }

    /// Returns the current cumulative volume.
    #[must_use]
    pub fn cumulative_volume(&self) -> f64 {
        self.cum_vol
    }

    /// Initializes the stream from native timestamped HLCV bars.
    pub fn init_bars(&mut self, data: &[VwapBar]) -> IndicatorResult<Vec<f64>> {
        self.init_input(data)
    }

    fn init_input<T: VwapInput>(&mut self, data: &[T]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        if data.is_empty() {
            return Ok(vec![]);
        }

        let mut result = Vec::with_capacity(data.len());
        self.current_day = utc_day(data[0].timestamp());
        self.initialized = true;

        for bar in data {
            result.push(self.next_input(bar).unwrap_or(f64::NAN));
        }

        Ok(result)
    }

    /// Processes one native timestamped HLCV bar.
    pub fn next_bar(&mut self, bar: VwapBar) -> Option<f64> {
        self.next_input(&bar)
    }

    fn next_input<T: VwapInput>(&mut self, bar: &T) -> Option<f64> {
        let day = utc_day(bar.timestamp());

        if !self.initialized || day != self.current_day {
            self.cum_tp_vol = 0.0;
            self.cum_vol = 0.0;
            self.current_day = day;
            self.initialized = true;
        }

        let tp = typical_price(bar);
        self.cum_tp_vol += tp * bar.volume();
        self.cum_vol += bar.volume();

        if self.cum_vol > 0.0 {
            Some(self.cum_tp_vol / self.cum_vol)
        } else {
            None
        }
    }
}

impl StreamingIndicator<OHLCV, f64> for SessionVwapStream {
    fn init(&mut self, data: &[OHLCV]) -> IndicatorResult<Vec<f64>> {
        self.init_input(data)
    }

    fn next(&mut self, candle: OHLCV) -> Option<f64> {
        self.next_input(&candle)
    }

    fn reset(&mut self) {
        self.cum_tp_vol = 0.0;
        self.cum_vol = 0.0;
        self.current_day = 0;
        self.initialized = false;
    }

    fn is_ready(&self) -> bool {
        self.initialized
    }
}

// ============================================================================
// Rolling VWAP (Window-based)
// ============================================================================

/// Rolling VWAP calculator for batch operations.
///
/// Uses a sliding window of N bars.
#[derive(Debug, Clone)]
pub struct RollingVwap {
    period: usize,
}

impl RollingVwap {
    /// Creates a new Rolling VWAP calculator with the specified period.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        Ok(Self { period })
    }

    /// Returns the period of this Rolling VWAP.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Calculates rolling VWAP from native timestamped HLCV bars.
    pub fn calculate_bars(&self, data: &[VwapBar]) -> IndicatorResult<Vec<f64>> {
        calculate_rolling(self.period, data)
    }
}

impl Indicator<&[OHLCV], Vec<f64>> for RollingVwap {
    fn calculate(&self, data: &[OHLCV]) -> IndicatorResult<Vec<f64>> {
        calculate_rolling(self.period, data)
    }
}

fn calculate_rolling<T: VwapInput>(period: usize, data: &[T]) -> IndicatorResult<Vec<f64>> {
    let len = data.len();
    let mut result = vec![f64::NAN; len];

    if len < period {
        return Ok(result);
    }

    let tp_vols: Vec<f64> = data
        .iter()
        .map(|bar| typical_price(bar) * bar.volume())
        .collect();
    let volumes: Vec<f64> = data.iter().map(|bar| bar.volume()).collect();

    let mut sum_tp_vol: f64 = tp_vols[..period].iter().sum();
    let mut sum_vol: f64 = volumes[..period].iter().sum();

    if sum_vol > 0.0 {
        result[period - 1] = sum_tp_vol / sum_vol;
    }

    for i in period..len {
        sum_tp_vol += tp_vols[i] - tp_vols[i - period];
        sum_vol += volumes[i] - volumes[i - period];

        if sum_vol > 0.0 {
            result[i] = sum_tp_vol / sum_vol;
        }
    }

    Ok(result)
}

/// Streaming Rolling VWAP calculator for real-time O(1) updates.
///
/// Uses a ring buffer for the sliding window.
#[derive(Debug, Clone)]
pub struct RollingVwapStream {
    period: usize,
    tp_vol_buffer: Vec<f64>,
    vol_buffer: Vec<f64>,
    buffer_idx: usize,
    sum_tp_vol: f64,
    sum_vol: f64,
    count: usize,
}

impl RollingVwapStream {
    /// Creates a new streaming Rolling VWAP calculator with the specified period.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        Ok(Self {
            period,
            tp_vol_buffer: vec![0.0; period],
            vol_buffer: vec![0.0; period],
            buffer_idx: 0,
            sum_tp_vol: 0.0,
            sum_vol: 0.0,
            count: 0,
        })
    }

    /// Returns the period of this Rolling VWAP.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the current VWAP value without consuming a new candle.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.is_ready() && self.sum_vol > 0.0 {
            Some(self.sum_tp_vol / self.sum_vol)
        } else {
            None
        }
    }

    /// Initializes the stream from native timestamped HLCV bars.
    pub fn init_bars(&mut self, data: &[VwapBar]) -> IndicatorResult<Vec<f64>> {
        self.init_input(data)
    }

    fn init_input<T: VwapInput>(&mut self, data: &[T]) -> IndicatorResult<Vec<f64>> {
        self.reset();
        let mut result = Vec::with_capacity(data.len());

        for bar in data {
            result.push(self.next_input(bar).unwrap_or(f64::NAN));
        }

        Ok(result)
    }

    /// Processes one native timestamped HLCV bar.
    pub fn next_bar(&mut self, bar: VwapBar) -> Option<f64> {
        self.next_input(&bar)
    }

    fn next_input<T: VwapInput>(&mut self, bar: &T) -> Option<f64> {
        let tp_vol = typical_price(bar) * bar.volume();
        let vol = bar.volume();

        if self.count >= self.period {
            self.sum_tp_vol -= self.tp_vol_buffer[self.buffer_idx];
            self.sum_vol -= self.vol_buffer[self.buffer_idx];
        }

        self.tp_vol_buffer[self.buffer_idx] = tp_vol;
        self.vol_buffer[self.buffer_idx] = vol;
        self.sum_tp_vol += tp_vol;
        self.sum_vol += vol;

        self.buffer_idx = (self.buffer_idx + 1) % self.period;
        self.count = self.count.saturating_add(1);

        if self.count >= self.period && self.sum_vol > 0.0 {
            Some(self.sum_tp_vol / self.sum_vol)
        } else {
            None
        }
    }
}

impl StreamingIndicator<OHLCV, f64> for RollingVwapStream {
    fn init(&mut self, data: &[OHLCV]) -> IndicatorResult<Vec<f64>> {
        self.init_input(data)
    }

    fn next(&mut self, candle: OHLCV) -> Option<f64> {
        self.next_input(&candle)
    }

    fn reset(&mut self) {
        self.tp_vol_buffer.fill(0.0);
        self.vol_buffer.fill(0.0);
        self.buffer_idx = 0;
        self.sum_tp_vol = 0.0;
        self.sum_vol = 0.0;
        self.count = 0;
    }

    fn is_ready(&self) -> bool {
        self.count >= self.period
    }
}

// ============================================================================
// Anchored VWAP (From Specific Index)
// ============================================================================

/// Anchored VWAP calculator for batch operations.
///
/// Calculates VWAP starting from a specific anchor index.
#[derive(Debug, Clone)]
pub struct AnchoredVwap {
    anchor_index: usize,
}

impl AnchoredVwap {
    /// Creates a new Anchored VWAP calculator starting from the given index.
    #[must_use]
    pub const fn new(anchor_index: usize) -> Self {
        Self { anchor_index }
    }

    /// Creates an Anchored VWAP calculator starting from a specific timestamp.
    ///
    /// Returns `None` if no candle matches or comes after the anchor timestamp.
    #[must_use]
    pub fn from_timestamp(data: &[OHLCV], anchor_timestamp: i64) -> Option<Self> {
        data.iter()
            .position(|c| c.timestamp >= anchor_timestamp)
            .map(|idx| Self::new(idx))
    }

    /// Creates an Anchored VWAP calculator from native timestamped HLCV bars.
    #[must_use]
    pub fn from_timestamp_bars(data: &[VwapBar], anchor_timestamp: i64) -> Option<Self> {
        data.iter()
            .position(|bar| bar.timestamp >= anchor_timestamp)
            .map(Self::new)
    }

    /// Returns the anchor index.
    #[must_use]
    pub const fn anchor_index(&self) -> usize {
        self.anchor_index
    }

    /// Calculates anchored VWAP from native timestamped HLCV bars.
    pub fn calculate_bars(&self, data: &[VwapBar]) -> IndicatorResult<Vec<f64>> {
        calculate_anchored(self.anchor_index, data)
    }
}

impl Indicator<&[OHLCV], Vec<f64>> for AnchoredVwap {
    fn calculate(&self, data: &[OHLCV]) -> IndicatorResult<Vec<f64>> {
        calculate_anchored(self.anchor_index, data)
    }
}

fn calculate_anchored<T: VwapInput>(anchor_index: usize, data: &[T]) -> IndicatorResult<Vec<f64>> {
    let len = data.len();
    let mut result = vec![f64::NAN; len];

    if anchor_index >= len {
        return Ok(result);
    }

    let mut cum_tp_vol = 0.0;
    let mut cum_vol = 0.0;

    for (i, bar) in data.iter().enumerate().skip(anchor_index) {
        let tp = typical_price(bar);
        cum_tp_vol += tp * bar.volume();
        cum_vol += bar.volume();

        if cum_vol > 0.0 {
            result[i] = cum_tp_vol / cum_vol;
        }
    }

    Ok(result)
}

/// Streaming Anchored VWAP calculator for real-time O(1) updates.
///
/// Once anchored, accumulates from that point forward.
#[derive(Debug, Clone)]
pub struct AnchoredVwapStream {
    cum_tp_vol: f64,
    cum_vol: f64,
    anchor_timestamp: Option<i64>,
    anchored: bool,
}

impl Default for AnchoredVwapStream {
    fn default() -> Self {
        Self::new()
    }
}

impl AnchoredVwapStream {
    /// Creates a new streaming Anchored VWAP calculator.
    ///
    /// Use `set_anchor()` or `anchor_now()` to set the anchor point.
    #[must_use]
    pub const fn new() -> Self {
        Self {
            cum_tp_vol: 0.0,
            cum_vol: 0.0,
            anchor_timestamp: None,
            anchored: false,
        }
    }

    /// Creates a new streaming Anchored VWAP calculator with a specific anchor timestamp.
    #[must_use]
    pub const fn with_anchor(anchor_timestamp: i64) -> Self {
        Self {
            cum_tp_vol: 0.0,
            cum_vol: 0.0,
            anchor_timestamp: Some(anchor_timestamp),
            anchored: false,
        }
    }

    /// Sets the anchor timestamp. VWAP will start accumulating from this point.
    pub fn set_anchor(&mut self, timestamp: i64) {
        self.anchor_timestamp = Some(timestamp);
        self.anchored = false;
        self.cum_tp_vol = 0.0;
        self.cum_vol = 0.0;
    }

    /// Anchors at the next candle received.
    pub fn anchor_now(&mut self) {
        self.anchor_timestamp = None;
        self.anchored = false;
        self.cum_tp_vol = 0.0;
        self.cum_vol = 0.0;
    }

    /// Returns the current VWAP value without consuming a new candle.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.anchored && self.cum_vol > 0.0 {
            Some(self.cum_tp_vol / self.cum_vol)
        } else {
            None
        }
    }

    /// Returns the anchor timestamp if set.
    #[must_use]
    pub const fn anchor_timestamp(&self) -> Option<i64> {
        self.anchor_timestamp
    }

    /// Returns the current cumulative typical price × volume.
    #[must_use]
    pub fn cumulative_tp_volume(&self) -> f64 {
        self.cum_tp_vol
    }

    /// Returns the current cumulative volume.
    #[must_use]
    pub fn cumulative_volume(&self) -> f64 {
        self.cum_vol
    }

    /// Initializes the stream from native timestamped HLCV bars.
    pub fn init_bars(&mut self, data: &[VwapBar]) -> IndicatorResult<Vec<f64>> {
        self.init_input(data)
    }

    fn init_input<T: VwapInput>(&mut self, data: &[T]) -> IndicatorResult<Vec<f64>> {
        self.cum_tp_vol = 0.0;
        self.cum_vol = 0.0;
        self.anchored = false;

        let mut result = Vec::with_capacity(data.len());
        for bar in data {
            result.push(self.next_input(bar).unwrap_or(f64::NAN));
        }

        Ok(result)
    }

    /// Processes one native timestamped HLCV bar.
    pub fn next_bar(&mut self, bar: VwapBar) -> Option<f64> {
        self.next_input(&bar)
    }

    fn next_input<T: VwapInput>(&mut self, bar: &T) -> Option<f64> {
        if !self.anchored {
            match self.anchor_timestamp {
                Some(timestamp) if bar.timestamp() >= timestamp => {
                    self.anchored = true;
                }
                None => {
                    self.anchored = true;
                    self.anchor_timestamp = Some(bar.timestamp());
                }
                _ => return None,
            }
        }

        let tp = typical_price(bar);
        self.cum_tp_vol += tp * bar.volume();
        self.cum_vol += bar.volume();

        if self.cum_vol > 0.0 {
            Some(self.cum_tp_vol / self.cum_vol)
        } else {
            None
        }
    }
}

impl StreamingIndicator<OHLCV, f64> for AnchoredVwapStream {
    fn init(&mut self, data: &[OHLCV]) -> IndicatorResult<Vec<f64>> {
        self.init_input(data)
    }

    fn next(&mut self, candle: OHLCV) -> Option<f64> {
        self.next_input(&candle)
    }

    fn reset(&mut self) {
        self.cum_tp_vol = 0.0;
        self.cum_vol = 0.0;
        self.anchor_timestamp = None;
        self.anchored = false;
    }

    fn is_ready(&self) -> bool {
        self.anchored
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn make_candles(
        prices_and_volumes: &[(f64, f64, f64, f64, f64)],
        start_ts: i64,
        interval_ms: i64,
    ) -> Vec<OHLCV> {
        prices_and_volumes
            .iter()
            .enumerate()
            .map(|(i, &(o, h, l, c, v))| {
                OHLCV::new(start_ts + (i as i64) * interval_ms, o, h, l, c, v)
            })
            .collect()
    }

    fn approx_eq(a: f64, b: f64, epsilon: f64) -> bool {
        if a.is_nan() && b.is_nan() {
            return true;
        }
        (a - b).abs() < epsilon
    }

    // ========== Session VWAP Tests ==========

    #[test]
    fn test_session_vwap_single_day() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),  // TP = 102.0
                (102.0, 106.0, 101.0, 104.0, 1500.0), // TP = 103.67
                (104.0, 108.0, 103.0, 106.0, 2000.0), // TP = 105.67
            ],
            1700000000000, // Some timestamp
            60000,         // 1 minute intervals
        );

        let vwap = SessionVwap::new();
        let result = vwap.calculate(&candles).unwrap();

        // Manual calculation:
        // Bar 0: VWAP = (102 * 1000) / 1000 = 102
        // Bar 1: VWAP = (102 * 1000 + 103.67 * 1500) / 2500 = 257500 / 2500 = 103
        // Bar 2: VWAP = (102 * 1000 + 103.67 * 1500 + 105.67 * 2000) / 4500 = 468840 / 4500 ≈ 104.19

        assert!(approx_eq(result[0], 102.0, 0.01));
        assert!(approx_eq(
            result[1],
            (102.0 * 1000.0 + ((106.0 + 101.0 + 104.0) / 3.0) * 1500.0) / 2500.0,
            0.01
        ));
    }

    #[test]
    fn test_session_vwap_day_reset() {
        // Day 1: starts at timestamp 0 (day 0)
        // Day 2: starts at timestamp 86400000 (day 1)
        let candles = vec![
            OHLCV::new(0, 100.0, 105.0, 99.0, 102.0, 1000.0), // Day 0
            OHLCV::new(60000, 102.0, 106.0, 101.0, 104.0, 1500.0), // Day 0
            OHLCV::new(86400000, 50.0, 55.0, 49.0, 52.0, 2000.0), // Day 1 - should reset
            OHLCV::new(86460000, 52.0, 56.0, 51.0, 54.0, 1000.0), // Day 1
        ];

        let vwap = SessionVwap::new();
        let result = vwap.calculate(&candles).unwrap();

        // Day 0 values
        assert!(approx_eq(result[0], 102.0, 0.01)); // First bar of day

        // Day 1 should reset
        let tp_day1_bar0 = (55.0 + 49.0 + 52.0) / 3.0; // 52.0
        assert!(approx_eq(result[2], tp_day1_bar0, 0.01));
    }

    #[test]
    fn test_vwap_bars_match_ohlcv_calculations() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
                (104.0, 108.0, 103.0, 106.0, 2000.0),
                (106.0, 110.0, 105.0, 108.0, 1200.0),
            ],
            1700000000000,
            60000,
        );
        let bars: Vec<VwapBar> = candles.iter().copied().map(VwapBar::from).collect();

        let session_from_candles = SessionVwap::new().calculate(&candles).unwrap();
        let session_from_bars = SessionVwap::new().calculate_bars(&bars).unwrap();
        let rolling_from_candles = RollingVwap::new(3).unwrap().calculate(&candles).unwrap();
        let rolling_from_bars = RollingVwap::new(3).unwrap().calculate_bars(&bars).unwrap();
        let anchored_from_candles = AnchoredVwap::new(1).calculate(&candles).unwrap();
        let anchored_from_bars = AnchoredVwap::new(1).calculate_bars(&bars).unwrap();

        for (expected, actual) in session_from_candles.iter().zip(session_from_bars) {
            assert!(approx_eq(*expected, actual, 0.0001));
        }
        for (expected, actual) in rolling_from_candles.iter().zip(rolling_from_bars) {
            assert!(approx_eq(*expected, actual, 0.0001));
        }
        for (expected, actual) in anchored_from_candles.iter().zip(anchored_from_bars) {
            assert!(approx_eq(*expected, actual, 0.0001));
        }
    }

    #[test]
    fn test_session_vwap_negative_epoch_day_boundary() {
        let candles = vec![
            OHLCV::new(-1, 100.0, 100.0, 100.0, 100.0, 1.0),
            OHLCV::new(0, 200.0, 200.0, 200.0, 200.0, 1.0),
        ];

        let result = SessionVwap::new().calculate(&candles).unwrap();

        // -1 ms is the final instant of the UTC day before the Unix epoch.
        assert!(approx_eq(result[0], 100.0, 0.0001));
        assert!(approx_eq(result[1], 200.0, 0.0001));
    }

    #[test]
    fn test_session_vwap_stream() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
            ],
            1700000000000,
            60000,
        );

        let batch = SessionVwap::new();
        let batch_result = batch.calculate(&candles).unwrap();

        let mut stream = SessionVwapStream::new();
        let stream_result = stream.init(&candles).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());
        for (b, s) in batch_result.iter().zip(stream_result.iter()) {
            assert!(approx_eq(*b, *s, 0.0001));
        }

        // Test next()
        let next_candle = OHLCV::new(1700000120000, 104.0, 108.0, 103.0, 106.0, 2000.0);
        let next_val = stream.next(next_candle).unwrap();
        assert!(next_val > 0.0);
    }

    // ========== Rolling VWAP Tests ==========

    #[test]
    fn test_rolling_vwap_basic() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
                (104.0, 108.0, 103.0, 106.0, 2000.0),
                (106.0, 110.0, 105.0, 108.0, 1200.0),
            ],
            1700000000000,
            60000,
        );

        let vwap = RollingVwap::new(3).unwrap();
        let result = vwap.calculate(&candles).unwrap();

        // First 2 values should be NaN
        assert!(result[0].is_nan());
        assert!(result[1].is_nan());
        // Value at index 2 should be VWAP of first 3 bars
        assert!(!result[2].is_nan());
        // Value at index 3 should be VWAP of bars 1, 2, 3
        assert!(!result[3].is_nan());
    }

    #[test]
    fn test_rolling_vwap_stream_matches_batch() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
                (104.0, 108.0, 103.0, 106.0, 2000.0),
                (106.0, 110.0, 105.0, 108.0, 1200.0),
                (108.0, 112.0, 107.0, 110.0, 1800.0),
            ],
            1700000000000,
            60000,
        );

        let batch = RollingVwap::new(3).unwrap();
        let batch_result = batch.calculate(&candles).unwrap();

        let mut stream = RollingVwapStream::new(3).unwrap();
        let stream_result = stream.init(&candles).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());
        for (b, s) in batch_result.iter().zip(stream_result.iter()) {
            assert!(approx_eq(*b, *s, 0.0001));
        }
    }

    #[test]
    fn test_rolling_vwap_invalid_period() {
        assert!(RollingVwap::new(0).is_err());
        assert!(RollingVwapStream::new(0).is_err());
    }

    // ========== Anchored VWAP Tests ==========

    #[test]
    fn test_anchored_vwap_basic() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
                (104.0, 108.0, 103.0, 106.0, 2000.0),
                (106.0, 110.0, 105.0, 108.0, 1200.0),
            ],
            1700000000000,
            60000,
        );

        // Anchor at index 1
        let vwap = AnchoredVwap::new(1);
        let result = vwap.calculate(&candles).unwrap();

        // Index 0 should be NaN
        assert!(result[0].is_nan());
        // Index 1 onward should have values
        assert!(!result[1].is_nan());
        assert!(!result[2].is_nan());
        assert!(!result[3].is_nan());

        // First value at anchor should equal typical price (only one bar)
        let tp1 = (106.0 + 101.0 + 104.0) / 3.0;
        assert!(approx_eq(result[1], tp1, 0.01));
    }

    #[test]
    fn test_anchored_vwap_from_timestamp() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
                (104.0, 108.0, 103.0, 106.0, 2000.0),
            ],
            1700000000000,
            60000,
        );

        // Anchor at timestamp of second candle
        let vwap = AnchoredVwap::from_timestamp(&candles, 1700000060000).unwrap();
        assert_eq!(vwap.anchor_index(), 1);

        // Anchor at timestamp between first and second (should snap to second)
        let vwap2 = AnchoredVwap::from_timestamp(&candles, 1700000030000).unwrap();
        assert_eq!(vwap2.anchor_index(), 1);
    }

    #[test]
    fn test_anchored_vwap_stream() {
        let candles = make_candles(
            &[
                (100.0, 105.0, 99.0, 102.0, 1000.0),
                (102.0, 106.0, 101.0, 104.0, 1500.0),
                (104.0, 108.0, 103.0, 106.0, 2000.0),
            ],
            1700000000000,
            60000,
        );

        let batch = AnchoredVwap::new(1).calculate(&candles).unwrap();
        let mut stream = AnchoredVwapStream::with_anchor(1700000060000);
        let result = stream.init(&candles).unwrap();

        assert_eq!(batch.len(), result.len());
        for (batch_value, stream_value) in batch.iter().zip(result.iter()) {
            assert!(approx_eq(*batch_value, *stream_value, 0.0001));
        }
    }

    #[test]
    fn test_anchored_vwap_anchor_now() {
        let mut stream = AnchoredVwapStream::new();
        stream.anchor_now();

        // First candle should become the anchor
        let candle1 = OHLCV::new(1700000000000, 100.0, 105.0, 99.0, 102.0, 1000.0);
        let val1 = stream.next(candle1);
        assert!(val1.is_some());
        assert_eq!(stream.anchor_timestamp(), Some(1700000000000));
    }

    #[test]
    fn test_vwap_stream_readiness_current_and_reset() {
        let first = OHLCV::new(0, 100.0, 100.0, 100.0, 100.0, 1.0);
        let second = OHLCV::new(1, 200.0, 200.0, 200.0, 200.0, 1.0);

        let mut session = SessionVwapStream::new();
        assert!(!session.is_ready());
        assert_eq!(session.current(), None);
        assert_eq!(session.next(first), Some(100.0));
        assert!(session.is_ready());
        assert_eq!(session.current(), Some(100.0));
        session.reset();
        assert!(!session.is_ready());
        assert_eq!(session.current(), None);

        let mut rolling = RollingVwapStream::new(2).unwrap();
        assert_eq!(rolling.next(first), None);
        assert!(!rolling.is_ready());
        assert_eq!(rolling.current(), None);
        assert_eq!(rolling.next(second), Some(150.0));
        assert!(rolling.is_ready());
        assert_eq!(rolling.current(), Some(150.0));
        rolling.reset();
        assert!(!rolling.is_ready());
        assert_eq!(rolling.current(), None);

        let mut anchored = AnchoredVwapStream::with_anchor(second.timestamp);
        assert_eq!(anchored.next(first), None);
        assert!(!anchored.is_ready());
        assert_eq!(anchored.current(), None);
        assert_eq!(anchored.next(second), Some(200.0));
        assert!(anchored.is_ready());
        assert_eq!(anchored.current(), Some(200.0));
        anchored.reset();
        assert!(!anchored.is_ready());
        assert_eq!(anchored.current(), None);
        assert_eq!(anchored.anchor_timestamp(), None);
    }

    // ========== Edge Cases ==========

    #[test]
    fn test_empty_data() {
        let empty: Vec<OHLCV> = vec![];

        let session = SessionVwap::new();
        assert!(session.calculate(&empty).unwrap().is_empty());

        let rolling = RollingVwap::new(5).unwrap();
        assert!(rolling.calculate(&empty).unwrap().is_empty());

        let anchored = AnchoredVwap::new(0);
        assert!(anchored.calculate(&empty).unwrap().is_empty());
    }

    #[test]
    fn test_zero_volume() {
        let candles = vec![OHLCV::new(0, 100.0, 105.0, 99.0, 102.0, 0.0)];

        let vwap = SessionVwap::new();
        let result = vwap.calculate(&candles).unwrap();
        assert!(result[0].is_nan());
    }
}
