#!/usr/bin/env bash
set -euo pipefail

# ta-tools build script
# Compiles Rust to WASM and bundles the TypeScript wrapper

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🦀 Building WASM..."
wasm-pack build crates/ta-core \
    --target nodejs \
    --out-dir ../../pkg \
    --out-name ta_core

echo "📦 Bundling ESM..."
pnpm exec tsup

echo "✅ Build complete!"
echo "   WASM output: pkg/"
echo "   ESM output:  dist/"
