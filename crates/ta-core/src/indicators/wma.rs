//! Weighted Moving Average (WMA) indicator.
//!
//! WMA applies linearly increasing weights to more recent prices.
//!
//! # Formula
//! ```text
//! WMA = (P1×1 + P2×2 + ... + Pn×n) / (1 + 2 + ... + n)
//! Weight denominator = n(n+1)/2
//! ```
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Wma;
//! use ta_core::traits::Indicator;
//!
//! let wma = Wma::new(3).unwrap();
//! let prices = [1.0, 2.0, 3.0, 4.0, 5.0];
//! let result = wma.calculate(&prices).unwrap();
//! // result: [NaN, NaN, 2.333, 3.333, 4.333]
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Weighted Moving Average calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Wma {
    period: usize,
    weight_sum: f64,
}

impl Wma {
    /// Creates a new WMA calculator with the specified period.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        // Weight sum = n(n+1)/2
        let weight_sum = (period * (period + 1)) as f64 / 2.0;
        Ok(Self { period, weight_sum })
    }

    /// Returns the period of this WMA.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }
}

impl Indicator<&[f64], Vec<f64>> for Wma {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        let len = data.len();
        let mut result = vec![f64::NAN; len];

        if len < self.period {
            return Ok(result);
        }

        for i in (self.period - 1)..len {
            let mut weighted_sum = 0.0;
            for (weight, j) in (1..=self.period).zip((i + 1 - self.period)..=i) {
                weighted_sum += data[j] * weight as f64;
            }
            result[i] = weighted_sum / self.weight_sum;
        }

        Ok(result)
    }
}

/// Weighted Moving Average calculator for streaming/real-time operations.
///
/// Uses a ring buffer and maintains running weighted sum for O(1) updates.
#[derive(Debug, Clone)]
pub struct WmaStream {
    period: usize,
    weight_sum: f64,
    buffer: Vec<f64>,
    head: usize,
    count: usize,
    /// Sum of all values in the buffer (for efficient recalculation)
    simple_sum: f64,
    /// Current weighted sum
    weighted_sum: f64,
}

impl WmaStream {
    /// Creates a new streaming WMA calculator with the specified period.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is 0.
    pub fn new(period: usize) -> IndicatorResult<Self> {
        if period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "period must be greater than 0".to_string(),
            ));
        }
        let weight_sum = (period * (period + 1)) as f64 / 2.0;
        Ok(Self {
            period,
            weight_sum,
            buffer: vec![0.0; period],
            head: 0,
            count: 0,
            simple_sum: 0.0,
            weighted_sum: 0.0,
        })
    }

    /// Returns the period of this WMA.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }
}

impl StreamingIndicator<f64, f64> for WmaStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<f64> {
        if self.count < self.period {
            // Still filling the buffer
            self.buffer[self.count] = value;
            self.count += 1;

            if self.count == self.period {
                // Calculate initial weighted sum
                self.weighted_sum = 0.0;
                self.simple_sum = 0.0;
                for (i, &val) in self.buffer.iter().enumerate() {
                    self.weighted_sum += val * (i + 1) as f64;
                    self.simple_sum += val;
                }
                self.head = 0;
                return Some(self.weighted_sum / self.weight_sum);
            }
            return None;
        }

        // O(1) update:
        // When we add a new value and remove the oldest:
        // - The new value gets weight = period
        // - All other weights shift down by 1
        // - The oldest value (weight 1) is removed
        //
        // new_weighted_sum = old_weighted_sum - simple_sum + new_value * period
        // (because subtracting simple_sum reduces each weight by 1, removing oldest)

        let oldest = self.buffer[self.head];
        self.buffer[self.head] = value;
        self.head = (self.head + 1) % self.period;

        // Update sums
        self.weighted_sum = self.weighted_sum - self.simple_sum + value * self.period as f64;
        self.simple_sum = self.simple_sum - oldest + value;

        Some(self.weighted_sum / self.weight_sum)
    }

    fn reset(&mut self) {
        self.buffer.fill(0.0);
        self.head = 0;
        self.count = 0;
        self.simple_sum = 0.0;
        self.weighted_sum = 0.0;
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
    fn test_wma_new_valid() {
        let wma = Wma::new(5).unwrap();
        assert_eq!(wma.period(), 5);
    }

    #[test]
    fn test_wma_new_zero_period() {
        assert!(matches!(
            Wma::new(0),
            Err(IndicatorError::InvalidParameter(_))
        ));
    }

    #[test]
    fn test_wma_batch_calculation() {
        let wma = Wma::new(3).unwrap();
        let data = [1.0, 2.0, 3.0, 4.0, 5.0];
        let result = wma.calculate(&data).unwrap();

        // First two values should be NaN
        assert!(result[0].is_nan());
        assert!(result[1].is_nan());

        // WMA at index 2: (1*1 + 2*2 + 3*3) / 6 = (1+4+9)/6 = 14/6 = 2.333...
        assert_approx_eq(result[2], 14.0 / 6.0);

        // WMA at index 3: (2*1 + 3*2 + 4*3) / 6 = (2+6+12)/6 = 20/6 = 3.333...
        assert_approx_eq(result[3], 20.0 / 6.0);

        // WMA at index 4: (3*1 + 4*2 + 5*3) / 6 = (3+8+15)/6 = 26/6 = 4.333...
        assert_approx_eq(result[4], 26.0 / 6.0);
    }

    #[test]
    fn test_wma_stream_matches_batch() {
        let batch = Wma::new(5).unwrap();
        let mut stream = WmaStream::new(5).unwrap();

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
    fn test_wma_stream_continues_correctly() {
        let batch = Wma::new(3).unwrap();
        let mut stream = WmaStream::new(3).unwrap();

        // Initialize
        stream.init(&[1.0, 2.0, 3.0]).unwrap();

        // Continue streaming
        let next1 = stream.next(4.0).unwrap();
        let next2 = stream.next(5.0).unwrap();

        // Compare with batch
        let full_batch = batch.calculate(&[1.0, 2.0, 3.0, 4.0, 5.0]).unwrap();

        assert_approx_eq(next1, full_batch[3]);
        assert_approx_eq(next2, full_batch[4]);
    }

    #[test]
    fn test_wma_stream_reset() {
        let mut wma = WmaStream::new(3).unwrap();
        wma.init(&[1.0, 2.0, 3.0]).unwrap();
        assert!(wma.is_ready());

        wma.reset();
        assert!(!wma.is_ready());
    }
}
