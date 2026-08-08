//! Native bindings for indicators with multiple output series.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{
    Adx, BBands, BBandsOutput as CoreBBandsOutput, Ichimoku, LinReg,
    LinRegOutput as CoreLinRegOutput, Macd, MacdOutput as CoreMacdOutput,
    MacdStream as CoreMacdStream, SignalType, StochRsi, StochRsiOutput as CoreStochRsiOutput,
    StochRsiStream as CoreStochRsiStream,
};
use ta_core::traits::{Indicator, StreamingIndicator};

use crate::error::{map_indicator_error, validate_finite};

#[napi(object)]
pub struct MacdOutput {
    pub macd: Float64Array,
    pub signal: Float64Array,
    pub histogram: Float64Array,
}

#[napi(object)]
pub struct MacdPoint {
    pub macd: f64,
    pub signal: f64,
    pub histogram: f64,
}

fn macd_point(output: CoreMacdOutput) -> MacdPoint {
    MacdPoint {
        macd: output.macd,
        signal: output.signal,
        histogram: output.histogram,
    }
}

fn parse_signal_type(value: Option<&str>) -> Result<SignalType> {
    match value.unwrap_or("ema").to_ascii_lowercase().as_str() {
        "ema" => Ok(SignalType::Ema),
        "sma" => Ok(SignalType::Sma),
        value => Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("signalType must be \"ema\" or \"sma\", got \"{value}\""),
        )),
    }
}

#[napi]
pub fn macd(
    data: &[f64],
    fast_period: u32,
    slow_period: u32,
    signal_period: u32,
    signal_type: Option<String>,
) -> Result<MacdOutput> {
    validate_finite(data)?;

    let indicator = Macd::with_signal_type(
        fast_period as usize,
        slow_period as usize,
        signal_period as usize,
        parse_signal_type(signal_type.as_deref())?,
    )
    .map_err(map_indicator_error)?;
    let results = indicator.calculate(data).map_err(map_indicator_error)?;

    let mut macd = Vec::with_capacity(results.len());
    let mut signal = Vec::with_capacity(results.len());
    let mut histogram = Vec::with_capacity(results.len());

    for result in results {
        macd.push(result.macd);
        signal.push(result.signal);
        histogram.push(result.histogram);
    }

    Ok(MacdOutput {
        macd: macd.into(),
        signal: signal.into(),
        histogram: histogram.into(),
    })
}

#[napi(js_name = "MacdStream")]
pub struct NativeMacdStream {
    inner: CoreMacdStream,
}

#[napi]
impl NativeMacdStream {
    #[napi(constructor)]
    pub fn new(
        fast_period: u32,
        slow_period: u32,
        signal_period: u32,
        signal_type: Option<String>,
    ) -> Result<Self> {
        Ok(Self {
            inner: CoreMacdStream::with_signal_type(
                fast_period as usize,
                slow_period as usize,
                signal_period as usize,
                parse_signal_type(signal_type.as_deref())?,
            )
            .map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<MacdPoint>> {
        validate_finite(data)?;
        Ok(self
            .inner
            .init(data)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(macd_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<MacdPoint>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value).map(macd_point))
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
    pub fn fast_period(&self) -> u32 {
        self.inner.fast_period() as u32
    }

    #[napi(getter)]
    pub fn slow_period(&self) -> u32 {
        self.inner.slow_period() as u32
    }

    #[napi(getter)]
    pub fn signal_period(&self) -> u32 {
        self.inner.signal_period() as u32
    }
}

#[napi(object)]
pub struct BBandsOutput {
    pub upper: Float64Array,
    pub middle: Float64Array,
    pub lower: Float64Array,
    pub percent_b: Float64Array,
    pub bandwidth: Float64Array,
}

#[napi(object)]
pub struct BBandsPoint {
    pub upper: f64,
    pub middle: f64,
    pub lower: f64,
    pub percent_b: f64,
    pub bandwidth: f64,
}

fn bbands_point(output: CoreBBandsOutput) -> BBandsPoint {
    BBandsPoint {
        upper: output.upper,
        middle: output.middle,
        lower: output.lower,
        percent_b: output.percent_b,
        bandwidth: output.bandwidth,
    }
}

#[napi]
pub fn bbands(data: &[f64], period: u32, k: f64) -> Result<BBandsOutput> {
    validate_finite(data)?;

    let indicator = BBands::new(period as usize, k).map_err(map_indicator_error)?;
    let results = indicator.calculate(data).map_err(map_indicator_error)?;

    let mut upper = Vec::with_capacity(results.len());
    let mut middle = Vec::with_capacity(results.len());
    let mut lower = Vec::with_capacity(results.len());
    let mut percent_b = Vec::with_capacity(results.len());
    let mut bandwidth = Vec::with_capacity(results.len());

    for result in results {
        upper.push(result.upper);
        middle.push(result.middle);
        lower.push(result.lower);
        percent_b.push(result.percent_b);
        bandwidth.push(result.bandwidth);
    }

    Ok(BBandsOutput {
        upper: upper.into(),
        middle: middle.into(),
        lower: lower.into(),
        percent_b: percent_b.into(),
        bandwidth: bandwidth.into(),
    })
}

#[napi(js_name = "BBandsStream")]
pub struct NativeBBandsStream {
    inner: ta_core::indicators::BBandsStream,
}

#[napi]
impl NativeBBandsStream {
    #[napi(constructor)]
    pub fn new(period: u32, k: f64) -> Result<Self> {
        Ok(Self {
            inner: ta_core::indicators::BBandsStream::new(period as usize, k)
                .map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<BBandsPoint>> {
        validate_finite(data)?;
        Ok(self
            .inner
            .init(data)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(bbands_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<BBandsPoint>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value).map(bbands_point))
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

    #[napi(getter)]
    pub fn k(&self) -> f64 {
        self.inner.k()
    }
}

#[napi(object)]
pub struct StochRsiOutput {
    pub k: Float64Array,
    pub d: Float64Array,
}

#[napi(object)]
pub struct StochRsiPoint {
    pub k: f64,
    pub d: f64,
}

fn stoch_rsi_point(output: CoreStochRsiOutput) -> StochRsiPoint {
    StochRsiPoint {
        k: output.k,
        d: output.d,
    }
}

#[napi]
pub fn stoch_rsi(
    data: &[f64],
    rsi_period: u32,
    stoch_period: u32,
    k_smooth: u32,
    d_period: u32,
) -> Result<StochRsiOutput> {
    validate_finite(data)?;

    let indicator = StochRsi::new(
        rsi_period as usize,
        stoch_period as usize,
        k_smooth as usize,
        d_period as usize,
    )
    .map_err(map_indicator_error)?;
    let results = indicator.calculate(data).map_err(map_indicator_error)?;

    let mut k = Vec::with_capacity(results.len());
    let mut d = Vec::with_capacity(results.len());
    for result in results {
        k.push(result.k);
        d.push(result.d);
    }

    Ok(StochRsiOutput {
        k: k.into(),
        d: d.into(),
    })
}

#[napi(js_name = "StochRsiStream")]
pub struct NativeStochRsiStream {
    inner: CoreStochRsiStream,
}

#[napi]
impl NativeStochRsiStream {
    #[napi(constructor)]
    pub fn new(rsi_period: u32, stoch_period: u32, k_smooth: u32, d_period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreStochRsiStream::new(
                rsi_period as usize,
                stoch_period as usize,
                k_smooth as usize,
                d_period as usize,
            )
            .map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<StochRsiPoint>> {
        validate_finite(data)?;
        Ok(self
            .inner
            .init(data)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(stoch_rsi_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<StochRsiPoint>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value).map(stoch_rsi_point))
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
    pub fn rsi_period(&self) -> u32 {
        self.inner.rsi_period() as u32
    }

    #[napi(getter)]
    pub fn stoch_period(&self) -> u32 {
        self.inner.stoch_period() as u32
    }

    #[napi(getter)]
    pub fn k_smooth(&self) -> u32 {
        self.inner.k_smooth() as u32
    }

    #[napi(getter)]
    pub fn d_period(&self) -> u32 {
        self.inner.d_period() as u32
    }
}

#[napi(object)]
pub struct AdxOutput {
    pub adx: Float64Array,
    pub plus_di: Float64Array,
    pub minus_di: Float64Array,
}

#[napi]
pub fn adx(highs: &[f64], lows: &[f64], closes: &[f64], period: u32) -> Result<AdxOutput> {
    crate::error::validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;

    let indicator = Adx::new(period as usize).map_err(map_indicator_error)?;
    let results = indicator
        .calculate(&(highs, lows, closes))
        .map_err(map_indicator_error)?;

    let mut adx = Vec::with_capacity(results.len());
    let mut plus_di = Vec::with_capacity(results.len());
    let mut minus_di = Vec::with_capacity(results.len());
    for result in results {
        adx.push(result.adx);
        plus_di.push(result.plus_di);
        minus_di.push(result.minus_di);
    }

    Ok(AdxOutput {
        adx: adx.into(),
        plus_di: plus_di.into(),
        minus_di: minus_di.into(),
    })
}

#[napi(object)]
pub struct IchimokuOutput {
    pub tenkan_sen: Float64Array,
    pub kijun_sen: Float64Array,
    pub senkou_span_a: Float64Array,
    pub senkou_span_b: Float64Array,
    pub chikou_span: Float64Array,
}

#[napi]
pub fn ichimoku(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    tenkan_period: u32,
    kijun_period: u32,
    senkou_b_period: u32,
) -> Result<IchimokuOutput> {
    crate::error::validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;

    let indicator = Ichimoku::new(
        tenkan_period as usize,
        kijun_period as usize,
        senkou_b_period as usize,
    )
    .map_err(map_indicator_error)?;
    let results = indicator
        .calculate(&(highs, lows, closes))
        .map_err(map_indicator_error)?;

    let mut tenkan_sen = Vec::with_capacity(results.len());
    let mut kijun_sen = Vec::with_capacity(results.len());
    let mut senkou_span_a = Vec::with_capacity(results.len());
    let mut senkou_span_b = Vec::with_capacity(results.len());
    let mut chikou_span = Vec::with_capacity(results.len());
    for result in results {
        tenkan_sen.push(result.tenkan_sen);
        kijun_sen.push(result.kijun_sen);
        senkou_span_a.push(result.senkou_span_a);
        senkou_span_b.push(result.senkou_span_b);
        chikou_span.push(result.chikou_span);
    }

    Ok(IchimokuOutput {
        tenkan_sen: tenkan_sen.into(),
        kijun_sen: kijun_sen.into(),
        senkou_span_a: senkou_span_a.into(),
        senkou_span_b: senkou_span_b.into(),
        chikou_span: chikou_span.into(),
    })
}

#[napi(object)]
pub struct LinRegOutput {
    pub value: Float64Array,
    pub upper: Float64Array,
    pub lower: Float64Array,
    pub slope: Float64Array,
    pub r: Float64Array,
    pub r_squared: Float64Array,
}

#[napi(object)]
pub struct LinRegPoint {
    pub value: f64,
    pub upper: f64,
    pub lower: f64,
    pub slope: f64,
    pub r: f64,
    pub r_squared: f64,
}

fn linreg_point(output: CoreLinRegOutput) -> LinRegPoint {
    LinRegPoint {
        value: output.value,
        upper: output.upper,
        lower: output.lower,
        slope: output.slope,
        r: output.r,
        r_squared: output.r_squared,
    }
}

#[napi]
pub fn linreg(data: &[f64], period: u32, num_std_dev: f64) -> Result<LinRegOutput> {
    validate_finite(data)?;
    validate_finite(&[num_std_dev])?;

    let indicator = LinReg::new(period as usize, num_std_dev).map_err(map_indicator_error)?;
    let results = indicator.calculate(data).map_err(map_indicator_error)?;

    let mut value = Vec::with_capacity(results.len());
    let mut upper = Vec::with_capacity(results.len());
    let mut lower = Vec::with_capacity(results.len());
    let mut slope = Vec::with_capacity(results.len());
    let mut r = Vec::with_capacity(results.len());
    let mut r_squared = Vec::with_capacity(results.len());
    for result in results {
        value.push(result.value);
        upper.push(result.upper);
        lower.push(result.lower);
        slope.push(result.slope);
        r.push(result.r);
        r_squared.push(result.r_squared);
    }

    Ok(LinRegOutput {
        value: value.into(),
        upper: upper.into(),
        lower: lower.into(),
        slope: slope.into(),
        r: r.into(),
        r_squared: r_squared.into(),
    })
}

#[napi(js_name = "LinRegStream")]
pub struct NativeLinRegStream {
    inner: ta_core::indicators::LinRegStream,
}

#[napi]
impl NativeLinRegStream {
    #[napi(constructor)]
    pub fn new(period: u32, num_std_dev: f64) -> Result<Self> {
        validate_finite(&[num_std_dev])?;
        Ok(Self {
            inner: ta_core::indicators::LinRegStream::new(period as usize, num_std_dev)
                .map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<LinRegPoint>> {
        validate_finite(data)?;
        Ok(self
            .inner
            .init(data)
            .map_err(map_indicator_error)?
            .into_iter()
            .map(linreg_point)
            .collect())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<LinRegPoint>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value).map(linreg_point))
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

    #[napi(getter)]
    pub fn num_std_dev(&self) -> f64 {
        self.inner.num_std_dev()
    }
}
