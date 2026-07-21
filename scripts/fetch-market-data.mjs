import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "outputs", "data");
const historyDir = path.join(outputDir, "history");

const now = new Date();
const refreshedAt = now.toISOString();
const userAgent = "MarketLens static data collector/1.0";

const commodities = [
  { id: "gold", name: "黄金", code: "XAU/USD", goldApiSymbol: "XAU", tencentCode: "hf_GC", unit: "美元/盎司", color: "#d97706", favorite: true },
  { id: "silver", name: "国际银价", code: "XAG/USD", goldApiSymbol: "XAG", tencentCode: "hf_SI", unit: "美元/盎司", color: "#b7c4cf", favorite: true },
  { id: "wti", name: "国际原油", code: "WTI", fredSeries: "DCOILWTICO", tencentCode: "hf_CL", unit: "美元/桶", color: "#155eef", favorite: true },
  { id: "copper", name: "国际铜价", code: "PCOPPUSDM", fredSeries: "PCOPPUSDM", unit: "美元/吨", color: "#b45309", favorite: false }
];

const ranges = {
  "1D": { points: 2, minPoints: 2 },
  "5D": { points: 6, minPoints: 2 },
  "1M": { points: 24, minPoints: 2 },
  "6M": { points: 135, minPoints: 2 },
  "1Y": { points: 270, minPoints: 2 },
  "2Y": { points: 540, minPoints: 2 }
};

const funds = [
  { code: "001877", name: "宝盈国家安全战略沪港深股票A", type: "股票型", color: "#8aaeb0" },
  { code: "014193", name: "汇添富中证芯片产业指数增强A", type: "指数增强", color: "#b58d5b" },
  { code: "022365", name: "永赢科技智选混合C", type: "混合型", color: "#7696b8" }
];

async function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchText(url, extraHeaders = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/json,text/plain;q=0.9,*/*;q=0.8",
        ...extraHeaders
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

function parseCsvRows(text) {
  return text.trim().split(/\r?\n/).slice(1).map((line) => {
    const divider = line.indexOf(",");
    return divider > -1 ? [line.slice(0, divider), line.slice(divider + 1)] : [];
  }).filter((row) => row.length === 2);
}

function historyPointCount(item, range) {
  const setting = ranges[range] || ranges["2Y"];
  const count = setting.points || 540;
  return item.id === "copper" ? Math.max(2, Math.ceil(count / 21)) : count;
}

async function fetchFredHistory(item, range) {
  if (!item.fredSeries) throw new Error(`${item.name} has no FRED history mapping.`);
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(item.fredSeries)}`;
  const text = await fetchText(url);
  const allPoints = parseCsvRows(text).map(([label, rawValue]) => {
    const value = Number(rawValue);
    return {
      label,
      value: Number(value.toFixed(item.id === "copper" ? 2 : 4))
    };
  }).filter((point) => point.label && Number.isFinite(point.value));
  const points = allPoints.slice(-historyPointCount(item, range));
  const setting = ranges[range] || ranges["2Y"];
  if (points.length < setting.minPoints) throw new Error(`${item.name} FRED history has insufficient points.`);
  return {
    id: item.id,
    range,
    points,
    source: item.id === "copper" ? "FRED公开月频商品价格" : "FRED公开日频商品价格",
    refreshedAt
  };
}

async function fetchXausGoldHistory(item, range) {
  const payload = await fetchJson("https://xaus.com/api/v1/history");
  const allPoints = Array.isArray(payload?.points) ? payload.points.map((entry) => {
    const value = Number(entry.c);
    return {
      label: entry.d,
      value: Number(value.toFixed(4))
    };
  }).filter((point) => point.label && Number.isFinite(point.value)) : [];
  const points = allPoints.slice(-historyPointCount(item, range));
  const setting = ranges[range] || ranges["2Y"];
  if (points.length < setting.minPoints) throw new Error(`${item.name} XAUS history has insufficient points.`);
  return {
    id: item.id,
    range,
    points,
    source: "XAUS公开日频黄金现货",
    refreshedAt
  };
}

async function fetchXausSilverHistory(item, range) {
  const payload = await fetchJson("https://xaus.com/api/v1/intraday?symbol=xag&hours=48");
  const allPoints = Array.isArray(payload?.points) ? payload.points.map((entry) => {
    const timestamp = Number(entry.t) * 1000;
    const value = Number(entry.p);
    return {
      label: new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date(timestamp)),
      value: Number(value.toFixed(4))
    };
  }).filter((point) => point.label && Number.isFinite(point.value)) : [];
  const points = allPoints.slice(-Math.min(allPoints.length, Math.max(24, historyPointCount(item, range))));
  if (points.length < 2) throw new Error(`${item.name} XAUS intraday history has insufficient points.`);
  return {
    id: item.id,
    range,
    points,
    source: "XAUS公开48小时白银现货分时",
    refreshedAt
  };
}

async function fetchCommodityHistory(item, range) {
  if (item.id === "gold") return fetchXausGoldHistory(item, range);
  if (item.id === "silver") return fetchXausSilverHistory(item, range);
  return fetchFredHistory(item, range);
}

async function fetchGoldApiQuote(item) {
  if (!item.goldApiSymbol) return null;
  const payload = await fetchJson(`https://api.gold-api.com/price/${item.goldApiSymbol}`);
  const price = Number(payload?.price);
  if (!Number.isFinite(price)) throw new Error(`${item.name} Gold-API quote missing price.`);
  return {
    ...item,
    price: Number(price.toFixed(4)),
    change: null,
    source: "Gold-API公开现货报价",
    delayed: true,
    unavailable: false
  };
}

function parseTencentCommodityQuotes(body) {
  const quotes = new Map();
  const pattern = /v_(hf_[^=]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const fields = match[2].split(",");
    const price = Number(fields[0]);
    const change = Number(fields[1]);
    if (!Number.isFinite(price)) continue;
    quotes.set(match[1], {
      price,
      change: Number.isFinite(change) ? Number(change.toFixed(2)) : null,
      source: "腾讯财经公开期货行情",
      delayed: true,
      unavailable: false
    });
  }
  return quotes;
}

async function fetchTencentCommodityQuotes() {
  const codes = commodities.map((item) => item.tencentCode).filter(Boolean);
  if (!codes.length) return new Map();
  const body = await fetchText(`https://qt.gtimg.cn/q=${codes.join(",")}`, {
    Referer: "https://gu.qq.com/"
  });
  return parseTencentCommodityQuotes(body);
}

function quoteFromHistory(item, history) {
  const points = history.points || [];
  const latest = points.at(-1);
  const previous = points.at(-2);
  if (!latest || !previous || previous.value === 0) {
    return { ...item, price: null, change: null, source: history.source, delayed: true, unavailable: true };
  }
  return {
    ...item,
    price: latest.value,
    change: Number((((latest.value - previous.value) / previous.value) * 100).toFixed(2)),
    source: history.source,
    delayed: true,
    unavailable: false
  };
}

function parseTencentQuotes(body) {
  const quotes = [];
  const pattern = /v_([^=]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const fields = match[2].split("~");
    const price = Number(fields[3]);
    const previousClose = Number(fields[4]);
    const declaredPercentChange = Number(fields[5]);
    if (!Number.isFinite(price)) continue;
    const isCompactIndexQuote = match[1].startsWith("s_");
    quotes.push({
      code: match[1],
      name: fields[1] || match[1],
      price,
      change: isCompactIndexQuote && Number.isFinite(declaredPercentChange)
        ? Number(declaredPercentChange.toFixed(2))
        : Number.isFinite(previousClose) && previousClose !== 0
          ? Number((((price - previousClose) / previousClose) * 100).toFixed(2))
          : null,
      source: "腾讯财经公开行情"
    });
  }
  return quotes;
}

async function fetchMarketOverview() {
  const body = await fetchText("https://qt.gtimg.cn/q=s_sh000001,s_sz399001,fx_usdcny");
  const quotes = parseTencentQuotes(body);
  const byCode = new Map(quotes.map((item) => [item.code, item]));
  return {
    shanghai: byCode.get("s_sh000001") || null,
    shenzhen: byCode.get("s_sz399001") || null,
    usdcny: byCode.get("fx_usdcny") || null
  };
}

function sectorGroup(name) {
  if (/军工|航天|航空|兵装|兵器|船舶|雷达|卫星/.test(name)) return "defense";
  if (/银行|证券|保险|多元金融/.test(name)) return "finance";
  if (/半导体|通信|软件|电子|算力|人工智能|计算机/.test(name)) return "tech";
  if (/煤炭|石油|化工|有色|钢铁|电力|燃气/.test(name)) return "cycle";
  return "other";
}

function makeSector(item) {
  const name = String(item.f14 || "未命名板块");
  const rising = Math.max(0, Number(item.f104) || 0);
  const falling = Math.max(0, Number(item.f105) || 0);
  const change = Number(item.f3) || 0;
  const flow = (Number(item.f62) || 0) / 100_000_000;
  return {
    name,
    group: sectorGroup(name),
    change: Number(change.toFixed(2)),
    heat: Math.max(18, Math.min(99, Math.round(50 + change * 8 + Math.min(18, Math.abs(flow))))),
    flow: Number(flow.toFixed(1)),
    breadth: rising || falling ? `${rising}/${rising + falling}` : "--"
  };
}

async function fetchEastmoneyList(params) {
  const query = new URLSearchParams({
    ut: "fa5fd1943c7b386f172d6893dbfba10b",
    ...params
  });
  const payload = await fetchJson(`https://push2delay.eastmoney.com/api/qt/clist/get?${query}`);
  if (!payload?.data) throw new Error("Eastmoney public list returned no data.");
  return payload;
}

async function fetchEastmoneySectorPage(type) {
  const payload = await fetchEastmoneyList({
    pn: "1",
    pz: "100",
    po: "1",
    np: "1",
    fltt: "2",
    invt: "2",
    fid: "f3",
    fs: `m:90+t:${type}`,
    fields: "f12,f14,f2,f3,f62,f104,f105"
  });
  return Array.isArray(payload?.data?.diff) ? payload.data.diff.map(makeSector) : [];
}

async function fetchSectors() {
  const [industry, concept] = await Promise.all([fetchEastmoneySectorPage(2), fetchEastmoneySectorPage(3)]);
  const all = [...industry, ...concept];
  const selected = [];
  const seen = new Set();
  const isFocus = (item) => /军工|航天|航空|银行|证券|保险|半导体|煤炭|石油|化工|电力/.test(item.name);
  for (const item of [...all.filter(isFocus), ...all]) {
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    selected.push(item);
    if (selected.length === 24) break;
  }
  return selected.sort((left, right) => right.change - left.change);
}

async function fetchAShareBreadth() {
  const fs = "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23";
  const payload = await fetchEastmoneyList({
    pn: "1",
    pz: "100",
    po: "1",
    np: "1",
    fltt: "2",
    invt: "2",
    fid: "f3",
    fs,
    fields: "f12,f3"
  });
  const total = Number(payload?.data?.total) || 0;
  const pageCount = Math.min(55, Math.ceil(total / 100));
  const rows = Array.isArray(payload?.data?.diff) ? [...payload.data.diff] : [];
  for (let page = 2; page <= pageCount; page += 1) {
    const next = await fetchEastmoneyList({
      pn: String(page),
      pz: "100",
      po: "1",
      np: "1",
      fltt: "2",
      invt: "2",
      fid: "f3",
      fs,
      fields: "f12,f3"
    }).catch(() => null);
    if (Array.isArray(next?.data?.diff)) rows.push(...next.data.diff);
  }
  const result = { rising: 0, falling: 0, flat: 0, total: 0 };
  for (const row of rows) {
    const change = Number(row.f3);
    if (!Number.isFinite(change)) continue;
    result.total += 1;
    if (change > 0) result.rising += 1;
    else if (change < 0) result.falling += 1;
    else result.flat += 1;
  }
  if (!result.total) throw new Error("A-share breadth returned no securities.");
  return result;
}

function chinaIsoDate(timestamp) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(timestamp));
}

function eastmoneyJsValue(body, variableName) {
  const match = body.match(new RegExp(`var\\s+${variableName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`Fund data missing ${variableName}.`);
  return JSON.parse(match[1]);
}

function eastmoneyJsString(body, variableName) {
  const match = body.match(new RegExp(`var\\s+${variableName}\\s*=\\s*"([^"]*)";`));
  return match?.[1] || "";
}

async function fetchFundHistory(fund) {
  const body = await fetchText(
    `https://fund.eastmoney.com/pingzhongdata/${fund.code}.js?v=${Date.now()}`,
    { Referer: `https://fund.eastmoney.com/${fund.code}.html` }
  );
  const sourceSeries = eastmoneyJsValue(body, "Data_netWorthTrend");
  const series = sourceSeries.map((entry) => ({
    date: chinaIsoDate(Number(entry.x)),
    timestamp: Number(entry.x),
    value: Number(entry.y),
    change: Number(entry.equityReturn)
  })).filter((entry) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.value))
    .sort((left, right) => left.timestamp - right.timestamp);
  if (series.length < 2) throw new Error(`${fund.code} public net-worth history is insufficient.`);
  const latest = series.at(-1);
  const previous = series.at(-2);
  const dailyChange = Number.isFinite(latest.change)
    ? latest.change
    : ((latest.value - previous.value) / previous.value) * 100;
  const twoYearsAgo = Date.now() - 770 * 24 * 60 * 60_000;
  const visibleSeries = series.filter((entry) => entry.timestamp >= twoYearsAgo);
  return {
    code: fund.code,
    name: eastmoneyJsString(body, "fS_name") || fund.name,
    type: fund.type,
    color: fund.color,
    nav: latest.value,
    navDate: latest.date,
    dailyChange: Number.isFinite(dailyChange) ? Number(dailyChange.toFixed(2)) : null,
    source: "东方财富公开历史净值",
    series: visibleSeries.length >= 2 ? visibleSeries : series.slice(-2)
  };
}

async function keepPrevious(filePath, fallback) {
  return readJson(filePath, fallback);
}

async function main() {
  await mkdir(historyDir, { recursive: true });

  const histories = new Map();
  const health = {};
  for (const item of commodities) {
    for (const range of Object.keys(ranges)) {
      const filePath = path.join(historyDir, `${item.id}-${range}.json`);
      try {
        const history = await fetchCommodityHistory(item, range);
        histories.set(`${item.id}:${range}`, history);
        await writeJson(filePath, history);
        health[`history:${item.id}:${range}`] = "fulfilled";
      } catch (error) {
        const previous = await keepPrevious(filePath, null);
        if (previous?.points?.length) histories.set(`${item.id}:${range}`, previous);
        health[`history:${item.id}:${range}`] = `reused-previous: ${error.message}`;
      }
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
  }

  const [tencentCommodityResult, goldApiResults] = await Promise.all([
    fetchTencentCommodityQuotes().catch(() => new Map()),
    Promise.allSettled(commodities.map(fetchGoldApiQuote))
  ]);
  const goldApiQuotes = new Map();
  goldApiResults.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      goldApiQuotes.set(commodities[index].id, result.value);
    }
  });

  const liveCommodities = commodities.map((item) => {
    const history = histories.get(`${item.id}:1D`) || histories.get(`${item.id}:1M`) || histories.get(`${item.id}:2Y`);
    const goldApiQuote = goldApiQuotes.get(item.id);
    if (goldApiQuote) {
      const tencentQuote = item.tencentCode ? tencentCommodityResult.get(item.tencentCode) : null;
      return {
        ...goldApiQuote,
        change: tencentQuote?.change ?? goldApiQuote.change
      };
    }
    if (history) return quoteFromHistory(item, history);
    const tencentQuote = item.tencentCode ? tencentCommodityResult.get(item.tencentCode) : null;
    return tencentQuote
      ? { ...item, ...tencentQuote }
      : { ...item, price: null, change: null, source: "公开数据暂不可用", unavailable: true };
  });

  const [overviewResult, sectorsResult, breadthResult] = await Promise.allSettled([
    fetchMarketOverview(),
    fetchSectors(),
    fetchAShareBreadth()
  ]);

  const previousMarket = await keepPrevious(path.join(outputDir, "market.json"), {});
  const market = {
    commodities: liveCommodities,
    sectors: sectorsResult.status === "fulfilled" ? sectorsResult.value : previousMarket.sectors || [],
    aShareBreadth: breadthResult.status === "fulfilled" ? breadthResult.value : previousMarket.aShareBreadth || null,
    aShareStatus: {
      configured: false,
      isTradingDay: null,
      date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(now),
      limited: false
    },
    overview: overviewResult.status === "fulfilled" ? overviewResult.value : previousMarket.overview || null,
    sources: {
      commodities: "XAUS公开贵金属历史 / FRED公开商品历史 / Gold-API公开现货 / 腾讯财经公开期货",
      sectors: "东方财富延迟公开行情",
      breadth: "东方财富延迟公开A股列表",
      indexes: "腾讯财经公开行情"
    },
    health: {
      ...health,
      overview: overviewResult.status,
      sectors: sectorsResult.status,
      breadth: breadthResult.status
    },
    refreshedAt
  };
  await writeJson(path.join(outputDir, "market.json"), market);

  const fundResults = await Promise.allSettled(funds.map(fetchFundHistory));
  const previousFunds = await keepPrevious(path.join(outputDir, "funds.json"), {});
  const fundPayload = {
    funds: fundResults.filter((result) => result.status === "fulfilled").map((result) => result.value),
    source: "东方财富公开历史净值",
    health: fundResults.map((result, index) => ({
      code: funds[index].code,
      status: result.status,
      error: result.status === "rejected" ? result.reason?.message || "公开净值暂不可用" : ""
    })),
    refreshedAt
  };
  if (!fundPayload.funds.length && Array.isArray(previousFunds.funds)) {
    fundPayload.funds = previousFunds.funds;
    fundPayload.health.push({ code: "previous", status: "reused", error: "本次基金数据抓取失败，沿用上次静态数据。" });
  }
  await writeJson(path.join(outputDir, "funds.json"), fundPayload);

  console.log(JSON.stringify({
    refreshedAt,
    commodities: liveCommodities.filter((item) => Number.isFinite(item.price)).length,
    sectors: market.sectors.length,
    breadth: Boolean(market.aShareBreadth),
    funds: fundPayload.funds.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
