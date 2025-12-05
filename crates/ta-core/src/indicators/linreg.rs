//! Linear Regression Channels indicator.
//!
//! Calculates linear regression line with standard deviation bands
//! and Pearson's R correlation coefficient.
//!
//! # Components
//! - **Value**: The linear regression value at each point
//! - **Upper**: Value + (num_std_dev × standard deviation)
//! - **Lower**: Value - (num_std_dev × standard deviation)
//! - **Slope**: The slope of the regression line
//! - **R**: Pearson's correlation coefficient (-1 to 1)
//! - **R²**: Coefficient of determination (0 to 1)
//!
//! # Formula
//! ```text
//! Linear Regression: y = mx + b
//! Where:
//!   m (slope) = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
//!   b (intercept) = ȳ - m × x̄
//!
//! Pearson's R = Σ((x - x̄)(y - ȳ)) / √(Σ((x - x̄)²) × Σ((y - ȳ)²))
//! R² = R × R
//!
//! Standard Deviation = √(Σ(residuals²) / N)
//! ```
//!
//! # Interpretation
//! - R close to 1: Strong positive correlation (uptrend)
//! - R close to -1: Strong negative correlation (downtrend)
//! - R close to 0: Weak correlation (sideways/noise)
//! - R² indicates how much of the price movement is explained by the trend

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult};

/// Linear Regression output structure.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LinRegOutput {
    /// The linear regression value
    pub value: f64,
    /// Upper channel (value + num_std_dev * std_dev)
    pub upper: f64,
    /// Lower channel (value - num_std_dev * std_dev)
    pub lower: f64,
    /// Slope of the regression line
    pub slope: f64,
    /// Pearson's correlation coefficient (-1 to 1)
    pub r: f64,
    /// Coefficient of determination (0 to 1)
    pub r_squared: f64,
}

impl LinRegOutput {
    /// Creates a new LinReg output with all NaN values.
    #[must_use]
    pub fn nan() -> Self {
        Self {
            value: f64::NAN,
            upper: f64::NAN,
            lower: f64::NAN,
            slope: f64::NAN,
            r: f64::NAN,
            r_squared: f64::NAN,
        }
    }
}

/// Linear Regression calculator for batch operations.
#[derive(Debug, Clone)]
pub struct LinReg {
    period: usize,
    num_std_dev: f64,
}

impl LinReg {
    /// Creates a new Linear Regression calculator.
    ///
    /// # Arguments
    /// * `period` - The lookback period for regression
    /// * `num_std_dev` - Number of standard deviations for the bands (default: 2.0)
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is less than 2.
    pub fn new(period: usize, num_std_dev: f64) -> IndicatorResult<Self> {
        if period < 2 {
            return Err(IndicatorError::InvalidParameter(
                "period must be at least 2 for regression".to_string(),
            ));
        }
        if num_std_dev < 0.0 {
            return Err(IndicatorError::InvalidParameter(
                "num_std_dev must be non-negative".to_string(),
            ));
        }
        Ok(Self { period, num_std_dev })
    }

    /// Creates a new Linear Regression calculator with default parameters (period, 2.0 std dev).
    pub fn with_period(period: usize) -> IndicatorResult<Self> {
        Self::new(period, 2.0)
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the number of standard deviations for bands.
    #[must_use]
    pub const fn num_std_dev(&self) -> f64 {
        self.num_std_dev
    }

    /// Calculate linear regression statistics for a window of data.
    fn calculate_regression(data: &[f64]) -> (f64, f64, f64, f64, f64) {
        let n = data.len() as f64;

        // X values are 0, 1, 2, ..., n-1
        // Mean of x: (n-1)/2
        let x_mean = (n - 1.0) / 2.0;

        // Mean of y
        let y_mean = data.iter().sum::<f64>() / n;

        // Calculate sums for regression
        let mut sum_xy_dev = 0.0; // Σ((x - x̄)(y - ȳ))
        let mut sum_xx_dev = 0.0; // Σ((x - x̄)²)
        let mut sum_yy_dev = 0.0; // Σ((y - ȳ)²)

        for (i, &y) in data.iter().enumerate() {
            let x = i as f64;
            let x_dev = x - x_mean;
            let y_dev = y - y_mean;
            sum_xy_dev += x_dev * y_dev;
            sum_xx_dev += x_dev * x_dev;
            sum_yy_dev += y_dev * y_dev;
        }

        // Slope and intercept
        let slope = if sum_xx_dev != 0.0 {
            sum_xy_dev / sum_xx_dev
        } else {
            0.0
        };
        let intercept = y_mean - slope * x_mean;

        // Regression value at the end of the window (x = n-1)
        let value = slope * (n - 1.0) + intercept;

        // Pearson's R
        let r = if sum_xx_dev != 0.0 && sum_yy_dev != 0.0 {
            sum_xy_dev / (sum_xx_dev * sum_yy_dev).sqrt()
        } else {
            0.0
        };

        // Calculate standard deviation of residuals
        let mut sum_residuals_sq = 0.0;
        for (i, &y) in data.iter().enumerate() {
            let x = i as f64;
            let predicted = slope * x + intercept;
            let residual = y - predicted;
            sum_residuals_sq += residual * residual;
        }
        let std_dev = (sum_residuals_sq / n).sqrt();

        (value, slope, r, r * r, std_dev)
    }
}

impl Indicator<&[f64], Vec<LinRegOutput>> for LinReg {
    fn calculate(&self, data: &[f64]) -> IndicatorResult<Vec<LinRegOutput>> {
        let len = data.len();
        let mut result = vec![LinRegOutput::nan(); len];

        if len < self.period {
            return Ok(result);
        }

        for i in (self.period - 1)..len {
            let start = i + 1 - self.period;
            let window = &data[start..=i];

            let (value, slope, r, r_squared, std_dev) = Self::calculate_regression(window);

            result[i] = LinRegOutput {
                value,
                upper: value + self.num_std_dev * std_dev,
                lower: value - self.num_std_dev * std_dev,
                slope,
                r,
                r_squared,
            };
        }

        Ok(result)
    }
}

/// Streaming Linear Regression calculator for real-time updates.
///
/// Maintains a ring buffer for O(1) sliding window updates.
/// Note: The full regression calculation is still O(period) per update,
/// but data management is O(1).
#[derive(Debug)]
pub struct LinRegStream {
    period: usize,
    num_std_dev: f64,
    buffer: Vec<f64>,
    head: usize,
    count: usize,
}

impl LinRegStream {
    /// Creates a new streaming Linear Regression calculator.
    ///
    /// # Errors
    /// Returns `InvalidParameter` if period is less than 2.
    pub fn new(period: usize, num_std_dev: f64) -> IndicatorResult<Self> {
        if period < 2 {
            return Err(IndicatorError::InvalidParameter(
                "period must be at least 2 for regression".to_string(),
            ));
        }
        if num_std_dev < 0.0 {
            return Err(IndicatorError::InvalidParameter(
                "num_std_dev must be non-negative".to_string(),
            ));
        }
        Ok(Self {
            period,
            num_std_dev,
            buffer: vec![0.0; period],
            head: 0,
            count: 0,
        })
    }

    /// Creates with default std dev of 2.0.
    pub fn with_period(period: usize) -> IndicatorResult<Self> {
        Self::new(period, 2.0)
    }

    /// Returns the period.
    #[must_use]
    pub const fn period(&self) -> usize {
        self.period
    }

    /// Returns the number of standard deviations for bands.
    #[must_use]
    pub const fn num_std_dev(&self) -> f64 {
        self.num_std_dev
    }

    /// Get data in correct order from ring buffer.
    fn get_ordered_data(&self) -> Vec<f64> {
        let mut data = Vec::with_capacity(self.period);
        for i in 0..self.period {
            let idx = (self.head + i) % self.period;
            data.push(self.buffer[idx]);
        }
        data
    }
}

impl StreamingIndicator<f64, LinRegOutput> for LinRegStream {
    fn init(&mut self, data: &[f64]) -> IndicatorResult<Vec<LinRegOutput>> {
        self.reset();

        let mut results = Vec::with_capacity(data.len());
        for &value in data {
            results.push(self.next(value).unwrap_or_else(LinRegOutput::nan));
        }
        Ok(results)
    }

    fn next(&mut self, value: f64) -> Option<LinRegOutput> {
        // Add to ring buffer
        if self.count < self.period {
            self.buffer[self.count] = value;
            self.count += 1;

            if self.count == self.period {
                // Calculate first regression
                let (reg_value, slope, r, r_squared, std_dev) =
                    LinReg::calculate_regression(&self.buffer);

                return Some(LinRegOutput {
                    value: reg_value,
                    upper: reg_value + self.num_std_dev * std_dev,
                    lower: reg_value - self.num_std_dev * std_dev,
                    slope,
                    r,
                    r_squared,
                });
            }
            return None;
        }

        // Update ring buffer
        self.buffer[self.head] = value;
        self.head = (self.head + 1) % self.period;

        // Get ordered data and calculate
        let data = self.get_ordered_data();
        let (reg_value, slope, r, r_squared, std_dev) = LinReg::calculate_regression(&data);

        Some(LinRegOutput {
            value: reg_value,
            upper: reg_value + self.num_std_dev * std_dev,
            lower: reg_value - self.num_std_dev * std_dev,
            slope,
            r,
            r_squared,
        })
    }

    fn reset(&mut self) {
        self.buffer.fill(0.0);
        self.head = 0;
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
    fn test_linreg_new_valid() {
        let lr = LinReg::new(20, 2.0).unwrap();
        assert_eq!(lr.period(), 20);
        assert_eq!(lr.num_std_dev(), 2.0);
    }

    #[test]
    fn test_linreg_new_invalid() {
        assert!(LinReg::new(0, 2.0).is_err());
        assert!(LinReg::new(1, 2.0).is_err());
        assert!(LinReg::new(20, -1.0).is_err());
    }

    #[test]
    fn test_linreg_perfect_linear() {
        // Perfect linear data: y = 2x + 1
        let data: Vec<f64> = (0..10).map(|x| 2.0 * x as f64 + 1.0).collect();

        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&data).unwrap();

        // R should be exactly 1.0 (or very close) for perfect linear data
        for r in result.iter().skip(4) {
            assert_approx_eq(r.r, 1.0);
            assert_approx_eq(r.r_squared, 1.0);
            assert_approx_eq(r.slope, 2.0);
        }
    }

    #[test]
    fn test_linreg_perfect_negative_linear() {
        // Perfect negative linear data: y = -2x + 10
        let data: Vec<f64> = (0..10).map(|x| -2.0 * x as f64 + 10.0).collect();

        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&data).unwrap();

        // R should be exactly -1.0 for perfect negative correlation
        for r in result.iter().skip(4) {
            assert_approx_eq(r.r, -1.0);
            assert_approx_eq(r.slope, -2.0);
        }
    }

    #[test]
    fn test_linreg_bands() {
        // Data with some variance
        let data = [1.0, 2.5, 2.0, 3.5, 3.0, 4.5, 4.0, 5.5, 5.0, 6.5];

        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&data).unwrap();

        for r in result.iter().skip(4) {
            // Upper should be above value
            assert!(r.upper > r.value);
            // Lower should be below value
            assert!(r.lower < r.value);
            // Bands should be symmetric
            let upper_dist = r.upper - r.value;
            let lower_dist = r.value - r.lower;
            assert_approx_eq(upper_dist, lower_dist);
        }
    }

    #[test]
    fn test_linreg_streaming_matches_batch() {
        let data: Vec<f64> = (0..20).map(|i| 100.0 + i as f64 * 0.5 + (i % 3) as f64 * 0.2).collect();

        let batch = LinReg::new(5, 2.0).unwrap();
        let batch_result = batch.calculate(&data).unwrap();

        let mut stream = LinRegStream::new(5, 2.0).unwrap();
        let stream_result = stream.init(&data).unwrap();

        for i in 0..batch_result.len() {
            assert_approx_eq(stream_result[i].value, batch_result[i].value);
            assert_approx_eq(stream_result[i].slope, batch_result[i].slope);
            assert_approx_eq(stream_result[i].r, batch_result[i].r);
            assert_approx_eq(stream_result[i].r_squared, batch_result[i].r_squared);
            assert_approx_eq(stream_result[i].upper, batch_result[i].upper);
            assert_approx_eq(stream_result[i].lower, batch_result[i].lower);
        }
    }

    #[test]
    fn test_linreg_r_squared_range() {
        // Random-ish data
        let data = [1.0, 3.0, 2.0, 5.0, 4.0, 6.0, 5.0, 8.0, 7.0, 9.0];

        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&data).unwrap();

        for r in result.iter().skip(4) {
            assert!(r.r >= -1.0 && r.r <= 1.0, "R should be between -1 and 1");
            assert!(r.r_squared >= 0.0 && r.r_squared <= 1.0, "R² should be between 0 and 1");
        }
    }

    #[test]
    fn test_linreg_stream_next_after_init() {
        let data: Vec<f64> = (0..10).map(|i| 100.0 + i as f64).collect();

        let mut stream = LinRegStream::new(5, 2.0).unwrap();
        stream.init(&data).unwrap();

        assert!(stream.is_ready());

        // Add one more value
        let result = stream.next(110.0).unwrap();
        assert!(!result.value.is_nan());
        assert!(!result.r.is_nan());
    }

    #[test]
    fn test_linreg_empty_data() {
        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&[]).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_linreg_insufficient_data() {
        let lr = LinReg::new(10, 2.0).unwrap();
        let data = [1.0, 2.0, 3.0, 4.0, 5.0]; // Only 5 values, need 10
        let result = lr.calculate(&data).unwrap();

        // All should be NaN
        assert!(result.iter().all(|r| r.value.is_nan()));
    }

    #[test]
    fn test_linreg_constant_data() {
        // Constant data should have slope 0 and undefined R
        let data = [5.0; 10];

        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&data).unwrap();

        for r in result.iter().skip(4) {
            assert_approx_eq(r.slope, 0.0);
            // Value should equal the constant
            assert_approx_eq(r.value, 5.0);
        }
    }

    #[test]
    fn test_linreg_value_at_end_of_window() {
        // For y = x (0, 1, 2, 3, 4), the regression line at x=4 should be 4
        let data = [0.0, 1.0, 2.0, 3.0, 4.0];

        let lr = LinReg::new(5, 2.0).unwrap();
        let result = lr.calculate(&data).unwrap();

        assert_approx_eq(result[4].value, 4.0);
        assert_approx_eq(result[4].slope, 1.0);
    }
}
