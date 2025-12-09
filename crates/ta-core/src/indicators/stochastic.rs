//! Stochastic Oscillator indicator.
//!
//! The Stochastic Oscillator is a momentum indicator comparing a closing price
//! to its price range over a given period. It helps identify overbought and
//! oversold conditions.
//!
//! # Variants
//! - **Fast Stochastic**: Raw %K, with %D as SMA of %K
//! - **Slow Stochastic**: %K is smoothed first (SMA), then %D is SMA of smoothed %K
//!
//! # Formula
//! ```text
//! Raw %K = 100 × (Close - Lowest Low) / (Highest High - Lowest Low)
//!
//! Fast Stochastic:
//!   %K = Raw %K
//!   %D = SMA(%K, d_period)
//!
//! Slow Stochastic:
//!   %K = SMA(Raw %K, slowing_period)  // typically 3
//!   %D = SMA(%K, d_period)
//! ```
//!
//! # Interpretation
//! - Above 80: Overbought condition
//! - Below 20: Oversold condition
//! - Crossovers of %K and %D generate trading signals
//!
//! # Default Parameters
//! - K Period: 14
//! - D Period: 3
//! - Slowing Period: 3 (for Slow Stochastic)
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::{Stoch, StochType};
//! use ta_core::traits::Indicator;
//!
//! let stoch = Stoch::new(14, 3, StochType::Fast).unwrap();
//! let highs = vec![127.01, 127.62, 126.59, 127.35, 128.17, 128.43, 127.37,
//!                  126.42, 126.90, 126.85, 125.65, 125.72, 127.16, 127.72, 127.69];
//! let lows = vec![125.36, 126.16, 124.93, 126.09, 126.82, 126.48, 126.03,
//!                 124.83, 126.39, 125.72, 124.56, 124.57, 125.07, 126.86, 126.63];
//! let closes = vec![126.90, 127.16, 125.30, 126.53, 127.79, 128.01, 127.11,
//!                   125.44, 126.70, 126.25, 125.09, 125.52, 126.74, 127.35, 128.15];
//! let result = stoch.calculate(&(&highs, &lows, &closes)).unwrap();
//! ```
//!
//! # Example (Streaming Mode)
//! ```
//! use ta_core::indicators::{StochStream, StochType, StochOutput};
//! use ta_core::traits::StreamingIndicator;
//!
//! let mut stoch = StochStream::new(14, 3, StochType::Fast).unwrap();
//! // Initialize with historical data
//! let data: Vec<(f64, f64, f64)> = vec![
//!     (127.01, 125.36, 126.90), (127.62, 126.16, 127.16), (126.59, 124.93, 125.30),
//!     (127.35, 126.09, 126.53), (128.17, 126.82, 127.79), (128.43, 126.48, 128.01),
//!     (127.37, 126.03, 127.11), (126.42, 124.83, 125.44), (126.90, 126.39, 126.70),
//!     (126.85, 125.72, 126.25), (125.65, 124.56, 125.09), (125.72, 124.57, 125.52),
//!     (127.16, 125.07, 126.74), (127.72, 126.86, 127.35), (127.69, 126.63, 128.15),
//! ];
//! stoch.init(&data).unwrap();
//! // Stream new values with O(1) updates
//! let output = stoch.next((128.22, 126.80, 127.50));
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};
use std::collections::VecDeque;

/// Type of Stochastic Oscillator calculation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StochType {
    /// Fast Stochastic: Raw %K with %D as simple moving average
    Fast,
    /// Slow Stochastic: %K is smoothed, %D is SMA of smoothed %K
    Slow,
}

/// Stochastic Oscillator output containing %K and %D values.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StochOutput {
    /// %K line value (0-100)
    pub k: f64,
    /// %D line value (0-100) - signal line
    pub d: f64,
}

impl StochOutput {
    /// Creates a new StochOutput with NaN values.
    #[must_use]
    pub const fn nan() -> Self {
        Self {
            k: f64::NAN,
            d: f64::NAN,
        }
    }
}

/// Stochastic Oscillator calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Stoch {
    k_period: usize,
    d_period: usize,
    slowing: usize,
    stoch_type: StochType,
}

impl Stoch {
    /// Creates a new Stochastic Oscillator calculator.
    ///
    /// # Arguments
    /// * `k_period` - Lookback period for highest high / lowest low (typically 14)
    /// * `d_period` - Smoothing period for %D line (typically 3)
    /// * `stoch_type` - Fast or Slow variant
    ///
    /// For Slow Stochastic, a default slowing period of 3 is used.
    /// Use [`new_with_slowing`](Self::new_with_slowing) for custom slowing.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if any period is 0.
    pub fn new(k_period: usize, d_period: usize, stoch_type: StochType) -> IndicatorResult<Self> {
        Self::new_with_slowing(k_period, d_period, 3, stoch_type)
    }

    /// Creates a new Stochastic Oscillator with custom slowing period.
    ///
    /// # Arguments
    /// * `k_period` - Lookback period for highest high / lowest low (typically 14)
    /// * `d_period` - Smoothing period for %D line (typically 3)
    /// * `slowing` - Slowing period for Slow Stochastic (typically 3)
    /// * `stoch_type` - Fast or Slow variant
    ///
    /// # Errors
    /// Returns `InvalidParameter` if any period is 0.
    pub fn new_with_slowing(
        k_period: usize,
        d_period: usize,
        slowing: usize,
        stoch_type: StochType,
    ) -> IndicatorResult<Self> {
        if k_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "k_period must be greater than 0".to_string(),
            ));
        }
        if d_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "d_period must be greater than 0".to_string(),
            ));
        }
        if slowing == 0 {
            return Err(IndicatorError::InvalidParameter(
                "slowing must be greater than 0".to_string(),
            ));
        }
        Ok(Self {
            k_period,
            d_period,
            slowing,
            stoch_type,
        })
    }

    /// Returns the K period.
    #[must_use]
    pub const fn k_period(&self) -> usize {
        self.k_period
    }

    /// Returns the D period.
    #[must_use]
    pub const fn d_period(&self) -> usize {
        self.d_period
    }

    /// Returns the slowing period.
    #[must_use]
    pub const fn slowing(&self) -> usize {
        self.slowing
    }

    /// Returns the stochastic type.
    #[must_use]
    pub const fn stoch_type(&self) -> StochType {
        self.stoch_type
    }

    /// Calculate raw stochastic %K value.
    #[inline]
    fn raw_k(close: f64, lowest: f64, highest: f64) -> f64 {
        let range = highest - lowest;
        if range == 0.0 {
            // Avoid division by zero - when high == low, return 50 (middle)
            50.0
        } else {
            100.0 * (close - lowest) / range
        }
    }
}

/// Input type for Stochastic: (highs, lows, closes)
type StochInput<'a> = (&'a [f64], &'a [f64], &'a [f64]);

impl Indicator<&StochInput<'_>, Vec<StochOutput>> for Stoch {
    fn calculate(&self, data: &StochInput<'_>) -> IndicatorResult<Vec<StochOutput>> {
        let (highs, lows, closes) = *data;
        let len = highs.len();

        // Validate input lengths match
        if lows.len() != len || closes.len() != len {
            return Err(IndicatorError::InvalidParameter(
                "highs, lows, and closes must have the same length".to_string(),
            ));
        }

        let mut result = vec![StochOutput::nan(); len];

        if len == 0 {
            return Ok(result);
        }

        // Calculate raw %K values for all valid points
        let mut raw_k_values = vec![f64::NAN; len];

        for i in (self.k_period - 1)..len {
            let start = i + 1 - self.k_period;
            let highest = highs[start..=i]
                .iter()
                .copied()
                .fold(f64::NEG_INFINITY, f64::max);
            let lowest = lows[start..=i]
                .iter()
                .copied()
                .fold(f64::INFINITY, f64::min);
            raw_k_values[i] = Self::raw_k(closes[i], lowest, highest);
        }

        match self.stoch_type {
            StochType::Fast => {
                // Fast: %K = raw %K, %D = SMA(%K, d_period)
                // First valid %K at index k_period - 1
                // First valid %D at index k_period - 1 + d_period - 1

                for i in (self.k_period - 1)..len {
                    let k = raw_k_values[i];

                    // Calculate %D (SMA of %K)
                    let d = if i >= self.k_period - 1 + self.d_period - 1 {
                        let start = i + 1 - self.d_period;
                        let sum: f64 = raw_k_values[start..=i].iter().sum();
                        sum / self.d_period as f64
                    } else {
                        f64::NAN
                    };

                    result[i] = StochOutput { k, d };
                }
            }
            StochType::Slow => {
                // Slow: %K = SMA(raw %K, slowing), %D = SMA(%K, d_period)
                let mut smoothed_k = vec![f64::NAN; len];

                // First smoothed %K at index k_period - 1 + slowing - 1
                let first_smoothed_idx = self.k_period - 1 + self.slowing - 1;

                for i in first_smoothed_idx..len {
                    let start = i + 1 - self.slowing;
                    let sum: f64 = raw_k_values[start..=i].iter().sum();
                    smoothed_k[i] = sum / self.slowing as f64;
                }

                // Now calculate %D as SMA of smoothed %K
                // First valid %D at index first_smoothed_idx + d_period - 1
                let first_d_idx = first_smoothed_idx + self.d_period - 1;

                for i in first_smoothed_idx..len {
                    let k = smoothed_k[i];

                    let d = if i >= first_d_idx {
                        let start = i + 1 - self.d_period;
                        let sum: f64 = smoothed_k[start..=i].iter().sum();
                        sum / self.d_period as f64
                    } else {
                        f64::NAN
                    };

                    result[i] = StochOutput { k, d };
                }
            }
        }

        Ok(result)
    }
}

/// Streaming Stochastic Oscillator calculator for real-time O(1) updates.
///
/// Uses monotonic deques to track min/max in O(1) amortized time.
#[derive(Debug)]
pub struct StochStream {
    k_period: usize,
    d_period: usize,
    slowing: usize,
    stoch_type: StochType,

    // Ring buffer for high/low/close values
    highs: VecDeque<f64>,
    lows: VecDeque<f64>,

    // Monotonic deques for O(1) min/max
    max_deque: VecDeque<(usize, f64)>, // (index, value) for highest high
    min_deque: VecDeque<(usize, f64)>, // (index, value) for lowest low

    // Buffer for raw %K values (used for smoothing)
    raw_k_buffer: VecDeque<f64>,

    // Buffer for smoothed %K values (for slow stochastic)
    smoothed_k_buffer: VecDeque<f64>,

    // Current index counter
    index: usize,

    // State tracking
    count: usize,
    initialized: bool,
}

impl StochStream {
    /// Creates a new streaming Stochastic Oscillator.
    ///
    /// # Arguments
    /// * `k_period` - Lookback period for highest high / lowest low (typically 14)
    /// * `d_period` - Smoothing period for %D line (typically 3)
    /// * `stoch_type` - Fast or Slow variant
    ///
    /// # Errors
    /// Returns `InvalidParameter` if any period is 0.
    pub fn new(k_period: usize, d_period: usize, stoch_type: StochType) -> IndicatorResult<Self> {
        Self::new_with_slowing(k_period, d_period, 3, stoch_type)
    }

    /// Creates a new streaming Stochastic Oscillator with custom slowing.
    pub fn new_with_slowing(
        k_period: usize,
        d_period: usize,
        slowing: usize,
        stoch_type: StochType,
    ) -> IndicatorResult<Self> {
        if k_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "k_period must be greater than 0".to_string(),
            ));
        }
        if d_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "d_period must be greater than 0".to_string(),
            ));
        }
        if slowing == 0 {
            return Err(IndicatorError::InvalidParameter(
                "slowing must be greater than 0".to_string(),
            ));
        }

        Ok(Self {
            k_period,
            d_period,
            slowing,
            stoch_type,
            highs: VecDeque::with_capacity(k_period),
            lows: VecDeque::with_capacity(k_period),
            max_deque: VecDeque::with_capacity(k_period),
            min_deque: VecDeque::with_capacity(k_period),
            raw_k_buffer: VecDeque::with_capacity(d_period.max(slowing)),
            smoothed_k_buffer: VecDeque::with_capacity(d_period),
            index: 0,
            count: 0,
            initialized: false,
        })
    }

    /// Returns the K period.
    #[must_use]
    pub const fn k_period(&self) -> usize {
        self.k_period
    }

    /// Returns the D period.
    #[must_use]
    pub const fn d_period(&self) -> usize {
        self.d_period
    }

    /// Returns the slowing period.
    #[must_use]
    pub const fn slowing(&self) -> usize {
        self.slowing
    }

    /// Returns the stochastic type.
    #[must_use]
    pub const fn stoch_type(&self) -> StochType {
        self.stoch_type
    }

    /// Add a new high value and update the max deque.
    #[inline]
    fn add_high(&mut self, high: f64) {
        // Remove elements from back that are smaller than current
        while let Some(&(_, v)) = self.max_deque.back() {
            if v <= high {
                self.max_deque.pop_back();
            } else {
                break;
            }
        }
        self.max_deque.push_back((self.index, high));

        // Remove elements that are out of window
        let window_start = self.index.saturating_sub(self.k_period - 1);
        while let Some(&(idx, _)) = self.max_deque.front() {
            if idx < window_start {
                self.max_deque.pop_front();
            } else {
                break;
            }
        }

        // Update ring buffer
        if self.highs.len() >= self.k_period {
            self.highs.pop_front();
        }
        self.highs.push_back(high);
    }

    /// Add a new low value and update the min deque.
    #[inline]
    fn add_low(&mut self, low: f64) {
        // Remove elements from back that are larger than current
        while let Some(&(_, v)) = self.min_deque.back() {
            if v >= low {
                self.min_deque.pop_back();
            } else {
                break;
            }
        }
        self.min_deque.push_back((self.index, low));

        // Remove elements that are out of window
        let window_start = self.index.saturating_sub(self.k_period - 1);
        while let Some(&(idx, _)) = self.min_deque.front() {
            if idx < window_start {
                self.min_deque.pop_front();
            } else {
                break;
            }
        }

        // Update ring buffer
        if self.lows.len() >= self.k_period {
            self.lows.pop_front();
        }
        self.lows.push_back(low);
    }

    /// Calculate raw %K from current state.
    #[inline]
    fn calc_raw_k(&self, close: f64) -> Option<f64> {
        if self.count < self.k_period {
            return None;
        }

        let highest = self.max_deque.front().map(|(_, v)| *v)?;
        let lowest = self.min_deque.front().map(|(_, v)| *v)?;

        let range = highest - lowest;
        if range == 0.0 {
            Some(50.0)
        } else {
            Some(100.0 * (close - lowest) / range)
        }
    }
}

/// Input for streaming: (high, low, close) tuple
pub type StochBar = (f64, f64, f64);

impl StreamingIndicator<StochBar, StochOutput> for StochStream {
    fn init(&mut self, data: &[StochBar]) -> IndicatorResult<Vec<StochOutput>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &bar in data {
            results.push(self.next(bar).unwrap_or(StochOutput::nan()));
        }
        self.initialized = !data.is_empty();
        Ok(results)
    }

    fn next(&mut self, value: StochBar) -> Option<StochOutput> {
        let (high, low, close) = value;

        // Update state
        self.add_high(high);
        self.add_low(low);
        self.count += 1;
        self.index += 1;

        // Calculate raw %K
        let raw_k = self.calc_raw_k(close)?;

        match self.stoch_type {
            StochType::Fast => {
                // Fast: %K = raw %K, %D = SMA(%K, d_period)
                // We need to track raw_k values for %D calculation
                if self.raw_k_buffer.len() >= self.d_period {
                    self.raw_k_buffer.pop_front();
                }
                self.raw_k_buffer.push_back(raw_k);

                let d = if self.raw_k_buffer.len() >= self.d_period {
                    let sum: f64 = self.raw_k_buffer.iter().sum();
                    sum / self.d_period as f64
                } else {
                    f64::NAN
                };

                Some(StochOutput { k: raw_k, d })
            }
            StochType::Slow => {
                // Slow: %K = SMA(raw %K, slowing), %D = SMA(%K, d_period)
                // First, add raw_k to buffer for slowing calculation
                if self.raw_k_buffer.len() >= self.slowing {
                    self.raw_k_buffer.pop_front();
                }
                self.raw_k_buffer.push_back(raw_k);

                // Calculate smoothed %K
                if self.raw_k_buffer.len() < self.slowing {
                    return Some(StochOutput::nan());
                }

                let smoothed_k: f64 = self.raw_k_buffer.iter().sum::<f64>() / self.slowing as f64;

                // Add smoothed %K to buffer for %D calculation
                if self.smoothed_k_buffer.len() >= self.d_period {
                    self.smoothed_k_buffer.pop_front();
                }
                self.smoothed_k_buffer.push_back(smoothed_k);

                // Calculate %D
                let d = if self.smoothed_k_buffer.len() >= self.d_period {
                    self.smoothed_k_buffer.iter().sum::<f64>() / self.d_period as f64
                } else {
                    f64::NAN
                };

                Some(StochOutput { k: smoothed_k, d })
            }
        }
    }

    fn reset(&mut self) {
        self.highs.clear();
        self.lows.clear();
        self.max_deque.clear();
        self.min_deque.clear();
        self.raw_k_buffer.clear();
        self.smoothed_k_buffer.clear();
        self.index = 0;
        self.count = 0;
        self.initialized = false;
    }

    fn is_ready(&self) -> bool {
        self.count >= self.k_period
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Test data from a real example (Lane's original paper values approximated)
    const HIGHS: [f64; 15] = [
        127.01, 127.62, 126.59, 127.35, 128.17, 128.43, 127.37, 126.42, 126.90, 126.85, 125.65,
        125.72, 127.16, 127.72, 127.69,
    ];
    const LOWS: [f64; 15] = [
        125.36, 126.16, 124.93, 126.09, 126.82, 126.48, 126.03, 124.83, 126.39, 125.72, 124.56,
        124.57, 125.07, 126.86, 126.63,
    ];
    const CLOSES: [f64; 15] = [
        126.90, 127.16, 125.30, 126.53, 127.79, 128.01, 127.11, 125.44, 126.70, 126.25, 125.09,
        125.52, 126.74, 127.35, 128.15,
    ];

    #[test]
    fn test_stoch_new() {
        assert!(Stoch::new(14, 3, StochType::Fast).is_ok());
        assert!(Stoch::new(0, 3, StochType::Fast).is_err());
        assert!(Stoch::new(14, 0, StochType::Fast).is_err());
    }

    #[test]
    fn test_stoch_fast_batch() {
        let stoch = Stoch::new(14, 3, StochType::Fast).unwrap();
        let result = stoch
            .calculate(&(&HIGHS[..], &LOWS[..], &CLOSES[..]))
            .unwrap();

        assert_eq!(result.len(), 15);

        // First 13 values should have NaN %K (need 14 periods)
        for i in 0..13 {
            assert!(result[i].k.is_nan(), "Expected NaN at index {i}");
        }

        // At index 13 (14th bar), we should have first valid %K
        assert!(!result[13].k.is_nan(), "Expected valid %K at index 13");

        // %K should be between 0 and 100
        for output in result.iter().filter(|o| !o.k.is_nan()) {
            assert!(output.k >= 0.0 && output.k <= 100.0, "%K out of range");
        }

        // First %D should appear at index 15 (k_period - 1 + d_period - 1)
        // But we only have 15 data points, so %D should be valid at index 14
        // Actually: first %K at 13, need 3 more for %D, so first %D at 15 (out of range)
        // Wait, let me recalculate: first %K at index 13, then we have indices 13, 14
        // That's only 2 %K values for %D with period 3
        // So for 15 data points with k=14, d=3: no valid %D
        // Unless we count: k_period=14 means first valid at index 13,
        // d_period=3 means we need 3 consecutive values starting at 13
        // So first valid %D would need indices 13, 14, 15 but we only have up to 14
        // Therefore, no valid %D in this test case
        assert!(result[14].d.is_nan(), "Expected NaN %D at index 14");
    }

    #[test]
    fn test_stoch_slow_batch() {
        let stoch = Stoch::new(14, 3, StochType::Slow).unwrap();
        let result = stoch
            .calculate(&(&HIGHS[..], &LOWS[..], &CLOSES[..]))
            .unwrap();

        assert_eq!(result.len(), 15);

        // Slow stochastic needs more data before producing valid values
        // First raw %K at 13, first smoothed %K at 13 + 2 = 15 (out of range for slowing=3)
        // Wait: index 13 is first raw %K, then indices 13, 14 give us 2 raw %K values
        // With slowing=3, we need 3 raw %K values (indices 13, 14, 15)
        // So for 15 data points, the last index is 14, no valid slow %K
    }

    #[test]
    fn test_stoch_with_shorter_period() {
        // Use shorter periods to get valid results with our test data
        let stoch = Stoch::new(5, 3, StochType::Fast).unwrap();
        let result = stoch
            .calculate(&(&HIGHS[..], &LOWS[..], &CLOSES[..]))
            .unwrap();

        // First %K at index 4, first %D at index 6
        assert!(!result[4].k.is_nan(), "Expected valid %K at index 4");
        assert!(result[5].d.is_nan(), "Expected NaN %D at index 5");
        assert!(!result[6].d.is_nan(), "Expected valid %D at index 6");
    }

    #[test]
    fn test_stoch_stream_matches_batch() {
        let k_period = 5;
        let d_period = 3;

        let batch = Stoch::new(k_period, d_period, StochType::Fast).unwrap();
        let batch_result = batch
            .calculate(&(&HIGHS[..], &LOWS[..], &CLOSES[..]))
            .unwrap();

        let mut stream = StochStream::new(k_period, d_period, StochType::Fast).unwrap();
        let data: Vec<StochBar> = HIGHS
            .iter()
            .zip(LOWS.iter())
            .zip(CLOSES.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();
        let stream_result = stream.init(&data).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.k.is_nan() {
                assert!(
                    s.k.is_nan(),
                    "Mismatch at index {i}: batch K is NaN but stream is {}",
                    s.k
                );
            } else {
                assert!(
                    (b.k - s.k).abs() < 1e-10,
                    "K mismatch at index {i}: batch={}, stream={}",
                    b.k,
                    s.k
                );
            }

            if b.d.is_nan() {
                assert!(
                    s.d.is_nan(),
                    "Mismatch at index {i}: batch D is NaN but stream is {}",
                    s.d
                );
            } else {
                assert!(
                    (b.d - s.d).abs() < 1e-10,
                    "D mismatch at index {i}: batch={}, stream={}",
                    b.d,
                    s.d
                );
            }
        }
    }

    #[test]
    fn test_stoch_stream_slow_matches_batch() {
        let k_period = 5;
        let d_period = 3;

        let batch = Stoch::new(k_period, d_period, StochType::Slow).unwrap();
        let batch_result = batch
            .calculate(&(&HIGHS[..], &LOWS[..], &CLOSES[..]))
            .unwrap();

        let mut stream = StochStream::new(k_period, d_period, StochType::Slow).unwrap();
        let data: Vec<StochBar> = HIGHS
            .iter()
            .zip(LOWS.iter())
            .zip(CLOSES.iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();
        let stream_result = stream.init(&data).unwrap();

        assert_eq!(batch_result.len(), stream_result.len());

        for (i, (b, s)) in batch_result.iter().zip(stream_result.iter()).enumerate() {
            if b.k.is_nan() {
                assert!(
                    s.k.is_nan(),
                    "Mismatch at index {i}: batch K is NaN but stream is {}",
                    s.k
                );
            } else {
                assert!(
                    (b.k - s.k).abs() < 1e-10,
                    "K mismatch at index {i}: batch={}, stream={}",
                    b.k,
                    s.k
                );
            }

            if b.d.is_nan() {
                assert!(
                    s.d.is_nan(),
                    "Mismatch at index {i}: batch D is NaN but stream is {}",
                    s.d
                );
            } else {
                assert!(
                    (b.d - s.d).abs() < 1e-10,
                    "D mismatch at index {i}: batch={}, stream={}",
                    b.d,
                    s.d
                );
            }
        }
    }

    #[test]
    fn test_stoch_stream_incremental() {
        let mut stream = StochStream::new(5, 3, StochType::Fast).unwrap();

        let data: Vec<StochBar> = HIGHS[..10]
            .iter()
            .zip(LOWS[..10].iter())
            .zip(CLOSES[..10].iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        stream.init(&data).unwrap();
        assert!(stream.is_ready());

        // Add remaining data points one by one
        for i in 10..15 {
            let output = stream.next((HIGHS[i], LOWS[i], CLOSES[i]));
            assert!(output.is_some());
            let output = output.unwrap();
            assert!(!output.k.is_nan());
        }
    }

    #[test]
    fn test_stoch_reset() {
        let mut stream = StochStream::new(5, 3, StochType::Fast).unwrap();

        let data: Vec<StochBar> = HIGHS[..10]
            .iter()
            .zip(LOWS[..10].iter())
            .zip(CLOSES[..10].iter())
            .map(|((&h, &l), &c)| (h, l, c))
            .collect();

        stream.init(&data).unwrap();
        assert!(stream.is_ready());

        stream.reset();
        assert!(!stream.is_ready());
    }

    #[test]
    fn test_stoch_range() {
        // Test that %K is always between 0 and 100
        let stoch = Stoch::new(5, 3, StochType::Fast).unwrap();

        // Create extreme data
        let highs = vec![100.0, 200.0, 150.0, 180.0, 190.0, 195.0, 185.0];
        let lows = vec![50.0, 80.0, 70.0, 90.0, 100.0, 110.0, 105.0];
        let closes = vec![75.0, 150.0, 100.0, 170.0, 195.0, 190.0, 150.0];

        let result = stoch
            .calculate(&(&highs[..], &lows[..], &closes[..]))
            .unwrap();

        for output in result.iter().filter(|o| !o.k.is_nan()) {
            assert!(output.k >= 0.0, "%K should be >= 0, got {}", output.k);
            assert!(output.k <= 100.0, "%K should be <= 100, got {}", output.k);
        }

        for output in result.iter().filter(|o| !o.d.is_nan()) {
            assert!(output.d >= 0.0, "%D should be >= 0, got {}", output.d);
            assert!(output.d <= 100.0, "%D should be <= 100, got {}", output.d);
        }
    }

    #[test]
    fn test_stoch_flat_market() {
        // When high == low == close, %K should be 50 (middle of range)
        let stoch = Stoch::new(3, 2, StochType::Fast).unwrap();

        let flat_price = 100.0;
        let highs = vec![flat_price; 5];
        let lows = vec![flat_price; 5];
        let closes = vec![flat_price; 5];

        let result = stoch
            .calculate(&(&highs[..], &lows[..], &closes[..]))
            .unwrap();

        // First valid %K at index 2
        assert!((result[2].k - 50.0).abs() < 1e-10);
        assert!((result[3].k - 50.0).abs() < 1e-10);
        assert!((result[4].k - 50.0).abs() < 1e-10);
    }

    #[test]
    fn test_stoch_empty_input() {
        let stoch = Stoch::new(14, 3, StochType::Fast).unwrap();
        let result = stoch.calculate(&(&[][..], &[][..], &[][..])).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_stoch_mismatched_lengths() {
        let stoch = Stoch::new(5, 3, StochType::Fast).unwrap();
        let result = stoch.calculate(&(&[1.0, 2.0][..], &[1.0][..], &[1.0, 2.0][..]));
        assert!(result.is_err());
    }
}
