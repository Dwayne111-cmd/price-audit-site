import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "outputs");
const companyPricePath = path.join(publicDir, "data", "company-procurement-prices.json");
const priceHistoryPath = path.join(publicDir, "data", "price-history.json");
const materialsPath = path.join(publicDir, "data", "materials.json");

const port = Number(process.env.PORT || 8787);
const apiToken = process.env.API_TOKEN || "";

const profiles = [
  {
    match: /stm|gd32|mcu|n32|ch32|主控/i,
    category: "MCU / 主控IC",
    spec: "内核资源、Flash容量、温区、封装脚位",
    risk: "中风险",
    costBreakdown: [
      { label: "晶圆/内核资源", value: 38 },
      { label: "封装测试", value: 22 },
      { label: "品牌/生命周期", value: 20 },
      { label: "渠道/库存", value: 20 }
    ],
    drivers: ["Flash/RAM配置", "封装脚位", "温区/生命周期", "交期渠道"],
    actions: ["筛同内核同脚位替代料", "确认交期和生命周期", "把固件适配成本纳入议价"]
  },
  {
    match: /w25|gd25|mx25|flash|dram|nand|emmc|ddr|存储/i,
    category: "存储器 / Flash DRAM",
    spec: "容量、接口速率、封装、原厂渠道",
    risk: "高关注",
    costBreakdown: [
      { label: "存储晶圆/容量", value: 45 },
      { label: "封装测试", value: 18 },
      { label: "原厂配额/品牌", value: 22 },
      { label: "渠道/库存", value: 15 }
    ],
    drivers: ["容量密度", "接口速率", "原厂配额", "渠道库存"],
    actions: ["按季度锁价", "预留第二品牌认证", "拆分原厂/代理/现货报价"]
  },
  {
    match: /uf|nf|pf|x5r|x7r|np0|c0g|mlcc|ceramic|cap|电容|钽电容|铝电解/i,
    category: "陶瓷电容 / MLCC",
    spec: "尺寸、容值、电压、介质、耐温、车规等级",
    risk: "低风险",
    costBreakdown: [
      { label: "陶瓷粉体/电极", value: 35 },
      { label: "尺寸/容值/电压", value: 28 },
      { label: "可靠性等级", value: 17 },
      { label: "渠道/用量", value: 20 }
    ],
    drivers: ["尺寸/容值", "电压/介质", "可靠性等级", "年度用量"],
    actions: ["复核降容和电压余量", "高用量料单独谈阶梯价", "低风险料多品牌承认"]
  },
  {
    match: /ohm|Ω|kohm|mohm|毫欧|电阻|resistor|0\.1%|1%|5%/i,
    category: "贴片电阻 / 精密电阻",
    spec: "尺寸、阻值、精度、温漂、功率、车规等级",
    risk: "低风险",
    costBreakdown: [
      { label: "基材/膜层", value: 30 },
      { label: "精度/温漂", value: 26 },
      { label: "功率/车规", value: 18 },
      { label: "渠道/年度量", value: 26 }
    ],
    drivers: ["精度/温漂", "功率/尺寸", "车规等级", "年度用量"],
    actions: ["建立标准阻值库", "合并高用量阻值议价", "采样电阻替代前确认温漂和温升"]
  },
  {
    match: /uh|mh|inductor|bead|fb|磁珠|电感/i,
    category: "电感 / 磁珠",
    spec: "电感量、饱和电流、DCR、屏蔽结构、尺寸",
    risk: "中风险",
    costBreakdown: [
      { label: "磁芯/铜线", value: 34 },
      { label: "电流/DCR规格", value: 26 },
      { label: "屏蔽/尺寸结构", value: 18 },
      { label: "渠道/交期", value: 22 }
    ],
    drivers: ["饱和电流", "DCR/效率", "屏蔽结构", "交期渠道"],
    actions: ["筛同尺寸同电流等级替代料", "同步比较DCR和温升", "关键电源回路保留FAE验证"]
  },
  {
    match: /tps|mp|sy|ldo|buck|boost|dcdc|dc-dc|电源|pmic/i,
    category: "电源管理 / DC-DC LDO",
    spec: "输入电压、输出电流、效率、热阻",
    risk: "中风险",
    costBreakdown: [
      { label: "晶圆/功率器件", value: 36 },
      { label: "效率/保护功能", value: 24 },
      { label: "封装热设计", value: 18 },
      { label: "品牌/渠道", value: 22 }
    ],
    drivers: ["电流/电压", "效率/频率", "热设计封装", "品牌渠道"],
    actions: ["同步计算外围BOM", "确认关键负载点效率", "优先筛同封装同引脚替代料"]
  },
  {
    match: /usb|type-c|fpc|btb|connector|terminal|连接器|端子|线束/i,
    category: "连接器 / 端子线束",
    spec: "镀层、PIN数、插拔寿命、认证",
    risk: "中风险",
    costBreakdown: [
      { label: "金属端子/塑胶", value: 36 },
      { label: "镀层/PIN数", value: 28 },
      { label: "模具/加工", value: 18 },
      { label: "认证/交付", value: 18 }
    ],
    drivers: ["镀层/PIN数", "塑胶/端子", "模具加工", "认证交付"],
    actions: ["拆分端子/胶壳/加工费", "明确插拔寿命和阻燃等级", "建立标准连接器库"]
  },
  {
    match: /tvs|esd|保护|clamp|浪涌/i,
    category: "保护器件 / TVS ESD",
    spec: "工作电压、钳位电压、峰值功率、电容、封装",
    risk: "低风险",
    costBreakdown: [
      { label: "芯片/击穿结构", value: 32 },
      { label: "钳位/电容参数", value: 24 },
      { label: "封装/可靠性", value: 18 },
      { label: "渠道/用量", value: 26 }
    ],
    drivers: ["钳位/功率", "结电容", "封装尺寸", "渠道用量"],
    actions: ["按接口速率和浪涌等级筛选", "高速接口确认结电容", "通用保护料多品牌阶梯价"]
  }
];

const fallbackProfile = {
  category: "通用电子料",
  spec: "品牌、封装、温区、生命周期、渠道来源",
  risk: "待确认",
  costBreakdown: [
    { label: "核心材料/芯片", value: 34 },
    { label: "规格/封装", value: 24 },
    { label: "品牌/可靠性", value: 18 },
    { label: "渠道/交付", value: 24 }
  ],
  drivers: ["渠道来源", "库存日期", "起订量", "交付条件"],
  actions: ["补充规格参数", "按渠道分别询价", "记录目标价和替代认证状态"]
};

function getProfile(part = "") {
  return profiles.find((profile) => profile.match.test(part)) || fallbackProfile;
}

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function textResponse(res, statusCode, content, contentType) {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(content);
}

async function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function publicRecord(record) {
  if (!record) return null;
  const isExternal = record.sourceType === "external";
  const isManual = record.sourceType === "manual";
  return {
    part: record.part,
    category: record.category,
    unitPrice: Number(record.unitPrice),
    currency: record.currency || "CNY",
    date: record.date || "",
    priceBasis: isManual ? "手动输入价格" : isExternal ? "外部参考价" : "公司价格表",
    supplier: isManual || isExternal ? record.supplier || "" : "公司价格表"
  };
}

function findPart(records, part) {
  const keyword = String(part || "").trim().toLowerCase();
  if (!keyword) return { matchType: "missing", records: [] };
  const exact = records.filter((item) => String(item.part || "").toLowerCase() === keyword);
  if (exact.length) return { matchType: "exact", records: exact };
  const fuzzy = records.filter((item) => {
    const value = String(item.part || "").toLowerCase();
    return value.includes(keyword) || keyword.includes(value);
  });
  return { matchType: fuzzy.length ? "fuzzy" : "none", records: fuzzy };
}

function latest(records) {
  return [...records].sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).at(-1);
}

function weightedAverage(records) {
  const totalQty = records.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const totalValue = records.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 1), 0);
  return totalQty ? totalValue / totalQty : 0;
}

function buildTrend(records) {
  if (!records.length) return [];
  const monthMap = new Map();
  for (const record of records) {
    const month = String(record.date || "").slice(0, 7);
    if (!month) continue;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month).push(record);
  }
  const months = [...monthMap.keys()].sort();
  const averages = months.map((month) => weightedAverage(monthMap.get(month)));
  const baseline = averages[0] || 1;
  return months.map((month, index) => ({
    month,
    averagePrice: Number(averages[index].toFixed(6)),
    index: Number(((averages[index] / baseline) * 100).toFixed(2))
  }));
}

function selectPricedRecord(data, part) {
  const companyMatch = findPart(data.companyRecords, part);
  const externalMatch = findPart(data.externalRecords, part);
  const selectedCompany = latest(companyMatch.records);
  const selectedExternal = latest(externalMatch.records);
  const selected = selectedCompany || selectedExternal;
  return {
    matchType: selectedCompany ? companyMatch.matchType : selectedExternal ? externalMatch.matchType : "none",
    record: selected || null,
    priceBasis: selectedCompany ? "公司价格表" : selectedExternal ? "外部参考价" : "暂无价格数据"
  };
}

function attributionFactors(profile, comparable) {
  const items = comparable
    ? profile.costBreakdown
    : [
        { label: "品类/规格差异", value: 34 },
        { label: "品牌/生命周期", value: 24 },
        { label: "封装/认证条件", value: 20 },
        { label: "渠道/交付条件", value: 22 }
      ];
  return items.map((item, index) => ({
    label: item.label,
    share: item.value,
    driver: comparable ? profile.drivers[index] || "需结合规格书确认" : "跨品类不能直接按单价判断"
  }));
}

async function loadData() {
  const company = await readJson(companyPricePath, { records: [] });
  const history = await readJson(priceHistoryPath, { records: [] });
  const materials = await readJson(materialsPath, { materials: [] });
  return {
    companyRecords: (company.records || []).map((item) => ({ ...item, sourceType: "company" })),
    externalRecords: (history.records || []).map((item) => ({ ...item, sourceType: "external" })),
    materials: materials.materials || [],
    historyMode: history.mode || "unknown",
    historyUpdatedAt: history.updatedAt || null
  };
}

function requireAuth(req, res) {
  if (!apiToken) return true;
  const auth = req.headers.authorization || "";
  if (auth === `Bearer ${apiToken}`) return true;
  jsonResponse(res, 401, {
    ok: false,
    error: "unauthorized",
    message: "Missing or invalid Authorization Bearer token."
  });
  return false;
}

async function handleHealth(res) {
  const data = await loadData();
  jsonResponse(res, 200, {
    ok: true,
    service: "component-price-api",
    time: new Date().toISOString(),
    auth: apiToken ? "enabled" : "disabled",
    companyPriceCount: data.companyRecords.length,
    externalPriceCount: data.externalRecords.length,
    materialCount: data.materials.length
  });
}

async function handleCompanyPrice(url, res) {
  const part = url.searchParams.get("part") || "";
  const data = await loadData();
  const match = findPart(data.companyRecords, part);
  const selected = latest(match.records);
  if (!selected) {
    jsonResponse(res, 404, {
      ok: false,
      part,
      matchType: match.matchType,
      priceBasis: "公司价格表",
      message: "公司价格表未找到该物料。"
    });
    return;
  }
  jsonResponse(res, 200, {
    ok: true,
    part,
    matchType: match.matchType,
    record: publicRecord(selected),
    matches: match.records.map(publicRecord)
  });
}

async function handleAnalyzePart(url, res) {
  const part = url.searchParams.get("part") || "";
  if (!part.trim()) {
    jsonResponse(res, 400, { ok: false, error: "missing_part", message: "请提供 part 参数。" });
    return;
  }

  const data = await loadData();
  const companyMatch = findPart(data.companyRecords, part);
  const externalMatch = findPart(data.externalRecords, part);
  const profile = getProfile(part);
  const selectedCompany = latest(companyMatch.records);
  const selectedExternal = latest(externalMatch.records);
  const selected = selectedCompany || selectedExternal;

  jsonResponse(res, 200, {
    ok: true,
    part,
    category: selected?.category || profile.category,
    price: selected ? publicRecord(selected) : null,
    priceBasis: selectedCompany ? "公司价格表" : selectedExternal ? "外部参考价" : "暂无价格数据",
    matchType: selectedCompany ? companyMatch.matchType : selectedExternal ? externalMatch.matchType : "none",
    risk: profile.risk,
    keySpecs: profile.spec,
    factorWeights: profile.drivers,
    costBreakdownReference: profile.costBreakdown,
    actions: profile.actions,
    note: selectedCompany
      ? "已命中公司价格表，外部价格仅作为后续参考。"
      : selectedExternal
        ? "公司价格表未命中，当前返回外部参考价。"
        : "当前未找到价格，请补充公司价格表或等待外部采集。"
  });
}

async function handleCategoryTrend(url, res) {
  const category = url.searchParams.get("category") || "";
  const data = await loadData();
  const keyword = category.trim().toLowerCase();
  const matched = data.externalRecords.filter((item) => {
    const itemCategory = String(item.category || "").toLowerCase();
    return keyword ? itemCategory.includes(keyword) || keyword.includes(itemCategory) : false;
  });
  jsonResponse(res, 200, {
    ok: true,
    category,
    priceBasis: "外部参考价",
    status: matched.length ? "available" : "awaiting-collection",
    updatedAt: data.historyUpdatedAt,
    historyMode: data.historyMode,
    trend: buildTrend(matched)
  });
}

async function handleAttributePriceDifference(url, res) {
  const part = url.searchParams.get("part") || "";
  const comparePart = url.searchParams.get("comparePart") || "";
  const targetPrice = Number(url.searchParams.get("targetPrice") || "");
  const targetSource = url.searchParams.get("targetSource") || "manual-target";

  if (!part.trim()) {
    jsonResponse(res, 400, { ok: false, error: "missing_part", message: "请提供 part 参数。" });
    return;
  }

  const data = await loadData();
  const base = selectPricedRecord(data, part);
  const profile = getProfile(part);
  if (!base.record) {
    jsonResponse(res, 404, {
      ok: false,
      error: "missing_base_price",
      part,
      message: "公司价格表和外部参考价都未找到该物料，无法计算价差。"
    });
    return;
  }

  const compare = comparePart ? selectPricedRecord(data, comparePart) : { record: null, priceBasis: "暂无价格数据", matchType: "none" };
  const manualRecord = Number.isFinite(targetPrice) && targetPrice > 0
    ? {
        part: comparePart || "目标价",
        category: base.record.category || profile.category,
        unitPrice: targetPrice,
        currency: base.record.currency || "CNY",
        supplier: targetSource,
        date: new Date().toISOString().slice(0, 10),
        sourceType: "manual"
      }
    : null;
  const compareRecord = manualRecord || compare.record;
  const compareBasis = manualRecord ? targetSource : compare.priceBasis;

  if (!compareRecord) {
    jsonResponse(res, 422, {
      ok: false,
      error: "missing_compare_price",
      part,
      base: publicRecord(base.record),
      basePriceBasis: base.priceBasis,
      message: "已找到基准价，但缺少对比料号价格或 targetPrice。"
    });
    return;
  }

  const delta = Number((Number(compareRecord.unitPrice) - Number(base.record.unitPrice)).toFixed(6));
  const deltaPercent = base.record.unitPrice
    ? Number(((delta / Number(base.record.unitPrice)) * 100).toFixed(4))
    : null;
  const comparable = String(compareRecord.category || profile.category) === String(base.record.category || profile.category);

  jsonResponse(res, 200, {
    ok: true,
    part,
    comparePart: compareRecord.part,
    category: base.record.category || profile.category,
    comparable,
    conclusion: delta > 0 ? "compare_higher" : delta < 0 ? "compare_lower" : "same_price",
    base: publicRecord(base.record),
    basePriceBasis: base.priceBasis,
    compare: publicRecord(compareRecord),
    comparePriceBasis: compareBasis,
    delta: {
      currency: base.record.currency || "CNY",
      amount: delta,
      percent: deltaPercent
    },
    attributionFactors: attributionFactors(profile, comparable),
    actions: [
      "核对税率、MOQ、交期、包装和报价有效期。",
      "同品类替代料需复核封装、脚位、关键规格和可靠性等级。",
      "公司价格作为主锚点，外部公开价仅用于缺料补充或异常报价复核。"
    ]
  });
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}

async function serveStatic(req, res, url) {
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(publicDir, `.${pathname}`);
  if (!filePath.startsWith(publicDir)) {
    textResponse(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }
  if (!existsSync(filePath)) {
    textResponse(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }
  textResponse(res, 200, await readFile(filePath), mimeType(filePath));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "OPTIONS") {
      jsonResponse(res, 204, {});
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      if (!requireAuth(req, res)) return;
      if (url.pathname === "/api/health") return handleHealth(res);
      if (url.pathname === "/api/company-price") return handleCompanyPrice(url, res);
      if (url.pathname === "/api/analyze-part") return handleAnalyzePart(url, res);
      if (url.pathname === "/api/attribute-price-difference") return handleAttributePriceDifference(url, res);
      if (url.pathname === "/api/category-trend") return handleCategoryTrend(url, res);
      jsonResponse(res, 404, { ok: false, error: "not_found" });
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    jsonResponse(res, 500, {
      ok: false,
      error: "server_error",
      message: error.message
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Component price API listening on http://127.0.0.1:${port}`);
});
