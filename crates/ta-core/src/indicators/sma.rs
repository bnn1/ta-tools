//! Simple Moving Average (SMA) indicator.
//!
//! SMA calculates the arithmetic mean of the last `period` values.
//!
//! # Formula
//! ```text
//! SMA = (P1 + P2 + ... + Pn) / n
//! ```
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Sma;
//! use ta_core::traits::Indicator;
//!
//! let sma = Sma::new(3).unwrap();
//! let prices = [1.0, 2.0, 3.0, 4.0, 5.0];
//! let result = sma.calculate(&prices).unwrap();
//! // result: [NaN, NaN, 2.0, 3.0, 4.0]
//! ```
//!
//! # Example (Streaming Mode)
//! ```
//! use ta_core::indicators::SmaStream;
//! use ta_core::traits::StreamingIndicator;
//!
//! let mut sma = SmaStream::new(3).unwrap();
//! sma.init(&[1.0, 2.0, 3.0]).unwrap();
//! assert_eq!(sma.next(4.0), Some(3.0)); // (2 + 3 + 4) / 3
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Simple Moving Average calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Sma {
    period: usize,
}

impl Sma {
    /// Creates a new SMA calculator with the specified period.
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

    /// Returns the period of this SMA.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }
}

impl Indicator<&[f64], Vec<f64>> for Sma {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        let len = data.len();
        let mut result = vec![f64::NAN; len];

        if len < self.period {
            return Ok(result);
        }

        // Calculate first SMA value
        let mut sum: f64 = data[..self.period].iter().sum();
        result[self.period - 1] = sum / self.period as f64;

        // Sliding window: subtract oldest, add newest
        for i in self.period..len {
            sum = sum - data[i - self.period] + data[i];
            result[i] = sum / self.period as f64;
        }

        Ok(result)
    }
}

/// Simple Moving Average calculator for streaming/real-time operations.
///
/// Maintains a ring buffer for O(1) updates.
#[derive(Debug, Clone)]
pub struct SmaStream {
    period: usize,
    buffer: Vec<f64>,
    head: usize,
    sum: f64,
    count: usize,
}

impl SmaStream {
    /// Creates a new streaming SMA calculator with the specified period.
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
            buffer: vec![0.0; period],
            head: 0,
            sum: 0.0,
            count: 0,
        })
    }

    /// Returns the period of this SMA.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }
}

impl StreamingIndicator<f64, f64> for SmaStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<f64> {
        // Subtract the value being replaced (if buffer is full)
        if self.count >= self.period {
            self.sum -= self.buffer[self.head];
        }

        // Add new value to buffer and sum
        self.buffer[self.head] = value;
        self.sum += value;

        // Advance head pointer (ring buffer)
        self.head = (self.head + 1) % self.period;

        // Increment count up to period
        if self.count < self.period {
            self.count += 1;
        }

        // Return SMA if we have enough data
        if self.count >= self.period {
            Some(self.sum / self.period as f64)
        } else {
            None
        }
    }

    fn reset(&mut self) {
        self.buffer.fill(0.0);
        self.head = 0;
        self.sum = 0.0;
        self.count = 0;
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
    fn test_sma_new_valid() {
        assert!(Sma::new(14).is_ok());
    }

    #[test]
    fn test_sma_new_zero_period() {
        assert!(matches!(
            Sma::new(0),
            Err(IndicatorError::InvalidParameter(_))
        ));
    }

    #[test]
    fn test_sma_batch_calculation() {
        let sma = Sma::new(3).unwrap();
        let data = [1.0, 2.0, 3.0, 4.0, 5.0];
        let result = sma.calculate(&data).unwrap();

        assert!(result[0].is_nan());
        assert!(result[1].is_nan());
        assert_approx_eq(result[2], 2.0); // (1+2+3)/3
        assert_approx_eq(result[3], 3.0); // (2+3+4)/3
        assert_approx_eq(result[4], 4.0); // (3+4+5)/3
    }

    #[test]
    fn test_sma_stream_basic() {
        let mut sma = SmaStream::new(3).unwrap();

        assert_eq!(sma.next(1.0), None);
        assert_eq!(sma.next(2.0), None);

        let result = sma.next(3.0);
        assert!(result.is_some());
        assert_approx_eq(result.unwrap(), 2.0);

        let result = sma.next(4.0);
        assert_approx_eq(result.unwrap(), 3.0);
    }

    #[test]
    fn test_sma_stream_init() {
        let mut sma = SmaStream::new(3).unwrap();
        let data = [1.0, 2.0, 3.0, 4.0, 5.0];
        let result = sma.init(&data).unwrap();

        assert!(result[0].is_nan());
        assert!(result[1].is_nan());
        assert_approx_eq(result[2], 2.0);
        assert_approx_eq(result[3], 3.0);
        assert_approx_eq(result[4], 4.0);

        // Verify streaming continues correctly
        let next_val = sma.next(6.0);
        assert_approx_eq(next_val.unwrap(), 5.0); // (4+5+6)/3
    }

    #[test]
    fn test_sma_stream_reset() {
        let mut sma = SmaStream::new(3).unwrap();
        sma.init(&[1.0, 2.0, 3.0]).unwrap();
        assert!(sma.is_ready());

        sma.reset();
        assert!(!sma.is_ready());
        assert_eq!(sma.next(1.0), None);
    }

    #[test]
    fn test_sma_insufficient_data() {
        let sma = Sma::new(5).unwrap();
        let data = [1.0, 2.0, 3.0];
        let result = sma.calculate(&data).unwrap();

        assert!(result.iter().all(|v| v.is_nan()));
    }
}
