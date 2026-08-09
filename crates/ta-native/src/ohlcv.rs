//! Native bindings for HLC and OHLCV indicators.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{
    AdxOutput as CoreAdxOutput, AdxStream as CoreAdxStream, Atr as CoreAtr,
    AtrStream as CoreAtrStream, CvdOhlcv as CoreCvdOhlcv, CvdOhlcvStream as CoreCvdOhlcvStream,
    IchimokuOutput as CoreIchimokuOutput, IchimokuStream as CoreIchimokuStream, Mfi as CoreMfi,
    MfiStream as CoreMfiStream, Stoch as CoreStoch, StochOutput as CoreStochOutput,
    StochStream as CoreStochStream, StochType,
};
use ta_core::traits::{stream_into, Indicator, StreamingIndicator};

use crate::error::{
    copy_history_into, map_indicator_error, validate_finite, validate_output,
    validate_output_disjoint, validate_same_length,
};
use crate::multi::{AdxOutput, IchimokuOutput};

fn validate_hlc(highs: &[f64], lows: &[f64], closes: &[f64]) -> Result<()> {
    validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;
    Ok(())
}

fn validate_hlcv(highs: &[f64], lows: &[f64], closes: &[f64], volumes: &[f64]) -> Result<()> {
    validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
        ("volumes", volumes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;
    validate_finite(volumes)?;
    Ok(())
}

#[napi]
pub fn atr(highs: &[f64], lows: &[f64], closes: &[f64], period: u32) -> Result<Float64Array> {
    validate_hlc(highs, lows, closes)?;

    let indicator = CoreAtr::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate(&(highs, lows, closes))
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "AtrStream")]
pub struct NativeAtrStream {
    inner: CoreAtrStream,
    history: Vec<f64>,
}

#[napi]
impl NativeAtrStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreAtrStream::new(period as usize).map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(&mut self, highs: &[f64], lows: &[f64], closes: &[f64]) -> Result<Float64Array> {
        validate_hlc(highs, lows, closes)?;
        let bars: Vec<(f64, f64, f64)> = highs
            .iter()
            .zip(lows)
            .zip(closes)
            .map(|((&high, &low), &close)| (high, low, close))
            .collect();
        let result = self.inner.init(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        mut output: Float64Array,
    ) -> Result<()> {
        let output = unsafe { output.as_mut() };
        validate_hlc(highs, lows, closes)?;
        validate_output(output, highs.len(), "output")?;
        validate_output_disjoint(
            &[("output", output)],
            &[("highs", highs), ("lows", lows), ("closes", closes)],
        )?;
        self.history.clear();
        self.history.reserve(highs.len());
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            highs.len(),
            |index| (highs[index], lows[index], closes[index]),
            |index, value| {
                let value = value.unwrap_or(f64::NAN);
                output[index] = value;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<f64>> {
        validate_finite(&[high, low, close])?;
        let result = self.inner.next((high, low, close));
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        mut output: Float64Array,
    ) -> Result<bool> {
        let output = unsafe { output.as_mut() };
        validate_finite(&[high, low, close])?;
        validate_output(output, 1, "output")?;
        let result = self.inner.next((high, low, close));
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

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }
}

#[napi(object)]
pub struct StochOutput {
    pub k: Float64Array,
    pub d: Float64Array,
}

#[napi(object)]
pub struct StochPoint {
    pub k: f64,
    pub d: f64,
}

fn stoch_point(output: CoreStochOutput) -> StochPoint {
    StochPoint {
        k: output.k,
        d: output.d,
    }
}

fn parse_stoch_type(value: &str) -> Result<StochType> {
    match value.to_ascii_lowercase().as_str() {
        "fast" => Ok(StochType::Fast),
        "slow" => Ok(StochType::Slow),
        value => Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("stochType must be \"fast\" or \"slow\", got \"{value}\""),
        )),
    }
}

fn calculate_stoch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: u32,
    d_period: u32,
    slowing: u32,
    stoch_type: StochType,
) -> Result<StochOutput> {
    validate_hlc(highs, lows, closes)?;
    let indicator = CoreStoch::new_with_slowing(
        k_period as usize,
        d_period as usize,
        slowing as usize,
        stoch_type,
    )
    .map_err(map_indicator_error)?;
    let results = indicator
        .calculate(&(highs, lows, closes))
        .map_err(map_indicator_error)?;

    let mut k = Vec::with_capacity(results.len());
    let mut d = Vec::with_capacity(results.len());
    for result in results {
        k.push(result.k);
        d.push(result.d);
    }
    Ok(StochOutput {
        k: k.into(),
        d: d.into(),
    })
}

#[napi]
pub fn stoch(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: u32,
    d_period: u32,
    slowing: u32,
    stoch_type: String,
) -> Result<StochOutput> {
    calculate_stoch(
        highs,
        lows,
        closes,
        k_period,
        d_period,
        slowing,
        parse_stoch_type(&stoch_type)?,
    )
}

#[napi(js_name = "stochFast")]
pub fn stoch_fast(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: u32,
    d_period: u32,
) -> Result<StochOutput> {
    calculate_stoch(highs, lows, closes, k_period, d_period, 3, StochType::Fast)
}

#[napi(js_name = "stochSlow")]
pub fn stoch_slow(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: u32,
    d_period: u32,
    slowing: u32,
) -> Result<StochOutput> {
    calculate_stoch(
        highs,
        lows,
        closes,
        k_period,
        d_period,
        slowing,
        StochType::Slow,
    )
}

#[napi(js_name = "StochStream")]
pub struct NativeStochStream {
    inner: CoreStochStream,
    history: Vec<CoreStochOutput>,
}

#[napi]
impl NativeStochStream {
    #[napi(constructor)]
    pub fn new(k_period: u32, d_period: u32, slowing: u32, stoch_type: String) -> Result<Self> {
        Ok(Self {
            inner: CoreStochStream::new_with_slowing(
                k_period as usize,
                d_period as usize,
                slowing as usize,
                parse_stoch_type(&stoch_type)?,
            )
            .map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(&mut self, highs: &[f64], lows: &[f64], closes: &[f64]) -> Result<Vec<StochPoint>> {
        validate_hlc(highs, lows, closes)?;
        let bars: Vec<(f64, f64, f64)> = highs
            .iter()
            .zip(lows)
            .zip(closes)
            .map(|((&high, &low), &close)| (high, low, close))
            .collect();
        let result = self.inner.init(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(stoch_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        mut k: Float64Array,
        mut d: Float64Array,
    ) -> Result<()> {
        let k = unsafe { k.as_mut() };
        let d = unsafe { d.as_mut() };
        validate_hlc(highs, lows, closes)?;
        let len = highs.len();
        validate_output(k, len, "k")?;
        validate_output(d, len, "d")?;
        validate_output_disjoint(
            &[("k", &*k), ("d", &*d)],
            &[("highs", highs), ("lows", lows), ("closes", closes)],
        )?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| (highs[index], lows[index], closes[index]),
            |index, value| {
                let value = value.unwrap_or_else(CoreStochOutput::nan);
                k[index] = value.k;
                d[index] = value.d;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<StochPoint>> {
        validate_finite(&[high, low, close])?;
        let result = self.inner.next((high, low, close));
        self.history
            .push(result.unwrap_or_else(CoreStochOutput::nan));
        Ok(result.map(stoch_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        mut k: Float64Array,
        mut d: Float64Array,
    ) -> Result<bool> {
        let k = unsafe { k.as_mut() };
        let d = unsafe { d.as_mut() };
        validate_finite(&[high, low, close])?;
        validate_output(k, 1, "k")?;
        validate_output(d, 1, "d")?;
        validate_output_disjoint(&[("k", &*k), ("d", &*d)], &[])?;
        let result = self.inner.next((high, low, close));
        let value = result.unwrap_or_else(CoreStochOutput::nan);
        k[0] = value.k;
        d[0] = value.d;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> StochOutput {
        let mut k = Vec::with_capacity(self.history.len());
        let mut d = Vec::with_capacity(self.history.len());
        for value in &self.history {
            k.push(value.k);
            d.push(value.d);
        }
        StochOutput {
            k: k.into(),
            d: d.into(),
        }
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(&self, mut k: Float64Array, mut d: Float64Array) -> Result<()> {
        let k = unsafe { k.as_mut() };
        let d = unsafe { d.as_mut() };
        validate_output(k, self.history.len(), "k")?;
        validate_output(d, self.history.len(), "d")?;
        validate_output_disjoint(&[("k", &*k), ("d", &*d)], &[])?;
        for (index, value) in self.history.iter().enumerate() {
            k[index] = value.k;
            d[index] = value.d;
        }
        Ok(())
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
    pub fn k_period(&self) -> u32 {
        self.inner.k_period() as u32
    }

    #[napi(getter)]
    pub fn d_period(&self) -> u32 {
        self.inner.d_period() as u32
    }

    #[napi(getter)]
    pub fn slowing(&self) -> u32 {
        self.inner.slowing() as u32
    }
}

#[napi(js_name = "StochFastStream")]
pub struct NativeStochFastStream {
    inner: NativeStochStream,
}

#[napi]
impl NativeStochFastStream {
    #[napi(constructor)]
    pub fn new(k_period: u32, d_period: u32) -> Result<Self> {
        Ok(Self {
            inner: NativeStochStream::new(k_period, d_period, 3, "fast".to_string())?,
        })
    }

    #[napi]
    pub fn init(&mut self, highs: &[f64], lows: &[f64], closes: &[f64]) -> Result<Vec<StochPoint>> {
        self.inner.init(highs, lows, closes)
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        k: Float64Array,
        d: Float64Array,
    ) -> Result<()> {
        self.inner.init_into(highs, lows, closes, k, d)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<StochPoint>> {
        self.inner.next(high, low, close)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        k: Float64Array,
        d: Float64Array,
    ) -> Result<bool> {
        self.inner.next_into(high, low, close, k, d)
    }

    #[napi]
    pub fn history(&self) -> StochOutput {
        self.inner.history()
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.inner.history_length()
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(&self, k: Float64Array, d: Float64Array) -> Result<()> {
        self.inner.history_into(k, d)
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

#[napi(js_name = "StochSlowStream")]
pub struct NativeStochSlowStream {
    inner: NativeStochStream,
}

#[napi]
impl NativeStochSlowStream {
    #[napi(constructor)]
    pub fn new(k_period: u32, d_period: u32, slowing: u32) -> Result<Self> {
        Ok(Self {
            inner: NativeStochStream::new(k_period, d_period, slowing, "slow".to_string())?,
        })
    }

    #[napi]
    pub fn init(&mut self, highs: &[f64], lows: &[f64], closes: &[f64]) -> Result<Vec<StochPoint>> {
        self.inner.init(highs, lows, closes)
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        k: Float64Array,
        d: Float64Array,
    ) -> Result<()> {
        self.inner.init_into(highs, lows, closes, k, d)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<StochPoint>> {
        self.inner.next(high, low, close)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        k: Float64Array,
        d: Float64Array,
    ) -> Result<bool> {
        self.inner.next_into(high, low, close, k, d)
    }

    #[napi]
    pub fn history(&self) -> StochOutput {
        self.inner.history()
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.inner.history_length()
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(&self, k: Float64Array, d: Float64Array) -> Result<()> {
        self.inner.history_into(k, d)
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

#[napi]
pub fn mfi(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    period: u32,
) -> Result<Float64Array> {
    validate_hlcv(highs, lows, closes, volumes)?;
    let indicator = CoreMfi::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate(&(highs, lows, closes, volumes))
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "MfiStream")]
pub struct NativeMfiStream {
    inner: CoreMfiStream,
    history: Vec<f64>,
}

#[napi]
impl NativeMfiStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreMfiStream::new(period as usize).map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Float64Array> {
        validate_hlcv(highs, lows, closes, volumes)?;
        let bars: Vec<(f64, f64, f64, f64)> = highs
            .iter()
            .zip(lows)
            .zip(closes)
            .zip(volumes)
            .map(|(((&high, &low), &close), &volume)| (high, low, close, volume))
            .collect();
        let result = self.inner.init(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
        mut output: Float64Array,
    ) -> Result<()> {
        let output = unsafe { output.as_mut() };
        validate_hlcv(highs, lows, closes, volumes)?;
        validate_output(output, highs.len(), "output")?;
        validate_output_disjoint(
            &[("output", output)],
            &[
                ("highs", highs),
                ("lows", lows),
                ("closes", closes),
                ("volumes", volumes),
            ],
        )?;
        self.history.clear();
        self.history.reserve(highs.len());
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            highs.len(),
            |index| (highs[index], lows[index], closes[index], volumes[index]),
            |index, value| {
                let value = value.unwrap_or(f64::NAN);
                output[index] = value;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64, volume: f64) -> Result<Option<f64>> {
        validate_finite(&[high, low, close, volume])?;
        let result = self.inner.next((high, low, close, volume));
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        mut output: Float64Array,
    ) -> Result<bool> {
        let output = unsafe { output.as_mut() };
        validate_finite(&[high, low, close, volume])?;
        validate_output(output, 1, "output")?;
        let result = self.inner.next((high, low, close, volume));
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

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }
}

#[napi]
pub fn cvd_ohlcv(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
) -> Result<Float64Array> {
    validate_hlcv(highs, lows, closes, volumes)?;
    let bars: Vec<(f64, f64, f64, f64)> = highs
        .iter()
        .zip(lows)
        .zip(closes)
        .zip(volumes)
        .map(|(((&high, &low), &close), &volume)| (high, low, close, volume))
        .collect();
    Ok(CoreCvdOhlcv::new()
        .calculate(&bars)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "CvdOhlcvStream")]
pub struct NativeCvdOhlcvStream {
    inner: CoreCvdOhlcvStream,
    history: Vec<f64>,
}

#[napi]
impl NativeCvdOhlcvStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreCvdOhlcvStream::new(),
            history: Vec::new(),
        }
    }

    #[napi]
    pub fn init(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
    ) -> Result<Float64Array> {
        validate_hlcv(highs, lows, closes, volumes)?;
        let bars: Vec<(f64, f64, f64, f64)> = highs
            .iter()
            .zip(lows)
            .zip(closes)
            .zip(volumes)
            .map(|(((&high, &low), &close), &volume)| (high, low, close, volume))
            .collect();
        let result = self.inner.init(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        volumes: &[f64],
        mut output: Float64Array,
    ) -> Result<()> {
        let output = unsafe { output.as_mut() };
        validate_hlcv(highs, lows, closes, volumes)?;
        validate_output(output, highs.len(), "output")?;
        validate_output_disjoint(
            &[("output", output)],
            &[
                ("highs", highs),
                ("lows", lows),
                ("closes", closes),
                ("volumes", volumes),
            ],
        )?;
        self.history.clear();
        self.history.reserve(highs.len());
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            highs.len(),
            |index| (highs[index], lows[index], closes[index], volumes[index]),
            |index, value| {
                let value = value.unwrap_or(f64::NAN);
                output[index] = value;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64, volume: f64) -> Result<Option<f64>> {
        validate_finite(&[high, low, close, volume])?;
        let result = self.inner.next((high, low, close, volume));
        self.history.push(result.unwrap_or(f64::NAN));
        Ok(result)
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        mut output: Float64Array,
    ) -> Result<bool> {
        let output = unsafe { output.as_mut() };
        validate_finite(&[high, low, close, volume])?;
        validate_output(output, 1, "output")?;
        let result = self.inner.next((high, low, close, volume));
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
    pub fn reset(&mut self) {
        self.inner.reset();
        self.history.clear();
    }

    #[napi(js_name = "isReady")]
    pub fn is_ready(&self) -> bool {
        self.inner.is_ready()
    }

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }
}

#[napi(js_name = "AdxStream")]
pub struct NativeAdxStream {
    inner: CoreAdxStream,
    history: Vec<CoreAdxOutput>,
}

#[napi(object)]
pub struct AdxStreamPoint {
    pub adx: f64,
    pub plus_di: f64,
    pub minus_di: f64,
}

fn adx_stream_point(output: CoreAdxOutput) -> AdxStreamPoint {
    AdxStreamPoint {
        adx: output.adx,
        plus_di: output.plus_di,
        minus_di: output.minus_di,
    }
}

#[napi]
impl NativeAdxStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreAdxStream::new(period as usize).map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<Vec<AdxStreamPoint>> {
        validate_hlc(highs, lows, closes)?;
        let bars: Vec<(f64, f64, f64)> = highs
            .iter()
            .zip(lows)
            .zip(closes)
            .map(|((&high, &low), &close)| (high, low, close))
            .collect();
        let result = self.inner.init(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(adx_stream_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        mut adx: Float64Array,
        mut plus_di: Float64Array,
        mut minus_di: Float64Array,
    ) -> Result<()> {
        let adx = unsafe { adx.as_mut() };
        let plus_di = unsafe { plus_di.as_mut() };
        let minus_di = unsafe { minus_di.as_mut() };
        validate_hlc(highs, lows, closes)?;
        let len = highs.len();
        for (name, output) in [
            ("adx", &*adx),
            ("plusDi", &*plus_di),
            ("minusDi", &*minus_di),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("adx", &*adx),
                ("plusDi", &*plus_di),
                ("minusDi", &*minus_di),
            ],
            &[("highs", highs), ("lows", lows), ("closes", closes)],
        )?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| (highs[index], lows[index], closes[index]),
            |index, value| {
                let value = value.unwrap_or_else(CoreAdxOutput::nan);
                adx[index] = value.adx;
                plus_di[index] = value.plus_di;
                minus_di[index] = value.minus_di;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<AdxStreamPoint>> {
        validate_finite(&[high, low, close])?;
        let result = self.inner.next((high, low, close));
        self.history.push(result.unwrap_or_else(CoreAdxOutput::nan));
        Ok(result.map(adx_stream_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        mut adx: Float64Array,
        mut plus_di: Float64Array,
        mut minus_di: Float64Array,
    ) -> Result<bool> {
        let adx = unsafe { adx.as_mut() };
        let plus_di = unsafe { plus_di.as_mut() };
        let minus_di = unsafe { minus_di.as_mut() };
        validate_finite(&[high, low, close])?;
        for (name, output) in [
            ("adx", &*adx),
            ("plusDi", &*plus_di),
            ("minusDi", &*minus_di),
        ] {
            validate_output(output, 1, name)?;
        }
        validate_output_disjoint(
            &[
                ("adx", &*adx),
                ("plusDi", &*plus_di),
                ("minusDi", &*minus_di),
            ],
            &[],
        )?;
        let result = self.inner.next((high, low, close));
        let value = result.unwrap_or_else(CoreAdxOutput::nan);
        adx[0] = value.adx;
        plus_di[0] = value.plus_di;
        minus_di[0] = value.minus_di;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> AdxOutput {
        let mut adx = Vec::with_capacity(self.history.len());
        let mut plus_di = Vec::with_capacity(self.history.len());
        let mut minus_di = Vec::with_capacity(self.history.len());
        for value in &self.history {
            adx.push(value.adx);
            plus_di.push(value.plus_di);
            minus_di.push(value.minus_di);
        }
        AdxOutput {
            adx: adx.into(),
            plus_di: plus_di.into(),
            minus_di: minus_di.into(),
        }
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(
        &self,
        mut adx: Float64Array,
        mut plus_di: Float64Array,
        mut minus_di: Float64Array,
    ) -> Result<()> {
        let adx = unsafe { adx.as_mut() };
        let plus_di = unsafe { plus_di.as_mut() };
        let minus_di = unsafe { minus_di.as_mut() };
        let len = self.history.len();
        validate_output(adx, len, "adx")?;
        validate_output(plus_di, len, "plusDi")?;
        validate_output(minus_di, len, "minusDi")?;
        validate_output_disjoint(
            &[
                ("adx", &*adx),
                ("plusDi", &*plus_di),
                ("minusDi", &*minus_di),
            ],
            &[],
        )?;
        for (index, value) in self.history.iter().enumerate() {
            adx[index] = value.adx;
            plus_di[index] = value.plus_di;
            minus_di[index] = value.minus_di;
        }
        Ok(())
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

    #[napi]
    pub fn current(&self) -> Option<AdxStreamPoint> {
        self.inner.current().map(adx_stream_point)
    }
}

#[napi(js_name = "IchimokuStream")]
pub struct NativeIchimokuStream {
    inner: CoreIchimokuStream,
    history: Vec<CoreIchimokuOutput>,
}

#[napi(object)]
pub struct IchimokuStreamPoint {
    pub tenkan_sen: f64,
    pub kijun_sen: f64,
    pub senkou_span_a: f64,
    pub senkou_span_b: f64,
    pub chikou_span: f64,
}

fn ichimoku_stream_point(output: CoreIchimokuOutput) -> IchimokuStreamPoint {
    IchimokuStreamPoint {
        tenkan_sen: output.tenkan_sen,
        kijun_sen: output.kijun_sen,
        senkou_span_a: output.senkou_span_a,
        senkou_span_b: output.senkou_span_b,
        chikou_span: output.chikou_span,
    }
}

#[napi]
impl NativeIchimokuStream {
    #[napi(constructor)]
    pub fn new(tenkan_period: u32, kijun_period: u32, senkou_b_period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreIchimokuStream::new(
                tenkan_period as usize,
                kijun_period as usize,
                senkou_b_period as usize,
            )
            .map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
    ) -> Result<Vec<IchimokuStreamPoint>> {
        validate_hlc(highs, lows, closes)?;
        let bars: Vec<(f64, f64, f64)> = highs
            .iter()
            .zip(lows)
            .zip(closes)
            .map(|((&high, &low), &close)| (high, low, close))
            .collect();
        let result = self.inner.init(&bars).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(ichimoku_stream_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        highs: &[f64],
        lows: &[f64],
        closes: &[f64],
        mut tenkan_sen: Float64Array,
        mut kijun_sen: Float64Array,
        mut senkou_span_a: Float64Array,
        mut senkou_span_b: Float64Array,
        mut chikou_span: Float64Array,
    ) -> Result<()> {
        let tenkan_sen = unsafe { tenkan_sen.as_mut() };
        let kijun_sen = unsafe { kijun_sen.as_mut() };
        let senkou_span_a = unsafe { senkou_span_a.as_mut() };
        let senkou_span_b = unsafe { senkou_span_b.as_mut() };
        let chikou_span = unsafe { chikou_span.as_mut() };
        validate_hlc(highs, lows, closes)?;
        let len = highs.len();
        for (name, output) in [
            ("tenkanSen", &*tenkan_sen),
            ("kijunSen", &*kijun_sen),
            ("senkouSpanA", &*senkou_span_a),
            ("senkouSpanB", &*senkou_span_b),
            ("chikouSpan", &*chikou_span),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("tenkanSen", &*tenkan_sen),
                ("kijunSen", &*kijun_sen),
                ("senkouSpanA", &*senkou_span_a),
                ("senkouSpanB", &*senkou_span_b),
                ("chikouSpan", &*chikou_span),
            ],
            &[("highs", highs), ("lows", lows), ("closes", closes)],
        )?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| (highs[index], lows[index], closes[index]),
            |index, value| {
                let value = value.unwrap_or_else(CoreIchimokuOutput::nan);
                tenkan_sen[index] = value.tenkan_sen;
                kijun_sen[index] = value.kijun_sen;
                senkou_span_a[index] = value.senkou_span_a;
                senkou_span_b[index] = value.senkou_span_b;
                chikou_span[index] = value.chikou_span;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<IchimokuStreamPoint>> {
        validate_finite(&[high, low, close])?;
        let result = self.inner.next((high, low, close));
        self.history
            .push(result.unwrap_or_else(CoreIchimokuOutput::nan));
        Ok(result.map(ichimoku_stream_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        high: f64,
        low: f64,
        close: f64,
        mut tenkan_sen: Float64Array,
        mut kijun_sen: Float64Array,
        mut senkou_span_a: Float64Array,
        mut senkou_span_b: Float64Array,
        mut chikou_span: Float64Array,
    ) -> Result<bool> {
        let tenkan_sen = unsafe { tenkan_sen.as_mut() };
        let kijun_sen = unsafe { kijun_sen.as_mut() };
        let senkou_span_a = unsafe { senkou_span_a.as_mut() };
        let senkou_span_b = unsafe { senkou_span_b.as_mut() };
        let chikou_span = unsafe { chikou_span.as_mut() };
        validate_finite(&[high, low, close])?;
        for (name, output) in [
            ("tenkanSen", &*tenkan_sen),
            ("kijunSen", &*kijun_sen),
            ("senkouSpanA", &*senkou_span_a),
            ("senkouSpanB", &*senkou_span_b),
            ("chikouSpan", &*chikou_span),
        ] {
            validate_output(output, 1, name)?;
        }
        validate_output_disjoint(
            &[
                ("tenkanSen", &*tenkan_sen),
                ("kijunSen", &*kijun_sen),
                ("senkouSpanA", &*senkou_span_a),
                ("senkouSpanB", &*senkou_span_b),
                ("chikouSpan", &*chikou_span),
            ],
            &[],
        )?;
        let result = self.inner.next((high, low, close));
        let value = result.unwrap_or_else(CoreIchimokuOutput::nan);
        tenkan_sen[0] = value.tenkan_sen;
        kijun_sen[0] = value.kijun_sen;
        senkou_span_a[0] = value.senkou_span_a;
        senkou_span_b[0] = value.senkou_span_b;
        chikou_span[0] = value.chikou_span;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> IchimokuOutput {
        let mut tenkan_sen = Vec::with_capacity(self.history.len());
        let mut kijun_sen = Vec::with_capacity(self.history.len());
        let mut senkou_span_a = Vec::with_capacity(self.history.len());
        let mut senkou_span_b = Vec::with_capacity(self.history.len());
        let mut chikou_span = Vec::with_capacity(self.history.len());
        for value in &self.history {
            tenkan_sen.push(value.tenkan_sen);
            kijun_sen.push(value.kijun_sen);
            senkou_span_a.push(value.senkou_span_a);
            senkou_span_b.push(value.senkou_span_b);
            chikou_span.push(value.chikou_span);
        }
        IchimokuOutput {
            tenkan_sen: tenkan_sen.into(),
            kijun_sen: kijun_sen.into(),
            senkou_span_a: senkou_span_a.into(),
            senkou_span_b: senkou_span_b.into(),
            chikou_span: chikou_span.into(),
        }
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(
        &self,
        mut tenkan_sen: Float64Array,
        mut kijun_sen: Float64Array,
        mut senkou_span_a: Float64Array,
        mut senkou_span_b: Float64Array,
        mut chikou_span: Float64Array,
    ) -> Result<()> {
        let tenkan_sen = unsafe { tenkan_sen.as_mut() };
        let kijun_sen = unsafe { kijun_sen.as_mut() };
        let senkou_span_a = unsafe { senkou_span_a.as_mut() };
        let senkou_span_b = unsafe { senkou_span_b.as_mut() };
        let chikou_span = unsafe { chikou_span.as_mut() };
        let len = self.history.len();
        for (name, output) in [
            ("tenkanSen", &*tenkan_sen),
            ("kijunSen", &*kijun_sen),
            ("senkouSpanA", &*senkou_span_a),
            ("senkouSpanB", &*senkou_span_b),
            ("chikouSpan", &*chikou_span),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("tenkanSen", &*tenkan_sen),
                ("kijunSen", &*kijun_sen),
                ("senkouSpanA", &*senkou_span_a),
                ("senkouSpanB", &*senkou_span_b),
                ("chikouSpan", &*chikou_span),
            ],
            &[],
        )?;
        for (index, value) in self.history.iter().enumerate() {
            tenkan_sen[index] = value.tenkan_sen;
            kijun_sen[index] = value.kijun_sen;
            senkou_span_a[index] = value.senkou_span_a;
            senkou_span_b[index] = value.senkou_span_b;
            chikou_span[index] = value.chikou_span;
        }
        Ok(())
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
    pub fn tenkan_period(&self) -> u32 {
        self.inner.tenkan_period() as u32
    }

    #[napi(getter)]
    pub fn kijun_period(&self) -> u32 {
        self.inner.kijun_period() as u32
    }

    #[napi(getter)]
    pub fn senkou_b_period(&self) -> u32 {
        self.inner.senkou_b_period() as u32
    }
}

#[napi(js_name = "atrInto")]
pub fn atr_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: u32,
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    validate_hlc(highs, lows, closes)?;
    validate_output(output, highs.len(), "output")?;
    validate_output_disjoint(
        &[("output", &*output)],
        &[("highs", highs), ("lows", lows), ("closes", closes)],
    )?;

    let mut stream = CoreAtrStream::new(period as usize).map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        highs.len(),
        |index| (highs[index], lows[index], closes[index]),
        |index, value| output[index] = value.unwrap_or(f64::NAN),
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "stochInto")]
pub fn stoch_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    k_period: u32,
    d_period: u32,
    slowing: u32,
    stoch_type: String,
    mut k: Float64Array,
    mut d: Float64Array,
) -> Result<()> {
    let k = unsafe { k.as_mut() };
    let d = unsafe { d.as_mut() };
    validate_hlc(highs, lows, closes)?;
    let len = highs.len();
    validate_output(k, len, "k")?;
    validate_output(d, len, "d")?;
    validate_output_disjoint(
        &[("k", &*k), ("d", &*d)],
        &[("highs", highs), ("lows", lows), ("closes", closes)],
    )?;

    let mut stream = CoreStochStream::new_with_slowing(
        k_period as usize,
        d_period as usize,
        slowing as usize,
        parse_stoch_type(&stoch_type)?,
    )
    .map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| (highs[index], lows[index], closes[index]),
        |index, value| {
            let value = value.unwrap_or_else(CoreStochOutput::nan);
            k[index] = value.k;
            d[index] = value.d;
        },
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "mfiInto")]
pub fn mfi_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    period: u32,
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    validate_hlcv(highs, lows, closes, volumes)?;
    validate_output(output, highs.len(), "output")?;
    validate_output_disjoint(
        &[("output", &*output)],
        &[
            ("highs", highs),
            ("lows", lows),
            ("closes", closes),
            ("volumes", volumes),
        ],
    )?;

    let mut stream = CoreMfiStream::new(period as usize).map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        highs.len(),
        |index| (highs[index], lows[index], closes[index], volumes[index]),
        |index, value| output[index] = value.unwrap_or(f64::NAN),
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "cvdOhlcvInto")]
pub fn cvd_ohlcv_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    volumes: &[f64],
    mut output: Float64Array,
) -> Result<()> {
    let output = unsafe { output.as_mut() };
    validate_hlcv(highs, lows, closes, volumes)?;
    validate_output(output, highs.len(), "output")?;
    validate_output_disjoint(
        &[("output", &*output)],
        &[
            ("highs", highs),
            ("lows", lows),
            ("closes", closes),
            ("volumes", volumes),
        ],
    )?;

    let mut stream = CoreCvdOhlcvStream::new();
    stream_into(
        &mut stream,
        highs.len(),
        |index| (highs[index], lows[index], closes[index], volumes[index]),
        |index, value| output[index] = value.unwrap_or(f64::NAN),
    )
    .map_err(map_indicator_error)
}
