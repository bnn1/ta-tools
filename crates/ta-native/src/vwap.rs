//! Native bindings for VWAP indicators.

use napi::bindgen_prelude::{Float64Array, Result};
use napi::{Error, Status};
use napi_derive::napi;
use ta_core::indicators::{
    AnchoredVwap as CoreAnchoredVwap, AnchoredVwapStream as CoreAnchoredVwapStream,
    RollingVwap as CoreRollingVwap, RollingVwapStream as CoreRollingVwapStream,
    SessionVwap as CoreSessionVwap, SessionVwapStream as CoreSessionVwapStream,
};
use ta_core::traits::StreamingIndicator;
use ta_core::types::VwapBar;

use crate::error::{
    copy_history_into, map_indicator_error, validate_finite, validate_output,
    validate_output_disjoint, validate_same_length, validate_timestamp,
};

fn validate_vwap_value(value: f64, name: &str, index: usize) -> Result<()> {
    if !value.is_finite() {
        return Err(Error::new(
            Status::InvalidArg,
            format!("{name}[{index}] must be finite"),
        ));
    }
    Ok(())
}

fn validate_vwap_columns(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<usize> {
    let len = validate_same_length(&[
        ("timestamps", timestamps.len()),
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
        ("volumes", volumes.len()),
    ])?;
    for index in 0..len {
        validate_timestamp(timestamps[index], index)?;
        validate_vwap_value(highs[index], "highs", index)?;
        validate_vwap_value(lows[index], "lows", index)?;
        validate_vwap_value(closes[index], "closes", index)?;
        validate_vwap_value(volumes[index], "volumes", index)?;
    }
    Ok(len)
}

fn validate_vwap_output(
    output: &[f64],
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<()> {
    validate_output(output, timestamps.len(), "output")?;
    validate_output_disjoint(
        &[("output", output)],
        &[
            ("timestamps", timestamps),
            ("highs", highs),
            ("lows", lows),
            ("closes", closes),
            ("volumes", volumes),
        ],
    )
}

fn make_bars(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Vec<VwapBar>> {
    validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;

    Ok(timestamps
        .into_iter()
        .zip(highs)
        .zip(lows)
        .zip(closes)
        .zip(volumes)
        .map(|((((&timestamp, &high), &low), &close), &volume)| {
            VwapBar::new(timestamp as i64, high, low, close, volume)
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
    history: Vec<f64>,
}

#[napi]
impl NativeSessionVwapStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreSessionVwapStream::new(),
            history: Vec::new(),
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
        let result = self.inner.init_bars(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        timestamps: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
        mut output: Float64Array,
    ) -> Result<()> {
        let output = unsafe { output.as_mut() };
        let len = validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
        validate_vwap_output(output, timestamps, highs, lows, closes, volumes)?;
        self.inner
            .init_with(
                len,
                |index| {
                    VwapBar::new(
                        timestamps[index] as i64,
                        highs[index],
                        lows[index],
                        closes[index],
                        volumes[index],
                    )
                },
                output,
            )
            .map_err(map_indicator_error)?;
        self.history.clear();
        self.history.extend_from_slice(output);
        Ok(())
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
        let result = self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume));
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        timestamp: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        mut output: Float64Array,
    ) -> Result<bool> {
        let output = unsafe { output.as_mut() };
        let timestamp = validate_timestamp(timestamp, 0)?;
        validate_finite(&[high, low, close, volume])?;
        validate_output(output, 1, "output")?;
        let result = self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume));
        output[0] = result.unwrap_or(f64::NAN);
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> Float64Array {
        self.history.clone().into()
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(&self, output: Float64Array) -> Result<()> {
        copy_history_into(&self.history, output)
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
        self.history.clear();
    }

    #[napi(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }
}

#[napi(js_name = "RollingVwapStream")]
pub struct NativeRollingVwapStream {
    inner: CoreRollingVwapStream,
    history: Vec<f64>,
}

#[napi]
impl NativeRollingVwapStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreRollingVwapStream::new(period as usize).map_err(map_indicator_error)?,
            history: Vec::new(),
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
        let result = self.inner.init_bars(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        timestamps: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
        mut output: Float64Array,
    ) -> Result<()> {
        let output = unsafe { output.as_mut() };
        let len = validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
        validate_vwap_output(output, timestamps, highs, lows, closes, volumes)?;
        self.inner
            .init_with(
                len,
                |index| {
                    VwapBar::new(
                        timestamps[index] as i64,
                        highs[index],
                        lows[index],
                        closes[index],
                        volumes[index],
                    )
                },
                output,
            )
            .map_err(map_indicator_error)?;
        self.history.clear();
        self.history.extend_from_slice(output);
        Ok(())
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
        let result = self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume));
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        timestamp: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        mut output: Float64Array,
    ) -> Result<bool> {
        let output = unsafe { output.as_mut() };
        let timestamp = validate_timestamp(timestamp, 0)?;
        validate_finite(&[high, low, close, volume])?;
        validate_output(output, 1, "output")?;
        let result = self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume));
        output[0] = result.unwrap_or(f64::NAN);
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> Float64Array {
        self.history.clone().into()
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(&self, output: Float64Array) -> Result<()> {
        copy_history_into(&self.history, output)
    }

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }

    #[napi]
    pub fn reset(&mut self) {
        self.inner.reset();
        self.history.clear();
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
    history: Vec<f64>,
}

#[napi]
impl NativeAnchoredVwapStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreAnchoredVwapStream::new(),
            history: Vec::new(),
        }
    }

    #[napi(factory)]
    pub fn with_anchor(anchor_timestamp: f64) -> Result<Self> {
        Ok(Self {
            inner: CoreAnchoredVwapStream::with_anchor(validate_timestamp(anchor_timestamp, 0)?),
            history: Vec::new(),
        })
    }

    #[napi(js_name = "setAnchor")]
    pub fn set_anchor(&mut self, timestamp: f64) -> Result<()> {
        self.inner.set_anchor(validate_timestamp(timestamp, 0)?);
        self.history.clear();
        Ok(())
    }

    #[napi(js_name = "anchorNow")]
    pub fn anchor_now(&mut self) {
        self.inner.anchor_now();
        self.history.clear();
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
        let result = self.inner.init_bars(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        timestamps: &[f64],
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
        mut output: Float64Array,
    ) -> Result<()> {
        let output = unsafe { output.as_mut() };
        let len = validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
        validate_vwap_output(output, timestamps, highs, lows, closes, volumes)?;
        self.inner
            .init_with(
                len,
                |index| {
                    VwapBar::new(
                        timestamps[index] as i64,
                        highs[index],
                        lows[index],
                        closes[index],
                        volumes[index],
                    )
                },
                output,
            )
            .map_err(map_indicator_error)?;
        self.history.clear();
        self.history.extend_from_slice(output);
        Ok(())
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
        let result = self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume));
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        timestamp: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        mut output: Float64Array,
    ) -> Result<bool> {
        let output = unsafe { output.as_mut() };
        let timestamp = validate_timestamp(timestamp, 0)?;
        validate_finite(&[high, low, close, volume])?;
        validate_output(output, 1, "output")?;
        let result = self
            .inner
            .next_bar(VwapBar::new(timestamp, high, low, close, volume));
        output[0] = result.unwrap_or(f64::NAN);
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> Float64Array {
        self.history.clone().into()
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(&self, output: Float64Array) -> Result<()> {
        copy_history_into(&self.history, output)
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
        self.history.clear();
    }

    #[napi(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }
}

#[napi(js_name = "sessionVwapInto")]
pub fn session_vwap_into(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    let len = validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
    validate_vwap_output(output, timestamps, highs, lows, closes, volumes)?;

    let mut stream = CoreSessionVwapStream::new();
    stream
        .init_with(
            len,
            |index| {
                VwapBar::new(
                    timestamps[index] as i64,
                    highs[index],
                    lows[index],
                    closes[index],
                    volumes[index],
                )
            },
            output,
        )
        .map_err(map_indicator_error)
}

#[napi(js_name = "rollingVwapInto")]
pub fn rolling_vwap_into(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    period: u32,
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    let len = validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
    validate_vwap_output(output, timestamps, highs, lows, closes, volumes)?;

    let mut stream = CoreRollingVwapStream::new(period as usize).map_err(map_indicator_error)?;
    stream
        .init_with(
            len,
            |index| {
                VwapBar::new(
                    timestamps[index] as i64,
                    highs[index],
                    lows[index],
                    closes[index],
                    volumes[index],
                )
            },
            output,
        )
        .map_err(map_indicator_error)
}

fn fill_anchored_vwap(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_index: usize,
    output: &mut [f64],
) -> Result<()> {
    let len = timestamps.len();
    validate_vwap_output(output, timestamps, highs, lows, closes, volumes)?;
    if anchor_index >= len {
        return Err(napi::Error::new(
            napi::Status::InvalidArg,
            "anchor index must be less than series length",
        ));
    }

    output[..anchor_index].fill(f64::NAN);
    let mut cumulative_tp_volume = 0.0;
    let mut cumulative_volume = 0.0;
    for index in anchor_index..len {
        let typical_price = (highs[index] + lows[index] + closes[index]) / 3.0;
        cumulative_tp_volume += typical_price * volumes[index];
        cumulative_volume += volumes[index];
        output[index] = if cumulative_volume > 0.0 {
            cumulative_tp_volume / cumulative_volume
        } else {
            f64::NAN
        };
    }
    Ok(())
}

#[napi(js_name = "anchoredVwapInto")]
pub fn anchored_vwap_into(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_index: u32,
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
    fill_anchored_vwap(
        timestamps,
        highs,
        lows,
        closes,
        volumes,
        anchor_index as usize,
        output,
    )
}

#[napi(js_name = "anchoredVwapFromTimestampInto")]
pub fn anchored_vwap_from_timestamp_into(
    timestamps: &[f64],
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    anchor_timestamp: f64,
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    let anchor_timestamp = validate_timestamp(anchor_timestamp, 0)?;
    let len = validate_vwap_columns(timestamps, highs, lows, closes, volumes)?;
    let anchor_index = timestamps
        .iter()
        .position(|&timestamp| timestamp >= anchor_timestamp as f64)
        .ok_or_else(|| {
            napi::Error::new(
                napi::Status::InvalidArg,
                "no bar found at or after anchor timestamp",
            )
        })?;
    debug_assert!(anchor_index < len);
    fill_anchored_vwap(
        timestamps,
        highs,
        lows,
        closes,
        volumes,
        anchor_index,
        output,
    )
}
