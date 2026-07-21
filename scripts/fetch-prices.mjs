import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const materialsPath = path.join(root, "outputs", "data", "materials.json");
const sourceRegistryPath = path.join(root, "outputs", "data", "source-registry.json");
const historyPath = path.join(root, "outputs", "data", "price-history.json");

const today = new Date().toISOString().slice(0, 10);
const fetchedAt = new Date().toISOString();
const offline = process.argv.includes("--offline") || process.env.PRICE_SCRAPER_OFFLINE === "1";
const dryRun = process.argv.includes("--dry-run");
const sourceScope = process.env.PRICE_SCRAPER_SOURCE_SCOPE || "global";
const userAgent = "ProcurementPriceRadar/1.0 (+daily price index; contact: procurement)";

async function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchConfiguredJson(url, tokenName) {
  const headers = { "User-Agent": userAgent };
  const token = process.env[tokenName];
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url} failed: ${response.status}`);
  const text = await response.text();
  return { text, isCsv: url.toLowerCase().endsWith(".csv") };
}

async function loadMaterials() {
  if (process.env.MATERIALS_URL && !offline) {
    const payload = await fetchConfiguredJson(process.env.MATERIALS_URL, "MATERIALS_TOKEN");
    return payload.isCsv ? { materials: parseMaterialsCsv(payload.text) } : JSON.parse(payload.text);
  }
  return readJson(materialsPath, { materials: [] });
}

async function loadSourceRegistry() {
  if (process.env.SOURCE_REGISTRY_URL && !offline) {
    const payload = await fetchConfiguredJson(process.env.SOURCE_REGISTRY_URL, "SOURCE_REGISTRY_TOKEN");
    return JSON.parse(payload.text);
  }
  return readJson(sourceRegistryPath, { sources: [] });
}

function parseMaterialsCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
    const part = row.part || row["料号"] || row["型号"] || row["物料编码"];
    return {
      id: row.id || part,
      part,
      category: row.category || row["品类"] || row["分类"] || "通用电子料",
      brand: row.brand || row["品牌"] || "",
      targetQty: Number(row.targetQty || row["目标数量"] || row["年用量"] || 1),
      sources: parseCsvSources(row, part)
    };
  }).filter((item) => item.part);
}

function parseCsvSources(row, part) {
  const mapped = {
    lcsc: row.lcsc || row["立创关键词"],
    digikey: row.digikey || row["得捷关键词"],
    mouser: row.mouser || row["贸泽关键词"],
    octopart: row.octopart || row["Octopart关键词"],
    findchips: row.findchips || row["Findchips关键词"],
    trustedparts: row.trustedparts || row["TrustedParts关键词"],
    arrow: row.arrow || row["Arrow关键词"],
    avnet: row.avnet || row["Avnet关键词"]
  };
  const sources = {};
  for (const [id, keyword] of Object.entries(mapped)) {
    if (keyword) sources[id] = { keyword };
  }
  return Object.keys(sources).length ? sources : { all: { keyword: part } };
}

function splitCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  cells.push(value.trim());
  return cells;
}

function sourceConfigForMaterial(material, sourceDef) {
  return material.sources?.[sourceDef.id] || material.sources?.all || { keyword: material.part };
}

function sourceUrl(sourceDef, material) {
  const cfg = sourceConfigForMaterial(material, sourceDef);
  if (cfg.url) return cfg.url;
  if (!sourceDef.urlTemplate) return "";
  const keyword = encodeURIComponent(cfg.keyword || material.part);
  return sourceDef.urlTemplate.replaceAll("{keyword}", keyword);
}

function createRecord(material, sourceDef, price, currency, sourceUrlValue) {
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    date: today,
    part: material.part,
    category: material.category,
    supplier: sourceDef.name,
    unitPrice: Number(price.toFixed(6)),
    qty: Number(material.targetQty || 1),
    currency,
    source: sourceDef.id,
    sourceType: "external",
    sourceLabel: "外部参考价",
    sourceTier: sourceDef.tier || "unknown",
    sourceWeight: Number(sourceDef.weight || 0.7),
    sourceUrl: sourceUrlValue,
    fetchedAt
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      "Accept": "text/html,application/json;q=0.9,*/*;q=0.8"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

function extractFirstPrice(text) {
  const jsonLdPrices = [...text.matchAll(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (jsonLdPrices.length) return Math.min(...jsonLdPrices);

  const priceLike = [...text.matchAll(/(?:￥|¥|CNY|USD|\$|€)\s*([0-9]+(?:\.[0-9]+)?)/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);
  return priceLike.length ? Math.min(...priceLike) : null;
}

async function fetchGenericHtml(material, sourceDef) {
  const url = sourceUrl(sourceDef, material);
  if (!url) return { failure: `${sourceDef.name} has no searchable URL.` };
  const html = await fetchText(url);
  const price = extractFirstPrice(html);
  return price
    ? createRecord(material, sourceDef, price, sourceDef.currency || "USD", url)
    : { failure: `${sourceDef.name} price not found in page content.` };
}

async function fetchMouser(material, sourceDef) {
  const apiKey = process.env.MOUSER_API_KEY;
  const keyword = sourceConfigForMaterial(material, sourceDef).keyword || material.part;
  if (!apiKey) return { failure: "MOUSER_API_KEY not configured." };

  const url = `https://api.mouser.com/api/v1/search/partnumber?apiKey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": userAgent },
    body: JSON.stringify({
      SearchByPartRequest: {
        mouserPartNumber: keyword,
        partSearchOptions: ""
      }
    })
  });
  if (!response.ok) throw new Error(`Mouser ${response.status}`);
  const data = await response.json();
  const part = data.SearchResults?.Parts?.[0];
  const priceBreak = part?.PriceBreaks?.find((item) => Number(item.Quantity) <= Number(material.targetQty || 1))
    || part?.PriceBreaks?.[0];
  const price = Number(String(priceBreak?.Price || "").replace(/[^0-9.]/g, ""));
  return createRecord(material, sourceDef, price, "USD", part?.ProductDetailUrl || "")
    || { failure: "Mouser price not found." };
}

async function fetchDigiKey(material, sourceDef) {
  const token = process.env.DIGIKEY_ACCESS_TOKEN;
  const clientId = process.env.DIGIKEY_CLIENT_ID;
  const keyword = sourceConfigForMaterial(material, sourceDef).keyword || material.part;
  if (!token || !clientId) return { failure: "DIGIKEY_ACCESS_TOKEN and DIGIKEY_CLIENT_ID not configured." };

  const url = `https://api.digikey.com/products/v4/search/${encodeURIComponent(keyword)}/productdetails`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-DIGIKEY-Client-Id": clientId,
      "X-DIGIKEY-Locale-Site": "US",
      "X-DIGIKEY-Locale-Language": "en",
      "X-DIGIKEY-Locale-Currency": "USD",
      "User-Agent": userAgent
    }
  });
  if (!response.ok) throw new Error(`DigiKey ${response.status}`);
  const data = await response.json();
  const product = data.Product || data;
  const priceBreak = product.UnitPrice
    ? { UnitPrice: product.UnitPrice }
    : product.StandardPricing?.find((item) => Number(item.BreakQuantity) <= Number(material.targetQty || 1))
      || product.StandardPricing?.[0];
  const price = Number(priceBreak?.UnitPrice);
  return createRecord(material, sourceDef, price, "USD", product.ProductUrl || "")
    || { failure: "DigiKey price not found." };
}

async function fetchNexar(material, sourceDef) {
  const token = process.env.NEXAR_TOKEN;
  const keyword = sourceConfigForMaterial(material, sourceDef).keyword || material.part;
  if (!token) return { failure: "NEXAR_TOKEN not configured." };

  const query = `
    query SupSearch($q: String!) {
      supSearch(q: $q, limit: 1) {
        results {
          part {
            sellers {
              offers {
                clickUrl
                prices { price currency quantity }
              }
            }
          }
        }
      }
    }
  `;
  const response = await fetch("https://api.nexar.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": userAgent
    },
    body: JSON.stringify({ query, variables: { q: keyword } })
  });
  if (!response.ok) throw new Error(`Nexar ${response.status}`);
  const data = await response.json();
  const offers = data.data?.supSearch?.results?.[0]?.part?.sellers?.flatMap((seller) => seller.offers || []) || [];
  const prices = offers.flatMap((offer) => (offer.prices || []).map((price) => ({ ...price, clickUrl: offer.clickUrl })));
  const best = prices
    .filter((price) => Number.isFinite(Number(price.price)))
    .sort((a, b) => Number(a.price) - Number(b.price))[0];
  return best
    ? createRecord(material, sourceDef, Number(best.price), best.currency || "USD", best.clickUrl || "")
    : { failure: "Nexar price not found." };
}

function fetcherFor(sourceDef) {
  return {
    mouserApi: fetchMouser,
    digikeyApi: fetchDigiKey,
    nexarApi: fetchNexar,
    htmlSearch: fetchGenericHtml
  }[sourceDef.type] || fetchGenericHtml;
}

function enabledSourcesForMaterial(material, registrySources) {
  const enabled = registrySources.filter((source) => source.enabled !== false);
  if (sourceScope === "global") return enabled;
  const requested = Object.keys(material.sources || {});
  if (!requested.length || requested.includes("all")) return enabled;
  return enabled.filter((source) => requested.includes(source.id));
}

async function collectForMaterial(material, registrySources) {
  const records = [];
  const failures = [];
  const attempts = enabledSourcesForMaterial(material, registrySources);

  for (const sourceDef of attempts) {
    if (offline) {
      failures.push({ date: today, part: material.part, source: sourceDef.id, reason: "offline validation mode" });
      continue;
    }
    try {
      const result = await fetcherFor(sourceDef)(material, sourceDef);
      if (result?.unitPrice) {
        records.push(result);
      } else if (result?.failure) {
        failures.push({ date: today, part: material.part, source: sourceDef.id, reason: result.failure });
      }
    } catch (error) {
      failures.push({ date: today, part: material.part, source: sourceDef.id, reason: error.message });
    }
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.PRICE_SCRAPER_DELAY_MS || 700)));
  }
  return { records, failures };
}

function mergeHistory(existing, newRecords, failures) {
  const recordsByKey = new Map();
  for (const record of [...(existing.records || []), ...newRecords]) {
    const key = [record.date, record.part, record.supplier, record.source].join("|");
    recordsByKey.set(key, record);
  }
  const mergedRecords = [...recordsByKey.values()]
    .sort((a, b) => `${a.date}${a.part}${a.supplier}`.localeCompare(`${b.date}${b.part}${b.supplier}`));
  return {
    updatedAt: fetchedAt,
    mode: offline ? "offline-validation" : "global-price-source-registry",
    records: mergedRecords,
    failures: [...(existing.failures || []), ...failures].slice(-600)
  };
}

async function main() {
  const materialsDb = await loadMaterials();
  const sourceRegistry = await loadSourceRegistry();
  const materials = materialsDb.materials || [];
  const registrySources = sourceRegistry.sources || [];
  const existing = await readJson(historyPath, { records: [], failures: [] });
  const allRecords = [];
  const allFailures = [];

  for (const material of materials) {
    const result = await collectForMaterial(material, registrySources);
    allRecords.push(...result.records);
    allFailures.push(...result.failures);
  }

  const merged = mergeHistory(existing, allRecords, allFailures);
  if (!dryRun) {
    await mkdir(path.dirname(historyPath), { recursive: true });
    await writeFile(historyPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify({
    date: today,
    materials: materials.length,
    sources: registrySources.filter((source) => source.enabled !== false).length,
    sourceScope,
    newRecords: allRecords.length,
    failures: allFailures.length,
    output: path.relative(root, historyPath),
    offline,
    dryRun
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
