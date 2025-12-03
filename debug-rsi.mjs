// Debug script to compare RSI batch vs streaming

import { rsi, RsiStream } from './dist/index.js';

const SAMPLE_PRICES = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03];
const period = 5;

console.log('=== RSI Debug ===');
console.log('Prices:', SAMPLE_PRICES);
console.log('Period:', period);
console.log('');

// Batch calculation
const data = new Float64Array(SAMPLE_PRICES);
const batchResult = rsi(data, period);
console.log('Batch RSI results:');
for (let i = 0; i < batchResult.length; i++) {
  console.log(`  [${i}] price=${SAMPLE_PRICES[i].toFixed(2)} -> RSI=${Number.isNaN(batchResult[i]) ? 'NaN' : batchResult[i].toFixed(4)}`);
}

console.log('');

// Streaming calculation
const stream = new RsiStream(period);
console.log('Streaming RSI results:');
for (let i = 0; i < SAMPLE_PRICES.length; i++) {
  const result = stream.next(SAMPLE_PRICES[i]);
  const rsiValue = result === undefined ? 'undefined' : result.toFixed(4);
  console.log(`  [${i}] price=${SAMPLE_PRICES[i].toFixed(2)} -> RSI=${rsiValue}`);
}

console.log('');

// Compare side by side
console.log('=== Comparison ===');
const stream2 = new RsiStream(period);
const streamResult = stream2.init(data);

console.log('Index | Batch RSI    | Stream RSI   | Match?');
console.log('------|--------------|--------------|-------');
for (let i = 0; i < batchResult.length; i++) {
  const b = batchResult[i];
  const s = streamResult[i];
  const bStr = Number.isNaN(b) ? 'NaN'.padEnd(12) : b.toFixed(4).padEnd(12);
  const sStr = Number.isNaN(s) ? 'NaN'.padEnd(12) : s.toFixed(4).padEnd(12);
  
  let match = '?';
  if (Number.isNaN(b) && Number.isNaN(s)) {
    match = '✓';
  } else if (!Number.isNaN(b) && !Number.isNaN(s)) {
    match = Math.abs(b - s) < 0.0001 ? '✓' : `✗ (diff=${Math.abs(b-s).toFixed(4)})`;
  } else {
    match = '✗ (NaN mismatch)';
  }
  
  console.log(`  ${i}   | ${bStr} | ${sStr} | ${match}`);
}

// Manual calculation trace
console.log('');
console.log('=== Manual Calculation Trace ===');
console.log('Changes (price[i] - price[i-1]):');
for (let i = 1; i < SAMPLE_PRICES.length; i++) {
  const change = SAMPLE_PRICES[i] - SAMPLE_PRICES[i-1];
  const gain = change > 0 ? change : 0;
  const loss = change < 0 ? -change : 0;
  console.log(`  [${i-1}] ${SAMPLE_PRICES[i-1].toFixed(2)} -> ${SAMPLE_PRICES[i].toFixed(2)}: change=${change.toFixed(4)}, gain=${gain.toFixed(4)}, loss=${loss.toFixed(4)}`);
}

// Calculate what the first RSI should be
const changes = [];
for (let i = 1; i < SAMPLE_PRICES.length; i++) {
  changes.push(SAMPLE_PRICES[i] - SAMPLE_PRICES[i-1]);
}

const gains = changes.map(c => c > 0 ? c : 0);
const losses = changes.map(c => c < 0 ? -c : 0);

console.log('');
console.log(`First ${period} gains:`, gains.slice(0, period).map(g => g.toFixed(4)));
console.log(`First ${period} losses:`, losses.slice(0, period).map(l => l.toFixed(4)));

const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

console.log(`Avg Gain = ${avgGain.toFixed(6)}`);
console.log(`Avg Loss = ${avgLoss.toFixed(6)}`);

const rs = avgGain / avgLoss;
const expectedRsi = 100 - (100 / (1 + rs));
console.log(`RS = ${rs.toFixed(6)}`);
console.log(`Expected RSI at index ${period} = ${expectedRsi.toFixed(4)}`);
