import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(directory, "..");
const outputPath = path.join(repositoryRoot, "outputs", "data", "rare-earth.json");
const require = createRequire(import.meta.url);
const { fetchRareEarthMarket } = require("./rare-earth-source.cjs");

try {
  const payload = await fetchRareEarthMarket();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(`Updated ${payload.products.length} rare-earth products at ${payload.refreshedAt}.`);
} catch (error) {
  if (!fs.existsSync(outputPath)) throw error;
  console.warn(`Rare-earth refresh failed; keeping the last published snapshot: ${error.message}`);
}
