use napi::{Error, Result, Status};
use ta_core::types::IndicatorError;

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

pub(crate) fn validate_timestamps(data: &[f64]) -> Result<Vec<i64>> {
    data.iter()
        .copied()
        .enumerate()
        .map(|(index, value)| validate_timestamp(value, index))
        .collect()
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
