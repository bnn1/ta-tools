//! Relative Strength Index (RSI) indicator.
//!
//! RSI is a momentum oscillator that measures the speed and magnitude of
//! price changes, oscillating between 0 and 100.
//!
//! # Formula
//! ```text
//! RS = Average Gain / Average Loss
//! RSI = 100 - (100 / (1 + RS))
//! ```
//!
//! Uses Wilder's smoothing method (α = 1/period) for the averages.
//!
//! # Interpretation
//! - RSI > 70: Overbought condition
//! - RSI < 30: Oversold condition
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Rsi;
//! use ta_core::traits::Indicator;
//!
//! let rsi = Rsi::new(14).unwrap();
//! let prices = vec![44.0, 44.25, 44.5, 43.75, 44.5, 44.25, 44.0, 43.5,
//!                   43.25, 43.5, 44.0, 44.25, 44.25, 44.0, 43.75];
//! let result = rsi.calculate(&prices).unwrap();
//! ```
//!
//! # Example (Streaming Mode)
//! ```
//! use ta_core::indicators::RsiStream;
//! use ta_core::traits::StreamingIndicator;
//!
//! let mut rsi = RsiStream::new(14).unwrap();
//! // Initialize with historical data
//! let prices = vec![44.0, 44.25, 44.5, 43.75, 44.5, 44.25, 44.0, 43.5,
//!                   43.25, 43.5, 44.0, 44.25, 44.25, 44.0, 43.75];
//! rsi.init(&prices).unwrap();
//! // Now stream new values with O(1) updates
//! let new_rsi = rsi.next(44.0);
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Relative Strength Index calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Rsi {
    period: usize,
}

impl Rsi {
    /// Creates a new RSI calculator with the specified period.
    ///
    /// The standard RSI period is 14.
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

    /// Returns the period of this RSI.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }
}

impl Indicator<&[f64], Vec<f64>> for Rsi {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        let len = data.len();
        let mut result = vec![f64::NAN; len];

        // Need at least period + 1 values to calculate first RSI
        if len <= self.period {
            return Ok(result);
        }

        // Calculate price changes
        let mut gains = Vec::with_capacity(len - 1);
        let mut losses = Vec::with_capacity(len - 1);

        for i in 1..len {
            let change = data[i] - data[i - 1];
            if change > 0.0 {
                gains.push(change);
                losses.push(0.0);
            } else {
                gains.push(0.0);
                losses.push(-change); // Store as positive
            }
        }

        // First average: simple mean of first `period` gains/losses
        let mut avg_gain: f64 = gains[..self.period].iter().sum::<f64>() / self.period as f64;
        let mut avg_loss: f64 = losses[..self.period].iter().sum::<f64>() / self.period as f64;

        // Calculate first RSI (at index = period)
        result[self.period] = calculate_rsi(avg_gain, avg_loss);

        // Subsequent values use Wilder's smoothing
        let alpha = 1.0 / self.period as f64;
        for i in self.period..(len - 1) {
            avg_gain = (avg_gain * (1.0 - alpha)) + (gains[i] * alpha);
            avg_loss = (avg_loss * (1.0 - alpha)) + (losses[i] * alpha);
            result[i + 1] = calculate_rsi(avg_gain, avg_loss);
        }

        Ok(result)
    }
}

/// Relative Strength Index calculator for streaming/real-time operations.
///
/// Maintains smoothed average gain/loss for O(1) updates.
#[derive(Debug, Clone)]
pub struct RsiStream {
    period: usize,
    alpha: f64,
    avg_gain: f64,
    avg_loss: f64,
    prev_value: f64,
    count: usize,
    initial_gains: Vec<f64>,
    initial_losses: Vec<f64>,
}

impl RsiStream {
    /// Creates a new streaming RSI calculator with the specified period.
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
            alpha: 1.0 / period as f64,
            avg_gain: 0.0,
            avg_loss: 0.0,
            prev_value: f64::NAN,
            count: 0,
            initial_gains: Vec::with_capacity(period),
            initial_losses: Vec::with_capacity(period),
        })
    }

    /// Returns the period of this RSI.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the current RSI value, if available.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.is_ready() {
            Some(calculate_rsi(self.avg_gain, self.avg_loss))
        } else {
            None
        }
    }
}

impl StreamingIndicator<f64, f64> for RsiStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<f64>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<f64> {
        self.count += 1;

        // First value: just store it, no change to calculate
        if self.count == 1 {
            self.prev_value = value;
            return None;
        }

        // Calculate change from previous value
        let change = value - self.prev_value;
        self.prev_value = value;

        let (gain, loss) = if change > 0.0 {
            (change, 0.0)
        } else {
            (0.0, -change)
        };

        // Accumulating initial period (need `period` changes for first RSI)
        if self.count <= self.period {
            self.initial_gains.push(gain);
            self.initial_losses.push(loss);
            return None;
        }

        // First RSI calculation (count == period + 1, have exactly `period` changes)
        if self.count == self.period + 1 {
            // Add the current change to complete the period
            self.initial_gains.push(gain);
            self.initial_losses.push(loss);

            // Calculate initial averages from accumulated gains/losses
            self.avg_gain = self.initial_gains.iter().sum::<f64>() / self.period as f64;
            self.avg_loss = self.initial_losses.iter().sum::<f64>() / self.period as f64;

            // Clear initial vectors to free memory
            self.initial_gains.clear();
            self.initial_gains.shrink_to_fit();
            self.initial_losses.clear();
            self.initial_losses.shrink_to_fit();

            // Return first RSI (same as batch at index=period)
            return Some(calculate_rsi(self.avg_gain, self.avg_loss));
        }

        // Subsequent RSIs: apply Wilder's smoothing then calculate
        self.avg_gain = (self.avg_gain * (1.0 - self.alpha)) + (gain * self.alpha);
        self.avg_loss = (self.avg_loss * (1.0 - self.alpha)) + (loss * self.alpha);

        Some(calculate_rsi(self.avg_gain, self.avg_loss))
    }

    fn reset(&mut self) {
        self.avg_gain = 0.0;
        self.avg_loss = 0.0;
        self.prev_value = f64::NAN;
        self.count = 0;
        self.initial_gains.clear();
        self.initial_losses.clear();
    }

    fn is_ready(&self) -> bool {
        self.count > self.period
    }
}

/// Calculate RSI from average gain and loss.
#[inline]
fn calculate_rsi(avg_gain: f64, avg_loss: f64) -> f64 {
    if avg_loss == 0.0 {
        if avg_gain == 0.0 {
            50.0 // No movement, neutral
        } else {
            100.0 // Only gains, maximum RSI
        }
    } else {
        let rs = avg_gain / avg_loss;
        100.0 - (100.0 / (1.0 + rs))
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
    fn test_rsi_new_valid() {
        let rsi = Rsi::new(14).unwrap();
        assert_eq!(rsi.period(), 14);
    }

    #[test]
    fn test_rsi_new_zero_period() {
        assert!(matches!(
            Rsi::new(0),
            Err(IndicatorError::InvalidParameter(_))
        ));
    }

    #[test]
    fn test_rsi_bounds() {
        let rsi = Rsi::new(3).unwrap();

        // All gains should give RSI close to 100
        let all_up = [1.0, 2.0, 3.0, 4.0, 5.0];
        let result = rsi.calculate(&all_up).unwrap();
        let last = result.last().unwrap();
        assert!(*last > 99.0, "expected RSI > 99, got {last}");

        // All losses should give RSI close to 0
        let all_down = [5.0, 4.0, 3.0, 2.0, 1.0];
        let result = rsi.calculate(&all_down).unwrap();
        let last = result.last().unwrap();
        assert!(*last < 1.0, "expected RSI < 1, got {last}");
    }

    #[test]
    fn test_rsi_no_change() {
        let rsi = Rsi::new(3).unwrap();
        let flat = [50.0, 50.0, 50.0, 50.0, 50.0];
        let result = rsi.calculate(&flat).unwrap();

        // No change should give RSI = 50 (neutral)
        for &val in result.iter().skip(3) {
            assert_approx_eq(val, 50.0);
        }
    }

    #[test]
    fn test_rsi_stream_matches_batch() {
        let batch = Rsi::new(5).unwrap();
        let mut stream = RsiStream::new(5).unwrap();

        let data = [
            44.0, 44.25, 44.5, 43.75, 44.5, 44.25, 44.0, 43.5, 43.25, 43.5, 44.0, 44.25, 44.25,
            44.0, 43.75, 44.0, 44.5, 44.75, 45.0, 45.5,
        ];

        let batch_result = batch.calculate(&data).unwrap();
        let stream_result = stream.init(&data).unwrap();

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.is_nan() {
                assert!(s.is_nan(), "index {i}: batch is NaN but stream is {s}");
            } else {
                assert!(
                    (b - s).abs() < 0.01,
                    "index {i}: batch={b}, stream={s}, diff={}",
                    (b - s).abs()
                );
            }
        }
    }

    #[test]
    fn test_rsi_stream_continues_correctly() {
        let batch = Rsi::new(5).unwrap();
        let mut stream = RsiStream::new(5).unwrap();

        let initial_data = [44.0, 44.25, 44.5, 43.75, 44.5, 44.25];
        stream.init(&initial_data).unwrap();

        // Continue with more data
        let continuation = [44.0, 43.5, 43.25, 43.5];
        let mut stream_values: Vec<f64> = vec![];
        for &val in &continuation {
            if let Some(rsi) = stream.next(val) {
                stream_values.push(rsi);
            }
        }

        // Calculate batch for full data
        let full_data: Vec<f64> = initial_data
            .iter()
            .chain(continuation.iter())
            .copied()
            .collect();
        let batch_result = batch.calculate(&full_data).unwrap();

        // Compare last values
        let batch_tail: Vec<f64> = batch_result
            .iter()
            .skip(initial_data.len())
            .copied()
            .collect();

        assert_eq!(stream_values.len(), batch_tail.len());
        for (b, s) in batch_tail.iter().zip(stream_values.iter()) {
            assert!(
                (b - s).abs() < 0.01,
                "batch={b}, stream={s}, diff={}",
                (b - s).abs()
            );
        }
    }

    #[test]
    fn test_rsi_stream_reset() {
        let mut rsi = RsiStream::new(3).unwrap();
        rsi.init(&[1.0, 2.0, 3.0, 4.0]).unwrap();
        assert!(rsi.is_ready());

        rsi.reset();
        assert!(!rsi.is_ready());
        assert!(rsi.current().is_none());
    }

    #[test]
    fn test_rsi_insufficient_data() {
        let rsi = Rsi::new(14).unwrap();
        let data = [1.0, 2.0, 3.0, 4.0, 5.0];
        let result = rsi.calculate(&data).unwrap();

        assert!(result.iter().all(|v| v.is_nan()));
    }
}
