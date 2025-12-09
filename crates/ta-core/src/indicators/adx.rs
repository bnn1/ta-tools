//! Average Directional Index (ADX) indicator.
//!
//! ADX measures trend strength regardless of direction. It's used with
//! +DI and -DI to determine trend direction and strength.
//!
//! # Components
//! - **+DI (Plus Directional Indicator)**: Measures upward trend strength
//! - **-DI (Minus Directional Indicator)**: Measures downward trend strength
//! - **ADX**: Smoothed average of the Directional Index (DX)
//!
//! # Formulas
//! ```text
//! True Range (TR) = max(High - Low, |High - Prev Close|, |Low - Prev Close|)
//! +DM = High - Prev High (if positive and > -DM, else 0)
//! -DM = Prev Low - Low (if positive and > +DM, else 0)
//!
//! Smoothed TR, +DM, -DM using Wilder's smoothing over period
//!
//! +DI = 100 × (Smoothed +DM / Smoothed TR)
//! -DI = 100 × (Smoothed -DM / Smoothed TR)
//!
//! DX = 100 × |+DI - -DI| / (+DI + -DI)
//! ADX = Wilder's smoothed average of DX over period
//! ```
//!
//! # Interpretation
//! - ADX > 25: Strong trend
//! - ADX < 20: Weak trend or ranging
//! - +DI > -DI: Uptrend
//! - -DI > +DI: Downtrend
//!
//! # Default Period
//! - 14 periods (standard)

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// ADX output structure containing ADX, +DI, and -DI values.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AdxOutput {
    /// Average Directional Index (0-100)
    pub adx: f64,
    /// Plus Directional Indicator (0-100)
    pub plus_di: f64,
    /// Minus Directional Indicator (0-100)
    pub minus_di: f64,
}

impl AdxOutput {
    /// Creates a new ADX output with all NaN values.
    #[must_use]
    pub fn nan() -> Self {
        Self {
            adx: f64::NAN,
            plus_di: f64::NAN,
            minus_di: f64::NAN,
        }
    }
}

/// ADX calculator for batch operations.
#[derive(Debug, Clone)]
pub struct Adx {
    period: usize,
}

impl Adx {
    /// Creates a new ADX calculator with the specified period.
    ///
    /// The standard ADX period is 14.
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

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Calculate True Range.
    #[inline]
    fn true_range(high: f64, low: f64, prev_close: f64) -> f64 {
        let hl = high - low;
        let hc = (high - prev_close).abs();
        let lc = (low - prev_close).abs();
        hl.max(hc).max(lc)
    }

    /// Calculate +DM and -DM.
    #[inline]
    fn directional_movement(high: f64, low: f64, prev_high: f64, prev_low: f64) -> (f64, f64) {
        let up_move = high - prev_high;
        let down_move = prev_low - low;

        let plus_dm = if up_move > down_move && up_move > 0.0 {
            up_move
        } else {
            0.0
        };

        let minus_dm = if down_move > up_move && down_move > 0.0 {
            down_move
        } else {
            0.0
        };

        (plus_dm, minus_dm)
    }
}

/// Input type: (highs, lows, closes)
pub type AdxInput<'a> = (&'a [f64], &'a [f64], &'a [f64]);

impl Indicator<&AdxInput<'_>, Vec<AdxOutput>> for Adx {
    fn calculate(&self, data: &AdxInput<'_>) -> IndicatorResult<Vec<AdxOutput>> {
        let (highs, lows, closes) = *data;
        let len = highs.len();

        if lows.len() != len || closes.len() != len {
            return Err(IndicatorError::InvalidParameter(
                "highs, lows, and closes must have the same length".to_string(),
            ));
        }

        let mut result = vec![AdxOutput::nan(); len];

        if len < 2 {
            return Ok(result);
        }

        // Calculate TR, +DM, -DM for each bar (starting from index 1)
        let mut tr_values = vec![0.0; len];
        let mut plus_dm_values = vec![0.0; len];
        let mut minus_dm_values = vec![0.0; len];

        for i in 1..len {
            tr_values[i] = Self::true_range(highs[i], lows[i], closes[i - 1]);
            let (plus_dm, minus_dm) =
                Self::directional_movement(highs[i], lows[i], highs[i - 1], lows[i - 1]);
            plus_dm_values[i] = plus_dm;
            minus_dm_values[i] = minus_dm;
        }

        // Need at least period + 1 values to calculate first smoothed values
        if len <= self.period {
            return Ok(result);
        }

        // First smoothed values: sum of first `period` values
        let mut smoothed_tr: f64 = tr_values[1..=self.period].iter().sum();
        let mut smoothed_plus_dm: f64 = plus_dm_values[1..=self.period].iter().sum();
        let mut smoothed_minus_dm: f64 = minus_dm_values[1..=self.period].iter().sum();

        // Calculate first +DI and -DI
        let mut di_values = Vec::with_capacity(len);
        for _ in 0..=self.period {
            di_values.push((f64::NAN, f64::NAN, f64::NAN)); // (plus_di, minus_di, dx)
        }

        // First DI values at index = period
        let (plus_di, minus_di, dx) =
            calculate_di_and_dx(smoothed_plus_dm, smoothed_minus_dm, smoothed_tr);
        di_values[self.period] = (plus_di, minus_di, dx);

        result[self.period].plus_di = plus_di;
        result[self.period].minus_di = minus_di;

        // Continue with Wilder's smoothing for subsequent bars
        let n = self.period as f64;
        for i in (self.period + 1)..len {
            // Wilder's smoothing: smooth = prev_smooth - (prev_smooth / n) + current
            smoothed_tr = smoothed_tr - (smoothed_tr / n) + tr_values[i];
            smoothed_plus_dm = smoothed_plus_dm - (smoothed_plus_dm / n) + plus_dm_values[i];
            smoothed_minus_dm = smoothed_minus_dm - (smoothed_minus_dm / n) + minus_dm_values[i];

            let (plus_di, minus_di, dx) =
                calculate_di_and_dx(smoothed_plus_dm, smoothed_minus_dm, smoothed_tr);
            di_values.push((plus_di, minus_di, dx));

            result[i].plus_di = plus_di;
            result[i].minus_di = minus_di;
        }

        // Now calculate ADX: smoothed average of DX over period
        // ADX starts at index = 2 * period - 1
        if len < 2 * self.period {
            return Ok(result);
        }

        // First ADX: average of first `period` DX values
        let dx_start = self.period;
        let dx_slice: Vec<f64> = di_values[dx_start..(dx_start + self.period)]
            .iter()
            .map(|(_, _, dx)| *dx)
            .collect();
        let mut adx: f64 = dx_slice.iter().sum::<f64>() / n;
        result[2 * self.period - 1].adx = adx;

        // Subsequent ADX values using Wilder's smoothing
        for i in (2 * self.period)..len {
            let dx = di_values[i].2;
            adx = ((adx * (n - 1.0)) + dx) / n;
            result[i].adx = adx;
        }

        Ok(result)
    }
}

/// Calculate +DI, -DI, and DX from smoothed values.
#[inline]
fn calculate_di_and_dx(
    smoothed_plus_dm: f64,
    smoothed_minus_dm: f64,
    smoothed_tr: f64,
) -> (f64, f64, f64) {
    if smoothed_tr == 0.0 {
        return (0.0, 0.0, 0.0);
    }

    let plus_di = 100.0 * smoothed_plus_dm / smoothed_tr;
    let minus_di = 100.0 * smoothed_minus_dm / smoothed_tr;

    let di_sum = plus_di + minus_di;
    let dx = if di_sum == 0.0 {
        0.0
    } else {
        100.0 * (plus_di - minus_di).abs() / di_sum
    };

    (plus_di, minus_di, dx)
}

/// Input bar for ADX streaming: (high, low, close)
pub type AdxBar = (f64, f64, f64);

/// Streaming ADX calculator for real-time updates.
#[derive(Debug)]
pub struct AdxStream {
    period: usize,
    count: usize,
    // Previous bar values
    prev_high: f64,
    prev_low: f64,
    prev_close: f64,
    // Smoothed values
    smoothed_tr: f64,
    smoothed_plus_dm: f64,
    smoothed_minus_dm: f64,
    // Initial accumulation
    initial_tr_sum: f64,
    initial_plus_dm_sum: f64,
    initial_minus_dm_sum: f64,
    // DX buffer for ADX calculation
    dx_buffer: Vec<f64>,
    dx_head: usize,
    dx_count: usize,
    // ADX state
    current_adx: Option<f64>,
    adx_initialized: bool,
}

impl AdxStream {
    /// Creates a new streaming ADX calculator.
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
            count: 0,
            prev_high: f64::NAN,
            prev_low: f64::NAN,
            prev_close: f64::NAN,
            smoothed_tr: 0.0,
            smoothed_plus_dm: 0.0,
            smoothed_minus_dm: 0.0,
            initial_tr_sum: 0.0,
            initial_plus_dm_sum: 0.0,
            initial_minus_dm_sum: 0.0,
            dx_buffer: vec![0.0; period],
            dx_head: 0,
            dx_count: 0,
            current_adx: None,
            adx_initialized: false,
        })
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the current ADX output if available.
    #[must_use]
    pub fn current(&self) -> Option<AdxOutput> {
        if self.count > self.period {
            let (plus_di, minus_di, _) = calculate_di_and_dx(
                self.smoothed_plus_dm,
                self.smoothed_minus_dm,
                self.smoothed_tr,
            );
            Some(AdxOutput {
                adx: self.current_adx.unwrap_or(f64::NAN),
                plus_di,
                minus_di,
            })
        } else {
            None
        }
    }
}

impl StreamingIndicator<AdxBar, AdxOutput> for AdxStream {
    fn init(&mut self, data: &[AdxBar]) -> IndicatorResult<Vec<AdxOutput>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &bar in data {
            results.push(self.next(bar).unwrap_or_else(AdxOutput::nan));
        }
        Ok(results)
    }

    fn next(&mut self, bar: AdxBar) -> Option<AdxOutput> {
        let (high, low, close) = bar;
        self.count += 1;

        // First bar: just store values
        if self.count == 1 {
            self.prev_high = high;
            self.prev_low = low;
            self.prev_close = close;
            return None;
        }

        // Calculate TR, +DM, -DM
        let tr = Adx::true_range(high, low, self.prev_close);
        let (plus_dm, minus_dm) =
            Adx::directional_movement(high, low, self.prev_high, self.prev_low);

        // Update previous values
        self.prev_high = high;
        self.prev_low = low;
        self.prev_close = close;

        let n = self.period as f64;

        // Accumulation phase (first `period` changes)
        if self.count <= self.period + 1 {
            self.initial_tr_sum += tr;
            self.initial_plus_dm_sum += plus_dm;
            self.initial_minus_dm_sum += minus_dm;

            if self.count == self.period + 1 {
                // Initialize smoothed values
                self.smoothed_tr = self.initial_tr_sum;
                self.smoothed_plus_dm = self.initial_plus_dm_sum;
                self.smoothed_minus_dm = self.initial_minus_dm_sum;

                let (plus_di, minus_di, dx) = calculate_di_and_dx(
                    self.smoothed_plus_dm,
                    self.smoothed_minus_dm,
                    self.smoothed_tr,
                );

                // Store DX for ADX calculation
                self.dx_buffer[0] = dx;
                self.dx_count = 1;

                return Some(AdxOutput {
                    adx: f64::NAN,
                    plus_di,
                    minus_di,
                });
            }
            return None;
        }

        // Wilder's smoothing
        self.smoothed_tr = self.smoothed_tr - (self.smoothed_tr / n) + tr;
        self.smoothed_plus_dm = self.smoothed_plus_dm - (self.smoothed_plus_dm / n) + plus_dm;
        self.smoothed_minus_dm = self.smoothed_minus_dm - (self.smoothed_minus_dm / n) + minus_dm;

        let (plus_di, minus_di, dx) = calculate_di_and_dx(
            self.smoothed_plus_dm,
            self.smoothed_minus_dm,
            self.smoothed_tr,
        );

        // ADX calculation
        let adx = if !self.adx_initialized {
            // Accumulate DX values
            if self.dx_count < self.period {
                self.dx_buffer[self.dx_count] = dx;
                self.dx_count += 1;

                if self.dx_count == self.period {
                    // First ADX: average of accumulated DX values
                    let adx_val = self.dx_buffer.iter().sum::<f64>() / n;
                    self.current_adx = Some(adx_val);
                    self.adx_initialized = true;
                    adx_val
                } else {
                    f64::NAN
                }
            } else {
                f64::NAN
            }
        } else {
            // Wilder's smoothing for ADX
            let prev_adx = self.current_adx.unwrap_or(0.0);
            let new_adx = ((prev_adx * (n - 1.0)) + dx) / n;
            self.current_adx = Some(new_adx);
            new_adx
        };

        Some(AdxOutput {
            adx,
            plus_di,
            minus_di,
        })
    }

    fn reset(&mut self) {
        self.count = 0;
        self.prev_high = f64::NAN;
        self.prev_low = f64::NAN;
        self.prev_close = f64::NAN;
        self.smoothed_tr = 0.0;
        self.smoothed_plus_dm = 0.0;
        self.smoothed_minus_dm = 0.0;
        self.initial_tr_sum = 0.0;
        self.initial_plus_dm_sum = 0.0;
        self.initial_minus_dm_sum = 0.0;
        self.dx_buffer.fill(0.0);
        self.dx_head = 0;
        self.dx_count = 0;
        self.current_adx = None;
        self.adx_initialized = false;
    }

    fn is_ready(&self) -> bool {
        self.adx_initialized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 0.01;

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
    fn test_adx_new_valid() {
        let adx = Adx::new(14).unwrap();
        assert_eq!(adx.period(), 14);
    }

    #[test]
    fn test_adx_new_invalid() {
        assert!(Adx::new(0).is_err());
    }

    #[test]
    fn test_adx_basic_calculation() {
        // Generate test data with a clear trend
        let highs: Vec<f64> = (0..30).map(|i| 100.0 + i as f64 * 0.5).collect();
        let lows: Vec<f64> = (0..30).map(|i| 99.0 + i as f64 * 0.5).collect();
        let closes: Vec<f64> = (0..30).map(|i| 99.5 + i as f64 * 0.5).collect();

        let adx = Adx::new(5).unwrap();
        let result = adx.calculate(&(&highs, &lows, &closes)).unwrap();

        assert_eq!(result.len(), 30);

        // +DI and -DI should be available from index = period
        assert!(result[4].plus_di.is_nan());
        assert!(!result[5].plus_di.is_nan());

        // ADX should be available from index = 2 * period - 1
        assert!(result[8].adx.is_nan());
        assert!(!result[9].adx.is_nan());

        // In an uptrend, +DI should be greater than -DI
        for r in result.iter().skip(10) {
            assert!(r.plus_di > r.minus_di, "+DI should be > -DI in uptrend");
        }
    }

    #[test]
    fn test_adx_streaming_matches_batch() {
        let highs: Vec<f64> = (0..30)
            .map(|i| 100.0 + (i as f64 * 0.3) + ((i % 3) as f64 * 0.2))
            .collect();
        let lows: Vec<f64> = (0..30)
            .map(|i| 99.0 + (i as f64 * 0.3) - ((i % 2) as f64 * 0.1))
            .collect();
        let closes: Vec<f64> = (0..30).map(|i| 99.5 + i as f64 * 0.3).collect();

        let batch = Adx::new(5).unwrap();
        let batch_result = batch.calculate(&(&highs, &lows, &closes)).unwrap();

        let mut stream = AdxStream::new(5).unwrap();
        let bars: Vec<AdxBar> = (0..30).map(|i| (highs[i], lows[i], closes[i])).collect();
        let stream_result = stream.init(&bars).unwrap();

        for i in 0..batch_result.len() {
            assert_approx_eq(stream_result[i].plus_di, batch_result[i].plus_di);
            assert_approx_eq(stream_result[i].minus_di, batch_result[i].minus_di);
            assert_approx_eq(stream_result[i].adx, batch_result[i].adx);
        }
    }

    #[test]
    fn test_adx_downtrend() {
        // Generate test data with a clear downtrend
        let highs: Vec<f64> = (0..30).map(|i| 120.0 - i as f64 * 0.5).collect();
        let lows: Vec<f64> = (0..30).map(|i| 119.0 - i as f64 * 0.5).collect();
        let closes: Vec<f64> = (0..30).map(|i| 119.5 - i as f64 * 0.5).collect();

        let adx = Adx::new(5).unwrap();
        let result = adx.calculate(&(&highs, &lows, &closes)).unwrap();

        // In a downtrend, -DI should be greater than +DI
        for r in result.iter().skip(10) {
            assert!(r.minus_di > r.plus_di, "-DI should be > +DI in downtrend");
        }
    }

    #[test]
    fn test_adx_stream_next_after_init() {
        let highs: Vec<f64> = (0..20).map(|i| 100.0 + i as f64 * 0.5).collect();
        let lows: Vec<f64> = (0..20).map(|i| 99.0 + i as f64 * 0.5).collect();
        let closes: Vec<f64> = (0..20).map(|i| 99.5 + i as f64 * 0.5).collect();

        let mut stream = AdxStream::new(5).unwrap();
        let bars: Vec<AdxBar> = (0..20).map(|i| (highs[i], lows[i], closes[i])).collect();
        stream.init(&bars).unwrap();

        assert!(stream.is_ready());

        // Add one more bar
        let result = stream.next((110.5, 109.5, 110.0)).unwrap();
        assert!(!result.adx.is_nan());
        assert!(!result.plus_di.is_nan());
        assert!(!result.minus_di.is_nan());
    }

    #[test]
    fn test_adx_empty_data() {
        let adx = Adx::new(14).unwrap();
        let result = adx
            .calculate(&(&[] as &[f64], &[] as &[f64], &[] as &[f64]))
            .unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_adx_mismatched_lengths() {
        let adx = Adx::new(5).unwrap();
        let result = adx.calculate(&(&[1.0, 2.0], &[1.0], &[1.0, 2.0]));
        assert!(result.is_err());
    }

    #[test]
    fn test_adx_values_in_range() {
        let highs: Vec<f64> = (0..50).map(|i| 100.0 + (i as f64).sin() * 5.0).collect();
        let lows: Vec<f64> = (0..50).map(|i| 95.0 + (i as f64).sin() * 5.0).collect();
        let closes: Vec<f64> = (0..50).map(|i| 97.5 + (i as f64).sin() * 5.0).collect();

        let adx = Adx::new(14).unwrap();
        let result = adx.calculate(&(&highs, &lows, &closes)).unwrap();

        for r in &result {
            if !r.adx.is_nan() {
                assert!(r.adx >= 0.0 && r.adx <= 100.0, "ADX should be 0-100");
            }
            if !r.plus_di.is_nan() {
                assert!(
                    r.plus_di >= 0.0 && r.plus_di <= 100.0,
                    "+DI should be 0-100"
                );
            }
            if !r.minus_di.is_nan() {
                assert!(
                    r.minus_di >= 0.0 && r.minus_di <= 100.0,
                    "-DI should be 0-100"
                );
            }
        }
    }
}
