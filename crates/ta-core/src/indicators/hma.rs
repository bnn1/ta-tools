//! Hull Moving Average (HMA) indicator.
//!
//! HMA is designed to reduce lag while maintaining smoothness.
//! It achieves this by using weighted moving averages at different periods.
//!
//! # Formula
//! ```text
//! HMA(n) = WMA(2 × WMA(n/2) − WMA(n), floor(√n))
//! ```
//!
//! Where:
//! - WMA(n/2) is the WMA over half the period (floor(n/2))
//! - WMA(n) is the WMA over the full period
//! - The final smoothing uses floor(√n) period
//!
//! # Characteristics
//! - Significantly reduces lag compared to SMA and EMA
//! - Maintains smoothness of the moving average
//! - Excellent for identifying trend reversals quickly
//! - Popular in scalping strategies
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Hma;
//! use ta_core::traits::Indicator;
//!
//! let hma = Hma::new(16).unwrap();
//! let prices = vec![44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08,
//!                   45.89, 46.03, 46.83, 47.69, 46.49, 46.26, 47.09, 46.66,
//!                   46.80, 46.23, 46.38, 46.33];
//! let result = hma.calculate(&prices).unwrap();
//! ```

use crate::indicators::{Wma, WmaStream};
use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Hull Moving Average calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Hma {
    period: usize,
    half_period: usize,
    sqrt_period: usize,
}

impl Hma {
    /// Creates a new HMA calculator with the specified period.
    ///
    /// # Arguments
    /// * `period` - The main period (typically 9, 16, 25, etc.)
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is less than 2.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period < 2 {
            return Err(IndicatorError::InvalidParameter(
                "period must be at least 2".to_string(),
            ));
        }
        let half_period = period / 2;
        let sqrt_period = (period as f64).sqrt().floor() as usize;

        // Ensure sqrt_period is at least 1
        let sqrt_period = sqrt_period.max(1);

        Ok(Self {
            period,
            half_period,
            sqrt_period,
        })
    }

    /// Returns the main period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the half period used for the first WMA.
    #[must_use]
    pub const fn half_period(&self) -> usize {
        self.half_period
    }

    /// Returns the sqrt period used for final smoothing.
    #[must_use]
    pub const fn sqrt_period(&self) -> usize {
        self.sqrt_period
    }

    /// Returns the total lookback period required for HMA calculation.
    /// This is period + sqrt_period - 2 (since we need data for all three WMAs).
    #[must_use]
    pub fn lookback(&self) -> usize {
        // Need `period` values for full WMA
        // Then need `sqrt_period` values of the difference series
        // The difference series starts at index (period - 1)
        // So total lookback = (period - 1) + (sqrt_period - 1) = period + sqrt_period - 2
        self.period + self.sqrt_period - 2
    }
}

impl Indicator<&[f64], Vec<f64>> for Hma {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        let len = data.len();
        let mut result = vec![f64::NAN; len];

        let lookback = self.lookback();
        if len <= lookback {
            return Ok(result);
        }

        // Step 1: Calculate WMA(n/2)
        let wma_half = Wma::new(self.half_period)?;
        let wma_half_values = wma_half.calculate(data)?;

        // Step 2: Calculate WMA(n)
        let wma_full = Wma::new(self.period)?;
        let wma_full_values = wma_full.calculate(data)?;

        // Step 3: Calculate raw HMA values: 2 * WMA(n/2) - WMA(n)
        // This is valid starting from index (period - 1)
        let mut raw_hma = vec![f64::NAN; len];
        for i in (self.period - 1)..len {
            if !wma_half_values[i].is_nan() && !wma_full_values[i].is_nan() {
                raw_hma[i] = 2.0 * wma_half_values[i] - wma_full_values[i];
            }
        }

        // Step 4: Apply WMA(sqrt(n)) to the raw HMA values
        // We need to extract the valid portion and apply WMA to it
        let valid_start = self.period - 1;
        let raw_slice: Vec<f64> = raw_hma[valid_start..].iter().copied().collect();

        let wma_sqrt = Wma::new(self.sqrt_period)?;
        let smoothed = wma_sqrt.calculate(&raw_slice)?;

        // Map back to result
        for (i, &val) in smoothed.iter().enumerate() {
            result[valid_start + i] = val;
        }

        Ok(result)
    }
}

/// Streaming HMA calculator for real-time O(1) updates.
///
/// Internally manages three WMA streams:
/// - WMA(n/2) for the half-period
/// - WMA(n) for the full period  
/// - WMA(√n) for the final smoothing
#[derive(Debug)]
pub struct HmaStream {
    period: usize,
    half_period: usize,
    sqrt_period: usize,
    wma_half: WmaStream,
    wma_full: WmaStream,
    wma_sqrt: WmaStream,
    raw_buffer: Vec<f64>,
    raw_head: usize,
    raw_count: usize,
}

impl HmaStream {
    /// Creates a new streaming HMA calculator.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is less than 2.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period < 2 {
            return Err(IndicatorError::InvalidParameter(
                "period must be at least 2".to_string(),
            ));
        }

        let half_period = period / 2;
        let sqrt_period = ((period as f64).sqrt().floor() as usize).max(1);

        Ok(Self {
            period,
            half_period,
            sqrt_period,
            wma_half: WmaStream::new(half_period)?,
            wma_full: WmaStream::new(period)?,
            wma_sqrt: WmaStream::new(sqrt_period)?,
            raw_buffer: vec![0.0; sqrt_period],
            raw_head: 0,
            raw_count: 0,
        })
    }

    /// Returns the main period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the half period.
    #[must_use]
    pub const fn half_period(&self) -> usize {
        self.half_period
    }

    /// Returns the sqrt period.
    #[must_use]
    pub const fn sqrt_period(&self) -> usize {
        self.sqrt_period
    }
}

impl StreamingIndicator<f64, f64> for HmaStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<f64> {
        // Feed value to both WMA calculators
        let wma_half_val = self.wma_half.next(value);
        let wma_full_val = self.wma_full.next(value);

        // We need both WMAs to be ready to compute raw HMA
        match (wma_half_val, wma_full_val) {
            (Some(half), Some(full)) => {
                let raw = 2.0 * half - full;
                // Feed raw value to the sqrt WMA
                self.wma_sqrt.next(raw)
            }
            _ => None,
        }
    }

    fn reset(&mut self) {
        self.wma_half.reset();
        self.wma_full.reset();
        self.wma_sqrt.reset();
        self.raw_buffer.fill(0.0);
        self.raw_head = 0;
        self.raw_count = 0;
    }

    fn is_ready(&self) -> bool {
        self.wma_sqrt.is_ready()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 1e-6;

    fn assert_approx_eq(a: f64, b: f64) {
        assert!(
            (a - b).abs() < EPSILON,
            "expected {b}, got {a}, diff = {}",
            (a - b).abs()
        );
    }

    #[test]
    fn test_hma_new_valid() {
        let hma = Hma::new(16).unwrap();
        assert_eq!(hma.period(), 16);
        assert_eq!(hma.half_period(), 8);
        assert_eq!(hma.sqrt_period(), 4);
    }

    #[test]
    fn test_hma_new_various_periods() {
        // Test various periods to verify sqrt calculation
        let hma9 = Hma::new(9).unwrap();
        assert_eq!(hma9.sqrt_period(), 3); // floor(sqrt(9)) = 3

        let hma25 = Hma::new(25).unwrap();
        assert_eq!(hma25.sqrt_period(), 5); // floor(sqrt(25)) = 5

        let hma20 = Hma::new(20).unwrap();
        assert_eq!(hma20.sqrt_period(), 4); // floor(sqrt(20)) = 4
    }

    #[test]
    fn test_hma_new_invalid() {
        assert!(Hma::new(0).is_err());
        assert!(Hma::new(1).is_err());
    }

    #[test]
    fn test_hma_basic_calculation() {
        let prices = [
            44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03, 46.83, 47.69,
            46.49, 46.26, 47.09, 46.66, 46.80, 46.23, 46.38, 46.33,
        ];

        let hma = Hma::new(9).unwrap();
        let result = hma.calculate(&prices).unwrap();

        assert_eq!(result.len(), prices.len());

        // HMA(9) lookback = 9 + 3 - 2 = 10, so first valid at index 10
        let lookback = hma.lookback();
        for i in 0..lookback {
            assert!(result[i].is_nan(), "Expected NaN at index {i}");
        }

        // Values after lookback should be valid
        for i in lookback..result.len() {
            assert!(!result[i].is_nan(), "Expected value at index {i}");
        }
    }

    #[test]
    fn test_hma_streaming_matches_batch() {
        let prices = [
            44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03, 46.83, 47.69,
            46.49, 46.26, 47.09, 46.66, 46.80, 46.23, 46.38, 46.33, 45.88, 47.82, 47.23, 46.99,
        ];

        let batch = Hma::new(9).unwrap();
        let batch_result = batch.calculate(&prices).unwrap();

        let mut stream = HmaStream::new(9).unwrap();
        let stream_result = stream.init(&prices).unwrap();

        for i in 0..batch_result.len() {
            if batch_result[i].is_nan() {
                assert!(stream_result[i].is_nan(), "Mismatch at index {i}");
            } else {
                assert_approx_eq(stream_result[i], batch_result[i]);
            }
        }
    }

    #[test]
    fn test_hma_stream_next_after_init() {
        let prices = [
            44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03, 46.83, 47.69,
            46.49, 46.26, 47.09, 46.66,
        ];

        let mut stream = HmaStream::new(9).unwrap();
        stream.init(&prices).unwrap();

        assert!(stream.is_ready());

        // Add more values and verify we get results
        let result = stream.next(46.80);
        assert!(result.is_some());
    }

    #[test]
    fn test_hma_less_responsive_to_noise() {
        // HMA should be smoother than raw prices but responsive to trends
        let prices = [
            100.0, 101.0, 100.5, 101.5, 102.0, 101.5, 102.5, 103.0, 102.5, 103.5, 104.0, 103.5,
            104.5, 105.0, 104.5, 105.5, 106.0, 105.5, 106.5, 107.0,
        ];

        let hma = Hma::new(9).unwrap();
        let result = hma.calculate(&prices).unwrap();

        // The HMA should follow the upward trend
        let valid_results: Vec<f64> = result.iter().filter(|x| !x.is_nan()).copied().collect();

        // Check that valid results are generally increasing (following the trend)
        let increasing_count = valid_results.windows(2).filter(|w| w[1] > w[0]).count();

        // Most transitions should be increasing given the upward trend
        assert!(
            increasing_count > valid_results.len() / 2,
            "HMA should follow upward trend"
        );
    }

    #[test]
    fn test_hma_empty_data() {
        let hma = Hma::new(9).unwrap();
        let result = hma.calculate(&[]).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_hma_insufficient_data() {
        let hma = Hma::new(16).unwrap();
        let prices = [1.0, 2.0, 3.0, 4.0, 5.0]; // Only 5 values, need more
        let result = hma.calculate(&prices).unwrap();

        // All should be NaN
        assert!(result.iter().all(|x| x.is_nan()));
    }

    #[test]
    fn test_hma_lookback() {
        let hma = Hma::new(16).unwrap();
        // period=16, half=8, sqrt=4
        // lookback = 16 + 4 - 2 = 18
        assert_eq!(hma.lookback(), 18);

        let hma = Hma::new(9).unwrap();
        // period=9, half=4, sqrt=3
        // lookback = 9 + 3 - 2 = 10
        assert_eq!(hma.lookback(), 10);
    }
}
