//! Cumulative Volume Delta (CVD) indicator.
//!
//! CVD tracks the cumulative difference between buying and selling pressure.
//! It's useful for identifying divergences between price and volume flow.
//!
//! The indicator supports two input modes:
//! 1. **Direct delta**: User provides pre-calculated buy-sell delta per bar
//! 2. **OHLCV approximation**: Estimate delta from candle data
//!
//! OHLCV approximation formula:
//! - `buyVolume ≈ volume * (close - low) / (high - low)`
//! - `sellVolume ≈ volume * (high - close) / (high - low)`
//! - `delta = buyVolume - sellVolume`

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::IndicatorResult;

/// Input for CVD calculation from HLC+Volume data.
/// Tuple: (high, low, close, volume)
pub type CvdBar = (f64, f64, f64, f64);

/// Batch CVD calculator using direct delta values.
///
/// # Example
/// ```
/// use ta_core::indicators::Cvd;
/// use ta_core::traits::Indicator;
///
/// let cvd = Cvd::new();
/// let deltas = vec![100.0, -50.0, 75.0, -25.0, 150.0];
/// let result = cvd.calculate(&deltas).unwrap();
/// // result = [100.0, 50.0, 125.0, 100.0, 250.0]
/// ```
pub struct Cvd;

impl Cvd {
    /// Create a new CVD calculator for direct delta input.
    #[must_use]
    pub const fn new() -> Self {
        Self
    }
}

impl Default for Cvd {
    fn default() -> Self {
        Self::new()
    }
}

impl Indicator<&[f64], Vec<f64>> for Cvd {
    fn calculate(&self, deltas: &[f64]) -> IndicatorResult<Vec<f64>> {
        if deltas.is_empty() {
            return Ok(vec![]);
        }

        let mut result = Vec::with_capacity(deltas.len());
        let mut cumulative = 0.0;

        for &delta in deltas {
            if delta.is_nan() {
                result.push(f64::NAN);
            } else {
                cumulative += delta;
                result.push(cumulative);
            }
        }

        Ok(result)
    }
}

/// Batch CVD calculator using OHLCV data.
///
/// Estimates buy/sell pressure from candle structure.
///
/// # Example
/// ```
/// use ta_core::indicators::CvdOhlcv;
/// use ta_core::traits::Indicator;
///
/// let cvd = CvdOhlcv::new();
/// // (high, low, close, volume)
/// let bars = vec![
///     (105.0, 99.0, 104.0, 1000.0),  // Bullish candle
///     (106.0, 102.0, 103.0, 800.0),  // Bearish candle
/// ];
/// let result = cvd.calculate(&bars).unwrap();
/// ```
pub struct CvdOhlcv;

impl CvdOhlcv {
    /// Create a new CVD calculator for OHLCV input.
    #[must_use]
    pub const fn new() -> Self {
        Self
    }

    /// Calculate volume delta from a single OHLCV bar.
    ///
    /// Uses the candle structure to estimate buy vs sell volume:
    /// - `buyVolume = volume * (close - low) / (high - low)`
    /// - `sellVolume = volume * (high - close) / (high - low)`
    /// - `delta = buyVolume - sellVolume`
    #[must_use]
    #[inline]
    pub fn calculate_delta(high: f64, low: f64, close: f64, volume: f64) -> f64 {
        let range = high - low;
        if range <= 0.0 || volume <= 0.0 {
            return 0.0;
        }

        // Buy pressure: how much price moved up from low
        let buy_ratio = (close - low) / range;
        // Sell pressure: how much price moved down from high
        let sell_ratio = (high - close) / range;

        // Delta = (buy_ratio - sell_ratio) * volume
        // Simplified: (2 * close - high - low) / range * volume
        (buy_ratio - sell_ratio) * volume
    }
}

impl Default for CvdOhlcv {
    fn default() -> Self {
        Self::new()
    }
}

impl Indicator<&[CvdBar], Vec<f64>> for CvdOhlcv {
    fn calculate(&self, bars: &[CvdBar]) -> IndicatorResult<Vec<f64>> {
        if bars.is_empty() {
            return Ok(vec![]);
        }

        let mut result = Vec::with_capacity(bars.len());
        let mut cumulative = 0.0;

        for &(high, low, close, volume) in bars {
            let delta = Self::calculate_delta(high, low, close, volume);
            cumulative += delta;
            result.push(cumulative);
        }

        Ok(result)
    }
}

/// Streaming CVD calculator for direct delta input.
///
/// # Example
/// ```
/// use ta_core::indicators::CvdStream;
/// use ta_core::traits::StreamingIndicator;
///
/// let mut stream = CvdStream::new();
/// let history = vec![100.0, -50.0, 75.0];
/// stream.init(&history);
///
/// // O(1) updates
/// let cvd = stream.next(200.0); // Returns Some(325.0)
/// ```
pub struct CvdStream {
    cumulative: f64,
    ready: bool,
}

impl CvdStream {
    /// Create a new streaming CVD calculator.
    #[must_use]
    pub fn new() -> Self {
        Self {
            cumulative: 0.0,
            ready: false,
        }
    }

    /// Get the current CVD value.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.ready {
            Some(self.cumulative)
        } else {
            None
        }
    }
}

impl Default for CvdStream {
    fn default() -> Self {
        Self::new()
    }
}

impl StreamingIndicator<f64, f64> for CvdStream {
    fn init(&mut self, deltas: &[f64]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        if deltas.is_empty() {
            return Ok(vec![]);
        }

        let mut result = Vec::with_capacity(deltas.len());

        for &delta in deltas {
            if delta.is_nan() {
                result.push(f64::NAN);
            } else {
                self.cumulative += delta;
                self.ready = true;
                result.push(self.cumulative);
            }
        }

        Ok(result)
    }

    fn next(&mut self, delta: f64) -> Option<f64> {
        if delta.is_nan() {
            return if self.ready { Some(self.cumulative) } else { None };
        }

        self.cumulative += delta;
        self.ready = true;
        Some(self.cumulative)
    }

    fn reset(&mut self) {
        self.cumulative = 0.0;
        self.ready = false;
    }

    fn is_ready(&self) -> bool {
        self.ready
    }
}

/// Streaming CVD calculator for OHLCV input.
///
/// # Example
/// ```
/// use ta_core::indicators::CvdOhlcvStream;
/// use ta_core::traits::StreamingIndicator;
///
/// let mut stream = CvdOhlcvStream::new();
/// // (high, low, close, volume)
/// let history = vec![
///     (105.0, 99.0, 104.0, 1000.0),
///     (106.0, 102.0, 103.0, 800.0),
/// ];
/// stream.init(&history);
///
/// // O(1) updates
/// let cvd = stream.next((108.0, 102.0, 107.0, 1200.0));
/// ```
pub struct CvdOhlcvStream {
    cumulative: f64,
    ready: bool,
}

impl CvdOhlcvStream {
    /// Create a new streaming CVD calculator for OHLCV data.
    #[must_use]
    pub fn new() -> Self {
        Self {
            cumulative: 0.0,
            ready: false,
        }
    }

    /// Get the current CVD value.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.ready {
            Some(self.cumulative)
        } else {
            None
        }
    }
}

impl Default for CvdOhlcvStream {
    fn default() -> Self {
        Self::new()
    }
}

impl StreamingIndicator<CvdBar, f64> for CvdOhlcvStream {
    fn init(&mut self, bars: &[CvdBar]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        if bars.is_empty() {
            return Ok(vec![]);
        }

        let mut result = Vec::with_capacity(bars.len());

        for &(high, low, close, volume) in bars {
            let delta = CvdOhlcv::calculate_delta(high, low, close, volume);
            self.cumulative += delta;
            self.ready = true;
            result.push(self.cumulative);
        }

        Ok(result)
    }

    fn next(&mut self, bar: CvdBar) -> Option<f64> {
        let (high, low, close, volume) = bar;
        let delta = CvdOhlcv::calculate_delta(high, low, close, volume);
        self.cumulative += delta;
        self.ready = true;
        Some(self.cumulative)
    }

    fn reset(&mut self) {
        self.cumulative = 0.0;
        self.ready = false;
    }

    fn is_ready(&self) -> bool {
        self.ready
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cvd_direct_delta() {
        let cvd = Cvd::new();
        let deltas = vec![100.0, -50.0, 75.0, -25.0, 150.0];
        let result = cvd.calculate(&deltas).unwrap();

        assert_eq!(result.len(), 5);
        assert!((result[0] - 100.0).abs() < 1e-10);
        assert!((result[1] - 50.0).abs() < 1e-10);
        assert!((result[2] - 125.0).abs() < 1e-10);
        assert!((result[3] - 100.0).abs() < 1e-10);
        assert!((result[4] - 250.0).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_empty() {
        let cvd = Cvd::new();
        let result = cvd.calculate(&[]).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_cvd_with_nan() {
        let cvd = Cvd::new();
        let deltas = vec![100.0, f64::NAN, 50.0];
        let result = cvd.calculate(&deltas).unwrap();

        assert_eq!(result.len(), 3);
        assert!((result[0] - 100.0).abs() < 1e-10);
        assert!(result[1].is_nan());
        assert!((result[2] - 150.0).abs() < 1e-10); // Continues from 100, not NaN
    }

    #[test]
    fn test_cvd_ohlcv_bullish_candle() {
        // Bullish candle: close near high
        let delta = CvdOhlcv::calculate_delta(110.0, 100.0, 109.0, 1000.0);
        // (109-100)/(110-100) = 0.9 buy, 0.1 sell, delta = 0.8 * 1000 = 800
        assert!((delta - 800.0).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_ohlcv_bearish_candle() {
        // Bearish candle: close near low
        let delta = CvdOhlcv::calculate_delta(110.0, 100.0, 101.0, 1000.0);
        // (101-100)/(110-100) = 0.1 buy, 0.9 sell, delta = -0.8 * 1000 = -800
        assert!((delta - (-800.0)).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_ohlcv_neutral_candle() {
        // Neutral candle: close at midpoint
        let delta = CvdOhlcv::calculate_delta(110.0, 100.0, 105.0, 1000.0);
        // (105-100)/(110-100) = 0.5 buy, 0.5 sell, delta = 0
        assert!((delta - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_ohlcv_doji() {
        // Doji: high == low (no range)
        let delta = CvdOhlcv::calculate_delta(100.0, 100.0, 100.0, 1000.0);
        assert!((delta - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_ohlcv_batch() {
        let cvd = CvdOhlcv::new();
        let bars = vec![
            (110.0, 100.0, 109.0, 1000.0), // +800
            (110.0, 100.0, 101.0, 1000.0), // -800
            (110.0, 100.0, 105.0, 1000.0), // 0
        ];
        let result = cvd.calculate(&bars).unwrap();

        assert_eq!(result.len(), 3);
        assert!((result[0] - 800.0).abs() < 1e-10);
        assert!((result[1] - 0.0).abs() < 1e-10);
        assert!((result[2] - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_stream_matches_batch() {
        let deltas = vec![100.0, -50.0, 75.0, -25.0, 150.0];

        let batch = Cvd::new();
        let batch_result = batch.calculate(&deltas).unwrap();

        let mut stream = CvdStream::new();
        let stream_result = stream.init(&deltas).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());
        for (b, s) in batch_result.iter().zip(stream_result.iter()) {
            assert!((b - s).abs() < 1e-10);
        }
    }

    #[test]
    fn test_cvd_stream_continues() {
        let mut stream = CvdStream::new();
        let _ = stream.init(&[100.0, 50.0]).unwrap();

        assert!(stream.is_ready());
        assert!((stream.current().unwrap() - 150.0).abs() < 1e-10);

        let next = stream.next(100.0).unwrap();
        assert!((next - 250.0).abs() < 1e-10);
    }

    #[test]
    fn test_cvd_ohlcv_stream_matches_batch() {
        let bars = vec![
            (110.0, 100.0, 109.0, 1000.0),
            (110.0, 100.0, 101.0, 1000.0),
            (110.0, 100.0, 105.0, 1000.0),
        ];

        let batch = CvdOhlcv::new();
        let batch_result = batch.calculate(&bars).unwrap();

        let mut stream = CvdOhlcvStream::new();
        let stream_result = stream.init(&bars).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());
        for (b, s) in batch_result.iter().zip(stream_result.iter()) {
            assert!((b - s).abs() < 1e-10);
        }
    }

    #[test]
    fn test_cvd_reset() {
        let mut stream = CvdStream::new();
        let _ = stream.init(&[100.0, 50.0]).unwrap();

        stream.reset();
        assert!(!stream.is_ready());
        assert!(stream.current().is_none());

        let result = stream.init(&[100.0, 50.0]).unwrap();
        assert!((result[1] - 150.0).abs() < 1e-10);
    }
}
