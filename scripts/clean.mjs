import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";

const distDirectory = fileURLToPath(new URL("../dist", import.meta.url));

rmSync(distDirectory, { recursive: true, force: true });
