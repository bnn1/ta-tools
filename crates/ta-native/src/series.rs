//! Native bindings for scalar-series indicators.

use napi::bindgen_prelude::{Float64Array, Result};
use napi_derive::napi;
use ta_core::indicators::{
    Cvd as CoreCvd, CvdStream as CoreCvdStream, Ema as CoreEma, EmaStream as CoreEmaStream,
    Hma as CoreHma, HmaStream as CoreHmaStream, Rsi as CoreRsi, RsiStream as CoreRsiStream,
    Sma as CoreSma, SmaStream as CoreSmaStream, Wma as CoreWma, WmaStream as CoreWmaStream,
};
use ta_core::traits::{Indicator, StreamingIndicator};

use crate::error::{map_indicator_error, validate_finite, validate_no_infinite};

#[napi]
pub fn sma(data: &[f64], period: u32) -> Result<Float64Array> {
    validate_finite(data)?;

    let indicator = CoreSma::new(period as usize).map_err(map_indicator_error)?;
    let result = indicator.calculate(data).map_err(map_indicator_error)?;
    Ok(result.into())
}

#[napi(js_name = "SmaStream")]
pub struct NativeSmaStream {
    inner: CoreSmaStream,
}

#[napi]
impl NativeSmaStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreSmaStream::new(period as usize).map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Float64Array> {
        validate_finite(data)?;

        Ok(self.inner.init(data).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<f64>> {
        validate_finite(&[value])?;

        Ok(self.inner.next(value))
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

#[napi]
pub fn ema(data: &[f64], period: u32) -> Result<Float64Array> {
    validate_finite(data)?;

    let indicator = CoreEma::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate(data)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "EmaStream")]
pub struct NativeEmaStream {
    inner: CoreEmaStream,
}

#[napi]
impl NativeEmaStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreEmaStream::new(period as usize).map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Float64Array> {
        validate_finite(data)?;
        Ok(self.inner.init(data).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<f64>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value))
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
    pub fn multiplier(&self) -> f64 {
        self.inner.multiplier()
    }

    #[napi]
    pub fn current(&self) -> Option<f64> {
        self.inner.current()
    }
}

#[napi]
pub fn wma(data: &[f64], period: u32) -> Result<Float64Array> {
    validate_finite(data)?;

    let indicator = CoreWma::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate(data)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "WmaStream")]
pub struct NativeWmaStream {
    inner: CoreWmaStream,
}

#[napi]
impl NativeWmaStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreWmaStream::new(period as usize).map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Float64Array> {
        validate_finite(data)?;
        Ok(self.inner.init(data).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<f64>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value))
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

#[napi]
pub fn rsi(data: &[f64], period: u32) -> Result<Float64Array> {
    validate_finite(data)?;

    let indicator = CoreRsi::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate(data)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "RsiStream")]
pub struct NativeRsiStream {
    inner: CoreRsiStream,
}

#[napi]
impl NativeRsiStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreRsiStream::new(period as usize).map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Float64Array> {
        validate_finite(data)?;
        Ok(self.inner.init(data).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<f64>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value))
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
pub fn hma(data: &[f64], period: u32) -> Result<Float64Array> {
    validate_finite(data)?;

    let indicator = CoreHma::new(period as usize).map_err(map_indicator_error)?;
    Ok(indicator
        .calculate(data)
        .map_err(map_indicator_error)?
        .into())
}

#[napi(js_name = "HmaStream")]
pub struct NativeHmaStream {
    inner: CoreHmaStream,
}

#[napi]
impl NativeHmaStream {
    #[napi(constructor)]
    pub fn new(period: u32) -> Result<Self> {
        Ok(Self {
            inner: CoreHmaStream::new(period as usize).map_err(map_indicator_error)?,
        })
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Float64Array> {
        validate_finite(data)?;
        Ok(self.inner.init(data).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<f64>> {
        validate_finite(&[value])?;
        Ok(self.inner.next(value))
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
    pub fn half_period(&self) -> u32 {
        self.inner.half_period() as u32
    }

    #[napi(getter)]
    pub fn sqrt_period(&self) -> u32 {
        self.inner.sqrt_period() as u32
    }
}

#[napi]
pub fn cvd(data: &[f64]) -> Result<Float64Array> {
    validate_no_infinite(data, "data")?;

    let result = CoreCvd::new()
        .calculate(data)
        .map_err(map_indicator_error)?;
    Ok(result.into())
}

#[napi(js_name = "CvdStream")]
pub struct NativeCvdStream {
    inner: CoreCvdStream,
}

#[napi]
impl NativeCvdStream {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CoreCvdStream::new(),
        }
    }

    #[napi]
    pub fn init(&mut self, data: &[f64]) -> Result<Float64Array> {
        validate_no_infinite(data, "data")?;
        Ok(self.inner.init(data).map_err(map_indicator_error)?.into())
    }

    #[napi]
    pub fn next(&mut self, value: f64) -> Result<Option<f64>> {
        validate_no_infinite(&[value], "value")?;
        Ok(self.inner.next(value))
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
