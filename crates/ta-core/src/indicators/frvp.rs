//! Fixed Range Volume Profile (FRVP) indicator.
//!
//! FRVP calculates volume distribution across price levels within a fixed range,
//! identifying key levels: Point of Control (POC), Value Area High (VAH), and Value Area Low (VAL).
//!
//! # Output
//! - **Volume Histogram**: Volume distributed by price level
//! - **POC (Point of Control)**: Price level with the highest volume
//! - **VAH (Value Area High)**: Upper boundary containing 70% of volume
//! - **VAL (Value Area Low)**: Lower boundary containing 70% of volume
//!
//! # Example
//! ```
//! use ta_core::indicators::frvp::Frvp;
//! use ta_core::traits::Indicator;
//! use ta_core::types::OHLCV;
//!
//! let frvp = Frvp::new(100).unwrap(); // 100 price bins
//! let candles = vec![
//!     OHLCV::new(1700000000000, 100.0, 105.0, 99.0, 102.0, 1000.0),
//!     OHLCV::new(1700000060000, 102.0, 106.0, 101.0, 104.0, 1500.0),
//!     OHLCV::new(1700000120000, 104.0, 108.0, 103.0, 107.0, 2000.0),
//! ];
//! let result = frvp.calculate(&candles).unwrap();
//! println!("POC: {}, VAH: {}, VAL: {}", result.poc, result.vah, result.val);
//! ```

use crate::traits::{Indicator, StreamingIndicator};
use crate::types::{IndicatorError, IndicatorResult, OHLCV};

// ============================================================================
// Constants
// ============================================================================

/// Default number of price bins for the volume histogram
pub const DEFAULT_NUM_BINS: usize = 100;

/// Value Area percentage (70% of total volume)
const VALUE_AREA_PERCENT: f64 = 0.70;

// ============================================================================
// Output Types
// ============================================================================

/// A single row in the volume profile histogram.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct VolumeProfileRow {
    /// Price level (center of the bin)
    pub price: f64,
    /// Volume at this price level
    pub volume: f64,
    /// Lower bound of the price bin
    pub low: f64,
    /// Upper bound of the price bin
    pub high: f64,
}

/// Output from Fixed Range Volume Profile calculation.
#[derive(Debug, Clone, PartialEq)]
pub struct FrvpOutput {
    /// Point of Control - price level with highest volume
    pub poc: f64,
    /// Value Area High - upper boundary of value area
    pub vah: f64,
    /// Value Area Low - lower boundary of value area
    pub val: f64,
    /// Volume histogram (sorted by price ascending)
    pub histogram: Vec<VolumeProfileRow>,
    /// Total volume in the range
    pub total_volume: f64,
    /// Volume at POC
    pub poc_volume: f64,
    /// Volume within the Value Area
    pub value_area_volume: f64,
    /// Highest price in the range
    pub range_high: f64,
    /// Lowest price in the range
    pub range_low: f64,
}

// ============================================================================
// Batch Calculator
// ============================================================================

/// Fixed Range Volume Profile calculator for batch operations.
///
/// Calculates volume distribution across price levels within a fixed range of candles.
#[derive(Debug, Clone)]
pub struct Frvp {
    /// Number of price bins (rows) in the histogram
    num_bins: usize,
    /// Value area percentage (default 0.70 = 70%)
    value_area_percent: f64,
}

impl Frvp {
    /// Creates a new FRVP calculator with the specified number of bins.
    ///
    /// # Arguments
    /// * `num_bins` - Number of price levels (rows) in the histogram (must be >= 1)
    ///
    /// # Errors
    /// Returns `IndicatorError::InvalidParameter` if `num_bins` is 0.
    pub fn new(num_bins: usize) -> IndicatorResult<Self> {
        if num_bins == 0 {
            return Err(IndicatorError::InvalidParameter(
                "num_bins must be at least 1".to_string(),
            ));
        }

        Ok(Self {
            num_bins,
            value_area_percent: VALUE_AREA_PERCENT,
        })
    }

    /// Creates a new FRVP calculator with custom value area percentage.
    ///
    /// # Arguments
    /// * `num_bins` - Number of price levels (rows) in the histogram
    /// * `value_area_percent` - Percentage of volume for value area (0.0 to 1.0)
    ///
    /// # Errors
    /// Returns error if parameters are invalid.
    pub fn with_value_area(num_bins: usize, value_area_percent: f64) -> IndicatorResult<Self> {
        if num_bins == 0 {
            return Err(IndicatorError::InvalidParameter(
                "num_bins must be at least 1".to_string(),
            ));
        }
        if !(0.0..=1.0).contains(&value_area_percent) {
            return Err(IndicatorError::InvalidParameter(
                "value_area_percent must be between 0.0 and 1.0".to_string(),
            ));
        }

        Ok(Self {
            num_bins,
            value_area_percent,
        })
    }

    /// Get the number of bins.
    #[must_use]
    pub const fn num_bins(&self) -> usize {
        self.num_bins
    }

    /// Get the value area percentage.
    #[must_use]
    pub const fn value_area_percent(&self) -> f64 {
        self.value_area_percent
    }
}

impl Default for Frvp {
    fn default() -> Self {
        Self {
            num_bins: DEFAULT_NUM_BINS,
            value_area_percent: VALUE_AREA_PERCENT,
        }
    }
}

impl Indicator<&[OHLCV], FrvpOutput> for Frvp {
    fn calculate(&self, data: &[OHLCV]) -> IndicatorResult<FrvpOutput> {
        if data.is_empty() {
            return Err(IndicatorError::InsufficientData {
                required: 1,
                provided: 0,
            });
        }

        // Find the price range
        let mut range_high = f64::NEG_INFINITY;
        let mut range_low = f64::INFINITY;

        for candle in data {
            range_high = range_high.max(candle.high);
            range_low = range_low.min(candle.low);
        }

        // Handle edge case: all prices are the same
        if (range_high - range_low).abs() < f64::EPSILON {
            let total_volume: f64 = data.iter().map(|c| c.volume).sum();
            let row = VolumeProfileRow {
                price: range_high,
                volume: total_volume,
                low: range_low,
                high: range_high,
            };
            return Ok(FrvpOutput {
                poc: range_high,
                vah: range_high,
                val: range_low,
                histogram: vec![row],
                total_volume,
                poc_volume: total_volume,
                value_area_volume: total_volume,
                range_high,
                range_low,
            });
        }

        // Calculate bin size
        let range = range_high - range_low;
        let bin_size = range / self.num_bins as f64;

        // Initialize volume bins
        let mut bins = vec![0.0_f64; self.num_bins];

        // Distribute volume from each candle across bins it touches
        for candle in data {
            if candle.volume <= 0.0 {
                continue;
            }

            // Find which bins this candle touches
            let candle_low = candle.low;
            let candle_high = candle.high;

            // Calculate bin indices this candle spans
            let start_bin = ((candle_low - range_low) / bin_size).floor() as usize;
            let end_bin = ((candle_high - range_low) / bin_size).floor() as usize;

            // Clamp to valid range
            let start_bin = start_bin.min(self.num_bins - 1);
            let end_bin = end_bin.min(self.num_bins - 1);

            // Calculate the candle's range
            let candle_range = candle_high - candle_low;

            if candle_range < f64::EPSILON {
                // Single price point - put all volume in one bin
                bins[start_bin] += candle.volume;
            } else {
                // Distribute volume proportionally across bins
                for bin_idx in start_bin..=end_bin {
                    let bin_low = range_low + bin_idx as f64 * bin_size;
                    let bin_high = bin_low + bin_size;

                    // Calculate overlap between candle and bin
                    let overlap_low = candle_low.max(bin_low);
                    let overlap_high = candle_high.min(bin_high);
                    let overlap = (overlap_high - overlap_low).max(0.0);

                    // Proportion of candle in this bin
                    let proportion = overlap / candle_range;
                    bins[bin_idx] += candle.volume * proportion;
                }
            }
        }

        // Calculate total volume
        let total_volume: f64 = bins.iter().sum();

        // Find POC (bin with maximum volume)
        let mut poc_idx = 0;
        let mut poc_volume = 0.0_f64;
        for (idx, &volume) in bins.iter().enumerate() {
            if volume > poc_volume {
                poc_volume = volume;
                poc_idx = idx;
            }
        }

        // Calculate Value Area (70% of volume centered around POC)
        let target_volume = total_volume * self.value_area_percent;
        let (val_idx, vah_idx) = calculate_value_area(&bins, poc_idx, target_volume);

        // Build histogram output
        let histogram: Vec<VolumeProfileRow> = bins
            .iter()
            .enumerate()
            .map(|(idx, &volume)| {
                let low = range_low + idx as f64 * bin_size;
                let high = low + bin_size;
                VolumeProfileRow {
                    price: (low + high) / 2.0,
                    volume,
                    low,
                    high,
                }
            })
            .collect();

        // Calculate value area volume
        let value_area_volume: f64 = bins[val_idx..=vah_idx].iter().sum();

        // Calculate price levels
        let poc = range_low + (poc_idx as f64 + 0.5) * bin_size;
        let val = range_low + val_idx as f64 * bin_size;
        let vah = range_low + (vah_idx + 1) as f64 * bin_size;

        Ok(FrvpOutput {
            poc,
            vah,
            val,
            histogram,
            total_volume,
            poc_volume,
            value_area_volume,
            range_high,
            range_low,
        })
    }
}

/// Calculate Value Area boundaries by expanding outward from POC.
///
/// The algorithm:
/// 1. Start with the POC bin
/// 2. Look at the bins immediately above and below
/// 3. Add the one with higher volume (or sum of 2 bins if comparing single vs pair)
/// 4. Repeat until we've captured the target percentage of volume
fn calculate_value_area(bins: &[f64], poc_idx: usize, target_volume: f64) -> (usize, usize) {
    let num_bins = bins.len();
    let mut val_idx = poc_idx;
    let mut vah_idx = poc_idx;
    let mut current_volume = bins[poc_idx];

    while current_volume < target_volume {
        let can_expand_down = val_idx > 0;
        let can_expand_up = vah_idx < num_bins - 1;

        if !can_expand_down && !can_expand_up {
            break;
        }

        // Get volumes for expansion candidates
        let down_volume = if can_expand_down {
            bins[val_idx - 1]
        } else {
            0.0
        };

        let up_volume = if can_expand_up {
            bins[vah_idx + 1]
        } else {
            0.0
        };

        // Expand in the direction with more volume
        if down_volume >= up_volume && can_expand_down {
            val_idx -= 1;
            current_volume += down_volume;
        } else if can_expand_up {
            vah_idx += 1;
            current_volume += up_volume;
        } else if can_expand_down {
            val_idx -= 1;
            current_volume += down_volume;
        }
    }

    (val_idx, vah_idx)
}

// ============================================================================
// Streaming Calculator
// ============================================================================

/// Streaming FRVP calculator for real-time updates.
///
/// Unlike batch mode, streaming mode maintains an internal buffer of candles
/// and recalculates on each update. This is still O(n) where n is the buffer size,
/// but avoids re-passing all data from JS to WASM.
#[derive(Debug, Clone)]
pub struct FrvpStream {
    /// Number of price bins
    num_bins: usize,
    /// Value area percentage
    value_area_percent: f64,
    /// Internal candle buffer
    candles: Vec<OHLCV>,
    /// Whether initialized
    initialized: bool,
}

impl FrvpStream {
    /// Creates a new streaming FRVP calculator.
    ///
    /// # Arguments
    /// * `num_bins` - Number of price levels in the histogram
    pub fn new(num_bins: usize) -> IndicatorResult<Self> {
        if num_bins == 0 {
            return Err(IndicatorError::InvalidParameter(
                "num_bins must be at least 1".to_string(),
            ));
        }

        Ok(Self {
            num_bins,
            value_area_percent: VALUE_AREA_PERCENT,
            candles: Vec::new(),
            initialized: false,
        })
    }

    /// Creates with custom value area percentage.
    pub fn with_value_area(num_bins: usize, value_area_percent: f64) -> IndicatorResult<Self> {
        if num_bins == 0 {
            return Err(IndicatorError::InvalidParameter(
                "num_bins must be at least 1".to_string(),
            ));
        }
        if !(0.0..=1.0).contains(&value_area_percent) {
            return Err(IndicatorError::InvalidParameter(
                "value_area_percent must be between 0.0 and 1.0".to_string(),
            ));
        }

        Ok(Self {
            num_bins,
            value_area_percent,
            candles: Vec::new(),
            initialized: false,
        })
    }

    /// Get the number of bins.
    #[must_use]
    pub const fn num_bins(&self) -> usize {
        self.num_bins
    }

    /// Get the number of candles in the buffer.
    #[must_use]
    pub fn candle_count(&self) -> usize {
        self.candles.len()
    }

    /// Clear all candles and reset.
    pub fn clear(&mut self) {
        self.candles.clear();
        self.initialized = false;
    }

    /// Recalculate using internal batch calculator.
    fn recalculate(&self) -> IndicatorResult<FrvpOutput> {
        let batch = Frvp {
            num_bins: self.num_bins,
            value_area_percent: self.value_area_percent,
        };
        batch.calculate(&self.candles)
    }
}

impl StreamingIndicator<OHLCV, FrvpOutput> for FrvpStream {
    fn init(&mut self, data: &[OHLCV]) -> IndicatorResult<Vec<FrvpOutput>> {
        self.candles = data.to_vec();
        self.initialized = !data.is_empty();

        // Return a single result for the entire range
        if self.initialized {
            Ok(vec![self.recalculate()?])
        } else {
            Ok(vec![])
        }
    }

    fn next(&mut self, candle: OHLCV) -> Option<FrvpOutput> {
        self.candles.push(candle);
        self.initialized = true;
        self.recalculate().ok()
    }

    fn reset(&mut self) {
        self.candles.clear();
        self.initialized = false;
    }

    fn is_ready(&self) -> bool {
        self.initialized && !self.candles.is_empty()
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn make_candle(high: f64, low: f64, close: f64, volume: f64) -> OHLCV {
        OHLCV::new(0, low, high, low, close, volume)
    }

    #[test]
    fn test_frvp_basic() {
        let frvp = Frvp::new(10).unwrap();
        let candles = vec![
            make_candle(105.0, 100.0, 102.0, 1000.0),
            make_candle(110.0, 105.0, 108.0, 2000.0),
            make_candle(108.0, 102.0, 105.0, 1500.0),
        ];

        let result = frvp.calculate(&candles).unwrap();

        assert_eq!(result.histogram.len(), 10);
        assert!(result.poc >= result.range_low && result.poc <= result.range_high);
        assert!(result.val <= result.poc);
        assert!(result.vah >= result.poc);
        assert!((result.total_volume - 4500.0).abs() < 0.01);
    }

    #[test]
    fn test_frvp_single_candle() {
        let frvp = Frvp::new(5).unwrap();
        let candles = vec![make_candle(110.0, 100.0, 105.0, 1000.0)];

        let result = frvp.calculate(&candles).unwrap();

        assert_eq!(result.histogram.len(), 5);
        assert!((result.total_volume - 1000.0).abs() < 0.01);
    }

    #[test]
    fn test_frvp_flat_price() {
        let frvp = Frvp::new(10).unwrap();
        let candles = vec![
            OHLCV::new(0, 100.0, 100.0, 100.0, 100.0, 500.0),
            OHLCV::new(1, 100.0, 100.0, 100.0, 100.0, 500.0),
        ];

        let result = frvp.calculate(&candles).unwrap();

        assert_eq!(result.poc, 100.0);
        assert!((result.total_volume - 1000.0).abs() < 0.01);
    }

    #[test]
    fn test_frvp_empty_data() {
        let frvp = Frvp::new(10).unwrap();
        let result = frvp.calculate(&[]);

        assert!(result.is_err());
    }

    #[test]
    fn test_frvp_invalid_params() {
        assert!(Frvp::new(0).is_err());
        assert!(Frvp::with_value_area(10, -0.1).is_err());
        assert!(Frvp::with_value_area(10, 1.5).is_err());
    }

    #[test]
    fn test_frvp_value_area() {
        let frvp = Frvp::with_value_area(20, 0.70).unwrap();

        // Create candles with clear volume distribution
        let candles = vec![
            make_candle(102.0, 100.0, 101.0, 100.0),  // Low volume at bottom
            make_candle(105.0, 103.0, 104.0, 1000.0), // High volume in middle
            make_candle(106.0, 104.0, 105.0, 1000.0), // High volume in middle
            make_candle(110.0, 108.0, 109.0, 100.0),  // Low volume at top
        ];

        let result = frvp.calculate(&candles).unwrap();

        // POC should be in the high-volume middle area
        assert!(result.poc > 102.0 && result.poc < 108.0);

        // Value area should contain ~70% of volume
        let va_ratio = result.value_area_volume / result.total_volume;
        assert!(va_ratio >= 0.65 && va_ratio <= 1.0);
    }

    #[test]
    fn test_frvp_stream() {
        let mut stream = FrvpStream::new(10).unwrap();
        let candles = vec![
            make_candle(105.0, 100.0, 102.0, 1000.0),
            make_candle(110.0, 105.0, 108.0, 2000.0),
        ];

        assert!(!stream.is_ready());

        let init_result = stream.init(&candles).unwrap();
        assert_eq!(init_result.len(), 1);
        assert!(stream.is_ready());

        let new_candle = make_candle(112.0, 108.0, 110.0, 1500.0);
        let result = stream.next(new_candle);
        assert!(result.is_some());

        let output = result.unwrap();
        assert!((output.total_volume - 4500.0).abs() < 0.01);
    }

    #[test]
    fn test_volume_distribution() {
        // Test that volume is correctly distributed across bins
        let frvp = Frvp::new(10).unwrap();

        // Single candle spanning from 100 to 110 with 1000 volume
        let candles = vec![make_candle(110.0, 100.0, 105.0, 1000.0)];

        let result = frvp.calculate(&candles).unwrap();

        // Each bin should have approximately 100 volume (1000 / 10 bins)
        for row in &result.histogram {
            assert!((row.volume - 100.0).abs() < 1.0);
        }
    }
}
