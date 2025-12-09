//! Pivot Points indicator.
//!
//! Pivot Points are support and resistance levels calculated from the previous
//! period's high, low, and close prices. They are widely used by day traders
//! to identify potential turning points.
//!
//! # Variants
//!
//! ## Standard (Classic)
//! ```text
//! Pivot = (High + Low + Close) / 3
//! R1 = 2 × Pivot - Low
//! S1 = 2 × Pivot - High
//! R2 = Pivot + (High - Low)
//! S2 = Pivot - (High - Low)
//! R3 = High + 2 × (Pivot - Low)
//! S3 = Low - 2 × (High - Pivot)
//! ```
//!
//! ## Fibonacci
//! Uses Fibonacci ratios (0.382, 0.618, 1.0) for support/resistance levels.
//! ```text
//! Pivot = (High + Low + Close) / 3
//! R1 = Pivot + 0.382 × (High - Low)
//! S1 = Pivot - 0.382 × (High - Low)
//! R2 = Pivot + 0.618 × (High - Low)
//! S2 = Pivot - 0.618 × (High - Low)
//! R3 = Pivot + 1.0 × (High - Low)
//! S3 = Pivot - 1.0 × (High - Low)
//! ```
//!
//! ## Woodie
//! Gives more weight to the closing price.
//! ```text
//! Pivot = (High + Low + 2 × Close) / 4
//! R1 = 2 × Pivot - Low
//! S1 = 2 × Pivot - High
//! R2 = Pivot + (High - Low)
//! S2 = Pivot - (High - Low)
//! R3 = High + 2 × (Pivot - Low)
//! S3 = Low - 2 × (High - Pivot)
//! ```
//!
//! # Example
//! ```
//! use ta_core::indicators::pivot_points::{PivotPoints, PivotPointsVariant};
//! use ta_core::traits::Indicator;
//!
//! // Calculate standard pivot points from previous day's OHLC
//! let pivots = PivotPoints::new(PivotPointsVariant::Standard);
//! let result = pivots.calculate(&(100.0, 95.0, 98.0)).unwrap(); // (high, low, close)
//! println!("Pivot: {}, R1: {}, S1: {}", result.pivot, result.r1, result.s1);
//! ```

use crate::traits::Indicator;
use crate::types::IndicatorResult;

// ============================================================================
// Types
// ============================================================================

/// Pivot Points calculation variant.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum PivotPointsVariant {
    /// Standard (Classic) pivot points
    #[default]
    Standard,
    /// Fibonacci pivot points using 0.382, 0.618, 1.0 ratios
    Fibonacci,
    /// Woodie pivot points (weighted toward close)
    Woodie,
}

/// Output from pivot points calculation.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PivotPointsOutput {
    /// The pivot point (central level)
    pub pivot: f64,
    /// First resistance level
    pub r1: f64,
    /// Second resistance level
    pub r2: f64,
    /// Third resistance level
    pub r3: f64,
    /// First support level
    pub s1: f64,
    /// Second support level
    pub s2: f64,
    /// Third support level
    pub s3: f64,
}

impl Default for PivotPointsOutput {
    fn default() -> Self {
        Self {
            pivot: f64::NAN,
            r1: f64::NAN,
            r2: f64::NAN,
            r3: f64::NAN,
            s1: f64::NAN,
            s2: f64::NAN,
            s3: f64::NAN,
        }
    }
}

impl PivotPointsOutput {
    /// Creates a new `PivotPointsOutput` with all NaN values.
    #[must_use]
    pub fn nan() -> Self {
        Self::default()
    }

    /// Returns true if all values are valid (not NaN).
    #[must_use]
    pub fn is_valid(&self) -> bool {
        !self.pivot.is_nan()
            && !self.r1.is_nan()
            && !self.r2.is_nan()
            && !self.r3.is_nan()
            && !self.s1.is_nan()
            && !self.s2.is_nan()
            && !self.s3.is_nan()
    }
}

/// Input type for pivot points: (high, low, close)
pub type PivotInput = (f64, f64, f64);

/// Input type for batch pivot points: arrays of (high, low, close)
pub type PivotBatchInput<'a> = (&'a [f64], &'a [f64], &'a [f64]);

// ============================================================================
// Pivot Points Calculator
// ============================================================================

/// Pivot Points calculator.
///
/// Calculates pivot point levels from previous period's high, low, and close.
#[derive(Debug, Clone, Copy, Default)]
pub struct PivotPoints {
    variant: PivotPointsVariant,
}

impl PivotPoints {
    /// Creates a new Pivot Points calculator with the specified variant.
    #[must_use]
    pub const fn new(variant: PivotPointsVariant) -> Self {
        Self { variant }
    }

    /// Creates a new Standard Pivot Points calculator.
    #[must_use]
    pub const fn standard() -> Self {
        Self::new(PivotPointsVariant::Standard)
    }

    /// Creates a new Fibonacci Pivot Points calculator.
    #[must_use]
    pub const fn fibonacci() -> Self {
        Self::new(PivotPointsVariant::Fibonacci)
    }

    /// Creates a new Woodie Pivot Points calculator.
    #[must_use]
    pub const fn woodie() -> Self {
        Self::new(PivotPointsVariant::Woodie)
    }

    /// Returns the variant of this calculator.
    #[must_use]
    pub const fn variant(&self) -> PivotPointsVariant {
        self.variant
    }

    /// Calculate pivot points from a single (high, low, close) tuple.
    #[must_use]
    pub fn calculate_single(&self, high: f64, low: f64, close: f64) -> PivotPointsOutput {
        if high.is_nan() || low.is_nan() || close.is_nan() {
            return PivotPointsOutput::nan();
        }

        let range = high - low;

        match self.variant {
            PivotPointsVariant::Standard => {
                let pivot = (high + low + close) / 3.0;
                PivotPointsOutput {
                    pivot,
                    r1: 2.0 * pivot - low,
                    r2: pivot + range,
                    r3: high + 2.0 * (pivot - low),
                    s1: 2.0 * pivot - high,
                    s2: pivot - range,
                    s3: low - 2.0 * (high - pivot),
                }
            }
            PivotPointsVariant::Fibonacci => {
                let pivot = (high + low + close) / 3.0;
                PivotPointsOutput {
                    pivot,
                    r1: pivot + 0.382 * range,
                    r2: pivot + 0.618 * range,
                    r3: pivot + range,
                    s1: pivot - 0.382 * range,
                    s2: pivot - 0.618 * range,
                    s3: pivot - range,
                }
            }
            PivotPointsVariant::Woodie => {
                let pivot = (high + low + 2.0 * close) / 4.0;
                PivotPointsOutput {
                    pivot,
                    r1: 2.0 * pivot - low,
                    r2: pivot + range,
                    r3: high + 2.0 * (pivot - low),
                    s1: 2.0 * pivot - high,
                    s2: pivot - range,
                    s3: low - 2.0 * (high - pivot),
                }
            }
        }
    }
}

/// Calculate pivot points from a single candle (high, low, close).
impl Indicator<&PivotInput, PivotPointsOutput> for PivotPoints {
    fn calculate(&self, data: &PivotInput) -> IndicatorResult<PivotPointsOutput> {
        let (high, low, close) = *data;
        Ok(self.calculate_single(high, low, close))
    }
}

/// Calculate pivot points from arrays of (highs, lows, closes).
///
/// Each element in the output corresponds to the pivot points calculated
/// from that period's high, low, close values.
impl Indicator<PivotBatchInput<'_>, Vec<PivotPointsOutput>> for PivotPoints {
    fn calculate(&self, data: PivotBatchInput<'_>) -> IndicatorResult<Vec<PivotPointsOutput>> {
        let (highs, lows, closes) = data;

        if highs.len() != lows.len() || lows.len() != closes.len() {
            return Err(crate::types::IndicatorError::InvalidParameter(
                "highs, lows, and closes must have the same length".to_string(),
            ));
        }

        let result: Vec<PivotPointsOutput> = highs
            .iter()
            .zip(lows.iter())
            .zip(closes.iter())
            .map(|((&h, &l), &c)| self.calculate_single(h, l, c))
            .collect();

        Ok(result)
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn approx_eq(a: f64, b: f64, epsilon: f64) -> bool {
        if a.is_nan() && b.is_nan() {
            return true;
        }
        (a - b).abs() < epsilon
    }

    #[test]
    fn test_standard_pivot_points() {
        let pp = PivotPoints::standard();

        // Test with known values
        // High = 110, Low = 100, Close = 105
        let result = pp.calculate_single(110.0, 100.0, 105.0);

        // Pivot = (110 + 100 + 105) / 3 = 105
        assert!(approx_eq(result.pivot, 105.0, 0.001));

        // R1 = 2 × 105 - 100 = 110
        assert!(approx_eq(result.r1, 110.0, 0.001));

        // S1 = 2 × 105 - 110 = 100
        assert!(approx_eq(result.s1, 100.0, 0.001));

        // R2 = 105 + (110 - 100) = 115
        assert!(approx_eq(result.r2, 115.0, 0.001));

        // S2 = 105 - (110 - 100) = 95
        assert!(approx_eq(result.s2, 95.0, 0.001));

        // R3 = 110 + 2 × (105 - 100) = 120
        assert!(approx_eq(result.r3, 120.0, 0.001));

        // S3 = 100 - 2 × (110 - 105) = 90
        assert!(approx_eq(result.s3, 90.0, 0.001));
    }

    #[test]
    fn test_fibonacci_pivot_points() {
        let pp = PivotPoints::fibonacci();

        // High = 110, Low = 100, Close = 105
        let result = pp.calculate_single(110.0, 100.0, 105.0);

        // Pivot = (110 + 100 + 105) / 3 = 105
        assert!(approx_eq(result.pivot, 105.0, 0.001));

        // Range = 10
        // R1 = 105 + 0.382 × 10 = 108.82
        assert!(approx_eq(result.r1, 108.82, 0.01));

        // S1 = 105 - 0.382 × 10 = 101.18
        assert!(approx_eq(result.s1, 101.18, 0.01));

        // R2 = 105 + 0.618 × 10 = 111.18
        assert!(approx_eq(result.r2, 111.18, 0.01));

        // S2 = 105 - 0.618 × 10 = 98.82
        assert!(approx_eq(result.s2, 98.82, 0.01));

        // R3 = 105 + 1.0 × 10 = 115
        assert!(approx_eq(result.r3, 115.0, 0.001));

        // S3 = 105 - 1.0 × 10 = 95
        assert!(approx_eq(result.s3, 95.0, 0.001));
    }

    #[test]
    fn test_woodie_pivot_points() {
        let pp = PivotPoints::woodie();

        // High = 110, Low = 100, Close = 105
        let result = pp.calculate_single(110.0, 100.0, 105.0);

        // Pivot = (110 + 100 + 2 × 105) / 4 = 105
        assert!(approx_eq(result.pivot, 105.0, 0.001));

        // With same pivot as standard, levels are the same
        // R1 = 2 × 105 - 100 = 110
        assert!(approx_eq(result.r1, 110.0, 0.001));

        // S1 = 2 × 105 - 110 = 100
        assert!(approx_eq(result.s1, 100.0, 0.001));
    }

    #[test]
    fn test_woodie_different_from_standard() {
        let standard = PivotPoints::standard();
        let woodie = PivotPoints::woodie();

        // When close is not at the midpoint, Woodie will differ
        // High = 110, Low = 100, Close = 108 (bullish close)
        let std_result = standard.calculate_single(110.0, 100.0, 108.0);
        let woodie_result = woodie.calculate_single(110.0, 100.0, 108.0);

        // Standard: Pivot = (110 + 100 + 108) / 3 = 106
        assert!(approx_eq(std_result.pivot, 106.0, 0.001));

        // Woodie: Pivot = (110 + 100 + 2 × 108) / 4 = 106.5
        assert!(approx_eq(woodie_result.pivot, 106.5, 0.001));

        // Pivots are different
        assert!(!approx_eq(std_result.pivot, woodie_result.pivot, 0.001));
    }

    #[test]
    fn test_batch_calculation() {
        let pp = PivotPoints::standard();

        let highs = [110.0, 120.0, 115.0];
        let lows = [100.0, 105.0, 108.0];
        let closes = [105.0, 118.0, 110.0];

        let result: Vec<PivotPointsOutput> =
            pp.calculate((&highs[..], &lows[..], &closes[..])).unwrap();

        assert_eq!(result.len(), 3);

        // First candle
        assert!(approx_eq(result[0].pivot, 105.0, 0.001));

        // Second candle: (120 + 105 + 118) / 3 = 114.33
        assert!(approx_eq(result[1].pivot, 114.333, 0.01));

        // Third candle: (115 + 108 + 110) / 3 = 111
        assert!(approx_eq(result[2].pivot, 111.0, 0.001));
    }

    #[test]
    fn test_single_input_trait() {
        let pp = PivotPoints::standard();
        let input: PivotInput = (110.0, 100.0, 105.0);

        let result: PivotPointsOutput = pp.calculate(&input).unwrap();
        assert!(approx_eq(result.pivot, 105.0, 0.001));
    }

    #[test]
    fn test_nan_handling() {
        let pp = PivotPoints::standard();

        let result = pp.calculate_single(f64::NAN, 100.0, 105.0);
        assert!(result.pivot.is_nan());
        assert!(!result.is_valid());

        let result = pp.calculate_single(110.0, f64::NAN, 105.0);
        assert!(result.pivot.is_nan());

        let result = pp.calculate_single(110.0, 100.0, f64::NAN);
        assert!(result.pivot.is_nan());
    }

    #[test]
    fn test_mismatched_lengths() {
        let pp = PivotPoints::standard();

        let highs = [110.0, 120.0];
        let lows = [100.0]; // Wrong length
        let closes = [105.0, 118.0];

        let result = pp.calculate((&highs[..], &lows[..], &closes[..]));
        assert!(result.is_err());
    }

    #[test]
    fn test_is_valid() {
        let pp = PivotPoints::standard();

        let valid = pp.calculate_single(110.0, 100.0, 105.0);
        assert!(valid.is_valid());

        let invalid = PivotPointsOutput::nan();
        assert!(!invalid.is_valid());
    }

    #[test]
    fn test_constructors() {
        assert_eq!(
            PivotPoints::standard().variant(),
            PivotPointsVariant::Standard
        );
        assert_eq!(
            PivotPoints::fibonacci().variant(),
            PivotPointsVariant::Fibonacci
        );
        assert_eq!(PivotPoints::woodie().variant(), PivotPointsVariant::Woodie);
    }

    #[test]
    fn test_zero_range() {
        // When high == low (doji), range is 0
        let pp = PivotPoints::standard();
        let result = pp.calculate_single(100.0, 100.0, 100.0);

        // Pivot = 100, all levels collapse to pivot
        assert!(approx_eq(result.pivot, 100.0, 0.001));
        assert!(approx_eq(result.r1, 100.0, 0.001));
        assert!(approx_eq(result.s1, 100.0, 0.001));
        assert!(approx_eq(result.r2, 100.0, 0.001));
        assert!(approx_eq(result.s2, 100.0, 0.001));
    }
}
