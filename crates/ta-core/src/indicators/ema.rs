//! Exponential Moving Average (EMA) indicator.
//!
//! EMA applies exponential weighting to give more importance to recent prices.
//!
//! # Formula
//! ```text
//! Multiplier (α) = 2 / (period + 1)
//! EMA = (Price × α) + (Previous EMA × (1 - α))
//! ```
//!
//! The first EMA value is typically seeded with the SMA of the first `period` values.
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Ema;
//! use ta_core::traits::Indicator;
//!
//! let ema = Ema::new(3).unwrap();
//! let prices = [1.0, 2.0, 3.0, 4.0, 5.0];
//! let result = ema.calculate(&prices).unwrap();
//! ```
//!
//! # Example (Streaming Mode)
//! ```
//! use ta_core::indicators::EmaStream;
//! use ta_core::traits::StreamingIndicator;
//!
//! let mut ema = EmaStream::new(3).unwrap();
//! ema.init(&[1.0, 2.0, 3.0]).unwrap();
//! let next_ema = ema.next(4.0);
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Exponential Moving Average calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Ema {
    period: usize,
    multiplier: f64,
}

impl Ema {
    /// Creates a new EMA calculator with the specified period.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        let multiplier = 2.0 / (period as f64 + 1.0);
        Ok(Self { period, multiplier })
    }

    /// Creates a new EMA calculator with a custom smoothing multiplier.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0 or multiplier is not in (0, 1].
    pub fn with_multiplier(period: usize, multiplier: f64) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        if multiplier <= 0.0 || multiplier > 1.0 {
            return Err(IndicatorError::InvalidParameter(
                "multiplier must be in range (0, 1]".to_string(),
            ));
        }
        Ok(Self { period, multiplier })
    }

    /// Returns the period of this EMA.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the smoothing multiplier.
    #[must_use]
    pub const fn multiplier(&self) -> f64 {
        self.multiplier
    }
}

impl Indicator<&[f64], Vec<f64>> for Ema {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        let len = data.len();
        let mut result = vec![f64::NAN; len];

        if len < self.period {
            return Ok(result);
        }

        // Seed EMA with SMA of first `period` values
        let sma: f64 = data[..self.period].iter().sum::<f64>() / self.period as f64;
        result[self.period - 1] = sma;

        // Calculate subsequent EMA values
        let mut prev_ema = sma;
        for i in self.period..len {
            let ema = (data[i] * self.multiplier) + (prev_ema * (1.0 - self.multiplier));
            result[i] = ema;
            prev_ema = ema;
        }

        Ok(result)
    }
}

/// Exponential Moving Average calculator for streaming/real-time operations.
///
/// Maintains only the previous EMA value for O(1) updates.
#[derive(Debug, Clone)]
pub struct EmaStream {
    period: usize,
    multiplier: f64,
    prev_ema: f64,
    count: usize,
    sum: f64, // For initial SMA calculation
}

impl EmaStream {
    /// Creates a new streaming EMA calculator with the specified period.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        let multiplier = 2.0 / (period as f64 + 1.0);
        Ok(Self {
            period,
            multiplier,
            prev_ema: 0.0,
            count: 0,
            sum: 0.0,
        })
    }

    /// Creates a new streaming EMA calculator with a custom smoothing multiplier.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0 or multiplier is not in (0, 1].
    pub fn with_multiplier(period: usize, multiplier: f64) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        if multiplier <= 0.0 || multiplier > 1.0 {
            return Err(IndicatorError::InvalidParameter(
                "multiplier must be in range (0, 1]".to_string(),
            ));
        }
        Ok(Self {
            period,
            multiplier,
            prev_ema: 0.0,
            count: 0,
            sum: 0.0,
        })
    }

    /// Returns the period of this EMA.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the smoothing multiplier.
    #[must_use]
    pub const fn multiplier(&self) -> f64 {
        self.multiplier
    }

    /// Returns the current EMA value, if available.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.is_ready() {
            Some(self.prev_ema)
        } else {
            None
        }
    }
}

impl StreamingIndicator<f64, f64> for EmaStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    #[inline]
    fn next(&mut self, value: f64) -> Option<f64> {
        self.count += 1;

        if self.count < self.period {
            // Accumulate sum for initial SMA
            self.sum += value;
            None
        } else if self.count == self.period {
            // Calculate initial SMA as seed
            self.sum += value;
            self.prev_ema = self.sum / self.period as f64;
            Some(self.prev_ema)
        } else {
            // O(1) EMA calculation
            self.prev_ema = (value * self.multiplier) + (self.prev_ema * (1.0 - self.multiplier));
            Some(self.prev_ema)
        }
    }

    fn reset(&mut self) {
        self.prev_ema = 0.0;
        self.count = 0;
        self.sum = 0.0;
    }

    fn is_ready(&self) -> bool {
        self.count >= self.period
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 1e-10;

    fn assert_approx_eq(a: f64, b: f64) {
        assert!((a - b).abs() < EPSILON, "expected {b}, got {a}");
    }

    #[test]
    fn test_ema_new_valid() {
        let ema = Ema::new(14).unwrap();
        assert_eq!(ema.period(), 14);
        assert_approx_eq(ema.multiplier(), 2.0 / 15.0);
    }

    #[test]
    fn test_ema_new_zero_period() {
        assert!(matches!(
            Ema::new(0),
            Err(IndicatorError::InvalidParameter(_))
        ));
    }

    #[test]
    fn test_ema_with_custom_multiplier() {
        let ema = Ema::with_multiplier(10, 0.5).unwrap();
        assert_approx_eq(ema.multiplier(), 0.5);
    }

    #[test]
    fn test_ema_invalid_multiplier() {
        assert!(Ema::with_multiplier(10, 0.0).is_err());
        assert!(Ema::with_multiplier(10, 1.5).is_err());
        assert!(Ema::with_multiplier(10, -0.1).is_err());
    }

    #[test]
    fn test_ema_batch_calculation() {
        let ema = Ema::new(3).unwrap();
        let data = [2.0, 4.0, 6.0, 8.0, 10.0];
        let result = ema.calculate(&data).unwrap();

        // First two values should be NaN
        assert!(result[0].is_nan());
        assert!(result[1].is_nan());

        // Third value is SMA: (2+4+6)/3 = 4.0
        assert_approx_eq(result[2], 4.0);

        // Fourth: EMA = 8 * 0.5 + 4 * 0.5 = 6.0
        let mult = 2.0 / 4.0; // 0.5
        let expected_3 = 8.0 * mult + 4.0 * (1.0 - mult);
        assert_approx_eq(result[3], expected_3);

        // Fifth: EMA = 10 * 0.5 + 6 * 0.5 = 8.0
        let expected_4 = 10.0 * mult + expected_3 * (1.0 - mult);
        assert_approx_eq(result[4], expected_4);
    }

    #[test]
    fn test_ema_stream_basic() {
        let mut ema = EmaStream::new(3).unwrap();
        let mult = 2.0 / 4.0;

        assert_eq!(ema.next(2.0), None);
        assert_eq!(ema.next(4.0), None);

        // Third value seeds with SMA
        let result = ema.next(6.0);
        assert!(result.is_some());
        assert_approx_eq(result.unwrap(), 4.0);

        // Fourth value uses EMA formula
        let result = ema.next(8.0);
        let expected = 8.0 * mult + 4.0 * (1.0 - mult);
        assert_approx_eq(result.unwrap(), expected);
    }

    #[test]
    fn test_ema_stream_matches_batch() {
        let batch = Ema::new(5).unwrap();
        let mut stream = EmaStream::new(5).unwrap();

        let data = [10.0, 11.0, 12.0, 11.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0];

        let batch_result = batch.calculate(&data).unwrap();
        let stream_result = stream.init(&data).unwrap();

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.is_nan() {
                assert!(s.is_nan(), "index {i}: batch is NaN but stream is {s}");
            } else {
                assert_approx_eq(*b, *s);
            }
        }
    }

    #[test]
    fn test_ema_stream_reset() {
        let mut ema = EmaStream::new(3).unwrap();
        ema.init(&[1.0, 2.0, 3.0]).unwrap();
        assert!(ema.is_ready());

        ema.reset();
        assert!(!ema.is_ready());
        assert!(ema.current().is_none());
    }

    #[test]
    fn test_ema_insufficient_data() {
        let ema = Ema::new(5).unwrap();
        let data = [1.0, 2.0, 3.0];
        let result = ema.calculate(&data).unwrap();

        assert!(result.iter().all(|v| v.is_nan()));
    }
}
