const RARE_EARTH_PRODUCTS = [
  {
    id: "prnd-alloy",
    name: "镨钕合金",
    role: "N52核心主材",
    detailId: "310",
    color: "#69b7ad"
  },
  {
    id: "prnd-oxide",
    name: "镨钕氧化物",
    role: "上游原料",
    detailId: "711",
    color: "#d2a05f"
  },
  {
    id: "dyfe-alloy",
    name: "镝铁合金",
    role: "高温牌号添加",
    detailId: "311",
    color: "#c8797f"
  },
  {
    id: "dysprosium-oxide",
    name: "氧化镝",
    role: "重稀土上游",
    detailId: "309",
    color: "#7899c2"
  }
];

const BASE_URL = "https://www.100ppi.com";

function decodeEscapedString(value) {
  return String(value || "")
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function packerKey(value, radix) {
  if (value < radix) {
    return value > 35 ? String.fromCharCode(value + 29) : value.toString(36);
  }
  return `${packerKey(Math.floor(value / radix), radix)}${packerKey(value % radix, radix)}`;
}

function unpackPackerSource(html) {
  const match = String(html || "").match(
    /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\),0,\{\}\)\)/
  );
  if (!match) throw new Error("公开图表缺少可解析的价格序列。");

  let source = decodeEscapedString(match[1]);
  const radix = Number(match[2]);
  const count = Number(match[3]);
  const dictionary = decodeEscapedString(match[4]).split("|");
  for (let index = count - 1; index >= 0; index -= 1) {
    if (!dictionary[index]) continue;
    source = source.replace(new RegExp(`\\b${packerKey(index, radix)}\\b`, "g"), dictionary[index]);
  }
  return source;
}

function parseQuotedValues(value) {
  return [...String(value || "").matchAll(/'((?:\\.|[^'])*)'/g)]
    .map((match) => decodeEscapedString(match[1]));
}

function parseNumericValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
}

function parse100PpiGraph(html) {
  const source = unpackPackerSource(html);
  const xAxisStart = source.indexOf("xAxis:");
  const seriesStart = source.indexOf("series:");
  if (xAxisStart < 0 || seriesStart < 0 || seriesStart <= xAxisStart) {
    throw new Error("公开图表坐标轴结构不可识别。");
  }

  const dateMatch = source.slice(xAxisStart, seriesStart).match(/data:\[([^\]]*)\]/);
  const valueMatch = source.slice(seriesStart).match(/data:\[([^\]]*)\]/);
  const dates = parseQuotedValues(dateMatch?.[1]);
  const values = parseNumericValues(valueMatch?.[1]);
  const pointCount = Math.min(dates.length, values.length);
  const series = [];
  for (let index = 0; index < pointCount; index += 1) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dates[index])) continue;
    series.push({ date: dates[index], value: values[index] });
  }
  if (series.length < 2) throw new Error("公开图表历史价格点不足。");
  return series.sort((left, right) => left.date.localeCompare(right.date));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parse100PpiDetail(html) {
  const body = String(html || "");
  const price = Number(body.match(/class=["']price-fb01_1["'][^>]*>([^<]+)/i)?.[1]?.replace(/,/g, ""));
  const unit = decodeHtml(body.match(/class=["']price-fb01_2["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]);
  const changeText = decodeHtml(body.match(/class=["']price-fb02_1[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]);
  const dailyChange = Number(changeText.replace("%", ""));
  if (!Number.isFinite(price)) throw new Error("公开详情页缺少当前基准价。");
  return {
    price,
    unit: unit || "元/吨",
    dailyChange: Number.isFinite(dailyChange) ? dailyChange : null
  };
}

async function requestText(url, { cookie = "", fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Referer: `${BASE_URL}/rawmex/`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MarketLens/1.0",
        ...(cookie ? { Cookie: cookie } : {})
      }
    });
    if (!response.ok) throw new Error(`生意社公开数据请求失败 (${response.status})。`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function challengeCookie(html) {
  const token = String(html || "").match(/var _0x2 = "([a-f0-9]+)"/i)?.[1];
  return token ? `HW_CHECK=${token}` : "";
}

async function fetch100PpiPage(url, { cookie = "", fetchImpl = fetch } = {}) {
  let body = await requestText(url, { cookie, fetchImpl });
  const nextCookie = challengeCookie(body);
  if (nextCookie) body = await requestText(url, { cookie: nextCookie, fetchImpl });
  if (/正在进行安全检查/.test(body)) throw new Error("生意社公开数据安全校验未完成。");
  return body;
}

async function fetchRareEarthMarket({ fetchImpl = fetch } = {}) {
  const seedUrl = `${BASE_URL}/rawmex/detail-${RARE_EARTH_PRODUCTS[0].detailId}.html`;
  const seedBody = await requestText(seedUrl, { fetchImpl });
  const cookie = challengeCookie(seedBody);

  const results = await Promise.allSettled(RARE_EARTH_PRODUCTS.map(async (product, index) => {
    const detailUrl = `${BASE_URL}/rawmex/detail-${product.detailId}.html`;
    const graphUrl = `${BASE_URL}/graph/cindex.php?f=graph_ppid_ave&ppid=${product.detailId}`;
    const detailPromise = index === 0 && !cookie
      ? Promise.resolve(seedBody)
      : fetch100PpiPage(detailUrl, { cookie, fetchImpl });
    const [detailHtml, graphHtml] = await Promise.all([
      detailPromise,
      fetch100PpiPage(graphUrl, { cookie, fetchImpl })
    ]);
    const detail = parse100PpiDetail(detailHtml);
    const series = parse100PpiGraph(graphHtml);
    const latest = series[series.length - 1];
    series[series.length - 1] = { ...latest, value: detail.price };
    return {
      ...product,
      price: detail.price,
      unit: detail.unit,
      dailyChange: detail.dailyChange,
      priceDate: latest.date,
      source: "生意社公开基准价格",
      sourceUrl: detailUrl,
      series
    };
  }));

  const products = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  if (!products.length) {
    const firstError = results.find((result) => result.status === "rejected")?.reason;
    throw firstError || new Error("稀土公开价格暂不可用。");
  }

  return {
    products,
    source: "生意社公开基准价格",
    sourceUrl: `${BASE_URL}/rawmex/`,
    health: results.map((result, index) => ({
      id: RARE_EARTH_PRODUCTS[index].id,
      status: result.status,
      error: result.status === "rejected" ? result.reason?.message || "公开价格暂不可用" : ""
    })),
    refreshedAt: new Date().toISOString()
  };
}

module.exports = {
  RARE_EARTH_PRODUCTS,
  unpackPackerSource,
  parse100PpiGraph,
  parse100PpiDetail,
  fetchRareEarthMarket
};
