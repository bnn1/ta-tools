import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["js/index.ts"],
  outDir: "dist",
  format: ["esm"],
  platform: "node",
  target: "node26",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: [
    "../native/index.js",
    /^node:/,
    /^@bnn1\/ta-tools-/,
  ],
});
