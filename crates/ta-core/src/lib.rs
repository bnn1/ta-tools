//! ta-core: High-performance technical analysis indicators
//!
//! This crate provides technical analysis indicators optimized for:
//! - **Batch mode**: Calculate over historical data arrays
//! - **Streaming mode**: O(1) incremental updates for live data

#![deny(clippy::all)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

pub mod indicators;
pub mod traits;
pub mod types;

#[cfg(feature = "wasm")]
pub mod wasm;

pub use traits::{Indicator, StreamingIndicator};
pub use types::OHLCV;
