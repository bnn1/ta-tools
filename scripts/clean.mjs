import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";

const distDirectory = fileURLToPath(new URL("../dist", import.meta.url));
const nativeDirectory = fileURLToPath(new URL("../native", import.meta.url));
const legacyPackageDirectory = fileURLToPath(new URL("../pkg", import.meta.url));

rmSync(distDirectory, { recursive: true, force: true });
rmSync(nativeDirectory, { recursive: true, force: true });
rmSync(legacyPackageDirectory, { recursive: true, force: true });
