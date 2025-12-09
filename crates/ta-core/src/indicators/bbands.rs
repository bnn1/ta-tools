//! Bollinger Bands indicator.
//!
//! Bollinger Bands are a volatility indicator consisting of a middle band
//! (SMA) and upper/lower bands at K standard deviations from the middle.
//!
//! # Components
//! - **Middle Band**: SMA of the price
//! - **Upper Band**: Middle + (K × σ)
//! - **Lower Band**: Middle - (K × σ)
//! - **%B**: (Price - Lower) / (Upper - Lower) — position within bands
//! - **Bandwidth**: (Upper - Lower) / Middle — relative volatility
//!
//! # Default Parameters
//! - Period: 20
//! - K (standard deviation multiplier): 2.0
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::BBands;
//! use ta_core::traits::Indicator;
//!
//! let bbands = BBands::new(20, 2.0).unwrap();
//! let prices: Vec<f64> = (1..=30).map(|x| x as f64).collect();
//! let result = bbands.calculate(&prices).unwrap();
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Bollinger Bands output containing all components.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BBandsOutput {
    /// Upper band (middle + k * stddev)
    pub upper: f64,
    /// Middle band (SMA)
    pub middle: f64,
    /// Lower band (middle - k * stddev)
    pub lower: f64,
    /// %B indicator: (price - lower) / (upper - lower)
    pub percent_b: f64,
    /// Bandwidth: (upper - lower) / middle
    pub bandwidth: f64,
}

impl BBandsOutput {
    /// Creates a new Bollinger Bands output.
    #[must_use]
    pub fn new(upper: f64, middle: f64, lower: f64, percent_b: f64, bandwidth: f64) -> Self {
        Self {
            upper,
            middle,
            lower,
            percent_b,
            bandwidth,
        }
    }

    /// Creates a NaN output for insufficient data.
    #[must_use]
    pub fn nan() -> Self {
        Self {
            upper: f64::NAN,
            middle: f64::NAN,
            lower: f64::NAN,
            percent_b: f64::NAN,
            bandwidth: f64::NAN,
        }
    }

    /// Returns true if any component is NaN.
    #[must_use]
    pub fn is_nan(&self) -> bool {
        self.upper.is_nan() || self.middle.is_nan() || self.lower.is_nan()
    }
}

/// Bollinger Bands calculator for batch operations.
#[derive(Debug, Clone)]
pub struct BBands {
    period: usize,
    k: f64,
}

impl BBands {
    /// Creates a new Bollinger Bands calculator.
    ///
    /// # Arguments
    /// * `period` - The SMA period (typically 20)
    /// * `k` - Standard deviation multiplier (typically 2.0)
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0 or k is not positive.
    pub fn new(period: usize, k: f64) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        if k <= 0.0 || !k.is_finite() {
            return Err(IndicatorError::InvalidParameter(
                "k must be a positive finite number".to_string(),
            ));
        }
        Ok(Self { period, k })
    }

    /// Creates with default parameters (20, 2.0).
    pub fn default_params() -> IndicatorResult<Self> {
        Self::new(20, 2.0)
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the K multiplier.
    #[must_use]
    pub const fn k(&self) -> f64 {
        self.k
    }
}

impl Indicator<&[f64], Vec<BBandsOutput>> for BBands {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<BBandsOutput>> {
        let len = data.len();
        let mut result = vec![BBandsOutput::nan(); len];

        if len < self.period {
            return Ok(result);
        }

        let n = self.period as f64;

        // Initialize running sums for first window
        let mut sum: f64 = data[..self.period].iter().sum();
        let mut sum_sq: f64 = data[..self.period].iter().map(|x| x * x).sum();

        // Calculate first BBands value
        let price = data[self.period - 1];
        let mean = sum / n;
        let variance = (sum_sq / n) - (mean * mean);
        let stddev = if variance > 0.0 { variance.sqrt() } else { 0.0 };
        let upper = mean + self.k * stddev;
        let lower = mean - self.k * stddev;
        let band_width = upper - lower;
        let percent_b = if band_width > 0.0 {
            (price - lower) / band_width
        } else {
            0.5
        };
        let bandwidth = if mean > 0.0 { band_width / mean } else { 0.0 };
        result[self.period - 1] = BBandsOutput::new(upper, mean, lower, percent_b, bandwidth);

        // Sliding window: O(1) per iteration
        for i in self.period..len {
            let old_value = data[i - self.period];
            let new_value = data[i];

            // Update running sums
            sum = sum - old_value + new_value;
            sum_sq = sum_sq - (old_value * old_value) + (new_value * new_value);

            // Calculate BBands from running sums
            let price = new_value;
            let mean = sum / n;
            let variance = (sum_sq / n) - (mean * mean);
            let stddev = if variance > 0.0 { variance.sqrt() } else { 0.0 };
            let upper = mean + self.k * stddev;
            let lower = mean - self.k * stddev;
            let band_width = upper - lower;
            let percent_b = if band_width > 0.0 {
                (price - lower) / band_width
            } else {
                0.5
            };
            let bandwidth = if mean > 0.0 { band_width / mean } else { 0.0 };
            result[i] = BBandsOutput::new(upper, mean, lower, percent_b, bandwidth);
        }

        Ok(result)
    }
}

/// Streaming Bollinger Bands calculator using Welford's online algorithm.
///
/// Achieves O(1) updates per tick by maintaining:
/// - Ring buffer for the window
/// - Running sum for mean calculation
/// - Running M2 (sum of squared differences) for variance
#[derive(Debug)]
pub struct BBandsStream {
    period: usize,
    k: f64,
    buffer: Vec<f64>,
    head: usize,
    count: usize,
    sum: f64,
    sum_sq: f64, // Sum of squares for variance calculation
}

impl BBandsStream {
    /// Creates a new streaming Bollinger Bands calculator.
    pub fn new(period: usize, k: f64) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        if k <= 0.0 || !k.is_finite() {
            return Err(IndicatorError::InvalidParameter(
                "k must be a positive finite number".to_string(),
            ));
        }
        Ok(Self {
            period,
            k,
            buffer: vec![0.0; period],
            head: 0,
            count: 0,
            sum: 0.0,
            sum_sq: 0.0,
        })
    }

    /// Creates with default parameters (20, 2.0).
    pub fn default_params() -> IndicatorResult<Self> {
        Self::new(20, 2.0)
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the K multiplier.
    #[must_use]
    pub const fn k(&self) -> f64 {
        self.k
    }

    /// Calculate output from current state.
    #[inline]
    fn calculate_output(&self, price: f64) -> BBandsOutput {
        let n = self.period as f64;
        let mean = self.sum / n;

        // Variance = E[X²] - E[X]² (using sum of squares method)
        let variance = (self.sum_sq / n) - (mean * mean);
        // Handle potential floating point errors making variance slightly negative
        let stddev = if variance > 0.0 { variance.sqrt() } else { 0.0 };

        let upper = mean + self.k * stddev;
        let lower = mean - self.k * stddev;

        let band_width = upper - lower;
        let percent_b = if band_width > 0.0 {
            (price - lower) / band_width
        } else {
            0.5
        };
        let bandwidth = if mean > 0.0 { band_width / mean } else { 0.0 };

        BBandsOutput::new(upper, mean, lower, percent_b, bandwidth)
    }
}

impl StreamingIndicator<f64, BBandsOutput> for BBandsStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<BBandsOutput>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or_else(BBandsOutput::nan));
        }
        Ok(results)
    }

    #[inline]
    fn next(&mut self, value: f64) -> Option<BBandsOutput> {
        // Remove old value from sums if buffer is full
        if self.count >= self.period {
            let old_value = self.buffer[self.head];
            self.sum -= old_value;
            self.sum_sq -= old_value * old_value;
        }

        // Add new value
        self.buffer[self.head] = value;
        self.sum += value;
        self.sum_sq += value * value;

        // Update head pointer
        self.head = (self.head + 1) % self.period;
        self.count = self.count.saturating_add(1).min(self.period + 1);

        // Need full period to calculate
        if self.count < self.period {
            return None;
        }

        Some(self.calculate_output(value))
    }

    fn reset(&mut self) {
        self.buffer.fill(0.0);
        self.head = 0;
        self.count = 0;
        self.sum = 0.0;
        self.sum_sq = 0.0;
    }

    fn is_ready(&self) -> bool {
        self.count >= self.period
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

    #[test]
    fn test_bbands_new_valid() {
        let bb = BBands::new(20, 2.0).unwrap();
        assert_eq!(bb.period(), 20);
        assert_approx_eq(bb.k(), 2.0);
    }

    #[test]
    fn test_bbands_new_invalid_period() {
        assert!(BBands::new(0, 2.0).is_err());
    }

    #[test]
    fn test_bbands_new_invalid_k() {
        assert!(BBands::new(20, 0.0).is_err());
        assert!(BBands::new(20, -1.0).is_err());
        assert!(BBands::new(20, f64::NAN).is_err());
        assert!(BBands::new(20, f64::INFINITY).is_err());
    }

    #[test]
    fn test_bbands_basic_calculation() {
        let bb = BBands::new(5, 2.0).unwrap();
        let data: Vec<f64> = vec![10.0, 11.0, 12.0, 11.0, 10.0, 11.0, 12.0, 13.0, 12.0, 11.0];
        let result = bb.calculate(&data).unwrap();

        // First 4 values should be NaN
        for i in 0..4 {
            assert!(result[i].is_nan(), "index {i} should be NaN");
        }

        // From index 4, should have valid values
        assert!(!result[4].is_nan());

        // Middle band at index 4 should be SMA of first 5 values
        let expected_middle = (10.0 + 11.0 + 12.0 + 11.0 + 10.0) / 5.0;
        assert_approx_eq(result[4].middle, expected_middle);

        // Upper should be > middle, lower should be < middle
        assert!(result[4].upper > result[4].middle);
        assert!(result[4].lower < result[4].middle);

        // %B should be between 0 and 1 when price is within bands
        for i in 4..result.len() {
            assert!(
                result[i].percent_b >= 0.0 && result[i].percent_b <= 1.0,
                "percent_b at {i} should be between 0 and 1: {}",
                result[i].percent_b
            );
        }
    }

    #[test]
    fn test_bbands_constant_prices() {
        // With constant prices, stddev = 0, so upper = middle = lower
        let bb = BBands::new(3, 2.0).unwrap();
        let data = vec![10.0, 10.0, 10.0, 10.0, 10.0];
        let result = bb.calculate(&data).unwrap();

        for i in 2..result.len() {
            assert_approx_eq(result[i].upper, 10.0);
            assert_approx_eq(result[i].middle, 10.0);
            assert_approx_eq(result[i].lower, 10.0);
            assert_approx_eq(result[i].percent_b, 0.5); // At middle when bands are flat
            assert_approx_eq(result[i].bandwidth, 0.0);
        }
    }

    #[test]
    fn test_bbands_stream_matches_batch() {
        let batch = BBands::new(5, 2.0).unwrap();
        let mut stream = BBandsStream::new(5, 2.0).unwrap();

        let data: Vec<f64> = vec![10.0, 11.0, 12.0, 11.0, 10.0, 11.0, 12.0, 13.0, 12.0, 11.0];

        let batch_result = batch.calculate(&data).unwrap();
        let stream_result = stream.init(&data).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.is_nan() {
                assert!(s.is_nan(), "index {i}: batch is NaN but stream is not");
            } else {
                assert_approx_eq(b.upper, s.upper);
                assert_approx_eq(b.middle, s.middle);
                assert_approx_eq(b.lower, s.lower);
                assert_approx_eq(b.percent_b, s.percent_b);
                assert_approx_eq(b.bandwidth, s.bandwidth);
            }
        }
    }

    #[test]
    fn test_bbands_stream_continues_correctly() {
        let batch = BBands::new(3, 2.0).unwrap();
        let mut stream = BBandsStream::new(3, 2.0).unwrap();

        // Initialize with some data
        let init_data: Vec<f64> = vec![10.0, 11.0, 12.0];
        stream.init(&init_data).unwrap();

        // Continue with more data
        let continue_data: Vec<f64> = vec![13.0, 14.0, 15.0];
        let full_data: Vec<f64> = vec![10.0, 11.0, 12.0, 13.0, 14.0, 15.0];

        let batch_result = batch.calculate(&full_data).unwrap();

        for (i, &value) in continue_data.iter().enumerate() {
            let stream_val = stream.next(value).unwrap();
            let batch_val = &batch_result[3 + i];

            assert_approx_eq(stream_val.upper, batch_val.upper);
            assert_approx_eq(stream_val.middle, batch_val.middle);
            assert_approx_eq(stream_val.lower, batch_val.lower);
        }
    }

    #[test]
    fn test_bbands_stream_reset() {
        let mut stream = BBandsStream::new(5, 2.0).unwrap();
        let data: Vec<f64> = vec![10.0, 11.0, 12.0, 11.0, 10.0];
        stream.init(&data).unwrap();
        assert!(stream.is_ready());

        stream.reset();
        assert!(!stream.is_ready());
    }

    #[test]
    fn test_bbands_bandwidth_increases_with_volatility() {
        let bb = BBands::new(3, 2.0).unwrap();

        // Low volatility
        let low_vol = vec![10.0, 10.1, 10.0, 10.1, 10.0];
        let low_result = bb.calculate(&low_vol).unwrap();

        // High volatility
        let high_vol = vec![10.0, 15.0, 10.0, 15.0, 10.0];
        let high_result = bb.calculate(&high_vol).unwrap();

        // High volatility should have larger bandwidth
        assert!(high_result[4].bandwidth > low_result[4].bandwidth);
    }
}
