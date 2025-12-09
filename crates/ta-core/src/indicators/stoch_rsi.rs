//! Stochastic RSI indicator.
//!
//! Stochastic RSI applies the Stochastic formula to RSI values instead of price,
//! creating an oscillator that moves between 0 and 100. It's more sensitive than
//! regular RSI and useful for identifying overbought/oversold conditions.
//!
//! Formula:
//! 1. Calculate RSI
//! 2. StochRSI = (RSI - min(RSI, n)) / (max(RSI, n) - min(RSI, n)) * 100
//! 3. %K = SMA(StochRSI, k_smooth)
//! 4. %D = SMA(%K, d_period)

use std::collections::VecDeque;

use crate::indicators::RsiStream;
use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Stochastic RSI output values.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StochRsiOutput {
    /// %K line value (0-100)
    pub k: f64,
    /// %D line value (0-100) - signal line
    pub d: f64,
}

/// Batch Stochastic RSI calculator.
///
/// # Example
/// ```
/// use ta_core::indicators::StochRsi;
/// use ta_core::traits::Indicator;
///
/// let stoch_rsi = StochRsi::new(14, 14, 3, 3).unwrap();
/// let prices = vec![44.0, 44.5, 43.5, 44.5, 44.0, 43.0, 42.5, 43.0, 42.0, 41.5,
///                   42.0, 43.0, 44.0, 45.0, 46.0, 45.5, 46.5, 47.0, 46.5, 47.5,
///                   48.0, 47.5, 48.5, 49.0, 48.5, 49.5, 50.0, 49.5, 50.5, 51.0];
/// let result = stoch_rsi.calculate(&prices).unwrap();
/// ```
pub struct StochRsi {
    rsi_period: usize,
    stoch_period: usize,
    k_smooth: usize,
    d_period: usize,
}

impl StochRsi {
    /// Create a new Stochastic RSI calculator.
    ///
    /// # Arguments
    /// * `rsi_period` - Period for RSI calculation (typically 14)
    /// * `stoch_period` - Lookback period for stochastic min/max (typically 14)
    /// * `k_smooth` - Smoothing period for %K line (typically 3)
    /// * `d_period` - SMA period for %D line (typically 3)
    ///
    /// # Errors
    /// Returns error if any period is 0.
    pub fn new(
        rsi_period: usize,
        stoch_period: usize,
        k_smooth: usize,
        d_period: usize,
    ) -> IndicatorResult<Self> {
        if rsi_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "RSI period must be > 0".to_string(),
            ));
        }
        if stoch_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "Stochastic period must be > 0".to_string(),
            ));
        }
        if k_smooth == 0 {
            return Err(IndicatorError::InvalidParameter(
                "K smoothing period must be > 0".to_string(),
            ));
        }
        if d_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "D period must be > 0".to_string(),
            ));
        }

        Ok(Self {
            rsi_period,
            stoch_period,
            k_smooth,
            d_period,
        })
    }

    /// Get the RSI period.
    #[must_use]
    pub const fn rsi_period(&self) -> usize {
        self.rsi_period
    }

    /// Get the stochastic lookback period.
    #[must_use]
    pub const fn stoch_period(&self) -> usize {
        self.stoch_period
    }

    /// Get the K smoothing period.
    #[must_use]
    pub const fn k_smooth(&self) -> usize {
        self.k_smooth
    }

    /// Get the D period.
    #[must_use]
    pub const fn d_period(&self) -> usize {
        self.d_period
    }
}

impl Indicator<&[f64], Vec<StochRsiOutput>> for StochRsi {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<StochRsiOutput>> {
        if data.is_empty() {
            return Ok(vec![]);
        }

        let mut results = vec![
            StochRsiOutput {
                k: f64::NAN,
                d: f64::NAN
            };
            data.len()
        ];

        // Step 1: Calculate RSI for all data
        let mut rsi_stream = RsiStream::new(self.rsi_period)?;
        let rsi_values = rsi_stream.init(data)?;

        // Step 2: Calculate raw Stochastic RSI values
        // We need stoch_period RSI values to calculate one StochRSI
        let mut rsi_window: VecDeque<f64> = VecDeque::with_capacity(self.stoch_period);
        let mut stoch_rsi_raw: Vec<f64> = vec![f64::NAN; data.len()];

        for (i, &rsi) in rsi_values.iter().enumerate() {
            if rsi.is_nan() {
                continue;
            }

            rsi_window.push_back(rsi);
            if rsi_window.len() > self.stoch_period {
                rsi_window.pop_front();
            }

            if rsi_window.len() == self.stoch_period {
                let min_rsi = rsi_window.iter().copied().fold(f64::INFINITY, f64::min);
                let max_rsi = rsi_window.iter().copied().fold(f64::NEG_INFINITY, f64::max);

                let range = max_rsi - min_rsi;
                stoch_rsi_raw[i] = if range > 0.0 {
                    ((rsi - min_rsi) / range) * 100.0
                } else {
                    50.0 // Neutral when range is 0
                };
            }
        }

        // Step 3: Smooth with K smoothing (SMA)
        let mut k_window: VecDeque<f64> = VecDeque::with_capacity(self.k_smooth);
        let mut k_values: Vec<f64> = vec![f64::NAN; data.len()];

        for (i, &raw) in stoch_rsi_raw.iter().enumerate() {
            if raw.is_nan() {
                continue;
            }

            k_window.push_back(raw);
            if k_window.len() > self.k_smooth {
                k_window.pop_front();
            }

            if k_window.len() == self.k_smooth {
                k_values[i] = k_window.iter().sum::<f64>() / self.k_smooth as f64;
            }
        }

        // Step 4: Calculate %D as SMA of %K
        let mut d_window: VecDeque<f64> = VecDeque::with_capacity(self.d_period);

        for (i, &k) in k_values.iter().enumerate() {
            if k.is_nan() {
                continue;
            }

            d_window.push_back(k);
            if d_window.len() > self.d_period {
                d_window.pop_front();
            }

            if d_window.len() == self.d_period {
                let d = d_window.iter().sum::<f64>() / self.d_period as f64;
                results[i] = StochRsiOutput { k, d };
            } else {
                // %K is available but %D is not yet
                results[i] = StochRsiOutput { k, d: f64::NAN };
            }
        }

        Ok(results)
    }
}

/// Streaming Stochastic RSI calculator for O(1) updates.
///
/// # Example
/// ```
/// use ta_core::indicators::StochRsiStream;
/// use ta_core::traits::StreamingIndicator;
///
/// let mut stream = StochRsiStream::new(14, 14, 3, 3).unwrap();
/// let history = vec![44.0, 44.5, 43.5, 44.5, 44.0, 43.0, 42.5, 43.0, 42.0, 41.5,
///                    42.0, 43.0, 44.0, 45.0, 46.0, 45.5, 46.5, 47.0, 46.5, 47.5,
///                    48.0, 47.5, 48.5, 49.0, 48.5, 49.5, 50.0, 49.5, 50.5, 51.0];
/// let _ = stream.init(&history);
///
/// // Process new values in O(1)
/// if let Some(output) = stream.next(51.5) {
///     println!("K: {}, D: {}", output.k, output.d);
/// }
/// ```
pub struct StochRsiStream {
    rsi_period: usize,
    stoch_period: usize,
    k_smooth: usize,
    d_period: usize,

    // Internal RSI stream
    rsi_stream: RsiStream,

    // RSI window for min/max tracking
    rsi_window: VecDeque<f64>,

    // Monotonic deques for O(1) min/max
    min_deque: VecDeque<(usize, f64)>, // (index, value)
    max_deque: VecDeque<(usize, f64)>,
    rsi_index: usize,

    // K smoothing (SMA)
    k_window: VecDeque<f64>,
    k_sum: f64,

    // D smoothing (SMA)
    d_window: VecDeque<f64>,
    d_sum: f64,

    ready: bool,
}

impl StochRsiStream {
    /// Create a new streaming Stochastic RSI calculator.
    pub fn new(
        rsi_period: usize,
        stoch_period: usize,
        k_smooth: usize,
        d_period: usize,
    ) -> IndicatorResult<Self> {
        if rsi_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "RSI period must be > 0".to_string(),
            ));
        }
        if stoch_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "Stochastic period must be > 0".to_string(),
            ));
        }
        if k_smooth == 0 {
            return Err(IndicatorError::InvalidParameter(
                "K smoothing period must be > 0".to_string(),
            ));
        }
        if d_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "D period must be > 0".to_string(),
            ));
        }

        let rsi_stream = RsiStream::new(rsi_period)?;

        Ok(Self {
            rsi_period,
            stoch_period,
            k_smooth,
            d_period,
            rsi_stream,
            rsi_window: VecDeque::with_capacity(stoch_period),
            min_deque: VecDeque::new(),
            max_deque: VecDeque::new(),
            rsi_index: 0,
            k_window: VecDeque::with_capacity(k_smooth),
            k_sum: 0.0,
            d_window: VecDeque::with_capacity(d_period),
            d_sum: 0.0,
            ready: false,
        })
    }

    /// Get the RSI period.
    #[must_use]
    pub const fn rsi_period(&self) -> usize {
        self.rsi_period
    }

    /// Get the stochastic lookback period.
    #[must_use]
    pub const fn stoch_period(&self) -> usize {
        self.stoch_period
    }

    /// Get the K smoothing period.
    #[must_use]
    pub const fn k_smooth(&self) -> usize {
        self.k_smooth
    }

    /// Get the D period.
    #[must_use]
    pub const fn d_period(&self) -> usize {
        self.d_period
    }

    /// Process a new RSI value and update stochastic calculations.
    fn process_rsi(&mut self, rsi: f64) -> Option<StochRsiOutput> {
        // Update RSI window
        self.rsi_window.push_back(rsi);
        if self.rsi_window.len() > self.stoch_period {
            self.rsi_window.pop_front();
        }

        // Maintain min deque (monotonically increasing)
        while self.min_deque.back().is_some_and(|(_, v)| *v >= rsi) {
            self.min_deque.pop_back();
        }
        self.min_deque.push_back((self.rsi_index, rsi));

        // Remove old entries from min deque
        while self.min_deque.front().is_some_and(|(idx, _)| {
            self.rsi_index >= self.stoch_period && *idx <= self.rsi_index - self.stoch_period
        }) {
            self.min_deque.pop_front();
        }

        // Maintain max deque (monotonically decreasing)
        while self.max_deque.back().is_some_and(|(_, v)| *v <= rsi) {
            self.max_deque.pop_back();
        }
        self.max_deque.push_back((self.rsi_index, rsi));

        // Remove old entries from max deque
        while self.max_deque.front().is_some_and(|(idx, _)| {
            self.rsi_index >= self.stoch_period && *idx <= self.rsi_index - self.stoch_period
        }) {
            self.max_deque.pop_front();
        }

        self.rsi_index += 1;

        // Need full stoch_period to calculate
        if self.rsi_window.len() < self.stoch_period {
            return None;
        }

        // Calculate raw Stochastic RSI
        let min_rsi = self.min_deque.front().map(|(_, v)| *v)?;
        let max_rsi = self.max_deque.front().map(|(_, v)| *v)?;

        let range = max_rsi - min_rsi;
        let stoch_rsi_raw = if range > 0.0 {
            ((rsi - min_rsi) / range) * 100.0
        } else {
            50.0
        };

        // Update K smoothing
        if self.k_window.len() == self.k_smooth {
            let old = self.k_window.pop_front().unwrap();
            self.k_sum -= old;
        }
        self.k_window.push_back(stoch_rsi_raw);
        self.k_sum += stoch_rsi_raw;

        if self.k_window.len() < self.k_smooth {
            return None;
        }

        let k = self.k_sum / self.k_smooth as f64;

        // Update D smoothing
        if self.d_window.len() == self.d_period {
            let old = self.d_window.pop_front().unwrap();
            self.d_sum -= old;
        }
        self.d_window.push_back(k);
        self.d_sum += k;

        if self.d_window.len() < self.d_period {
            // K is ready but D is not yet - return partial output
            return Some(StochRsiOutput { k, d: f64::NAN });
        }

        self.ready = true;
        let d = self.d_sum / self.d_period as f64;

        Some(StochRsiOutput { k, d })
    }
}

impl StreamingIndicator<f64, StochRsiOutput> for StochRsiStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<StochRsiOutput>> {
        self.reset();

        if data.is_empty() {
            return Ok(vec![]);
        }

        let mut results = Vec::with_capacity(data.len());

        // Initialize RSI first - RSI.init handles any data length gracefully
        let rsi_values = self.rsi_stream.init(data)?;

        // Process each RSI value through stochastic calculation
        for &rsi in &rsi_values {
            if rsi.is_nan() {
                results.push(StochRsiOutput {
                    k: f64::NAN,
                    d: f64::NAN,
                });
            } else if let Some(output) = self.process_rsi(rsi) {
                results.push(output);
            } else {
                results.push(StochRsiOutput {
                    k: f64::NAN,
                    d: f64::NAN,
                });
            }
        }

        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<StochRsiOutput> {
        let rsi = self.rsi_stream.next(value)?;
        self.process_rsi(rsi)
    }

    fn reset(&mut self) {
        self.rsi_stream.reset();
        self.rsi_window.clear();
        self.min_deque.clear();
        self.max_deque.clear();
        self.rsi_index = 0;
        self.k_window.clear();
        self.k_sum = 0.0;
        self.d_window.clear();
        self.d_sum = 0.0;
        self.ready = false;
    }

    fn is_ready(&self) -> bool {
        self.ready
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_prices() -> Vec<f64> {
        // Extended sample data (50 prices) to meet minimum data requirements
        vec![
            44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03,
            45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45,
            45.78, 46.23, 46.69, 47.23, 46.98, 47.29, 47.71, 47.57, 47.85, 47.45, 47.89, 48.23,
            48.05, 47.79, 48.15, 48.45, 48.32, 48.67, 48.89, 49.12, 48.95, 49.35, 49.67, 49.45,
            49.78, 50.01,
        ]
    }

    #[test]
    fn test_stoch_rsi_new() {
        assert!(StochRsi::new(14, 14, 3, 3).is_ok());
        assert!(StochRsi::new(0, 14, 3, 3).is_err());
        assert!(StochRsi::new(14, 0, 3, 3).is_err());
        assert!(StochRsi::new(14, 14, 0, 3).is_err());
        assert!(StochRsi::new(14, 14, 3, 0).is_err());
    }

    #[test]
    fn test_stoch_rsi_batch() {
        let indicator = StochRsi::new(14, 14, 3, 3).unwrap();
        let prices = sample_prices();
        let results = indicator.calculate(&prices).unwrap();

        assert_eq!(results.len(), prices.len());

        // With period 14 RSI + 14 stoch + 3 k_smooth + 3 d_period:
        // - RSI needs 15 values (period + 1) to produce first value at index 14
        // - Then stoch needs 14 more RSI values, so first stoch_raw at index 27
        // - Then k_smooth needs 3, so first K at index 29
        // - Then d_period needs 3, so first D at index 31

        // First 29 values should have NaN K
        for (i, result) in results.iter().enumerate().take(29) {
            assert!(
                result.k.is_nan(),
                "Expected NaN K at index {}, got {}",
                i,
                result.k
            );
        }

        // Index 29-30 should have valid K but NaN D
        for i in 29..31.min(results.len()) {
            assert!(!results[i].k.is_nan(), "Expected valid K at index {}", i);
            assert!(
                results[i].d.is_nan(),
                "Expected NaN D at index {}, got {}",
                i,
                results[i].d
            );
        }

        // From index 31 onward, both K and D should be valid and in range 0-100
        for (i, result) in results.iter().enumerate().skip(31) {
            assert!(
                result.k >= 0.0 && result.k <= 100.0,
                "K out of range at {}: {}",
                i,
                result.k
            );
            assert!(
                result.d >= 0.0 && result.d <= 100.0,
                "D out of range at {}: {}",
                i,
                result.d
            );
        }
    }

    #[test]
    fn test_stoch_rsi_stream() {
        let mut stream = StochRsiStream::new(14, 14, 3, 3).unwrap();
        let prices = sample_prices();
        let results = stream.init(&prices).unwrap();

        assert_eq!(results.len(), prices.len());
        assert!(stream.is_ready());

        // Process one more value
        let next_result = stream.next(50.25);
        assert!(next_result.is_some());
        let output = next_result.unwrap();
        assert!(output.k >= 0.0 && output.k <= 100.0);
        assert!(output.d >= 0.0 && output.d <= 100.0);
    }

    #[test]
    fn test_stoch_rsi_streaming_matches_batch() {
        let prices = sample_prices();

        // Batch calculation
        let batch = StochRsi::new(14, 14, 3, 3).unwrap();
        let batch_results = batch.calculate(&prices).unwrap();

        // Streaming calculation
        let mut stream = StochRsiStream::new(14, 14, 3, 3).unwrap();
        let stream_results = stream.init(&prices).unwrap();

        // Compare
        for (i, (b, s)) in batch_results.iter().zip(stream_results.iter()).enumerate() {
            if b.k.is_nan() {
                assert!(
                    s.k.is_nan(),
                    "Mismatch at index {}: batch k=NaN, stream k={}",
                    i,
                    s.k
                );
            } else {
                assert!(
                    (b.k - s.k).abs() < 1e-10,
                    "K mismatch at index {}: batch={}, stream={}",
                    i,
                    b.k,
                    s.k
                );
            }
            if b.d.is_nan() {
                assert!(
                    s.d.is_nan(),
                    "Mismatch at index {}: batch d=NaN, stream d={}",
                    i,
                    s.d
                );
            } else {
                assert!(
                    (b.d - s.d).abs() < 1e-10,
                    "D mismatch at index {}: batch={}, stream={}",
                    i,
                    b.d,
                    s.d
                );
            }
        }
    }

    #[test]
    fn test_stoch_rsi_insufficient_data_returns_nan() {
        // Should handle gracefully - return NaN, not error
        let indicator = StochRsi::new(14, 14, 3, 3).unwrap();

        // Test with very short data
        let prices = vec![1.0; 10];
        let result = indicator.calculate(&prices).unwrap();
        assert_eq!(result.len(), 10);
        for r in &result {
            assert!(r.k.is_nan());
            assert!(r.d.is_nan());
        }

        // Test with empty data
        let empty: Vec<f64> = vec![];
        let result = indicator.calculate(&empty).unwrap();
        assert!(result.is_empty());

        // Test streaming with short data
        let mut stream = StochRsiStream::new(14, 14, 3, 3).unwrap();
        let result = stream.init(&prices).unwrap();
        assert_eq!(result.len(), 10);
        for r in &result {
            assert!(r.k.is_nan());
            assert!(r.d.is_nan());
        }

        // Stream should not be "ready" yet
        assert!(!stream.is_ready());
    }

    #[test]
    fn test_stoch_rsi_single_value() {
        let indicator = StochRsi::new(14, 14, 3, 3).unwrap();
        let prices = vec![100.0];
        let result = indicator.calculate(&prices).unwrap();
        assert_eq!(result.len(), 1);
        assert!(result[0].k.is_nan());
        assert!(result[0].d.is_nan());
    }

    #[test]
    fn test_stoch_rsi_reset() {
        let mut stream = StochRsiStream::new(14, 14, 3, 3).unwrap();
        let prices = sample_prices();

        let results1 = stream.init(&prices).unwrap();
        stream.reset();
        let results2 = stream.init(&prices).unwrap();

        for (r1, r2) in results1.iter().zip(results2.iter()) {
            if r1.k.is_nan() {
                assert!(r2.k.is_nan());
            } else {
                assert!((r1.k - r2.k).abs() < 1e-10);
            }
            if r1.d.is_nan() {
                assert!(r2.d.is_nan());
            } else {
                assert!((r1.d - r2.d).abs() < 1e-10);
            }
        }
    }
}
