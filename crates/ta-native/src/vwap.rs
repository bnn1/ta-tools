//! Native bindings for VWAP indicators.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{
    AnchoredVwap as CoreAnchoredVwap, AnchoredVwapStream as CoreAnchoredVwapStream,
    RollingVwap as CoreRollingVwap, RollingVwapStream as CoreRollingVwapStream,
    SessionVwap as CoreSessionVwap, SessionVwapStream as CoreSessionVwapStream,
};
use ta_core::traits::StreamingIndicator;
use ta_core::types::VwapBar;

use crate::error::{
    map_indicator_error, validate_finite, validate_same_length, validate_timestamp,
    validate_timestamps,
};

fn make_bars(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Vec<VwapBar>> {
    validate_same_length(&[
        ("timestamps", timestamps.len()),
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
        ("volumes", volumes.len()),
    ])?;
    let timestamps = validate_timestamps(timestamps)?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;
    validate_finite(volumes)?;

    Ok(timestamps
        .into_iter()
        .zip(highs)
        .zip(lows)
        .zip(closes)
        .zip(volumes)
        .map(|((((timestamp, &high), &low), &close), &volume)| {
            VwapBar::new(timestamp, high, low, close, volume)
        })
        .collect())
}

#[napi(js_name = "sessionVwap")]
pub fn session_vwap(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Float64Array> {
    let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
    Ok(CoreSessionVwap::new()
        .calculate_bars(&bars)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "rollingVwap")]
pub fn rolling_vwap(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    period: u32,
) -> Result<Float64Array> {
    let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
    let indicator = CoreRollingVwap::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate_bars(&bars)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "anchoredVwap")]
pub fn anchored_vwap(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_index: u32,
) -> Result<Float64Array> {
    let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
    Ok(CoreAnchoredVwap::new(anchor_index as usize)
        .calculate_bars(&bars)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "anchoredVwapFromTimestamp")]
pub fn anchored_vwap_from_timestamp(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_timestamp: f64,
) -> Result<Float64Array> {
    let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
    let anchor_timestamp = validate_timestamp(anchor_timestamp, 0)?;
    let indicator =
        CoreAnchoredVwap::from_timestamp_bars(&bars, anchor_timestamp).ok_or_else(|| {
            napi::Error::new(
                napi::Status::InvalidArg,
                "no bar found at or after anchor timestamp",
            )
        })?;
    Ok(indicator
        .calculate_bars(&bars)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "SessionVwapStream")]
pub struct NativeSessionVwapStream {
    inner: CoreSessionVwapStream,
}

#[napi]
impl NativeSessionVwapStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreSessionVwapStream::new(),
        }
    }

    #[napi]
    pub fn init(
        &mut self,
        timestamps: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Float64Array> {
        let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
        Ok(self
            .inner
            .init_bars(&bars)
            .map_err(map_indicator_error)?
            .into())
    }

    #[napi]
    pub fn next(
        &mut self,
        timestamp: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Result<Option<f64>> {
        let timestamp = validate_timestamp(timestamp, 0)?;
        validate_finite(&[high, low, close, volume])?;
        Ok(self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume)))
    }

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    #[napi]
    pub fn cumulative_tp_volume(&self) -> f64 {
        self.inner.cumulative_tp_volume()
    }

    #[napi]
    pub fn cumulative_volume(&self) -> f64 {
        self.inner.cumulative_volume()
    }

    #[napi]
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    #[napi(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }
}

#[napi(js_name = "RollingVwapStream")]
pub struct NativeRollingVwapStream {
    inner: CoreRollingVwapStream,
}

#[napi]
impl NativeRollingVwapStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreRollingVwapStream::new(period as usize).map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(
        &mut self,
        timestamps: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Float64Array> {
        let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
        Ok(self
            .inner
            .init_bars(&bars)
            .map_err(map_indicator_error)?
            .into())
    }

    #[napi]
    pub fn next(
        &mut self,
        timestamp: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Result<Option<f64>> {
        let timestamp = validate_timestamp(timestamp, 0)?;
        validate_finite(&[high, low, close, volume])?;
        Ok(self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume)))
    }

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
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
    pub fn period(&self) -> u32 {
        self.inner.period() as u32
    }
}

#[napi(js_name = "AnchoredVwapStream")]
pub struct NativeAnchoredVwapStream {
    inner: CoreAnchoredVwapStream,
}

#[napi]
impl NativeAnchoredVwapStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreAnchoredVwapStream::new(),
        }
    }

    #[napi(factory)]
    pub fn with_anchor(anchor_timestamp: f64) -> Result<Self> {
        Ok(Self {
            inner: CoreAnchoredVwapStream::with_anchor(validate_timestamp(anchor_timestamp, 0)?),
        })
    }

    #[napi(js_name = "setAnchor")]
    pub fn set_anchor(&mut self, timestamp: f64) -> Result<()> {
        self.inner.set_anchor(validate_timestamp(timestamp, 0)?);
        Ok(())
    }

    #[napi(js_name = "anchorNow")]
    pub fn anchor_now(&mut self) {
        self.inner.anchor_now();
    }

    #[napi]
    pub fn init(
        &mut self,
        timestamps: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Float64Array> {
        let bars = make_bars(timestamps, highs, lows, closes, volumes)?;
        Ok(self
            .inner
            .init_bars(&bars)
            .map_err(map_indicator_error)?
            .into())
    }

    #[napi]
    pub fn next(
        &mut self,
        timestamp: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Result<Option<f64>> {
        let timestamp = validate_timestamp(timestamp, 0)?;
        validate_finite(&[high, low, close, volume])?;
        Ok(self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume)))
    }

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    #[napi]
    pub fn anchor_timestamp(&self) -> Option<f64> {
        self.inner
            .anchor_timestamp()
            .map(|timestamp| timestamp as f64)
    }

    #[napi]
    pub fn cumulative_tp_volume(&self) -> f64 {
        self.inner.cumulative_tp_volume()
    }

    #[napi]
    pub fn cumulative_volume(&self) -> f64 {
        self.inner.cumulative_volume()
    }

    #[napi]
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    #[napi(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }
}
