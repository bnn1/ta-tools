use napi::bindgen_prelude::Float64Array;
use napi::{Error, Result, Status};
use ta_core::types::IndicatorError;

fn ranges_overlap(left: &[f64], right: &[f64]) -> bool {
    if left.is_empty() || right.is_empty() {
        return false;
    }

    let left_start = left.as_ptr() as usize;
    let right_start = right.as_ptr() as usize;
    let left_end = left_start.saturating_add(std::mem::size_of_val(left));
    let right_end = right_start.saturating_add(std::mem::size_of_val(right));

    left_start < right_end && right_start < left_end
}

pub(crate) fn validate_finite(data: &[f64]) -> Result<()> {
    if let Some(index) = data.iter().position(|value| !value.is_finite()) {
        return Err(Error::new(
            Status::InvalidArg,
            format!("data[{index}] must be finite"),
        ));
    }

    Ok(())
}

pub(crate) fn validate_no_infinite(data: &[f64], name: &str) -> Result<()> {
    if let Some(index) = data.iter().position(|value| value.is_infinite()) {
        return Err(Error::new(
            Status::InvalidArg,
            format!("{name}[{index}] must not be infinite"),
        ));
    }

    Ok(())
}

pub(crate) fn validate_same_length(named: &[(&str, usize)]) -> Result<usize> {
    let Some((_, expected)) = named.first() else {
        return Ok(0);
    };

    if let Some((name, actual)) = named.iter().find(|(_, length)| length != expected) {
        return Err(Error::new(
            Status::InvalidArg,
            format!("{name} has length {actual}, expected {expected}"),
        ));
    }

    Ok(*expected)
}

pub(crate) fn validate_output(output: &[f64], expected: usize, name: &str) -> Result<()> {
    if output.len() != expected {
        return Err(Error::new(
            Status::InvalidArg,
            format!("{name} has length {}, expected {expected}", output.len()),
        ));
    }

    Ok(())
}

pub(crate) fn copy_history_into(history: &[f64], mut output: Float64Array) -> Result<()> {
    let output = unsafe { output.as_mut() };
    validate_output(output, history.len(), "output")?;
    output.copy_from_slice(history);
    Ok(())
}

pub(crate) fn validate_output_disjoint(
    outputs: &[(&str, &[f64])],
    inputs: &[(&str, &[f64])],
) -> Result<()> {
    for (index, (left_name, left)) in outputs.iter().enumerate() {
        for (right_name, right) in outputs.iter().skip(index + 1) {
            if ranges_overlap(left, right) {
                return Err(Error::new(
                    Status::InvalidArg,
                    format!("output buffers {left_name} and {right_name} must not overlap"),
                ));
            }
        }

        for (input_name, input) in inputs {
            if ranges_overlap(left, input) {
                return Err(Error::new(
                    Status::InvalidArg,
                    format!("output buffer {left_name} overlaps input {input_name}"),
                ));
            }
        }
    }

    Ok(())
}

pub(crate) fn validate_timestamp(value: f64, index: usize) -> Result<i64> {
    const MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_991.0;

    if !value.is_finite() || value.fract() != 0.0 || value.abs() > MAX_SAFE_INTEGER {
        return Err(Error::new(
            Status::InvalidArg,
            format!(
                "timestamps[{index}] must be a finite integer within JavaScript's safe integer range"
            ),
        ));
    }

    Ok(value as i64)
}

pub(crate) fn map_indicator_error(error: IndicatorError) -> Error {
    let status = match &error {
        IndicatorError::NotInitialized => Status::GenericFailure,
        IndicatorError::InsufficientData { .. } | IndicatorError::InvalidParameter(_) => {
            Status::InvalidArg
        }
    };

    Error::new(status, error.to_string())
}
