//! Native bindings for pivot-point indicators.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{PivotPoints, PivotPointsOutput as CorePivotOutput, PivotPointsVariant};
use ta_core::traits::Indicator;

use crate::error::{
    map_indicator_error, validate_finite, validate_output, validate_output_disjoint,
    validate_same_length,
};

#[napi(object)]
pub struct PivotOutput {
    pub pivot: f64,
    pub r1: f64,
    pub r2: f64,
    pub r3: f64,
    pub s1: f64,
    pub s2: f64,
    pub s3: f64,
}

#[napi(object)]
pub struct PivotBatchOutput {
    pub pivot: Float64Array,
    pub r1: Float64Array,
    pub r2: Float64Array,
    pub r3: Float64Array,
    pub s1: Float64Array,
    pub s2: Float64Array,
    pub s3: Float64Array,
}

fn pivot_output(output: CorePivotOutput) -> PivotOutput {
    PivotOutput {
        pivot: output.pivot,
        r1: output.r1,
        r2: output.r2,
        r3: output.r3,
        s1: output.s1,
        s2: output.s2,
        s3: output.s3,
    }
}

fn parse_variant(value: &str) -> Result<PivotPointsVariant> {
    match value.to_ascii_lowercase().as_str() {
        "standard" | "classic" => Ok(PivotPointsVariant::Standard),
        "fibonacci" | "fib" => Ok(PivotPointsVariant::Fibonacci),
        "woodie" | "woodies" => Ok(PivotPointsVariant::Woodie),
        value => Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("variant must be standard, fibonacci, or woodie; got \"{value}\""),
        )),
    }
}

#[napi(js_name = "pivotPoints")]
pub fn pivot_points(high: f64, low: f64, close: f64, variant: String) -> Result<PivotOutput> {
    validate_finite(&[high, low, close])?;
    let indicator = PivotPoints::new(parse_variant(&variant)?);
    Ok(pivot_output(indicator.calculate_single(high, low, close)))
}

#[napi(js_name = "pivotPointsBatch")]
pub fn pivot_points_batch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    variant: String,
) -> Result<PivotBatchOutput> {
    validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;

    let indicator = PivotPoints::new(parse_variant(&variant)?);
    let results = indicator
        .calculate((highs, lows, closes))
        .map_err(map_indicator_error)?;

    let mut pivot = Vec::with_capacity(results.len());
    let mut r1 = Vec::with_capacity(results.len());
    let mut r2 = Vec::with_capacity(results.len());
    let mut r3 = Vec::with_capacity(results.len());
    let mut s1 = Vec::with_capacity(results.len());
    let mut s2 = Vec::with_capacity(results.len());
    let mut s3 = Vec::with_capacity(results.len());
    for result in results {
        pivot.push(result.pivot);
        r1.push(result.r1);
        r2.push(result.r2);
        r3.push(result.r3);
        s1.push(result.s1);
        s2.push(result.s2);
        s3.push(result.s3);
    }

    Ok(PivotBatchOutput {
        pivot: pivot.into(),
        r1: r1.into(),
        r2: r2.into(),
        r3: r3.into(),
        s1: s1.into(),
        s2: s2.into(),
        s3: s3.into(),
    })
}

#[napi(js_name = "pivotPointsBatchInto")]
pub fn pivot_points_batch_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    variant: String,
    mut pivot: Float64Array,
    mut r1: Float64Array,
    mut r2: Float64Array,
    mut r3: Float64Array,
    mut s1: Float64Array,
    mut s2: Float64Array,
    mut s3: Float64Array,
) -> Result<()> {
    let pivot = unsafe { pivot.as_mut() };
    let r1 = unsafe { r1.as_mut() };
    let r2 = unsafe { r2.as_mut() };
    let r3 = unsafe { r3.as_mut() };
    let s1 = unsafe { s1.as_mut() };
    let s2 = unsafe { s2.as_mut() };
    let s3 = unsafe { s3.as_mut() };
    let len = validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;
    for (name, output) in [
        ("pivot", &*pivot),
        ("r1", &*r1),
        ("r2", &*r2),
        ("r3", &*r3),
        ("s1", &*s1),
        ("s2", &*s2),
        ("s3", &*s3),
    ] {
        validate_output(output, len, name)?;
    }
    validate_output_disjoint(
        &[
            ("pivot", &*pivot),
            ("r1", &*r1),
            ("r2", &*r2),
            ("r3", &*r3),
            ("s1", &*s1),
            ("s2", &*s2),
            ("s3", &*s3),
        ],
        &[("highs", highs), ("lows", lows), ("closes", closes)],
    )?;

    let indicator = PivotPoints::new(parse_variant(&variant)?);
    for index in 0..len {
        let value = indicator.calculate_single(highs[index], lows[index], closes[index]);
        pivot[index] = value.pivot;
        r1[index] = value.r1;
        r2[index] = value.r2;
        r3[index] = value.r3;
        s1[index] = value.s1;
        s2[index] = value.s2;
        s3[index] = value.s3;
    }
    Ok(())
}
