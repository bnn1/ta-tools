---
name: context7-mcp
description: 'Use Context7 to fetch current documentation for Rust crates and tooling, WebAssembly tools, TypeScript, Vitest, npm packages, and other version-sensitive libraries before writing or reviewing code.'
---

# Context7 documentation lookup

Use this skill whenever a task depends on a library, framework, compiler tool, CLI, API, or version-sensitive configuration. Do not rely on training-data memory for current APIs or commands.

## Workflow

1. Resolve the library ID with `resolve-library-id` using the library name and conveying the user's full intent as shortly as you can.
2. Select the closest authoritative, version-matched result.
3. Fetch the relevant documentation with `query-docs` using the specific task question and conveying the user's full intent as shortly as you can.
4. Compare the documentation with the installed version in `Cargo.toml`, `package.json`, or the lockfile.
5. Use repository source and tests to verify local behavior after the documentation lookup.

For this repository, common lookups include Rust, `wasm-bindgen`, `wasm-pack`, Binaryen/`wasm-opt`, TypeScript, Vitest, and npm package APIs.

If Context7 cannot resolve or retrieve the needed documentation, state that limitation and use authoritative upstream documentation or installed declarations as an explicit fallback. Never invent an API, option, command, or version.
