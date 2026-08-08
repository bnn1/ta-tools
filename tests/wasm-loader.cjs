const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

const filename = path.resolve(
  __dirname,
  "../node_modules/@bnn1/ta-tools/pkg/ta_core.js",
);

if (!fs.existsSync(filename)) {
  throw new Error(
    `The original WASM package is missing its glue module: ${filename}`,
  );
}

const wasmModule = new Module(filename, module);
wasmModule.filename = filename;
wasmModule.paths = Module._nodeModulePaths(path.dirname(filename));
wasmModule._compile(fs.readFileSync(filename, "utf8"), filename);

module.exports = wasmModule.exports;
