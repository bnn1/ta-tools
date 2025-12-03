//! Average True Range (ATR) indicator.
//!
//! ATR measures market volatility by decomposing the entire range of an asset
//! price for a given period. It uses the True Range, which accounts for gaps.
//!
//! # True Range
//! TR = max(High - Low, |High - Prev Close|, |Low - Prev Close|)
//!
//! # ATR Calculation
//! - First ATR: Simple average of first N true ranges
//! - Subsequent: Wilder's smoothing: ATR = ((Prev ATR × (n-1)) + TR) / n
//!
//! # Default Parameters
//! - Period: 14
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Atr;
//! use ta_core::traits::Indicator;
//!
//! let atr = Atr::new(14).unwrap();
//! let highs = vec![48.7, 48.72, 48.9, 48.87, 48.82];
//! let lows = vec![47.79, 48.14, 48.39, 48.37, 48.24];
//! let closes = vec![48.16, 48.61, 48.75, 48.63, 48.74];
//! let result = atr.calculate(&(&highs, &lows, &closes)).unwrap();
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// ATR calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Atr {
    period: usize,
}

impl Atr {
    /// Creates a new ATR calculator with the specified period.
    ///
    /// # Arguments
    /// * `period` - The smoothing period (typically 14)
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

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Calculate True Range for a single bar.
    #[inline]
    fn true_range(high: f64, low: f64, prev_close: Option<f64>) -> f64 {
        match prev_close {
            Some(pc) => {
                let hl = high - low;
                let hc = (high - pc).abs();
                let lc = (low - pc).abs();
                hl.max(hc).max(lc)
            }
            None => high - low, // First bar: just use high - low
        }
    }
}

/// Input type for ATR: (highs, lows, closes)
type AtrInput<'a> = (&'a [f64], &'a [f64], &'a [f64]);

impl Indicator<&AtrInput<'_>, Vec<f64>> for Atr {
    fn calculate(&self, data: &AtrInput<'_>) -> IndicatorResult<Vec<f64>> {
        let (highs, lows, closes) = *data;
        let len = highs.len();

        // Validate input lengths match
        if lows.len() != len || closes.len() != len {
            return Err(IndicatorError::InvalidParameter(
                "highs, lows, and closes must have the same length".to_string(),
            ));
        }

        let mut result = vec![f64::NAN; len];

        if len == 0 {
            return Ok(result);
        }

        // Calculate True Ranges
        let mut true_ranges = Vec::with_capacity(len);
        true_ranges.push(Self::true_range(highs[0], lows[0], None));

        for i in 1..len {
            true_ranges.push(Self::true_range(highs[i], lows[i], Some(closes[i - 1])));
        }

        // Need at least `period` values to calculate first ATR
        if len < self.period {
            return Ok(result);
        }

        // First ATR: simple average of first `period` true ranges
        let first_atr: f64 = true_ranges[..self.period].iter().sum::<f64>() / self.period as f64;
        result[self.period - 1] = first_atr;

        // Subsequent ATRs: Wilder's smoothing
        let mut prev_atr = first_atr;
        let n = self.period as f64;

        for i in self.period..len {
            let atr = ((prev_atr * (n - 1.0)) + true_ranges[i]) / n;
            result[i] = atr;
            prev_atr = atr;
        }

        Ok(result)
    }
}

/// Streaming ATR calculator for real-time O(1) updates.
///
/// After initialization, each `next()` call is O(1) as it only needs:
/// - Previous ATR value
/// - Previous close (for True Range calculation)
#[derive(Debug)]
pub struct AtrStream {
    period: usize,
    prev_close: Option<f64>,
    prev_atr: Option<f64>,
    tr_buffer: Vec<f64>,
    count: usize,
    initialized: bool,
}

impl AtrStream {
    /// Creates a new streaming ATR calculator.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        Ok(Self {
            period,
            prev_close: None,
            prev_atr: None,
            tr_buffer: Vec::with_capacity(period),
            count: 0,
            initialized: false,
        })
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the current ATR value if available.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        self.prev_atr
    }

    /// Calculate True Range.
    #[inline]
    fn true_range(high: f64, low: f64, prev_close: Option<f64>) -> f64 {
        match prev_close {
            Some(pc) => {
                let hl = high - low;
                let hc = (high - pc).abs();
                let lc = (low - pc).abs();
                hl.max(hc).max(lc)
            }
            None => high - low,
        }
    }
}

/// Input for streaming: (high, low, close) tuple
pub type AtrBar = (f64, f64, f64);

impl StreamingIndicator<AtrBar, f64> for AtrStream {
    fn init(&mut self, data: &[AtrBar]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &bar in data {
            results.push(self.next(bar).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    fn next(&mut self, value: AtrBar) -> Option<f64> {
        let (high, low, close) = value;
        self.count += 1;

        // Calculate True Range
        let tr = Self::true_range(high, low, self.prev_close);
        self.prev_close = Some(close);

        if !self.initialized {
            // Accumulating for first ATR
            self.tr_buffer.push(tr);

            if self.tr_buffer.len() >= self.period {
                // Calculate first ATR as simple average
                let first_atr = self.tr_buffer.iter().sum::<f64>() / self.period as f64;
                self.prev_atr = Some(first_atr);
                self.initialized = true;
                self.tr_buffer.clear(); // No longer needed
                return Some(first_atr);
            }
            return None;
        }

        // Wilder's smoothing for subsequent values
        let prev = self.prev_atr.unwrap();
        let n = self.period as f64;
        let atr = ((prev * (n - 1.0)) + tr) / n;
        self.prev_atr = Some(atr);
        Some(atr)
    }

    fn reset(&mut self) {
        self.prev_close = None;
        self.prev_atr = None;
        self.tr_buffer.clear();
        self.count = 0;
        self.initialized = false;
    }

    fn is_ready(&self) -> bool {
        self.initialized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 1e-6;

    fn assert_approx_eq(a: f64, b: f64) {
        assert!(
            (a - b).abs() < EPSILON,
            "expected {b}, got {a}, diff: {}",
            (a - b).abs()
        );
    }

    // Sample OHLC data
    fn sample_data() -> (Vec<f64>, Vec<f64>, Vec<f64>) {
        let highs = vec![
            48.70, 48.72, 48.90, 48.87, 48.82, 49.05, 49.20, 49.35, 49.92, 50.19,
            50.12, 49.66, 49.88, 50.19, 50.36, 50.57, 50.65, 50.43, 49.63, 50.33,
        ];
        let lows = vec![
            47.79, 48.14, 48.39, 48.37, 48.24, 48.64, 48.94, 48.86, 49.50, 49.87,
            49.20, 48.90, 49.43, 49.73, 49.26, 50.09, 50.30, 49.21, 48.98, 49.61,
        ];
        let closes = vec![
            48.16, 48.61, 48.75, 48.63, 48.74, 49.03, 49.07, 49.32, 49.91, 50.13,
            49.53, 49.50, 49.75, 50.03, 50.31, 50.52, 50.41, 49.34, 49.37, 50.23,
        ];
        (highs, lows, closes)
    }

    #[test]
    fn test_atr_new_valid() {
        let atr = Atr::new(14).unwrap();
        assert_eq!(atr.period(), 14);
    }

    #[test]
    fn test_atr_new_zero_period() {
        assert!(Atr::new(0).is_err());
    }

    #[test]
    fn test_true_range_no_gap() {
        // Simple case: no previous close
        let tr = Atr::true_range(50.0, 48.0, None);
        assert_approx_eq(tr, 2.0);
    }

    #[test]
    fn test_true_range_with_gap_up() {
        // Gap up: previous close was 45, current high-low is 50-48
        let tr = Atr::true_range(50.0, 48.0, Some(45.0));
        // max(2, |50-45|, |48-45|) = max(2, 5, 3) = 5
        assert_approx_eq(tr, 5.0);
    }

    #[test]
    fn test_true_range_with_gap_down() {
        // Gap down: previous close was 52, current high-low is 50-48
        let tr = Atr::true_range(50.0, 48.0, Some(52.0));
        // max(2, |50-52|, |48-52|) = max(2, 2, 4) = 4
        assert_approx_eq(tr, 4.0);
    }

    #[test]
    fn test_atr_basic_calculation() {
        let (highs, lows, closes) = sample_data();
        let atr = Atr::new(5).unwrap();
        let result = atr.calculate(&(&highs, &lows, &closes)).unwrap();

        assert_eq!(result.len(), highs.len());

        // First 4 values should be NaN
        for i in 0..4 {
            assert!(result[i].is_nan(), "index {i} should be NaN");
        }

        // From index 4, should have valid ATR values
        assert!(!result[4].is_nan());

        // ATR should always be positive
        for i in 4..result.len() {
            assert!(result[i] > 0.0, "ATR at {i} should be positive");
        }
    }

    #[test]
    fn test_atr_mismatched_lengths() {
        let atr = Atr::new(14).unwrap();
        let highs = vec![1.0, 2.0, 3.0];
        let lows = vec![0.5, 1.5]; // Different length
        let closes = vec![0.8, 1.8, 2.8];

        let result = atr.calculate(&(&highs, &lows, &closes));
        assert!(result.is_err());
    }

    #[test]
    fn test_atr_stream_matches_batch() {
        let (highs, lows, closes) = sample_data();

        let batch = Atr::new(5).unwrap();
        let mut stream = AtrStream::new(5).unwrap();

        let batch_result = batch.calculate(&(&highs, &lows, &closes)).unwrap();

        // Convert to bars for streaming
        let bars: Vec<AtrBar> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        let stream_result = stream.init(&bars).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.is_nan() {
                assert!(s.is_nan(), "index {i}: batch is NaN but stream is not");
            } else {
                assert_approx_eq(*b, *s);
            }
        }
    }

    #[test]
    fn test_atr_stream_continues_correctly() {
        let (highs, lows, closes) = sample_data();
        let batch = Atr::new(5).unwrap();
        let mut stream = AtrStream::new(5).unwrap();

        // Initialize with first 10 bars
        let init_bars: Vec<AtrBar> = highs[..10]
            .iter()
            .zip(lows[..10].iter())
            .zip(closes[..10].iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        stream.init(&init_bars).unwrap();

        // Continue with remaining bars
        let full_result = batch.calculate(&(&highs, &lows, &closes)).unwrap();

        for i in 10..highs.len() {
            let bar = (highs[i], lows[i], closes[i]);
            let stream_val = stream.next(bar).unwrap();
            assert_approx_eq(stream_val, full_result[i]);
        }
    }

    #[test]
    fn test_atr_stream_reset() {
        let mut stream = AtrStream::new(5).unwrap();
        let bars: Vec<AtrBar> = vec![
            (48.7, 47.79, 48.16),
            (48.72, 48.14, 48.61),
            (48.9, 48.39, 48.75),
            (48.87, 48.37, 48.63),
            (48.82, 48.24, 48.74),
        ];
        stream.init(&bars).unwrap();
        assert!(stream.is_ready());

        stream.reset();
        assert!(!stream.is_ready());
        assert!(stream.current().is_none());
    }
}
