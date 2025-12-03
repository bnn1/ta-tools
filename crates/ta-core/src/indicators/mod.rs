//! Technical analysis indicators.
//!
//! This module contains all indicator implementations, each supporting
//! both batch and streaming calculation modes.

pub mod atr;
pub mod bbands;
pub mod ema;
pub mod macd;
pub mod rsi;
pub mod sma;
pub mod wma;

pub use atr::{Atr, AtrBar, AtrStream};
pub use bbands::{BBands, BBandsOutput, BBandsStream};
pub use ema::{Ema, EmaStream};
pub use macd::{Macd, MacdOutput, MacdStream, SignalType};
pub use rsi::{Rsi, RsiStream};
pub use sma::{Sma, SmaStream};
pub use wma::{Wma, WmaStream};
