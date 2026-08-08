//! Native bindings for fixed-range volume-profile indicators.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{
    Frvp as CoreFrvp, FrvpOutput as CoreFrvpOutput, FrvpStream as CoreFrvpStream,
};
use ta_core::traits::StreamingIndicator;
use ta_core::types::FrvpBar;

use crate::error::{map_indicator_error, validate_finite, validate_same_length};

fn validate_frvp_columns(highs: &[f64], lows: &[f64], volumes: &[f64]) -> Result<()> {
    validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("volumes", volumes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(volumes)?;
    if let Some(index) = highs.iter().zip(lows).position(|(&high, &low)| high < low) {
        return Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("highs[{index}] must be greater than or equal to lows[{index}]"),
        ));
    }
    Ok(())
}

fn make_bars(highs: &[f64], lows: &[f64], volumes: &[f64]) -> Result<Vec<FrvpBar>> {
    validate_frvp_columns(highs, lows, volumes)?;
    Ok(highs
        .iter()
        .zip(lows)
        .zip(volumes)
        .map(|((&high, &low), &volume)| FrvpBar::new(high, low, volume))
        .collect())
}

#[napi(object)]
pub struct FrvpHistogram {
    pub prices: Float64Array,
    pub volumes: Float64Array,
    pub lows: Float64Array,
    pub highs: Float64Array,
}

#[napi(object)]
pub struct FrvpOutput {
    pub poc: f64,
    pub vah: f64,
    pub val: f64,
    pub total_volume: f64,
    pub poc_volume: f64,
    pub value_area_volume: f64,
    pub range_high: f64,
    pub range_low: f64,
    pub histogram: FrvpHistogram,
}

fn frvp_output(output: CoreFrvpOutput) -> FrvpOutput {
    let mut prices = Vec::with_capacity(output.histogram.len());
    let mut volumes = Vec::with_capacity(output.histogram.len());
    let mut lows = Vec::with_capacity(output.histogram.len());
    let mut highs = Vec::with_capacity(output.histogram.len());
    for row in output.histogram {
        prices.push(row.price);
        volumes.push(row.volume);
        lows.push(row.low);
        highs.push(row.high);
    }

    FrvpOutput {
        poc: output.poc,
        vah: output.vah,
        val: output.val,
        total_volume: output.total_volume,
        poc_volume: output.poc_volume,
        value_area_volume: output.value_area_volume,
        range_high: output.range_high,
        range_low: output.range_low,
        histogram: FrvpHistogram {
            prices: prices.into(),
            volumes: volumes.into(),
            lows: lows.into(),
            highs: highs.into(),
        },
    }
}

#[napi]
pub fn frvp(
    highs: &[f64],
    lows: &[f64],
    volumes: &[f64],
    num_bins: Option<u32>,
    value_area_percent: Option<f64>,
) -> Result<FrvpOutput> {
    let bars = make_bars(highs, lows, volumes)?;
    let indicator = match value_area_percent {
        Some(value_area_percent) => {
            CoreFrvp::with_value_area(num_bins.unwrap_or(100) as usize, value_area_percent)
        }
        None => CoreFrvp::new(num_bins.unwrap_or(100) as usize),
    }
    .map_err(map_indicator_error)?;
    Ok(frvp_output(
        indicator
            .calculate_bars(&bars)
            .map_err(map_indicator_error)?,
    ))
}

#[napi(js_name = "FrvpStream")]
pub struct NativeFrvpStream {
    inner: CoreFrvpStream,
}

#[napi]
impl NativeFrvpStream {
    #[napi(constructor)]
    pub fn new(num_bins: u32, value_area_percent: Option<f64>) -> Result<Self> {
        let inner = match value_area_percent {
            Some(value_area_percent) => {
                CoreFrvpStream::with_value_area(num_bins as usize, value_area_percent)
            }
            None => CoreFrvpStream::new(num_bins as usize),
        }
        .map_err(map_indicator_error)?;
        Ok(Self { inner })
    }

    #[napi]
    pub fn init(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        volumes: &[f64],
    ) -> Result<Option<FrvpOutput>> {
        let bars = make_bars(highs, lows, volumes)?;
        Ok(self
            .inner
            .init_bars(&bars)
            .map_err(map_indicator_error)?
            .into_iter()
            .next()
            .map(frvp_output))
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, volume: f64) -> Result<Option<FrvpOutput>> {
        validate_frvp_columns(&[high], &[low], &[volume])?;
        Ok(self
            .inner
            .next_bar(FrvpBar::new(high, low, volume))
            .map(frvp_output))
    }

    #[napi]
    pub fn clear(&mut self) {
        self.inner.clear();
    }

    #[napi]
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    #[napi(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    #[napi(getter)]
    pub fn num_bins(&self) -> u32 {
        self.inner.num_bins() as u32
    }

    #[napi(getter, js_name = "candleCount")]
    pub fn candle_count(&self) -> u32 {
        self.inner.candle_count() as u32
    }
}
