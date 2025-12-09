//! Ichimoku Cloud (Ichimoku Kinko Hyo) indicator.
//!
//! The Ichimoku Cloud is a comprehensive indicator that defines support/resistance,
//! identifies trend direction, gauges momentum, and provides trading signals.
//!
//! # Components
//! - **Tenkan-sen (Conversion Line)**: (9-period high + 9-period low) / 2
//! - **Kijun-sen (Base Line)**: (26-period high + 26-period low) / 2
//! - **Senkou Span A (Leading Span A)**: (Tenkan-sen + Kijun-sen) / 2, plotted 26 periods ahead
//! - **Senkou Span B (Leading Span B)**: (52-period high + 52-period low) / 2, plotted 26 periods ahead
//! - **Chikou Span (Lagging Span)**: Close plotted 26 periods behind
//!
//! # Default Periods
//! - Tenkan-sen: 9
//! - Kijun-sen: 26
//! - Senkou Span B: 52
//!
//! # Note on Leading/Lagging
//! This implementation returns current values without shifting. The caller is
//! responsible for applying the appropriate offset when plotting:
//! - Senkou Span A/B: shift forward by kijun_period (26)
//! - Chikou Span: shift backward by kijun_period (26)

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};
use std::collections::VecDeque;

/// Ichimoku Cloud output structure.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct IchimokuOutput {
    /// Tenkan-sen (Conversion Line)
    pub tenkan_sen: f64,
    /// Kijun-sen (Base Line)
    pub kijun_sen: f64,
    /// Senkou Span A (Leading Span A) - to be plotted kijun_period ahead
    pub senkou_span_a: f64,
    /// Senkou Span B (Leading Span B) - to be plotted kijun_period ahead
    pub senkou_span_b: f64,
    /// Chikou Span (Lagging Span) - to be plotted kijun_period behind
    pub chikou_span: f64,
}

impl IchimokuOutput {
    /// Creates a new Ichimoku output with all NaN values.
    #[must_use]
    pub fn nan() -> Self {
        Self {
            tenkan_sen: f64::NAN,
            kijun_sen: f64::NAN,
            senkou_span_a: f64::NAN,
            senkou_span_b: f64::NAN,
            chikou_span: f64::NAN,
        }
    }
}

/// Ichimoku Cloud calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Ichimoku {
    tenkan_period: usize,
    kijun_period: usize,
    senkou_b_period: usize,
}

impl Ichimoku {
    /// Creates a new Ichimoku calculator with the specified periods.
    ///
    /// # Arguments
    /// * `tenkan_period` - Tenkan-sen period (default: 9)
    /// * `kijun_period` - Kijun-sen period (default: 26)
    /// * `senkou_b_period` - Senkou Span B period (default: 52)
    ///
    /// # Errors
    /// Returns `InvalidParameter` if any period is 0.
    pub fn new(
        tenkan_period: usize,
        kijun_period: usize,
        senkou_b_period: usize,
    ) -> IndicatorResult<Self> {
        if tenkan_period == 0 || kijun_period == 0 || senkou_b_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "all periods must be greater than 0".to_string(),
            ));
        }
        Ok(Self {
            tenkan_period,
            kijun_period,
            senkou_b_period,
        })
    }

    /// Creates a new Ichimoku calculator with default periods (9, 26, 52).
    pub fn default_periods() -> IndicatorResult<Self> {
        Self::new(9, 26, 52)
    }

    /// Returns the Tenkan-sen period.
    #[must_use]
    pub const fn tenkan_period(&self) -> usize {
        self.tenkan_period
    }

    /// Returns the Kijun-sen period.
    #[must_use]
    pub const fn kijun_period(&self) -> usize {
        self.kijun_period
    }

    /// Returns the Senkou Span B period.
    #[must_use]
    pub const fn senkou_b_period(&self) -> usize {
        self.senkou_b_period
    }

    /// Calculate (highest high + lowest low) / 2 for a slice.
    fn donchian_midpoint(highs: &[f64], lows: &[f64]) -> f64 {
        let highest = highs.iter().copied().fold(f64::NEG_INFINITY, f64::max);
        let lowest = lows.iter().copied().fold(f64::INFINITY, f64::min);
        (highest + lowest) / 2.0
    }
}

/// Input type: (highs, lows, closes)
pub type IchimokuInput<'a> = (&'a [f64], &'a [f64], &'a [f64]);

impl Indicator<&IchimokuInput<'_>, Vec<IchimokuOutput>> for Ichimoku {
    fn calculate(&self, data: &IchimokuInput<'_>) -> IndicatorResult<Vec<IchimokuOutput>> {
        let (highs, lows, closes) = *data;
        let len = highs.len();

        if lows.len() != len || closes.len() != len {
            return Err(IndicatorError::InvalidParameter(
                "highs, lows, and closes must have the same length".to_string(),
            ));
        }

        let mut result = vec![IchimokuOutput::nan(); len];

        if len == 0 {
            return Ok(result);
        }

        for i in 0..len {
            let mut output = IchimokuOutput::nan();

            // Tenkan-sen: available after tenkan_period values
            if i >= self.tenkan_period - 1 {
                let start = i + 1 - self.tenkan_period;
                output.tenkan_sen = Self::donchian_midpoint(&highs[start..=i], &lows[start..=i]);
            }

            // Kijun-sen: available after kijun_period values
            if i >= self.kijun_period - 1 {
                let start = i + 1 - self.kijun_period;
                output.kijun_sen = Self::donchian_midpoint(&highs[start..=i], &lows[start..=i]);
            }

            // Senkou Span A: average of Tenkan and Kijun (when both available)
            if !output.tenkan_sen.is_nan() && !output.kijun_sen.is_nan() {
                output.senkou_span_a = (output.tenkan_sen + output.kijun_sen) / 2.0;
            }

            // Senkou Span B: available after senkou_b_period values
            if i >= self.senkou_b_period - 1 {
                let start = i + 1 - self.senkou_b_period;
                output.senkou_span_b = Self::donchian_midpoint(&highs[start..=i], &lows[start..=i]);
            }

            // Chikou Span: just the close (caller handles the offset)
            output.chikou_span = closes[i];

            result[i] = output;
        }

        Ok(result)
    }
}

/// Input bar for Ichimoku streaming: (high, low, close)
pub type IchimokuBar = (f64, f64, f64);

/// Streaming Ichimoku Cloud calculator for real-time O(1) updates.
///
/// Uses monotonic deques to track min/max efficiently for each period.
#[derive(Debug)]
pub struct IchimokuStream {
    tenkan_period: usize,
    kijun_period: usize,
    senkou_b_period: usize,
    // Ring buffers for high/low values
    high_buffer: Vec<f64>,
    low_buffer: Vec<f64>,
    close_buffer: Vec<f64>,
    head: usize,
    count: usize,
    // Monotonic deques for efficient min/max tracking
    // For tenkan (shortest period)
    tenkan_max_deque: VecDeque<(usize, f64)>,
    tenkan_min_deque: VecDeque<(usize, f64)>,
    // For kijun (medium period)
    kijun_max_deque: VecDeque<(usize, f64)>,
    kijun_min_deque: VecDeque<(usize, f64)>,
    // For senkou_b (longest period)
    senkou_max_deque: VecDeque<(usize, f64)>,
    senkou_min_deque: VecDeque<(usize, f64)>,
}

impl IchimokuStream {
    /// Creates a new streaming Ichimoku calculator with specified periods.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if any period is 0.
    pub fn new(
        tenkan_period: usize,
        kijun_period: usize,
        senkou_b_period: usize,
    ) -> IndicatorResult<Self> {
        if tenkan_period == 0 || kijun_period == 0 || senkou_b_period == 0 {
            return Err(IndicatorError::InvalidParameter(
                "all periods must be greater than 0".to_string(),
            ));
        }

        // Buffer size needs to be the largest period
        let max_period = senkou_b_period.max(kijun_period).max(tenkan_period);

        Ok(Self {
            tenkan_period,
            kijun_period,
            senkou_b_period,
            high_buffer: vec![0.0; max_period],
            low_buffer: vec![0.0; max_period],
            close_buffer: vec![0.0; max_period],
            head: 0,
            count: 0,
            tenkan_max_deque: VecDeque::new(),
            tenkan_min_deque: VecDeque::new(),
            kijun_max_deque: VecDeque::new(),
            kijun_min_deque: VecDeque::new(),
            senkou_max_deque: VecDeque::new(),
            senkou_min_deque: VecDeque::new(),
        })
    }

    /// Creates a new streaming Ichimoku calculator with default periods (9, 26, 52).
    pub fn default_periods() -> IndicatorResult<Self> {
        Self::new(9, 26, 52)
    }

    /// Returns the Tenkan-sen period.
    #[must_use]
    pub const fn tenkan_period(&self) -> usize {
        self.tenkan_period
    }

    /// Returns the Kijun-sen period.
    #[must_use]
    pub const fn kijun_period(&self) -> usize {
        self.kijun_period
    }

    /// Returns the Senkou Span B period.
    #[must_use]
    pub const fn senkou_b_period(&self) -> usize {
        self.senkou_b_period
    }

    /// Update a monotonic deque for max values.
    fn update_max_deque(
        deque: &mut VecDeque<(usize, f64)>,
        index: usize,
        value: f64,
        period: usize,
    ) {
        // Remove elements older than the window
        while let Some(&(idx, _)) = deque.front() {
            if index >= period && idx <= index - period {
                deque.pop_front();
            } else {
                break;
            }
        }
        // Remove smaller elements from back
        while let Some(&(_, v)) = deque.back() {
            if v <= value {
                deque.pop_back();
            } else {
                break;
            }
        }
        deque.push_back((index, value));
    }

    /// Update a monotonic deque for min values.
    fn update_min_deque(
        deque: &mut VecDeque<(usize, f64)>,
        index: usize,
        value: f64,
        period: usize,
    ) {
        // Remove elements older than the window
        while let Some(&(idx, _)) = deque.front() {
            if index >= period && idx <= index - period {
                deque.pop_front();
            } else {
                break;
            }
        }
        // Remove larger elements from back
        while let Some(&(_, v)) = deque.back() {
            if v >= value {
                deque.pop_back();
            } else {
                break;
            }
        }
        deque.push_back((index, value));
    }

    /// Get midpoint from max and min deques.
    fn get_midpoint(max_deque: &VecDeque<(usize, f64)>, min_deque: &VecDeque<(usize, f64)>) -> f64 {
        match (max_deque.front(), min_deque.front()) {
            (Some(&(_, max)), Some(&(_, min))) => (max + min) / 2.0,
            _ => f64::NAN,
        }
    }
}

impl StreamingIndicator<IchimokuBar, IchimokuOutput> for IchimokuStream {
    fn init(&mut self, data: &[IchimokuBar]) -> IndicatorResult<Vec<IchimokuOutput>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &bar in data {
            results.push(self.next(bar).unwrap_or_else(IchimokuOutput::nan));
        }
        Ok(results)
    }

    fn next(&mut self, bar: IchimokuBar) -> Option<IchimokuOutput> {
        let (high, low, close) = bar;
        let idx = self.count;
        self.count += 1;

        // Store in ring buffer
        let max_period = self.high_buffer.len();
        let buf_idx = idx % max_period;
        self.high_buffer[buf_idx] = high;
        self.low_buffer[buf_idx] = low;
        self.close_buffer[buf_idx] = close;

        // Update all deques with new high value
        Self::update_max_deque(&mut self.tenkan_max_deque, idx, high, self.tenkan_period);
        Self::update_max_deque(&mut self.kijun_max_deque, idx, high, self.kijun_period);
        Self::update_max_deque(&mut self.senkou_max_deque, idx, high, self.senkou_b_period);

        // Update all deques with new low value
        Self::update_min_deque(&mut self.tenkan_min_deque, idx, low, self.tenkan_period);
        Self::update_min_deque(&mut self.kijun_min_deque, idx, low, self.kijun_period);
        Self::update_min_deque(&mut self.senkou_min_deque, idx, low, self.senkou_b_period);

        let mut output = IchimokuOutput::nan();

        // Tenkan-sen
        if self.count >= self.tenkan_period {
            output.tenkan_sen = Self::get_midpoint(&self.tenkan_max_deque, &self.tenkan_min_deque);
        }

        // Kijun-sen
        if self.count >= self.kijun_period {
            output.kijun_sen = Self::get_midpoint(&self.kijun_max_deque, &self.kijun_min_deque);
        }

        // Senkou Span A
        if !output.tenkan_sen.is_nan() && !output.kijun_sen.is_nan() {
            output.senkou_span_a = (output.tenkan_sen + output.kijun_sen) / 2.0;
        }

        // Senkou Span B
        if self.count >= self.senkou_b_period {
            output.senkou_span_b =
                Self::get_midpoint(&self.senkou_max_deque, &self.senkou_min_deque);
        }

        // Chikou Span (just the close)
        output.chikou_span = close;

        Some(output)
    }

    fn reset(&mut self) {
        self.high_buffer.fill(0.0);
        self.low_buffer.fill(0.0);
        self.close_buffer.fill(0.0);
        self.head = 0;
        self.count = 0;
        self.tenkan_max_deque.clear();
        self.tenkan_min_deque.clear();
        self.kijun_max_deque.clear();
        self.kijun_min_deque.clear();
        self.senkou_max_deque.clear();
        self.senkou_min_deque.clear();
    }

    fn is_ready(&self) -> bool {
        // Ready when we can compute all components
        self.count >= self.senkou_b_period
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 1e-10;

    fn assert_approx_eq(a: f64, b: f64) {
        if a.is_nan() && b.is_nan() {
            return;
        }
        assert!(
            (a - b).abs() < EPSILON,
            "expected {b}, got {a}, diff = {}",
            (a - b).abs()
        );
    }

    #[test]
    fn test_ichimoku_new_valid() {
        let ich = Ichimoku::new(9, 26, 52).unwrap();
        assert_eq!(ich.tenkan_period(), 9);
        assert_eq!(ich.kijun_period(), 26);
        assert_eq!(ich.senkou_b_period(), 52);
    }

    #[test]
    fn test_ichimoku_default_periods() {
        let ich = Ichimoku::default_periods().unwrap();
        assert_eq!(ich.tenkan_period(), 9);
        assert_eq!(ich.kijun_period(), 26);
        assert_eq!(ich.senkou_b_period(), 52);
    }

    #[test]
    fn test_ichimoku_new_invalid() {
        assert!(Ichimoku::new(0, 26, 52).is_err());
        assert!(Ichimoku::new(9, 0, 52).is_err());
        assert!(Ichimoku::new(9, 26, 0).is_err());
    }

    #[test]
    fn test_ichimoku_basic_calculation() {
        // Simple test data
        let highs = [10.0, 11.0, 12.0, 11.5, 10.5, 11.0, 12.0, 13.0, 12.5, 12.0];
        let lows = [9.0, 10.0, 11.0, 10.5, 9.5, 10.0, 11.0, 12.0, 11.5, 11.0];
        let closes = [9.5, 10.5, 11.5, 11.0, 10.0, 10.5, 11.5, 12.5, 12.0, 11.5];

        let ich = Ichimoku::new(3, 5, 7).unwrap();
        let result = ich.calculate(&(&highs, &lows, &closes)).unwrap();

        assert_eq!(result.len(), 10);

        // Tenkan (period 3) should be available from index 2
        assert!(result[0].tenkan_sen.is_nan());
        assert!(result[1].tenkan_sen.is_nan());
        assert!(!result[2].tenkan_sen.is_nan());

        // Kijun (period 5) should be available from index 4
        assert!(result[3].kijun_sen.is_nan());
        assert!(!result[4].kijun_sen.is_nan());

        // Senkou Span B (period 7) should be available from index 6
        assert!(result[5].senkou_span_b.is_nan());
        assert!(!result[6].senkou_span_b.is_nan());

        // Chikou span is always the close
        for (i, r) in result.iter().enumerate() {
            assert_approx_eq(r.chikou_span, closes[i]);
        }
    }

    #[test]
    fn test_ichimoku_donchian_midpoint() {
        let highs = [10.0, 12.0, 11.0];
        let lows = [8.0, 9.0, 7.0];

        // Highest high = 12, Lowest low = 7
        // Midpoint = (12 + 7) / 2 = 9.5
        let midpoint = Ichimoku::donchian_midpoint(&highs, &lows);
        assert_approx_eq(midpoint, 9.5);
    }

    #[test]
    fn test_ichimoku_streaming_matches_batch() {
        let highs: Vec<f64> = (0..20).map(|i| 100.0 + i as f64 + (i % 3) as f64).collect();
        let lows: Vec<f64> = (0..20).map(|i| 98.0 + i as f64 - (i % 2) as f64).collect();
        let closes: Vec<f64> = (0..20).map(|i| 99.0 + i as f64).collect();

        let batch = Ichimoku::new(3, 5, 7).unwrap();
        let batch_result = batch.calculate(&(&highs, &lows, &closes)).unwrap();

        let mut stream = IchimokuStream::new(3, 5, 7).unwrap();
        let bars: Vec<IchimokuBar> = (0..20).map(|i| (highs[i], lows[i], closes[i])).collect();
        let stream_result = stream.init(&bars).unwrap();

        for i in 0..batch_result.len() {
            assert_approx_eq(stream_result[i].tenkan_sen, batch_result[i].tenkan_sen);
            assert_approx_eq(stream_result[i].kijun_sen, batch_result[i].kijun_sen);
            assert_approx_eq(
                stream_result[i].senkou_span_a,
                batch_result[i].senkou_span_a,
            );
            assert_approx_eq(
                stream_result[i].senkou_span_b,
                batch_result[i].senkou_span_b,
            );
            assert_approx_eq(stream_result[i].chikou_span, batch_result[i].chikou_span);
        }
    }

    #[test]
    fn test_ichimoku_senkou_span_a() {
        let highs = [10.0, 12.0, 14.0, 13.0, 11.0];
        let lows = [8.0, 10.0, 12.0, 11.0, 9.0];
        let closes = [9.0, 11.0, 13.0, 12.0, 10.0];

        let ich = Ichimoku::new(2, 3, 4).unwrap();
        let result = ich.calculate(&(&highs, &lows, &closes)).unwrap();

        // At index 2: Tenkan and Kijun both available
        // Senkou Span A should be their average
        if !result[2].tenkan_sen.is_nan() && !result[2].kijun_sen.is_nan() {
            let expected = (result[2].tenkan_sen + result[2].kijun_sen) / 2.0;
            assert_approx_eq(result[2].senkou_span_a, expected);
        }
    }

    #[test]
    fn test_ichimoku_stream_next_after_init() {
        let highs = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0];
        let lows = [9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0];
        let closes = [9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5];

        let mut stream = IchimokuStream::new(3, 5, 7).unwrap();
        let bars: Vec<IchimokuBar> = (0..8).map(|i| (highs[i], lows[i], closes[i])).collect();
        stream.init(&bars).unwrap();

        assert!(stream.is_ready());

        // Add one more bar
        let result = stream.next((18.0, 17.0, 17.5)).unwrap();
        assert!(!result.tenkan_sen.is_nan());
        assert!(!result.kijun_sen.is_nan());
        assert!(!result.senkou_span_b.is_nan());
    }

    #[test]
    fn test_ichimoku_empty_data() {
        let ich = Ichimoku::new(9, 26, 52).unwrap();
        let result = ich
            .calculate(&(&[] as &[f64], &[] as &[f64], &[] as &[f64]))
            .unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_ichimoku_mismatched_lengths() {
        let ich = Ichimoku::new(3, 5, 7).unwrap();
        let result = ich.calculate(&(&[1.0, 2.0], &[1.0], &[1.0, 2.0]));
        assert!(result.is_err());
    }
}
