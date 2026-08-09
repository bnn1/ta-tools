//! Native bindings for indicators with multiple output series.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{
    Adx, BBands, BBandsOutput as CoreBBandsOutput, Ichimoku, LinReg,
    LinRegOutput as CoreLinRegOutput, Macd, MacdOutput as CoreMacdOutput,
    MacdStream as CoreMacdStream, SignalType, StochRsi, StochRsiOutput as CoreStochRsiOutput,
    StochRsiStream as CoreStochRsiStream,
};
use ta_core::traits::{stream_into, Indicator, StreamingIndicator};

use crate::error::{
    map_indicator_error, validate_finite, validate_output, validate_output_disjoint,
    validate_same_length,
};

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
    history: Vec<CoreMacdOutput>,
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
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<MacdPoint>> {
        validate_finite(data)?;
        let result = self.inner.init(data).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(macd_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        data: &[f64],
        mut macd: Float64Array,
        mut signal: Float64Array,
        mut histogram: Float64Array,
    ) -> Result<()> {
        let macd = unsafe { macd.as_mut() };
        let signal = unsafe { signal.as_mut() };
        let histogram = unsafe { histogram.as_mut() };
        validate_finite(data)?;
        let len = data.len();
        for (name, output) in [
            ("macd", &*macd),
            ("signal", &*signal),
            ("histogram", &*histogram),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("macd", &*macd),
                ("signal", &*signal),
                ("histogram", &*histogram),
            ],
            &[("data", data)],
        )?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| data[index],
            |index, value| {
                let value = value.unwrap_or(CoreMacdOutput {
                    macd: f64::NAN,
                    signal: f64::NAN,
                    histogram: f64::NAN,
                });
                macd[index] = value.macd;
                signal[index] = value.signal;
                histogram[index] = value.histogram;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<MacdPoint>> {
        validate_finite(&[value])?;
        let result = self.inner.next(value);
        self.history
            .push(result.unwrap_or_else(CoreMacdOutput::nan));
        Ok(result.map(macd_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        value: f64,
        mut macd: Float64Array,
        mut signal: Float64Array,
        mut histogram: Float64Array,
    ) -> Result<bool> {
        let macd = unsafe { macd.as_mut() };
        let signal = unsafe { signal.as_mut() };
        let histogram = unsafe { histogram.as_mut() };
        validate_finite(&[value])?;
        for (name, output) in [
            ("macd", &*macd),
            ("signal", &*signal),
            ("histogram", &*histogram),
        ] {
            validate_output(output, 1, name)?;
        }
        validate_output_disjoint(
            &[
                ("macd", &*macd),
                ("signal", &*signal),
                ("histogram", &*histogram),
            ],
            &[],
        )?;
        let result = self.inner.next(value);
        let value = result.unwrap_or(CoreMacdOutput {
            macd: f64::NAN,
            signal: f64::NAN,
            histogram: f64::NAN,
        });
        macd[0] = value.macd;
        signal[0] = value.signal;
        histogram[0] = value.histogram;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> MacdOutput {
        let mut macd = Vec::with_capacity(self.history.len());
        let mut signal = Vec::with_capacity(self.history.len());
        let mut histogram = Vec::with_capacity(self.history.len());
        for value in &self.history {
            macd.push(value.macd);
            signal.push(value.signal);
            histogram.push(value.histogram);
        }
        MacdOutput {
            macd: macd.into(),
            signal: signal.into(),
            histogram: histogram.into(),
        }
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(
        &self,
        mut macd: Float64Array,
        mut signal: Float64Array,
        mut histogram: Float64Array,
    ) -> Result<()> {
        let macd = unsafe { macd.as_mut() };
        let signal = unsafe { signal.as_mut() };
        let histogram = unsafe { histogram.as_mut() };
        let len = self.history.len();
        for (name, output) in [
            ("macd", &*macd),
            ("signal", &*signal),
            ("histogram", &*histogram),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("macd", &*macd),
                ("signal", &*signal),
                ("histogram", &*histogram),
            ],
            &[],
        )?;
        for (index, value) in self.history.iter().enumerate() {
            macd[index] = value.macd;
            signal[index] = value.signal;
            histogram[index] = value.histogram;
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
    history: Vec<CoreBBandsOutput>,
}

#[napi]
impl NativeBBandsStream {
    #[napi(constructor)]
    pub fn new(period: u32, k: f64) -> Result<Self> {
        Ok(Self {
            inner: ta_core::indicators::BBandsStream::new(period as usize, k)
                .map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<BBandsPoint>> {
        validate_finite(data)?;
        let result = self.inner.init(data).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(bbands_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        data: &[f64],
        mut upper: Float64Array,
        mut middle: Float64Array,
        mut lower: Float64Array,
        mut percent_b: Float64Array,
        mut bandwidth: Float64Array,
    ) -> Result<()> {
        let upper = unsafe { upper.as_mut() };
        let middle = unsafe { middle.as_mut() };
        let lower = unsafe { lower.as_mut() };
        let percent_b = unsafe { percent_b.as_mut() };
        let bandwidth = unsafe { bandwidth.as_mut() };
        validate_finite(data)?;
        let len = data.len();
        for (name, output) in [
            ("upper", &*upper),
            ("middle", &*middle),
            ("lower", &*lower),
            ("percentB", &*percent_b),
            ("bandwidth", &*bandwidth),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("upper", &*upper),
                ("middle", &*middle),
                ("lower", &*lower),
                ("percentB", &*percent_b),
                ("bandwidth", &*bandwidth),
            ],
            &[("data", data)],
        )?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| data[index],
            |index, value| {
                let value = value.unwrap_or_else(CoreBBandsOutput::nan);
                upper[index] = value.upper;
                middle[index] = value.middle;
                lower[index] = value.lower;
                percent_b[index] = value.percent_b;
                bandwidth[index] = value.bandwidth;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<BBandsPoint>> {
        validate_finite(&[value])?;
        let result = self.inner.next(value);
        self.history
            .push(result.unwrap_or_else(CoreBBandsOutput::nan));
        Ok(result.map(bbands_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        value: f64,
        mut upper: Float64Array,
        mut middle: Float64Array,
        mut lower: Float64Array,
        mut percent_b: Float64Array,
        mut bandwidth: Float64Array,
    ) -> Result<bool> {
        let upper = unsafe { upper.as_mut() };
        let middle = unsafe { middle.as_mut() };
        let lower = unsafe { lower.as_mut() };
        let percent_b = unsafe { percent_b.as_mut() };
        let bandwidth = unsafe { bandwidth.as_mut() };
        validate_finite(&[value])?;
        for (name, output) in [
            ("upper", &*upper),
            ("middle", &*middle),
            ("lower", &*lower),
            ("percentB", &*percent_b),
            ("bandwidth", &*bandwidth),
        ] {
            validate_output(output, 1, name)?;
        }
        validate_output_disjoint(
            &[
                ("upper", &*upper),
                ("middle", &*middle),
                ("lower", &*lower),
                ("percentB", &*percent_b),
                ("bandwidth", &*bandwidth),
            ],
            &[],
        )?;
        let result = self.inner.next(value);
        let value = result.unwrap_or_else(CoreBBandsOutput::nan);
        upper[0] = value.upper;
        middle[0] = value.middle;
        lower[0] = value.lower;
        percent_b[0] = value.percent_b;
        bandwidth[0] = value.bandwidth;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> BBandsOutput {
        let mut upper = Vec::with_capacity(self.history.len());
        let mut middle = Vec::with_capacity(self.history.len());
        let mut lower = Vec::with_capacity(self.history.len());
        let mut percent_b = Vec::with_capacity(self.history.len());
        let mut bandwidth = Vec::with_capacity(self.history.len());
        for value in &self.history {
            upper.push(value.upper);
            middle.push(value.middle);
            lower.push(value.lower);
            percent_b.push(value.percent_b);
            bandwidth.push(value.bandwidth);
        }
        BBandsOutput {
            upper: upper.into(),
            middle: middle.into(),
            lower: lower.into(),
            percent_b: percent_b.into(),
            bandwidth: bandwidth.into(),
        }
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(
        &self,
        mut upper: Float64Array,
        mut middle: Float64Array,
        mut lower: Float64Array,
        mut percent_b: Float64Array,
        mut bandwidth: Float64Array,
    ) -> Result<()> {
        let upper = unsafe { upper.as_mut() };
        let middle = unsafe { middle.as_mut() };
        let lower = unsafe { lower.as_mut() };
        let percent_b = unsafe { percent_b.as_mut() };
        let bandwidth = unsafe { bandwidth.as_mut() };
        let len = self.history.len();
        for (name, output) in [
            ("upper", &*upper),
            ("middle", &*middle),
            ("lower", &*lower),
            ("percentB", &*percent_b),
            ("bandwidth", &*bandwidth),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("upper", &*upper),
                ("middle", &*middle),
                ("lower", &*lower),
                ("percentB", &*percent_b),
                ("bandwidth", &*bandwidth),
            ],
            &[],
        )?;
        for (index, value) in self.history.iter().enumerate() {
            upper[index] = value.upper;
            middle[index] = value.middle;
            lower[index] = value.lower;
            percent_b[index] = value.percent_b;
            bandwidth[index] = value.bandwidth;
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
    history: Vec<CoreStochRsiOutput>,
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
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<StochRsiPoint>> {
        validate_finite(data)?;
        let result = self.inner.init(data).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(stoch_rsi_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        data: &[f64],
        mut k: Float64Array,
        mut d: Float64Array,
    ) -> Result<()> {
        let k = unsafe { k.as_mut() };
        let d = unsafe { d.as_mut() };
        validate_finite(data)?;
        let len = data.len();
        validate_output(k, len, "k")?;
        validate_output(d, len, "d")?;
        validate_output_disjoint(&[("k", &*k), ("d", &*d)], &[("data", data)])?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| data[index],
            |index, value| {
                let value = value.unwrap_or(CoreStochRsiOutput {
                    k: f64::NAN,
                    d: f64::NAN,
                });
                k[index] = value.k;
                d[index] = value.d;
                history.push(value);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<StochRsiPoint>> {
        validate_finite(&[value])?;
        let result = self.inner.next(value);
        self.history
            .push(result.unwrap_or_else(|| CoreStochRsiOutput {
                k: f64::NAN,
                d: f64::NAN,
            }));
        Ok(result.map(stoch_rsi_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        value: f64,
        mut k: Float64Array,
        mut d: Float64Array,
    ) -> Result<bool> {
        let k = unsafe { k.as_mut() };
        let d = unsafe { d.as_mut() };
        validate_finite(&[value])?;
        validate_output(k, 1, "k")?;
        validate_output(d, 1, "d")?;
        validate_output_disjoint(&[("k", &*k), ("d", &*d)], &[])?;
        let result = self.inner.next(value);
        let value = result.unwrap_or(CoreStochRsiOutput {
            k: f64::NAN,
            d: f64::NAN,
        });
        k[0] = value.k;
        d[0] = value.d;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> StochRsiOutput {
        let mut k = Vec::with_capacity(self.history.len());
        let mut d = Vec::with_capacity(self.history.len());
        for value in &self.history {
            k.push(value.k);
            d.push(value.d);
        }
        StochRsiOutput {
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

#[napi(js_name = "macdInto")]
pub fn macd_into(
    data: &[f64],
    fast_period: u32,
    slow_period: u32,
    signal_period: u32,
    signal_type: Option<String>,
    mut macd: Float64Array,
    mut signal: Float64Array,
    mut histogram: Float64Array,
) -> Result<()> {
    let macd = unsafe { macd.as_mut() };
    let signal = unsafe { signal.as_mut() };
    let histogram = unsafe { histogram.as_mut() };
    validate_finite(data)?;
    let len = data.len();
    for (name, output) in [
        ("macd", &*macd),
        ("signal", &*signal),
        ("histogram", &*histogram),
    ] {
        validate_output(output, len, name)?;
    }
    validate_output_disjoint(
        &[
            ("macd", &*macd),
            ("signal", &*signal),
            ("histogram", &*histogram),
        ],
        &[("data", data)],
    )?;

    let mut stream = CoreMacdStream::with_signal_type(
        fast_period as usize,
        slow_period as usize,
        signal_period as usize,
        parse_signal_type(signal_type.as_deref())?,
    )
    .map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| data[index],
        |index, value| {
            let value = value.unwrap_or_else(CoreMacdOutput::nan);
            macd[index] = value.macd;
            signal[index] = value.signal;
            histogram[index] = value.histogram;
        },
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "bbandsInto")]
pub fn bbands_into(
    data: &[f64],
    period: u32,
    k: f64,
    mut upper: Float64Array,
    mut middle: Float64Array,
    mut lower: Float64Array,
    mut percent_b: Float64Array,
    mut bandwidth: Float64Array,
) -> Result<()> {
    let upper = unsafe { upper.as_mut() };
    let middle = unsafe { middle.as_mut() };
    let lower = unsafe { lower.as_mut() };
    let percent_b = unsafe { percent_b.as_mut() };
    let bandwidth = unsafe { bandwidth.as_mut() };
    validate_finite(data)?;
    let len = data.len();
    for (name, output) in [
        ("upper", &*upper),
        ("middle", &*middle),
        ("lower", &*lower),
        ("percentB", &*percent_b),
        ("bandwidth", &*bandwidth),
    ] {
        validate_output(output, len, name)?;
    }
    validate_output_disjoint(
        &[
            ("upper", &*upper),
            ("middle", &*middle),
            ("lower", &*lower),
            ("percentB", &*percent_b),
            ("bandwidth", &*bandwidth),
        ],
        &[("data", data)],
    )?;

    let mut stream =
        ta_core::indicators::BBandsStream::new(period as usize, k).map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| data[index],
        |index, value| {
            let value = value.unwrap_or_else(CoreBBandsOutput::nan);
            upper[index] = value.upper;
            middle[index] = value.middle;
            lower[index] = value.lower;
            percent_b[index] = value.percent_b;
            bandwidth[index] = value.bandwidth;
        },
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "stochRsiInto")]
pub fn stoch_rsi_into(
    data: &[f64],
    rsi_period: u32,
    stoch_period: u32,
    k_smooth: u32,
    d_period: u32,
    mut k: Float64Array,
    mut d: Float64Array,
) -> Result<()> {
    let k = unsafe { k.as_mut() };
    let d = unsafe { d.as_mut() };
    validate_finite(data)?;
    let len = data.len();
    validate_output(k, len, "k")?;
    validate_output(d, len, "d")?;
    validate_output_disjoint(&[("k", &*k), ("d", &*d)], &[("data", data)])?;

    let mut stream = CoreStochRsiStream::new(
        rsi_period as usize,
        stoch_period as usize,
        k_smooth as usize,
        d_period as usize,
    )
    .map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| data[index],
        |index, value| {
            let value = value.unwrap_or(CoreStochRsiOutput {
                k: f64::NAN,
                d: f64::NAN,
            });
            k[index] = value.k;
            d[index] = value.d;
        },
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "adxInto")]
pub fn adx_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: u32,
    mut adx: Float64Array,
    mut plus_di: Float64Array,
    mut minus_di: Float64Array,
) -> Result<()> {
    let adx = unsafe { adx.as_mut() };
    let plus_di = unsafe { plus_di.as_mut() };
    let minus_di = unsafe { minus_di.as_mut() };
    let len = validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;
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

    let mut stream =
        ta_core::indicators::AdxStream::new(period as usize).map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| (highs[index], lows[index], closes[index]),
        |index, value| {
            let value = value.unwrap_or_else(ta_core::indicators::AdxOutput::nan);
            adx[index] = value.adx;
            plus_di[index] = value.plus_di;
            minus_di[index] = value.minus_di;
        },
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "ichimokuInto")]
pub fn ichimoku_into(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    tenkan_period: u32,
    kijun_period: u32,
    senkou_b_period: u32,
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
    let len = validate_same_length(&[
        ("highs", highs.len()),
        ("lows", lows.len()),
        ("closes", closes.len()),
    ])?;
    validate_finite(highs)?;
    validate_finite(lows)?;
    validate_finite(closes)?;
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

    let mut stream = ta_core::indicators::IchimokuStream::new(
        tenkan_period as usize,
        kijun_period as usize,
        senkou_b_period as usize,
    )
    .map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| (highs[index], lows[index], closes[index]),
        |index, value| {
            let value = value.unwrap_or_else(ta_core::indicators::IchimokuOutput::nan);
            tenkan_sen[index] = value.tenkan_sen;
            kijun_sen[index] = value.kijun_sen;
            senkou_span_a[index] = value.senkou_span_a;
            senkou_span_b[index] = value.senkou_span_b;
            chikou_span[index] = value.chikou_span;
        },
    )
    .map_err(map_indicator_error)
}

#[napi(js_name = "linregInto")]
pub fn linreg_into(
    data: &[f64],
    period: u32,
    num_std_dev: f64,
    mut value: Float64Array,
    mut upper: Float64Array,
    mut lower: Float64Array,
    mut slope: Float64Array,
    mut r: Float64Array,
    mut r_squared: Float64Array,
) -> Result<()> {
    let value = unsafe { value.as_mut() };
    let upper = unsafe { upper.as_mut() };
    let lower = unsafe { lower.as_mut() };
    let slope = unsafe { slope.as_mut() };
    let r = unsafe { r.as_mut() };
    let r_squared = unsafe { r_squared.as_mut() };
    validate_finite(data)?;
    let len = data.len();
    for (name, output) in [
        ("value", &*value),
        ("upper", &*upper),
        ("lower", &*lower),
        ("slope", &*slope),
        ("r", &*r),
        ("rSquared", &*r_squared),
    ] {
        validate_output(output, len, name)?;
    }
    validate_output_disjoint(
        &[
            ("value", &*value),
            ("upper", &*upper),
            ("lower", &*lower),
            ("slope", &*slope),
            ("r", &*r),
            ("rSquared", &*r_squared),
        ],
        &[("data", data)],
    )?;

    let mut stream = ta_core::indicators::LinRegStream::new(period as usize, num_std_dev)
        .map_err(map_indicator_error)?;
    stream_into(
        &mut stream,
        len,
        |index| data[index],
        |index, output| {
            let output = output.unwrap_or_else(ta_core::indicators::LinRegOutput::nan);
            value[index] = output.value;
            upper[index] = output.upper;
            lower[index] = output.lower;
            slope[index] = output.slope;
            r[index] = output.r;
            r_squared[index] = output.r_squared;
        },
    )
    .map_err(map_indicator_error)
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
    history: Vec<CoreLinRegOutput>,
}

#[napi]
impl NativeLinRegStream {
    #[napi(constructor)]
    pub fn new(period: u32, num_std_dev: f64) -> Result<Self> {
        validate_finite(&[num_std_dev])?;
        Ok(Self {
            inner: ta_core::indicators::LinRegStream::new(period as usize, num_std_dev)
                .map_err(map_indicator_error)?,
            history: Vec::new(),
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Vec<LinRegPoint>> {
        validate_finite(data)?;
        let result = self.inner.init(data).map_err(map_indicator_error)?;
        self.history = result.clone();
        Ok(result.into_iter().map(linreg_point).collect())
    }

    #[napi(js_name = "initInto")]
    pub fn init_into(
        &mut self,
        data: &[f64],
        mut value: Float64Array,
        mut upper: Float64Array,
        mut lower: Float64Array,
        mut slope: Float64Array,
        mut r: Float64Array,
        mut r_squared: Float64Array,
    ) -> Result<()> {
        let value = unsafe { value.as_mut() };
        let upper = unsafe { upper.as_mut() };
        let lower = unsafe { lower.as_mut() };
        let slope = unsafe { slope.as_mut() };
        let r = unsafe { r.as_mut() };
        let r_squared = unsafe { r_squared.as_mut() };
        validate_finite(data)?;
        let len = data.len();
        for (name, output) in [
            ("value", &*value),
            ("upper", &*upper),
            ("lower", &*lower),
            ("slope", &*slope),
            ("r", &*r),
            ("rSquared", &*r_squared),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("value", &*value),
                ("upper", &*upper),
                ("lower", &*lower),
                ("slope", &*slope),
                ("r", &*r),
                ("rSquared", &*r_squared),
            ],
            &[("data", data)],
        )?;
        self.history.clear();
        self.history.reserve(len);
        let history = &mut self.history;
        stream_into(
            &mut self.inner,
            len,
            |index| data[index],
            |index, output| {
                let output = output.unwrap_or_else(CoreLinRegOutput::nan);
                value[index] = output.value;
                upper[index] = output.upper;
                lower[index] = output.lower;
                slope[index] = output.slope;
                r[index] = output.r;
                r_squared[index] = output.r_squared;
                history.push(output);
            },
        )
        .map_err(map_indicator_error)
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<LinRegPoint>> {
        validate_finite(&[value])?;
        let result = self.inner.next(value);
        self.history
            .push(result.unwrap_or_else(CoreLinRegOutput::nan));
        Ok(result.map(linreg_point))
    }

    #[napi(js_name = "nextInto")]
    pub fn next_into(
        &mut self,
        value: f64,
        mut output_value: Float64Array,
        mut output_upper: Float64Array,
        mut output_lower: Float64Array,
        mut output_slope: Float64Array,
        mut output_r: Float64Array,
        mut output_r_squared: Float64Array,
    ) -> Result<bool> {
        let output_value = unsafe { output_value.as_mut() };
        let output_upper = unsafe { output_upper.as_mut() };
        let output_lower = unsafe { output_lower.as_mut() };
        let output_slope = unsafe { output_slope.as_mut() };
        let output_r = unsafe { output_r.as_mut() };
        let output_r_squared = unsafe { output_r_squared.as_mut() };
        validate_finite(&[value])?;
        for (name, output) in [
            ("value", &*output_value),
            ("upper", &*output_upper),
            ("lower", &*output_lower),
            ("slope", &*output_slope),
            ("r", &*output_r),
            ("rSquared", &*output_r_squared),
        ] {
            validate_output(output, 1, name)?;
        }
        validate_output_disjoint(
            &[
                ("value", &*output_value),
                ("upper", &*output_upper),
                ("lower", &*output_lower),
                ("slope", &*output_slope),
                ("r", &*output_r),
                ("rSquared", &*output_r_squared),
            ],
            &[],
        )?;
        let result = self.inner.next(value);
        let value = result.unwrap_or_else(CoreLinRegOutput::nan);
        output_value[0] = value.value;
        output_upper[0] = value.upper;
        output_lower[0] = value.lower;
        output_slope[0] = value.slope;
        output_r[0] = value.r;
        output_r_squared[0] = value.r_squared;
        self.history.push(value);
        Ok(result.is_some())
    }

    #[napi]
    pub fn history(&self) -> LinRegOutput {
        let mut value = Vec::with_capacity(self.history.len());
        let mut upper = Vec::with_capacity(self.history.len());
        let mut lower = Vec::with_capacity(self.history.len());
        let mut slope = Vec::with_capacity(self.history.len());
        let mut r = Vec::with_capacity(self.history.len());
        let mut r_squared = Vec::with_capacity(self.history.len());
        for output in &self.history {
            value.push(output.value);
            upper.push(output.upper);
            lower.push(output.lower);
            slope.push(output.slope);
            r.push(output.r);
            r_squared.push(output.r_squared);
        }
        LinRegOutput {
            value: value.into(),
            upper: upper.into(),
            lower: lower.into(),
            slope: slope.into(),
            r: r.into(),
            r_squared: r_squared.into(),
        }
    }

    #[napi(getter)]
    pub fn history_length(&self) -> u32 {
        self.history.len() as u32
    }

    #[napi(js_name = "historyInto")]
    pub fn history_into(
        &self,
        mut value: Float64Array,
        mut upper: Float64Array,
        mut lower: Float64Array,
        mut slope: Float64Array,
        mut r: Float64Array,
        mut r_squared: Float64Array,
    ) -> Result<()> {
        let value = unsafe { value.as_mut() };
        let upper = unsafe { upper.as_mut() };
        let lower = unsafe { lower.as_mut() };
        let slope = unsafe { slope.as_mut() };
        let r = unsafe { r.as_mut() };
        let r_squared = unsafe { r_squared.as_mut() };
        let len = self.history.len();
        for (name, output) in [
            ("value", &*value),
            ("upper", &*upper),
            ("lower", &*lower),
            ("slope", &*slope),
            ("r", &*r),
            ("rSquared", &*r_squared),
        ] {
            validate_output(output, len, name)?;
        }
        validate_output_disjoint(
            &[
                ("value", &*value),
                ("upper", &*upper),
                ("lower", &*lower),
                ("slope", &*slope),
                ("r", &*r),
                ("rSquared", &*r_squared),
            ],
            &[],
        )?;
        for (index, output) in self.history.iter().enumerate() {
            value[index] = output.value;
            upper[index] = output.upper;
            lower[index] = output.lower;
            slope[index] = output.slope;
            r[index] = output.r;
            r_squared[index] = output.r_squared;
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

    #[napi(getter)]
    pub fn num_std_dev(&self) -> f64 {
        self.inner.num_std_dev()
    }
}
