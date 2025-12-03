#!/usr/bin/env bash
set -euo pipefail

# ta-tools build script
# Compiles Rust to WASM and builds TypeScript wrapper

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🦀 Building WASM..."
wasm-pack build crates/ta-core \
    --target nodejs \
    --out-dir ../../pkg \
    --out-name ta_core

echo "📦 Building TypeScript..."
npx tsc

echo "✅ Build complete!"
echo "   WASM output: pkg/"
echo "   JS output:   dist/"
