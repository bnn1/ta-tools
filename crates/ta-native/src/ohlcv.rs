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
use ta_core::traits::{Indicator, StreamingIndicator};

use crate::error::{map_indicator_error, validate_finite, validate_same_length};

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
}

#[napi]
impl NativeAtrStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreAtrStream::new(period as usize).map_err(map_indicator_error)?,
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
        Ok(self.inner.init(&bars).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<f64>> {
        validate_finite(&[high, low, close])?;
        Ok(self.inner.next((high, low, close)))
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
        Ok(self
            .inner
            .init(&bars)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(stoch_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<StochPoint>> {
        validate_finite(&[high, low, close])?;
        Ok(self.inner.next((high, low, close)).map(stoch_point))
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

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<StochPoint>> {
        self.inner.next(high, low, close)
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

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<StochPoint>> {
        self.inner.next(high, low, close)
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
}

#[napi]
impl NativeMfiStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreMfiStream::new(period as usize).map_err(map_indicator_error)?,
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
        Ok(self.inner.init(&bars).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64, volume: f64) -> Result<Option<f64>> {
        validate_finite(&[high, low, close, volume])?;
        Ok(self.inner.next((high, low, close, volume)))
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
}

#[napi]
impl NativeCvdOhlcvStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreCvdOhlcvStream::new(),
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
        Ok(self.inner.init(&bars).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64, volume: f64) -> Result<Option<f64>> {
        validate_finite(&[high, low, close, volume])?;
        Ok(self.inner.next((high, low, close, volume)))
    }

    #[napi]
    pub fn reset(&mut self) {
        self.inner.reset();
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
        Ok(self
            .inner
            .init(&bars)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(adx_stream_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<AdxStreamPoint>> {
        validate_finite(&[high, low, close])?;
        Ok(self.inner.next((high, low, close)).map(adx_stream_point))
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

    #[napi]
    pub fn current(&self) -> Option<AdxStreamPoint> {
        self.inner.current().map(adx_stream_point)
    }
}

#[napi(js_name = "IchimokuStream")]
pub struct NativeIchimokuStream {
    inner: CoreIchimokuStream,
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
        Ok(self
            .inner
            .init(&bars)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(ichimoku_stream_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, high: f64, low: f64, close: f64) -> Result<Option<IchimokuStreamPoint>> {
        validate_finite(&[high, low, close])?;
        Ok(self
            .inner
            .next((high, low, close))
            .map(ichimoku_stream_point))
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
