# ta-tools

A high-performance Technical Analysis library written in **Rust** and compiled to **WebAssembly**.

`ta-tools` provides near-native calculation speeds for technical indicators while remaining universally compatible across Node.js, Bun, Deno, and modern browsers.

### Why?

Most existing TA libraries fall into two categories:
1.  **Pure JavaScript:** Easy to use but suffers from garbage collection overhead during heavy calculations.
2.  **Native C++ Add-ons (e.g., `tulind`):** Fast, but require complex compile-chains (`node-gyp`) on installation and do not run in the browser.

`ta-tools` solves this by using **WebAssembly**. It offers the performance of C++ with the portability of JavaScript.
*   **Zero Compilation:** Users do not need a C++ compiler installed.
*   **Universal:** The exact same package runs on the server and the client.
*   **Type Safe:** Built with Rust for memory safety and correctness.

---

## Installation

```bash
npm install ta-tools
```

---

## Usage/API

**Under development.**

---

## Performance Notes

`ta-tools` is optimized to minimize boundary overhead between JavaScript and WebAssembly.
*   **Memory:** Uses flat memory arrays to avoid object overhead.
*   **Precision:** All calculations are performed using 64-bit floating-point precision (`f64`).

---

## Development

Prerequisites:
*   [Rust](https://www.rust-lang.org/tools/install)
*   [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

**Build for distribution:**
To generate the universal package (Node + Web), run the build scripts:

```bash
# Build node version (CommonJS/ESM compat)
wasm-pack build --target nodejs --out-dir pkg/node

# Build web version (ESM)
wasm-pack build --target web --out-dir pkg/web
```

**Run Tests:**
```bash
cargo test
```

## License

MIT