//! Core traits defining the indicator calculation interfaces.
//!
//! All indicators implement two modes:
//! - **Batch mode** via [`Indicator`]: For historical data calculation
//! - **Streaming mode** via [`StreamingIndicator`]: For O(1) real-time updates

use crate::types::IndicatorResult;

/// Trait for batch/historical indicator calculations.
///
/// Implementors calculate indicator values over an entire array of data.
/// This is optimized for throughput when processing historical data.
///
/// # Type Parameters
/// - `Input`: The input data type (e.g., `&[f64]` for price series)
/// - `Output`: The output data type (e.g., `Vec<f64>` for indicator values)
pub trait Indicator<Input, Output> {
    /// Calculate indicator values for the entire input dataset.
    ///
    /// Returns a vector of indicator values aligned with the input data.
    /// Early values may be `NaN` if insufficient data exists for calculation.
    fn calculate(&self, data: Input) -> IndicatorResult<Output>;
}

/// Trait for streaming/real-time indicator calculations.
///
/// Implementors maintain internal state to enable O(1) incremental updates.
/// This is crucial for live market data where recalculating the entire
/// history on each tick would be prohibitively expensive.
///
/// # Type Parameters
/// - `Input`: The input value type for each tick (e.g., `f64` for price)
/// - `Output`: The output value type (e.g., `f64` for indicator value)
pub trait StreamingIndicator<Input, Output> {
    /// Initialize the indicator with historical data.
    ///
    /// This method processes historical data to establish the internal state
    /// needed for subsequent O(1) incremental updates via [`next`](Self::next).
    ///
    /// # Returns
    /// The indicator values for the historical data, or an error if
    /// insufficient data was provided.
    fn init(&mut self, data: &[Input]) -> IndicatorResult<Vec<Output>>;

    /// Process a new value and return the updated indicator value.
    ///
    /// This must run in O(1) time complexity.
    ///
    /// # Returns
    /// - `Some(value)` if the indicator can produce a value
    /// - `None` if insufficient data has been accumulated
    fn next(&mut self, value: Input) -> Option<Output>;

    /// Reset the indicator to its initial state.
    fn reset(&mut self);

    /// Returns `true` if the indicator has been initialized with enough data.
    fn is_ready(&self) -> bool;
}
