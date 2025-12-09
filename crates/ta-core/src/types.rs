//! Core data types for technical analysis calculations.

/// OHLCV (Open, High, Low, Close, Volume) candle data.
///
/// All price values use `f64` for precision as required by institutional-grade calculations.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OHLCV {
    /// Unix timestamp in milliseconds (UTC)
    pub timestamp: i64,
    /// Opening price
    pub open: f64,
    /// Highest price
    pub high: f64,
    /// Lowest price
    pub low: f64,
    /// Closing price
    pub close: f64,
    /// Trading volume
    pub volume: f64,
}

impl OHLCV {
    /// Creates a new OHLCV candle.
    #[must_use]
    pub const fn new(
        timestamp: i64,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) -> Self {
        Self {
            timestamp,
            open,
            high,
            low,
            close,
            volume,
        }
    }

    /// Returns the typical price: (high + low + close) / 3
    #[must_use]
    pub fn typical_price(&self) -> f64 {
        (self.high + self.low + self.close) / 3.0
    }

    /// Returns the median price: (high + low) / 2
    #[must_use]
    pub fn median_price(&self) -> f64 {
        (self.high + self.low) / 2.0
    }
}

/// Result type alias for indicator calculations.
pub type IndicatorResult<T> = Result<T, IndicatorError>;

/// Errors that can occur during indicator calculations.
#[derive(Debug, Clone, PartialEq)]
pub enum IndicatorError {
    /// Not enough data points to calculate the indicator
    InsufficientData { required: usize, provided: usize },
    /// Invalid parameter provided (e.g., period of 0)
    InvalidParameter(String),
    /// Indicator has not been properly initialized
    NotInitialized,
}

impl std::fmt::Display for IndicatorError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InsufficientData { required, provided } => {
                write!(
                    f,
                    "Insufficient data: required {required}, provided {provided}"
                )
            }
            Self::InvalidParameter(msg) => write!(f, "Invalid parameter: {msg}"),
            Self::NotInitialized => write!(f, "Indicator not initialized"),
        }
    }
}

impl std::error::Error for IndicatorError {}
