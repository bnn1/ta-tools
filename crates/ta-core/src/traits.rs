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

/// Drive a streaming indicator over a finite input sequence.
///
/// This is the canonical batch driver for indicators that have an incremental
/// state machine. The caller supplies an input factory so columnar inputs do
/// not need to be materialized as temporary bar vectors.
pub fn collect_stream<I, Input, Output, MakeInput, MakeUnavailable>(
    stream: &mut I,
    len: usize,
    make_input: MakeInput,
    mut make_unavailable: MakeUnavailable,
) -> IndicatorResult<Vec<Output>>
where
    I: StreamingIndicator<Input, Output>,
    MakeInput: FnMut(usize) -> Input,
    MakeUnavailable: FnMut() -> Output,
{
    let mut result = Vec::with_capacity(len);
    stream_into(stream, len, make_input, |_, output| {
        result.push(match output {
            Some(output) => output,
            None => make_unavailable(),
        });
    })?;

    Ok(result)
}

/// Drive a streaming indicator over a finite input sequence without creating
/// an intermediate output vector.
pub fn stream_into<I, Input, Output, MakeInput, Write>(
    stream: &mut I,
    len: usize,
    mut make_input: MakeInput,
    mut write: Write,
) -> IndicatorResult<()>
where
    I: StreamingIndicator<Input, Output>,
    MakeInput: FnMut(usize) -> Input,
    Write: FnMut(usize, Option<Output>),
{
    stream.reset();

    for index in 0..len {
        write(index, stream.next(make_input(index)));
    }

    Ok(())
}
