import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(scriptDirectory, "..");

function argumentsMap(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error(`Invalid argument near ${key || "end of command"}`);
    result.set(key.slice(2), value);
  }
  return result;
}

const options = argumentsMap(process.argv.slice(2));
const deployRepository = path.resolve(options.get("deploy-repo") || "C:/Users/15175/Documents/Codex/2026-07-08/new-chat-2");
const sourceRoot = path.resolve(options.get("source-root") || path.join(workspace, "outputs", "market-dashboard"));
const apiBase = options.get("api") || "http://127.0.0.1:8900";
const keyFile = path.resolve(options.get("key-file") || path.join(deployRepository, "private-data", "component-access-key.txt"));
const deployOutput = path.join(deployRepository, "outputs");
const secureOutput = path.join(deployOutput, "data", "component-quotes.secure.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function ensureAccessKey() {
  fs.mkdirSync(path.dirname(keyFile), { recursive: true });
  if (fs.existsSync(keyFile)) {
    const existing = fs.readFileSync(keyFile, "utf8").trim();
    if (existing.length >= 12) return existing;
  }
  const generated = crypto.randomBytes(12).toString("base64url");
  fs.writeFileSync(keyFile, `${generated}\n`, "utf8");
  return generated;
}

async function mapConcurrent(items, limit, operation) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await operation(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function exportInternalQuotes() {
  const sourcePath = path.join(sourceRoot, "data", "internal-quotes.json");
  const source = readJson(sourcePath);
  const queries = [...new Set((source.quotes || []).map((quote) => quote.materialCode || quote.model).filter(Boolean))];
  if (!queries.length) throw new Error("The internal quote database contains no searchable records.");

  const batches = await mapConcurrent(queries, 6, async (query) => {
    const url = new URL("/api/component-quotes", apiBase);
    url.searchParams.set("mpn", query);
    url.searchParams.set("source", "internal");
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(`${query}: ${payload.error || `HTTP ${response.status}`}`);
    return Array.isArray(payload.quotes) ? payload.quotes.filter((quote) => quote.sourceType === "internal") : [];
  });

  const quotesById = new Map();
  batches.flat().forEach((quote) => quotesById.set(quote.id, quote));
  const quotes = [...quotesById.values()].sort((left, right) => String(left.materialCode).localeCompare(String(right.materialCode), "zh-CN"));
  if (quotes.length !== source.quotes.length) {
    throw new Error(`Secure export count mismatch: source ${source.quotes.length}, exported ${quotes.length}.`);
  }

  const accessKey = ensureAccessKey();
  const payload = Buffer.from(JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceGeneratedAt: source.generatedAt || null,
    quotes
  }), "utf8");
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const iterations = 250000;
  const key = crypto.pbkdf2Sync(accessKey, salt, iterations, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final(), cipher.getAuthTag()]);
  writeJson(secureOutput, {
    version: 1,
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  });
  return { count: quotes.length, accessKey };
}

function exportRareEarthSnapshot() {
  const snapshotStore = readJson(path.join(sourceRoot, "data", "background-snapshots.json"));
  const rareEarth = snapshotStore.snapshots?.["rare-earth"];
  if (!rareEarth?.products?.length) throw new Error("The local rare-earth snapshot is unavailable.");
  writeJson(path.join(deployOutput, "data", "rare-earth.json"), rareEarth);
  return rareEarth.products.length;
}

function copyConceptFiles() {
  const sourceDirectory = path.join(sourceRoot, "ui-concepts");
  const outputDirectory = path.join(deployOutput, "ui-concepts");
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const name of ["index.html", "concepts.css", "observatory.css", "concepts.js"]) {
    fs.copyFileSync(path.join(sourceDirectory, name), path.join(outputDirectory, name));
  }
  const indexPath = path.join(outputDirectory, "index.html");
  const html = fs.readFileSync(indexPath, "utf8")
    .replace('data-concept-href="../index.html#fundWorkspace"', 'data-concept-href="../market-dashboard.html#fundWorkspace"');
  fs.writeFileSync(indexPath, html, "utf8");
}

async function main() {
  const componentResult = await exportInternalQuotes();
  const rareEarthCount = exportRareEarthSnapshot();
  copyConceptFiles();
  console.log(`Encrypted ${componentResult.count} component records.`);
  console.log(`Exported ${rareEarthCount} rare-earth products.`);
  console.log(`Access key file: ${keyFile}`);
  console.log(`Pages output: ${deployOutput}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
