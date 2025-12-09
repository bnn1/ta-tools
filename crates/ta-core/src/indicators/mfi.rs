//! Money Flow Index (MFI) indicator.
//!
//! MFI is a volume-weighted RSI that uses both price and volume to measure
//! buying and selling pressure.
//!
//! # Formula
//! ```text
//! Typical Price (TP) = (High + Low + Close) / 3
//! Raw Money Flow = TP × Volume
//! Money Flow Ratio = Positive Money Flow / Negative Money Flow (over N periods)
//! MFI = 100 - (100 / (1 + Money Flow Ratio))
//! ```
//!
//! - If today's TP > yesterday's TP → Positive Money Flow
//! - If today's TP < yesterday's TP → Negative Money Flow
//!
//! # Interpretation
//! - MFI > 80: Overbought condition
//! - MFI < 20: Oversold condition
//!
//! # Example (Batch Mode)
//! ```
//! use ta_core::indicators::Mfi;
//! use ta_core::traits::Indicator;
//!
//! let mfi = Mfi::new(14).unwrap();
//! let highs = vec![48.7, 48.72, 48.9, 48.87, 48.82];
//! let lows = vec![47.79, 48.14, 48.39, 48.37, 48.24];
//! let closes = vec![48.16, 48.61, 48.75, 48.63, 48.74];
//! let volumes = vec![1000.0, 1200.0, 1100.0, 1300.0, 1150.0];
//! // Note: Need more data for period=14
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// MFI calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Mfi {
    period: usize,
}

impl Mfi {
    /// Creates a new MFI calculator with the specified period.
    ///
    /// The standard MFI period is 14.
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

    /// Returns the period of this MFI.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }
}

/// Input type for MFI: (highs, lows, closes, volumes)
pub type MfiInput<'a> = (&'a [f64], &'a [f64], &'a [f64], &'a [f64]);

impl Indicator<&MfiInput<'_>, Vec<f64>> for Mfi {
    fn calculate(&self, data: &MfiInput<'_>) -> IndicatorResult<Vec<f64>> {
        let (highs, lows, closes, volumes) = *data;
        let len = highs.len();

        // Validate lengths
        if lows.len() != len || closes.len() != len || volumes.len() != len {
            return Err(IndicatorError::InvalidParameter(
                "all arrays must have the same length".to_string(),
            ));
        }

        let mut result = vec![f64::NAN; len];

        if len <= self.period {
            return Ok(result);
        }

        // Calculate typical prices
        let typical_prices: Vec<f64> = (0..len)
            .map(|i| (highs[i] + lows[i] + closes[i]) / 3.0)
            .collect();

        // Calculate raw money flows and classify as positive/negative
        let mut positive_flows = vec![0.0; len];
        let mut negative_flows = vec![0.0; len];

        for i in 1..len {
            let raw_flow = typical_prices[i] * volumes[i];
            if typical_prices[i] > typical_prices[i - 1] {
                positive_flows[i] = raw_flow;
            } else if typical_prices[i] < typical_prices[i - 1] {
                negative_flows[i] = raw_flow;
            }
            // If equal, neither positive nor negative
        }

        // Calculate MFI for each valid position
        for i in self.period..len {
            let pos_sum: f64 = positive_flows[(i + 1 - self.period)..=i].iter().sum();
            let neg_sum: f64 = negative_flows[(i + 1 - self.period)..=i].iter().sum();
            result[i] = calculate_mfi(pos_sum, neg_sum);
        }

        Ok(result)
    }
}

/// Calculate MFI from positive and negative flow sums.
#[inline]
fn calculate_mfi(positive_flow: f64, negative_flow: f64) -> f64 {
    if negative_flow == 0.0 {
        100.0
    } else if positive_flow == 0.0 {
        0.0
    } else {
        let ratio = positive_flow / negative_flow;
        100.0 - (100.0 / (1.0 + ratio))
    }
}

/// Input bar for MFI streaming: (high, low, close, volume)
pub type MfiBar = (f64, f64, f64, f64);

/// Streaming MFI calculator for real-time O(1) updates.
///
/// Uses ring buffers to maintain running sums of positive and negative flows.
#[derive(Debug)]
pub struct MfiStream {
    period: usize,
    positive_buffer: Vec<f64>,
    negative_buffer: Vec<f64>,
    head: usize,
    count: usize,
    prev_tp: Option<f64>,
    positive_sum: f64,
    negative_sum: f64,
}

impl MfiStream {
    /// Creates a new streaming MFI calculator.
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
            positive_buffer: vec![0.0; period],
            negative_buffer: vec![0.0; period],
            head: 0,
            count: 0,
            prev_tp: None,
            positive_sum: 0.0,
            negative_sum: 0.0,
        })
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the current MFI value if available.
    #[must_use]
    pub fn current(&self) -> Option<f64> {
        if self.is_ready() {
            Some(calculate_mfi(self.positive_sum, self.negative_sum))
        } else {
            None
        }
    }
}

impl StreamingIndicator<MfiBar, f64> for MfiStream {
    fn init(&mut self, data: &[MfiBar]) -> IndicatorResult<Vec<f64>> {
        self.reset();
        let mut results = Vec::with_capacity(data.len());
        for &bar in data {
            results.push(self.next(bar).unwrap_or(f64::NAN));
        }
        Ok(results)
    }

    fn next(&mut self, bar: MfiBar) -> Option<f64> {
        let (high, low, close, volume) = bar;
        let tp = (high + low + close) / 3.0;
        let raw_flow = tp * volume;

        let (pos_flow, neg_flow) = match self.prev_tp {
            Some(prev) if tp > prev => (raw_flow, 0.0),
            Some(prev) if tp < prev => (0.0, raw_flow),
            _ => (0.0, 0.0),
        };

        self.prev_tp = Some(tp);
        self.count += 1;

        if self.count == 1 {
            // First bar: just store TP, can't classify yet
            return None;
        }

        // Ring buffer operations (count starts from 2 since we skip first)
        let effective_count = self.count - 1;

        if effective_count <= self.period {
            // Filling buffer
            let idx = effective_count - 1;
            self.positive_buffer[idx] = pos_flow;
            self.negative_buffer[idx] = neg_flow;
            self.positive_sum += pos_flow;
            self.negative_sum += neg_flow;

            if effective_count == self.period {
                return Some(calculate_mfi(self.positive_sum, self.negative_sum));
            }
            return None;
        }

        // O(1) update: remove oldest, add newest
        let old_pos = self.positive_buffer[self.head];
        let old_neg = self.negative_buffer[self.head];
        self.positive_buffer[self.head] = pos_flow;
        self.negative_buffer[self.head] = neg_flow;
        self.head = (self.head + 1) % self.period;

        self.positive_sum = self.positive_sum - old_pos + pos_flow;
        self.negative_sum = self.negative_sum - old_neg + neg_flow;

        Some(calculate_mfi(self.positive_sum, self.negative_sum))
    }

    fn reset(&mut self) {
        self.positive_buffer.fill(0.0);
        self.negative_buffer.fill(0.0);
        self.head = 0;
        self.count = 0;
        self.prev_tp = None;
        self.positive_sum = 0.0;
        self.negative_sum = 0.0;
    }

    fn is_ready(&self) -> bool {
        self.count > self.period
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 0.01;

    fn assert_approx_eq(a: f64, b: f64) {
        assert!((a - b).abs() < EPSILON, "expected {b}, got {a}");
    }

    #[test]
    fn test_mfi_new_valid() {
        let mfi = Mfi::new(14).unwrap();
        assert_eq!(mfi.period(), 14);
    }

    #[test]
    fn test_mfi_new_invalid() {
        assert!(Mfi::new(0).is_err());
    }

    #[test]
    fn test_mfi_basic_calculation() {
        // Sample data with clear positive/negative flows
        let highs = [10.0, 11.0, 12.0, 11.0, 10.5];
        let lows = [9.0, 10.0, 11.0, 10.0, 9.5];
        let closes = [9.5, 10.5, 11.5, 10.5, 10.0];
        let volumes = [100.0, 150.0, 200.0, 180.0, 160.0];

        let mfi = Mfi::new(3).unwrap();
        let result = mfi.calculate(&(&highs, &lows, &closes, &volumes)).unwrap();

        assert_eq!(result.len(), 5);
        // First 3 should be NaN
        assert!(result[0].is_nan());
        assert!(result[1].is_nan());
        assert!(result[2].is_nan());
        // Index 3 should have a value
        assert!(!result[3].is_nan());
        assert!(result[3] >= 0.0 && result[3] <= 100.0);
    }

    #[test]
    fn test_mfi_streaming_matches_batch() {
        let highs = [10.0, 11.0, 12.0, 11.0, 10.5, 11.5, 12.5, 13.0, 12.5, 12.0];
        let lows = [9.0, 10.0, 11.0, 10.0, 9.5, 10.5, 11.5, 12.0, 11.5, 11.0];
        let closes = [9.5, 10.5, 11.5, 10.5, 10.0, 11.0, 12.0, 12.5, 12.0, 11.5];
        let volumes = [
            100.0, 150.0, 200.0, 180.0, 160.0, 190.0, 210.0, 220.0, 200.0, 180.0,
        ];

        let batch = Mfi::new(3).unwrap();
        let batch_result = batch
            .calculate(&(&highs, &lows, &closes, &volumes))
            .unwrap();

        let mut stream = MfiStream::new(3).unwrap();
        let bars: Vec<MfiBar> = (0..highs.len())
            .map(|i| (highs[i], lows[i], closes[i], volumes[i]))
            .collect();
        let stream_result = stream.init(&bars).unwrap();

        for i in 0..batch_result.len() {
            if batch_result[i].is_nan() {
                assert!(stream_result[i].is_nan());
            } else {
                assert_approx_eq(stream_result[i], batch_result[i]);
            }
        }
    }

    #[test]
    fn test_mfi_all_positive() {
        // Prices consistently rising
        let highs = [10.0, 11.0, 12.0, 13.0, 14.0];
        let lows = [9.0, 10.0, 11.0, 12.0, 13.0];
        let closes = [9.5, 10.5, 11.5, 12.5, 13.5];
        let volumes = [100.0; 5];

        let mfi = Mfi::new(3).unwrap();
        let result = mfi.calculate(&(&highs, &lows, &closes, &volumes)).unwrap();

        // When all flows are positive, MFI should be 100
        assert_approx_eq(result[3], 100.0);
        assert_approx_eq(result[4], 100.0);
    }

    #[test]
    fn test_mfi_all_negative() {
        // Prices consistently falling
        let highs = [14.0, 13.0, 12.0, 11.0, 10.0];
        let lows = [13.0, 12.0, 11.0, 10.0, 9.0];
        let closes = [13.5, 12.5, 11.5, 10.5, 9.5];
        let volumes = [100.0; 5];

        let mfi = Mfi::new(3).unwrap();
        let result = mfi.calculate(&(&highs, &lows, &closes, &volumes)).unwrap();

        // When all flows are negative, MFI should be 0
        assert_approx_eq(result[3], 0.0);
        assert_approx_eq(result[4], 0.0);
    }

    #[test]
    fn test_mfi_stream_next_after_init() {
        let highs = [10.0, 11.0, 12.0, 11.0, 10.5];
        let lows = [9.0, 10.0, 11.0, 10.0, 9.5];
        let closes = [9.5, 10.5, 11.5, 10.5, 10.0];
        let volumes = [100.0, 150.0, 200.0, 180.0, 160.0];

        let mut stream = MfiStream::new(3).unwrap();
        let bars: Vec<MfiBar> = (0..highs.len())
            .map(|i| (highs[i], lows[i], closes[i], volumes[i]))
            .collect();
        stream.init(&bars).unwrap();

        assert!(stream.is_ready());

        // Add one more bar
        let result = stream.next((11.0, 10.0, 10.5, 170.0));
        assert!(result.is_some());
        let mfi = result.unwrap();
        assert!(mfi >= 0.0 && mfi <= 100.0);
    }

    #[test]
    fn test_mfi_empty_data() {
        let mfi = Mfi::new(14).unwrap();
        let result = mfi
            .calculate(&(&[] as &[f64], &[] as &[f64], &[] as &[f64], &[] as &[f64]))
            .unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_mfi_mismatched_lengths() {
        let mfi = Mfi::new(3).unwrap();
        let result = mfi.calculate(&(&[1.0, 2.0], &[1.0], &[1.0, 2.0], &[1.0, 2.0]));
        assert!(result.is_err());
    }
}
