//! Moving Average Convergence Divergence (MACD) indicator.
//!
//! MACD is a trend-following momentum indicator that shows the relationship
//! between two moving averages of a security's price.
//!
//! # Components
//! - **MACD Line**: Fast EMA - Slow EMA
//! - **Signal Line**: EMA (or SMA) of the MACD Line
//! - **Histogram**: MACD Line - Signal Line
//!
//! # Default Parameters
//! - Fast period: 12
//! - Slow period: 26
//! - Signal period: 9
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Macd;
//! use ta_core::traits::Indicator;
//!
//! let macd = Macd::new(12, 26, 9).unwrap();
//! let prices: Vec<f64> = (1..=50).map(|x| x as f64).collect();
//! let result = macd.calculate(&prices).unwrap();
//! ```

use crate::indicators::{EmaStream, SmaStream};
use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// MACD output containing all three components.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MacdOutput {
    /// MACD line (fast EMA - slow EMA)
    pub macd: f64,
    /// Signal line (EMA/SMA of MACD)
    pub signal: f64,
    /// Histogram (MACD - signal)
    pub histogram: f64,
}

impl MacdOutput {
    /// Creates a new MACD output.
    #[must_use]
    pub const fn new(macd: f64, signal: f64, histogram: f64) -> Self {
        Self {
            macd,
            signal,
            histogram,
        }
    }

    /// Creates a NaN output for insufficient data.
    #[must_use]
    pub fn nan() -> Self {
        Self {
            macd: f64::NAN,
            signal: f64::NAN,
            histogram: f64::NAN,
        }
    }

    /// Returns true if any component is NaN.
    #[must_use]
    pub fn is_nan(&self) -> bool {
        self.macd.is_nan() || self.signal.is_nan() || self.histogram.is_nan()
    }
}

/// Signal line type for MACD.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SignalType {
    /// Use EMA for signal line (default, most common)
    #[default]
    Ema,
    /// Use SMA for signal line
    Sma,
}

/// MACD calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Macd {
    fast_period: usize,
    slow_period: usize,
    signal_period: usize,
    signal_type: SignalType,
}

impl Macd {
    /// Creates a new MACD calculator with the specified periods.
    ///
    /// # Arguments
    /// * `fast_period` - Period for the fast EMA (typically 12)
    /// * `slow_period` - Period for the slow EMA (typically 26)
    /// * `signal_period` - Period for the signal line (typically 9)
    ///
    /// # Errors
    /// Returns `InvalidParameter` if any period is 0 or if fast >= slow.
    pub fn new(fast_period: usize, slow_period: usize, signal_period: usize) -> IndicatorResult<Self> {
        Self::with_signal_type(fast_period, slow_period, signal_period, SignalType::Ema)
    }

    /// Creates a new MACD calculator with custom signal line type.
    pub fn with_signal_type(
        fast_period: usize,
        slow_period: usize,
        signal_period: usize,
        signal_type: SignalType,
    ) -> IndicatorResult<Self> {
        if fast_period == 0 || slow_period == 0 || signal_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "all periods must be greater than 0".to_string(),
            ));
        }
        if fast_period >= slow_period {
            return Err(IndicatorError::InvalidParameter(
                "fast_period must be less than slow_period".to_string(),
            ));
        }
        Ok(Self {
            fast_period,
            slow_period,
            signal_period,
            signal_type,
        })
    }

    /// Returns the fast period.
    #[must_use]
    pub const fn fast_period(&self) -> usize {
        self.fast_period
    }

    /// Returns the slow period.
    #[must_use]
    pub const fn slow_period(&self) -> usize {
        self.slow_period
    }

    /// Returns the signal period.
    #[must_use]
    pub const fn signal_period(&self) -> usize {
        self.signal_period
    }
}

impl Indicator<&[f64], Vec<MacdOutput>> for Macd {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<MacdOutput>> {
        let len = data.len();
        let mut result = vec![MacdOutput::nan(); len];

        // Need at least slow_period values to start calculating MACD line
        if len < self.slow_period {
            return Ok(result);
        }

        // Calculate fast and slow EMAs
        let mut fast_ema = EmaStream::new(self.fast_period)?;
        let mut slow_ema = EmaStream::new(self.slow_period)?;

        let fast_values = fast_ema.init(data)?;
        let slow_values = slow_ema.init(data)?;

        // Calculate MACD line
        let mut macd_line = vec![f64::NAN; len];
        for i in (self.slow_period - 1)..len {
            macd_line[i] = fast_values[i] - slow_values[i];
        }

        // Calculate signal line from MACD values
        // We need signal_period valid MACD values
        let valid_macd_start = self.slow_period - 1;
        let signal_start = valid_macd_start + self.signal_period - 1;

        if len <= signal_start {
            // Can calculate MACD but not signal
            for i in valid_macd_start..len {
                result[i] = MacdOutput::new(macd_line[i], f64::NAN, f64::NAN);
            }
            return Ok(result);
        }

        // Get valid MACD values for signal calculation
        let valid_macd: Vec<f64> = macd_line[valid_macd_start..].to_vec();

        let signal_values = match self.signal_type {
            SignalType::Ema => {
                let mut signal_ema = EmaStream::new(self.signal_period)?;
                signal_ema.init(&valid_macd)?
            }
            SignalType::Sma => {
                let mut signal_sma = SmaStream::new(self.signal_period)?;
                signal_sma.init(&valid_macd)?
            }
        };

        // Combine results
        for i in valid_macd_start..len {
            let macd_idx = i - valid_macd_start;
            let macd = macd_line[i];
            let signal = signal_values[macd_idx];
            let histogram = if signal.is_nan() { f64::NAN } else { macd - signal };
            result[i] = MacdOutput::new(macd, signal, histogram);
        }

        Ok(result)
    }
}

/// MACD calculator for streaming/real-time operations.
#[derive(Debug)]
pub struct MacdStream {
    fast_ema: EmaStream,
    slow_ema: EmaStream,
    signal_ema: Option<EmaStream>,
    signal_sma: Option<SmaStream>,
    slow_period: usize,
    signal_period: usize,
    count: usize,
    macd_buffer: Vec<f64>,
}

impl MacdStream {
    /// Creates a new streaming MACD calculator with EMA signal line.
    pub fn new(fast_period: usize, slow_period: usize, signal_period: usize) -> IndicatorResult<Self> {
        Self::with_signal_type(fast_period, slow_period, signal_period, SignalType::Ema)
    }

    /// Creates a new streaming MACD calculator with custom signal line type.
    pub fn with_signal_type(
        fast_period: usize,
        slow_period: usize,
        signal_period: usize,
        signal_type: SignalType,
    ) -> IndicatorResult<Self> {
        if fast_period == 0 || slow_period == 0 || signal_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "all periods must be greater than 0".to_string(),
            ));
        }
        if fast_period >= slow_period {
            return Err(IndicatorError::InvalidParameter(
                "fast_period must be less than slow_period".to_string(),
            ));
        }

        let fast_ema = EmaStream::new(fast_period)?;
        let slow_ema = EmaStream::new(slow_period)?;

        let (signal_ema, signal_sma) = match signal_type {
            SignalType::Ema => (Some(EmaStream::new(signal_period)?), None),
            SignalType::Sma => (None, Some(SmaStream::new(signal_period)?)),
        };

        Ok(Self {
            fast_ema,
            slow_ema,
            signal_ema,
            signal_sma,
            slow_period,
            signal_period,
            count: 0,
            macd_buffer: Vec::with_capacity(signal_period),
        })
    }

    /// Returns the fast period.
    #[must_use]
    pub fn fast_period(&self) -> usize {
        self.fast_ema.period()
    }

    /// Returns the slow period.
    #[must_use]
    pub const fn slow_period(&self) -> usize {
        self.slow_period
    }

    /// Returns the signal period.
    #[must_use]
    pub const fn signal_period(&self) -> usize {
        self.signal_period
    }
}

impl StreamingIndicator<f64, MacdOutput> for MacdStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<MacdOutput>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or_else(MacdOutput::nan));
        }
        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<MacdOutput> {
        self.count += 1;

        let fast = self.fast_ema.next(value);
        let slow = self.slow_ema.next(value);

        // Need both EMAs to calculate MACD line
        let (fast_val, slow_val) = match (fast, slow) {
            (Some(f), Some(s)) => (f, s),
            _ => return None,
        };

        let macd = fast_val - slow_val;

        // Calculate signal line
        let signal = match (&mut self.signal_ema, &mut self.signal_sma) {
            (Some(ema), None) => ema.next(macd),
            (None, Some(sma)) => sma.next(macd),
            _ => None,
        };

        match signal {
            Some(sig) => Some(MacdOutput::new(macd, sig, macd - sig)),
            None => Some(MacdOutput::new(macd, f64::NAN, f64::NAN)),
        }
    }

    fn reset(&mut self) {
        self.fast_ema.reset();
        self.slow_ema.reset();
        if let Some(ref mut ema) = self.signal_ema {
            ema.reset();
        }
        if let Some(ref mut sma) = self.signal_sma {
            sma.reset();
        }
        self.count = 0;
        self.macd_buffer.clear();
    }

    fn is_ready(&self) -> bool {
        let signal_ready = match (&self.signal_ema, &self.signal_sma) {
            (Some(ema), None) => ema.is_ready(),
            (None, Some(sma)) => sma.is_ready(),
            _ => false,
        };
        self.slow_ema.is_ready() && signal_ready
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
    fn test_macd_new_valid() {
        let macd = Macd::new(12, 26, 9).unwrap();
        assert_eq!(macd.fast_period(), 12);
        assert_eq!(macd.slow_period(), 26);
        assert_eq!(macd.signal_period(), 9);
    }

    #[test]
    fn test_macd_new_invalid_zero() {
        assert!(Macd::new(0, 26, 9).is_err());
        assert!(Macd::new(12, 0, 9).is_err());
        assert!(Macd::new(12, 26, 0).is_err());
    }

    #[test]
    fn test_macd_new_invalid_fast_ge_slow() {
        assert!(Macd::new(26, 26, 9).is_err());
        assert!(Macd::new(30, 26, 9).is_err());
    }

    #[test]
    fn test_macd_basic_calculation() {
        // Use small periods for easier testing
        let macd = Macd::new(3, 5, 3).unwrap();
        let data: Vec<f64> = (1..=20).map(|x| x as f64).collect();
        let result = macd.calculate(&data).unwrap();

        // First 4 values should be NaN (need 5 for slow EMA)
        for i in 0..4 {
            assert!(result[i].is_nan(), "index {i} should be NaN");
        }

        // From index 4, MACD line should be valid
        assert!(!result[4].macd.is_nan());

        // Signal becomes valid after signal_period more values
        // slow_period - 1 + signal_period - 1 = 4 + 2 = 6
        assert!(!result[6].signal.is_nan());
        assert!(!result[6].histogram.is_nan());

        // MACD line should be positive for uptrending data
        // (fast EMA > slow EMA when price is rising)
        for i in 5..result.len() {
            assert!(result[i].macd > 0.0, "MACD at {i} should be positive");
        }
    }

    #[test]
    fn test_macd_stream_matches_batch() {
        let batch = Macd::new(3, 5, 3).unwrap();
        let mut stream = MacdStream::new(3, 5, 3).unwrap();

        let data: Vec<f64> = (1..=15).map(|x| x as f64).collect();

        let batch_result = batch.calculate(&data).unwrap();
        let stream_result = stream.init(&data).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.macd.is_nan() {
                assert!(s.macd.is_nan(), "index {i}: batch macd is NaN but stream is not");
            } else {
                assert_approx_eq(b.macd, s.macd);
            }
            if b.signal.is_nan() {
                assert!(s.signal.is_nan(), "index {i}: batch signal is NaN but stream is not");
            } else {
                assert_approx_eq(b.signal, s.signal);
            }
            if b.histogram.is_nan() {
                assert!(s.histogram.is_nan(), "index {i}: batch histogram is NaN but stream is not");
            } else {
                assert_approx_eq(b.histogram, s.histogram);
            }
        }
    }

    #[test]
    fn test_macd_with_sma_signal() {
        let macd_ema = Macd::new(3, 5, 3).unwrap();
        let macd_sma = Macd::with_signal_type(3, 5, 3, SignalType::Sma).unwrap();

        // Use more varied data to ensure EMA and SMA diverge
        let data: Vec<f64> = vec![
            10.0, 12.0, 11.0, 13.0, 15.0, 14.0, 16.0, 18.0, 17.0, 20.0,
            19.0, 22.0, 21.0, 24.0, 23.0, 26.0, 25.0, 28.0, 27.0, 30.0,
        ];

        let result_ema = macd_ema.calculate(&data).unwrap();
        let result_sma = macd_sma.calculate(&data).unwrap();

        // MACD lines should be identical
        for (e, s) in result_ema.iter().zip(result_sma.iter()) {
            if !e.macd.is_nan() && !s.macd.is_nan() {
                assert_approx_eq(e.macd, s.macd);
            }
        }

        // Signal lines should differ (EMA vs SMA) - check later values where they've diverged
        let mut found_difference = false;
        for (e, s) in result_ema.iter().zip(result_sma.iter()).skip(10) {
            if !e.signal.is_nan() && !s.signal.is_nan() {
                if (e.signal - s.signal).abs() > EPSILON {
                    found_difference = true;
                    break;
                }
            }
        }
        assert!(found_difference, "EMA and SMA signal lines should differ");
    }

    #[test]
    fn test_macd_stream_reset() {
        let mut stream = MacdStream::new(3, 5, 3).unwrap();
        let data: Vec<f64> = (1..=10).map(|x| x as f64).collect();
        stream.init(&data).unwrap();
        assert!(stream.is_ready());

        stream.reset();
        assert!(!stream.is_ready());
    }
}
