const categories = [
  {
    name: "MCU / 主控IC",
    icon: "IC",
    tone: "#62e3d6",
    trend: "稳中偏紧",
    copy: "价格差异通常来自内核资源、Flash/RAM、封装脚位、温区与生态锁定。国产替代可行，但需要关注量产验证周期。",
    values: [101, 100, 99, 100, 102, 104, 103, 105, 107, 108, 109, 111],
    driver: "Flash容量 / 供货周期",
    factorShare: [
      { label: "容量/外设", value: 34 },
      { label: "封装脚位", value: 24 },
      { label: "温区/生命周期", value: 18 },
      { label: "渠道交期", value: 24 }
    ],
    action: "重点询同系列降配与Pin-to-Pin替代"
  },
  {
    name: "存储器 / Flash DRAM",
    icon: "MEM",
    tone: "#5f9df7",
    trend: "上行明显",
    copy: "AI服务器与企业SSD需求推高存储链条景气度，报价需单独拆分容量、速率、封装与原厂渠道溢价。",
    values: [92, 94, 98, 101, 106, 112, 118, 124, 129, 136, 142, 149],
    driver: "容量密度 / 原厂配额",
    factorShare: [
      { label: "容量密度", value: 42 },
      { label: "接口/速度", value: 18 },
      { label: "原厂配额", value: 26 },
      { label: "渠道库存", value: 14 }
    ],
    action: "锁季度价格，预留第二品牌认证"
  },
  {
    name: "陶瓷电容 / MLCC",
    icon: "CAP",
    tone: "#8edb91",
    trend: "低位修复",
    copy: "常见价差来自尺寸、容值、电压、介质、厚度和车规等级。小尺寸高容值、X7R高压和车规MLCC仍有结构性溢价。",
    values: [100, 98, 96, 95, 96, 97, 99, 100, 102, 103, 104, 105],
    driver: "尺寸 / 容值 / 介质",
    factorShare: [
      { label: "尺寸/容值", value: 36 },
      { label: "电压/介质", value: 28 },
      { label: "可靠性等级", value: 16 },
      { label: "渠道用量", value: 20 }
    ],
    action: "复核降容、电压余量和库存周转"
  },
  {
    name: "贴片电阻 / 精密电阻",
    icon: "RES",
    tone: "#b6d46b",
    trend: "低波动",
    copy: "价格通常由尺寸、阻值、精度、温漂、功率和车规等级决定。单价低但用量大，适合做阶梯价和多品牌承认。",
    values: [100, 99, 99, 98, 98, 99, 99, 100, 100, 101, 101, 101],
    driver: "精度 / 温漂 / 功率",
    factorShare: [
      { label: "精度/温漂", value: 32 },
      { label: "功率/尺寸", value: 22 },
      { label: "车规等级", value: 14 },
      { label: "年度用量", value: 32 }
    ],
    action: "按年度用量谈阶梯价，建立通用阻值库"
  },
  {
    name: "铝电解 / 钽电容",
    icon: "ELC",
    tone: "#76c7f2",
    trend: "结构分化",
    copy: "容量、电压、寿命、ESR、耐温和品牌系列会拉开价格。高可靠、长寿命、低ESR型号需单独比较规格余量。",
    values: [101, 101, 100, 100, 101, 102, 103, 104, 104, 105, 106, 106],
    driver: "寿命 / ESR / 耐温",
    factorShare: [
      { label: "容量/电压", value: 28 },
      { label: "寿命/耐温", value: 30 },
      { label: "ESR/纹波", value: 22 },
      { label: "品牌渠道", value: 20 }
    ],
    action: "核对寿命小时数和纹波电流后再替代"
  },
  {
    name: "电感 / 磁珠",
    icon: "IND",
    tone: "#d5b86a",
    trend: "温和上行",
    copy: "核心价差来自电感量、饱和电流、DCR、屏蔽结构、尺寸和频率特性。电源类电感要连同效率和温升一起看。",
    values: [99, 99, 100, 101, 101, 102, 103, 104, 105, 105, 106, 107],
    driver: "饱和电流 / DCR / 尺寸",
    factorShare: [
      { label: "饱和电流", value: 30 },
      { label: "DCR/效率", value: 24 },
      { label: "尺寸/屏蔽", value: 24 },
      { label: "交期渠道", value: 22 }
    ],
    action: "同步验证效率、温升和EMI余量"
  },
  {
    name: "电源管理 / DC-DC LDO",
    icon: "PWR",
    tone: "#e7b85a",
    trend: "分化",
    copy: "价差由输入电压、输出电流、效率、频率、保护功能和封装热阻决定，国产替代空间通常较大。",
    values: [103, 102, 101, 100, 101, 103, 102, 104, 106, 107, 106, 108],
    driver: "电流能力 / 热设计",
    factorShare: [
      { label: "电流/电压", value: 32 },
      { label: "效率/频率", value: 24 },
      { label: "热设计封装", value: 20 },
      { label: "品牌渠道", value: 24 }
    ],
    action: "同步比对效率曲线和外围BOM成本"
  },
  {
    name: "连接器 / 端子线束",
    icon: "CON",
    tone: "#ef806d",
    trend: "温和上涨",
    copy: "金属件、塑胶料、镀层厚度、插拔寿命和认证要求会放大价差。需与结构和可靠性要求一起评估。",
    values: [99, 100, 101, 101, 102, 104, 105, 106, 107, 108, 109, 111],
    driver: "镀层 / 认证 / 模具",
    factorShare: [
      { label: "镀层/PIN数", value: 32 },
      { label: "塑胶/端子", value: 26 },
      { label: "模具加工", value: 20 },
      { label: "认证交付", value: 22 }
    ],
    action: "拆分端子、胶壳、线束加工费用"
  },
  {
    name: "保护器件 / TVS ESD",
    icon: "ESD",
    tone: "#c8a2ff",
    trend: "平稳",
    copy: "参数差异集中在反向工作电压、钳位电压、峰值脉冲功率、电容和封装尺寸，单价低但失效成本高。",
    values: [100, 100, 99, 99, 100, 100, 101, 100, 101, 101, 102, 102],
    driver: "钳位电压 / 电容",
    factorShare: [
      { label: "钳位/功率", value: 34 },
      { label: "结电容", value: 24 },
      { label: "封装尺寸", value: 18 },
      { label: "渠道用量", value: 24 }
    ],
    action: "按接口速率和浪涌等级筛选"
  }
];

const vendorConnectors = [
  {
    name: "公司价格表",
    status: "主数据",
    method: "company-procurement-prices.json 或临时导入采购表",
    note: "用于料号分析和议价基准。"
  },
  {
    name: "授权分销源",
    status: "补缺参考",
    method: "DigiKey、Mouser、Arrow、Avnet、RS、TME 等",
    note: "仅在公司表没有对应物料时用于参考。"
  },
  {
    name: "聚合搜索源",
    status: "补缺覆盖",
    method: "Octopart/Nexar、Findchips、TrustedParts 等",
    note: "用于补齐跨区域、跨供应商参考样本。"
  },
  {
    name: "国内公开源",
    status: "本土参考",
    method: "LCSC、云汉芯城、华秋商城等",
    note: "用于观察国内现货与常用品类波动。"
  },
  {
    name: "自定义源池",
    status: "可扩展",
    method: "source-registry.json 或 SOURCE_REGISTRY_URL",
    note: "新增网站只改配置，仍作为缺料补充。"
  }
];

let companyRecords = [];
let externalRecords = [];
let dataMode = "公司价格";

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
    drivers: [
      "同系列不同Flash/RAM配置会形成显著价格阶梯。",
      "工业温区、LQFP/QFN封装与供货周期会放大报价差异。",
      "生态迁移成本高，替代料不能只按单价判断。"
    ],
    actions: [
      "拉取同内核、同脚位、低一档Flash容量的候选料。",
      "要求供应商同步提供交期、最小包装和生命周期状态。",
      "把固件适配成本折算到年度用量后再谈目标价。"
    ]
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
    drivers: [
      "容量密度和原厂配额是当前主要价格驱动。",
      "AI服务器和企业SSD需求抬高存储链条预期。",
      "同容量不同封装、温区、批次来源可能造成明显价差。"
    ],
    actions: [
      "按季度锁价，避免短周期补货被动追高。",
      "预留第二品牌认证，优先找同容量同封装替代。",
      "询价时要求拆分原厂、代理、现货渠道报价。"
    ]
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
    drivers: [
      "小尺寸高容值MLCC仍有结构性溢价。",
      "介质、电压余量、耐温和车规等级会显著影响价格。",
      "同容值不同尺寸和厚度可能影响贴装、库存和替代范围。"
    ],
    actions: [
      "检查是否可以放宽尺寸或电压余量。",
      "把年度用量前20的电容单独做阶梯价谈判。",
      "低风险料可采用多品牌并行承认策略。"
    ]
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
    drivers: [
      "精度、温漂和功率等级是电阻报价的主要分层。",
      "常规阻值价格稳定，但大用量会放大年度总差额。",
      "精密电阻、低阻采样电阻和车规料需要单独评估替代风险。"
    ],
    actions: [
      "建立常用阻值、尺寸、精度的标准承认清单。",
      "将高用量阻值合并谈阶梯价和年度返利。",
      "采样电阻替代前同步确认功率、温漂和温升。"
    ]
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
    drivers: [
      "饱和电流、DCR和尺寸直接影响单价与可替代范围。",
      "屏蔽结构、频率特性和温升余量会造成明显规格溢价。",
      "电源类电感不能只按电感量替代，需要连同效率和EMI验证。"
    ],
    actions: [
      "优先筛选同尺寸、同饱和电流等级的二供。",
      "比较单价时同步记录DCR、温升和效率影响。",
      "对关键电源回路保留FAE验证和小批试产。"
    ]
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
    drivers: [
      "电流能力、频率和效率曲线是核心价差来源。",
      "保护功能和热设计余量决定可替代范围。",
      "外围BOM差异可能抵消芯片单价优势。"
    ],
    actions: [
      "对比芯片单价时同步计算电感、电容和散热成本。",
      "要求FAE确认关键负载点效率和环路稳定性。",
      "优先筛同封装、同引脚定义的国产替代料。"
    ]
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
    drivers: [
      "镀金厚度、塑胶耐温和认证等级直接影响报价。",
      "小批量连接器容易被模具、起订量和包装费用拉高。",
      "结构件替代需要同步确认装配公差和可靠性。"
    ],
    actions: [
      "拆分端子、胶壳、包装和加工费后再比较总价。",
      "把插拔寿命、盐雾、阻燃等级写入询价条件。",
      "对非关键接口建立标准化连接器库。"
    ]
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
    drivers: [
      "工作电压、钳位电压和峰值脉冲功率决定主要规格层级。",
      "高速接口用低电容器件会比普通ESD有明显溢价。",
      "同参数不同封装或品牌，更多体现渠道与可靠性差异。"
    ],
    actions: [
      "按接口速率、浪涌等级和封装尺寸建立替代清单。",
      "对高频接口优先确认结电容和眼图余量。",
      "低风险通用保护料可采用多品牌阶梯价策略。"
    ]
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
  drivers: [
    "当前输入未命中明确品类，建议补充封装、参数和目标品牌。",
    "报价差异可能来自渠道来源、库存日期、起订量和交付条件。",
    "若是关键料，需要确认生命周期状态和可替代等级。"
  ],
  actions: [
    "补充完整规格书关键参数后重新分析。",
    "按原厂代理、授权分销、现货渠道分别询价。",
    "记录历史成交价、目标价和替代料认证状态。"
  ]
};

function canonicalCategory(value) {
  const text = String(value || "").toLowerCase();
  return categories.find((item) => {
    const name = item.name.toLowerCase();
    return text.includes(name.split(" / ")[0].toLowerCase()) || name.includes(text);
  })?.name || categories.find((item) => {
    if (/mcu|主控/.test(text)) return item.name.includes("MCU");
    if (/flash|dram|nand|emmc|存储/.test(text)) return item.name.includes("存储");
    if (/mlcc|cap|电容|x5r|x7r/.test(text)) return item.name.includes("电容");
    if (/res|ohm|电阻/.test(text)) return item.name.includes("电阻");
    if (/ind|bead|电感|磁珠/.test(text)) return item.name.includes("电感");
    if (/power|pmic|ldo|buck|boost|电源/.test(text)) return item.name.includes("电源");
    if (/connector|type-c|usb|连接器|端子/.test(text)) return item.name.includes("连接器");
    if (/tvs|esd|保护/.test(text)) return item.name.includes("保护");
    return false;
  })?.name || value || "通用电子料";
}

function normalizeSourceType(raw, fallback = "company") {
  const text = String(raw.sourceType || raw.dataSourceType || raw.sourceKind || raw["来源类型"] || raw["价格口径"] || raw["数据类型"] || raw.source || fallback).toLowerCase();
  if (/company|internal|erp|po|purchase|procurement|公司|内部|采购|订单|真实/.test(text)) return "company";
  if (/external|public|market|web|platform|global|lcsc|digikey|mouser|nexar|平台|公开|外部|全网|网站/.test(text)) return "external";
  return fallback;
}

function normalizeRecord(raw, fallbackSourceType = "company") {
  const sourceType = normalizeSourceType(raw, fallbackSourceType);
  const rawDate = raw.date || raw["日期"] || raw["采购日期"] || raw["下单日期"] || raw["订单日期"] || raw.month || raw["月份"];
  const date = rawDate || (sourceType === "company" ? new Date().toISOString().slice(0, 10) : "");
  const part = raw.part || raw.mpn || raw.model || raw["料号"] || raw["型号"] || raw["物料编码"];
  const category = canonicalCategory(raw.category || raw["品类"] || raw["分类"]);
  const supplier = raw.supplier || raw.vendor || raw.channel || raw["供应商"] || raw["采购供应商"] || raw["渠道"] || (sourceType === "company" ? "公司价格表" : "未标注供应商");
  const unitPrice = Number(raw.unitPrice || raw.price || raw["历史采购价"] || raw["采购单价"] || raw["订单价"] || raw["成交价"] || raw["单价"] || raw["含税单价"] || raw["价格"]);
  const qty = Number(raw.qty || raw.quantity || raw["数量"] || raw["采购数量"] || raw["订单数量"] || 1);
  const currency = raw.currency || raw["币种"] || "CNY";

  if (!date || !part || !Number.isFinite(unitPrice)) return null;
  return {
    date: String(date).slice(0, 7),
    part: String(part).trim(),
    category,
    supplier: String(supplier).trim(),
    unitPrice,
    qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
    currency,
    sourceType,
    sourceLabel: sourceType === "company" ? "公司价格" : "外部参考价",
    source: raw.source || raw.sourceId || raw["来源"] || ""
  };
}

function latestRecord(records) {
  return [...records].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
}

function collapseCompanyPrices(records) {
  const byPart = new Map();
  records.forEach((record) => {
    const key = record.part.toLowerCase();
    const current = byPart.get(key);
    if (!current || record.date.localeCompare(current.date) >= 0) {
      byPart.set(key, record);
    }
  });
  return [...byPart.values()];
}

function weightedAverage(records) {
  const totalQty = records.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = records.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  return totalQty ? totalValue / totalQty : 0;
}

function recordsForCategory(categoryName) {
  const external = externalRecords.filter((item) => item.category === categoryName);
  if (external.length) return { records: external, sourceType: "external" };
  return { records: [], sourceType: "model" };
}

function buildValuesFromRecords(categoryName) {
  const { records: categoryRecords, sourceType } = recordsForCategory(categoryName);
  if (!categoryRecords.length) {
    return {
      values: Array.from({ length: 12 }, () => 100),
      sampleCount: 0,
      monthCount: 0,
      quality: "待外部采集",
      sourceType
    };
  }

  const monthMap = new Map();
  categoryRecords.forEach((item) => {
    if (!monthMap.has(item.date)) monthMap.set(item.date, []);
    monthMap.get(item.date).push(item);
  });

  const months = [...monthMap.keys()].sort();
  const averages = months.map((month) => weightedAverage(monthMap.get(month)));
  const baseline = averages[0] || 1;
  const indexes = averages.map((value) => (value / baseline) * 100);
  const quality = months.length >= 6 ? "月度采样" : "插值预览";

  if (indexes.length === 1) {
    return {
      values: Array.from({ length: 12 }, () => Math.round(indexes[0])),
      sampleCount: categoryRecords.length,
      monthCount: months.length,
      quality,
      sourceType
    };
  }

  if (indexes.length >= 12) {
    return {
      values: indexes.slice(-12).map((value) => Math.round(value)),
      sampleCount: categoryRecords.length,
      monthCount: months.length,
      quality,
      sourceType
    };
  }

  const filled = Array.from({ length: 12 }, (_, index) => {
    const position = (index / 11) * (indexes.length - 1);
    const left = Math.floor(position);
    const right = Math.min(Math.ceil(position), indexes.length - 1);
    const ratio = position - left;
    const interpolated = indexes[left] + (indexes[right] - indexes[left]) * ratio;
    return Math.round(interpolated);
  });
  return {
    values: filled,
    sampleCount: categoryRecords.length,
    monthCount: months.length,
    quality,
    sourceType
  };
}

function recordsSummary() {
  const records = [...companyRecords, ...externalRecords];
  const categoriesHit = new Set(records.map((item) => item.category));
  const dates = records.map((item) => item.date).sort();
  return {
    companyCount: companyRecords.length,
    externalCount: externalRecords.length,
    categoryCount: categoriesHit.size,
    range: dates.length ? `${dates[0]} - ${dates.at(-1)}` : "暂无价格"
  };
}

function sourceTextForCategory(categoryName) {
  const { records, sourceType } = recordsForCategory(categoryName);
  if (sourceType === "external") {
    const suppliers = [...new Set(records.map((item) => item.supplier))].slice(0, 4).join(" / ");
    return `外部参考价：${suppliers}`;
  }
  if (sourceType === "company") return "公司价格表";
  return "待外部采集";
}

function findQuoteRecords(part, categoryName) {
  const keyword = part.toLowerCase();
  const exactCompany = companyRecords.filter((item) => item.part.toLowerCase() === keyword);
  if (exactCompany.length) return { title: "匹配公司价格表", records: exactCompany, mode: "公司价格", sourceType: "company" };
  const fuzzyCompany = companyRecords.filter((item) => item.part.toLowerCase().includes(keyword) || keyword.includes(item.part.toLowerCase()));
  if (fuzzyCompany.length) return { title: "匹配公司价格表", records: fuzzyCompany, mode: "公司价格", sourceType: "company" };
  const exactExternal = externalRecords.filter((item) => item.part.toLowerCase() === keyword);
  if (exactExternal.length) return { title: "匹配外部参考价", records: exactExternal, mode: "外部参考价", sourceType: "external" };
  const fuzzyExternal = externalRecords.filter((item) => item.part.toLowerCase().includes(keyword) || keyword.includes(item.part.toLowerCase()));
  if (fuzzyExternal.length) return { title: "匹配外部参考价", records: fuzzyExternal, mode: "外部参考价", sourceType: "external" };
  const companyCategory = companyRecords.filter((item) => item.category === categoryName).slice(-8);
  if (companyCategory.length) {
    return {
      title: "同品类公司价格表",
      records: companyCategory,
      mode: "公司价格",
      sourceType: "company"
    };
  }
  return {
    title: "同品类外部参考价",
    records: externalRecords.filter((item) => item.category === categoryName).slice(-8),
    mode: "外部参考价",
    sourceType: "external"
  };
}

function priceStats(records) {
  if (!records.length) return null;
  const prices = records.map((item) => item.unitPrice).sort((a, b) => a - b);
  return {
    min: prices[0],
    median: prices[Math.floor(prices.length / 2)],
    max: prices.at(-1),
    latest: latestRecord(records)
  };
}

function renderPricePanel(quoteGroup, stats, quoteRows) {
  if (!stats) {
    return `<p class="empty-note">暂无可用价格数据，请等待每日采集或临时导入价格文件。</p>`;
  }

  if (quoteGroup.sourceType === "company") {
    const item = latestRecord(quoteGroup.records);
    const label = quoteGroup.records.length === 1 ? "公司价格" : "匹配价格";
    const value = quoteGroup.records.length === 1 ? `${item.currency} ${item.unitPrice}` : `${quoteGroup.records.length} 项`;
    return `
      <div class="quote-stats quote-stats-single">
        <div><span>${label}</span><strong>${value}</strong></div>
      </div>
      <div class="quote-table">${quoteRows}</div>
    `;
  }

  return `
    <div class="quote-stats">
      <div><span>最低</span><strong>${stats.latest.currency} ${stats.min}</strong></div>
      <div><span>中位</span><strong>${stats.latest.currency} ${stats.median}</strong></div>
      <div><span>最高</span><strong>${stats.latest.currency} ${stats.max}</strong></div>
    </div>
    <div class="quote-table">${quoteRows}</div>
  `;
}

function priceMetricText(quoteGroup, stats) {
  if (!stats) return "暂无";
  const item = latestRecord(quoteGroup.records);
  const prefix = quoteGroup.sourceType === "company" ? "" : "参考 ";
  return `${prefix}${item.currency} ${item.unitPrice}`;
}

function priceBasisText(quoteGroup) {
  if (quoteGroup.sourceType === "company") return "公司价格表";
  if (quoteGroup.sourceType === "external") return "外部参考价";
  return "暂无价格数据";
}

function selectedQuote(part, preferredCategory) {
  const profile = getProfile(part);
  const group = findQuoteRecords(part, preferredCategory || profile.category);
  return {
    part,
    profile,
    group,
    record: latestRecord(group.records),
    stats: priceStats(group.records)
  };
}

function formatPrice(record) {
  if (!record || !Number.isFinite(record.unitPrice)) return "暂无";
  return `${record.currency || "CNY"} ${record.unitPrice}`;
}

function buildAttributionFactors(baseProfile, compareProfile, comparable) {
  const baseItems = baseProfile.costBreakdown || fallbackProfile.costBreakdown;
  const sourceFactors = comparable
    ? baseItems
    : [
        { label: "品类/规格差异", value: 34 },
        { label: "品牌/生命周期", value: 24 },
        { label: "封装/认证条件", value: 20 },
        { label: "渠道/交付条件", value: 22 }
      ];
  return sourceFactors.map((item, index) => ({
    label: item.label,
    value: item.value,
    note: comparable
      ? (baseProfile.drivers[index] || compareProfile.drivers?.[index] || "需结合规格书确认")
      : "两边不属于同一窄品类，不能直接按单价判断优劣"
  }));
}

function renderAttribution() {
  const panel = document.querySelector("#attributionPanel");
  if (!panel) return;

  const basePart = document.querySelector("#basePartInput").value.trim();
  const comparePart = document.querySelector("#comparePartInput").value.trim();
  const targetPriceValue = Number(document.querySelector("#targetPriceInput").value);
  const targetSource = document.querySelector("#targetSourceInput").value.trim() || "手动输入价格";

  if (!basePart) {
    panel.innerHTML = `<p class="empty-note">请先输入基准料号。</p>`;
    return;
  }

  const base = selectedQuote(basePart);
  if (!base.record) {
    panel.innerHTML = `
      <div class="result-header">
        <div>
          <span class="eyebrow">Attribution Result</span>
          <div class="result-code">${basePart}</div>
        </div>
        <span class="risk-pill">缺少基准价</span>
      </div>
      <p class="empty-note">公司价格表和外部参考价都没有命中该料号，无法计算价差。请先补充公司价格。</p>
    `;
    return;
  }

  const useManualTarget = Number.isFinite(targetPriceValue) && targetPriceValue > 0;
  const compare = comparePart ? selectedQuote(comparePart, base.profile.category) : null;
  const compareRecord = useManualTarget
    ? {
        part: comparePart || "目标价",
        category: base.record.category || base.profile.category,
        supplier: targetSource,
        sourceType: "manual",
        unitPrice: targetPriceValue,
        currency: base.record.currency || "CNY",
        date: new Date().toISOString().slice(0, 10)
      }
    : compare?.record;

  if (!compareRecord) {
    panel.innerHTML = `
      <div class="result-header">
        <div>
          <span class="eyebrow">Attribution Result</span>
          <div class="result-code">${basePart}</div>
        </div>
        <span class="risk-pill">待补对比价</span>
      </div>
      <p class="empty-note">已找到基准价 ${formatPrice(base.record)}，请再输入对比料号、目标价或供应商报价。</p>
    `;
    return;
  }

  const delta = compareRecord.unitPrice - base.record.unitPrice;
  const deltaPercent = base.record.unitPrice ? (delta / base.record.unitPrice) * 100 : 0;
  const direction = delta > 0 ? "对比价更高" : delta < 0 ? "对比价更低" : "两边价格一致";
  const comparable = (compareRecord.category || base.profile.category) === (base.record.category || base.profile.category);
  const factors = buildAttributionFactors(base.profile, compare?.profile || base.profile, comparable);
  const deltaClass = delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "";

  panel.innerHTML = `
    <div class="result-header">
      <div>
        <span class="eyebrow">Attribution Result</span>
        <div class="result-code">${basePart} → ${compareRecord.part}</div>
      </div>
      <span class="risk-pill">${comparable ? "同品类可比" : "可比性待确认"}</span>
    </div>
    <div class="attribution-summary">
      <div class="metric"><span>价差结论</span><strong>${direction}</strong></div>
      <div class="metric"><span>差额</span><strong class="${deltaClass}">${base.record.currency || "CNY"} ${Math.abs(delta).toFixed(4)}</strong></div>
      <div class="metric"><span>差异比例</span><strong class="${deltaClass}">${deltaPercent >= 0 ? "+" : ""}${deltaPercent.toFixed(2)}%</strong></div>
    </div>
    <section class="quote-panel">
      <div class="quote-head">
        <h3>价格口径</h3>
        <span>公司价格优先，外部价格仅补缺</span>
      </div>
      <div class="comparison-table">
        <div class="comparison-row">
          <span>基准料号</span>
          <strong>${base.record.part}</strong>
          <b>${formatPrice(base.record)}</b>
        </div>
        <div class="comparison-row">
          <span>基准来源</span>
          <strong>${priceBasisText(base.group)}</strong>
          <b>${base.record.date || "未标注日期"}</b>
        </div>
        <div class="comparison-row">
          <span>对比对象</span>
          <strong>${compareRecord.part}</strong>
          <b>${formatPrice(compareRecord)}</b>
        </div>
        <div class="comparison-row">
          <span>对比来源</span>
          <strong>${useManualTarget ? targetSource : priceBasisText(compare.group)}</strong>
          <b>${compareRecord.date || "未标注日期"}</b>
        </div>
      </div>
    </section>
    <section class="attribution-factors">
      <div class="quote-head">
        <h3>归因拆解</h3>
        <span>${comparable ? "按当前品类规则拆分" : "跨品类仅作风险提示"}</span>
      </div>
      ${factors.map((factor, index) => `
        <div class="attribution-factor">
          <strong>${factor.label}</strong>
          <div class="attribution-factor-track">
            <span class="factor-${index + 1}" style="--factor:${factor.value}%"></span>
          </div>
          <span>${factor.value}%</span>
          <p class="empty-note">${factor.note}</p>
        </div>
      `).join("")}
    </section>
    <section class="attribution-actions">
      <div class="quote-head">
        <h3>采购动作</h3>
        <span>用于议价和复核</span>
      </div>
      <ul class="action-list">
        <li>要求供应商补齐税率、MOQ、交期、包装和报价有效期，避免口径不一致。</li>
        <li>若为同品类替代料，优先核对封装、脚位、关键规格和可靠性等级。</li>
        <li>用公司价格作为主锚点，外部公开价只作为缺料或异常报价时的参考。</li>
      </ul>
    </section>
  `;
}

function renderCostBreakdown(profile) {
  const items = profile.costBreakdown || fallbackProfile.costBreakdown;
  const segments = items
    .map((item, index) => `<span class="cost-segment cost-${index + 1}" style="--share:${item.value}"></span>`)
    .join("");
  const rows = items
    .map((item, index) => `
      <div class="cost-row">
        <span class="cost-key cost-${index + 1}"></span>
        <span>${item.label}</span>
        <strong>${item.value}%</strong>
      </div>
    `)
    .join("");

  return `
    <section class="cost-panel">
      <div class="quote-head">
        <h3>成本组成参考</h3>
        <span>规则口径</span>
      </div>
      <div class="cost-stack" aria-label="成本组成百分比">${segments}</div>
      <div class="cost-grid">${rows}</div>
    </section>
  `;
}

function renderFactorShare(item) {
  return `
    <div class="factor-share">
      <span class="factor-title">价差因素参考权重</span>
      ${(item.factorShare || []).map((factor, index) => `
        <div class="factor-row">
          <div class="factor-label">
            <i class="factor-dot factor-${index + 1}"></i>
            <span>${factor.label}</span>
          </div>
          <div class="factor-track">
            <span class="factor-fill factor-${index + 1}" style="--factor:${factor.value}%"></span>
          </div>
          <strong>${factor.value}%</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function createChart(values, color) {
  const width = 340;
  const height = 150;
  const chartLeft = 38;
  const chartRight = 10;
  const chartTop = 12;
  const chartBottom = 28;
  const innerWidth = width - chartLeft - chartRight;
  const innerHeight = height - chartTop - chartBottom;
  const min = Math.floor((Math.min(...values) - 4) / 10) * 10;
  const max = Math.ceil((Math.max(...values) + 4) / 10) * 10;
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = chartLeft + (index / (values.length - 1)) * innerWidth;
    const y = chartTop + (1 - (value - min) / span) * innerHeight;
    return [x, y];
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const smoothLine = points.reduce((path, point, index) => {
    const [x, y] = point;
    if (index === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    const [prevX, prevY] = points[index - 1];
    const controlX = (prevX + x) / 2;
    return `${path} C ${controlX.toFixed(1)} ${prevY.toFixed(1)}, ${controlX.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, "");
  const baseline = chartTop + innerHeight;
  const area = `${chartLeft},${baseline} ${line} ${width - chartRight},${baseline}`;
  const ticks = [min, Math.round((min + max) / 2), max];
  const grid = ticks
    .map((tick) => {
      const y = chartTop + (1 - (tick - min) / span) * innerHeight;
      return `
        <line class="chart-grid" x1="${chartLeft}" y1="${y.toFixed(1)}" x2="${width - chartRight}" y2="${y.toFixed(1)}" />
        <text class="chart-axis-label" x="${chartLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${tick}</text>
      `;
    })
    .join("");
  const monthLabels = [
    { label: "1月", index: 0 },
    { label: "6月", index: 5 },
    { label: "12月", index: 11 }
  ]
    .map(({ label, index }) => {
      const x = chartLeft + (index / (values.length - 1)) * innerWidth;
      return `<text class="chart-axis-label" x="${x.toFixed(1)}" y="${height - 5}" text-anchor="middle">${label}</text>`;
    })
    .join("");
  const dots = points
    .filter((_, index) => index === 0 || index === points.length - 1 || index === 5)
    .map(([x, y]) => `<circle class="chart-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" style="--card-color:${color}"></circle>`)
    .join("");

  return `
    <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="12个月平均价格指数走势，纵轴为价格指数，基准等于100，横轴为月份">
      <text class="chart-title" x="${chartLeft}" y="8">价格指数（基准=100）</text>
      ${grid}
      <line class="chart-axis" x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${baseline}" />
      <line class="chart-axis" x1="${chartLeft}" y1="${baseline}" x2="${width - chartRight}" y2="${baseline}" />
      <polyline class="chart-area" points="${area}"></polyline>
      <path class="chart-line" d="${smoothLine}" style="--card-color:${color}"></path>
      ${dots}
      ${monthLabels}
    </svg>
  `;
}

function renderCategories() {
  const grid = document.querySelector("#categoryGrid");
  grid.innerHTML = categories
    .map((item) => {
      const trendData = buildValuesFromRecords(item.name);
      const values = trendData.values;
      const change = values.at(-1) - values[0];
      const sign = change >= 0 ? "+" : "";
      const trendLabel = trendData.sourceType === "model" ? "待采集" : `${item.trend} ${sign}${change.toFixed(0)}pt`;
      return `
        <article class="category-card" style="--card-color:${item.tone}">
          <div class="category-top">
            <div class="category-icon" aria-hidden="true">${item.icon}</div>
            <span class="trend-badge">${trendLabel}</span>
          </div>
          <div class="source-badge">来源 · ${sourceTextForCategory(item.name)}</div>
          <h3>${item.name}</h3>
          <p>${item.copy}</p>
          ${createChart(values, item.tone)}
          <div class="card-meta">
            ${renderFactorShare(item)}
            <div><span>采购动作</span><strong>${item.action}</strong></div>
          </div>
          <p class="card-source">数据来源：${sourceTextForCategory(item.name)}</p>
        </article>
      `;
    })
    .join("");
}

function renderDataSources() {
  const sourceGrid = document.querySelector("#sourceGrid");
  const insights = document.querySelector("#dataInsights");
  const sourceSummary = document.querySelector("#sourceSummary");
  if (!sourceGrid || !insights) return;

  const summary = recordsSummary();
  const externalNames = [...new Set(externalRecords.map((item) => item.supplier))].slice(0, 5).join(" / ");
  sourceSummary.textContent = companyRecords.length
    ? `当前折线图来源：${externalNames ? `外部参考价：${externalNames}` : "待外部采集"}；公司表只作为当前公司价格。`
    : `当前折线图来源：${externalNames ? `外部参考价：${externalNames}` : "待外部采集"}。导入公司价格表后会用于料号分析。`;
  sourceGrid.innerHTML = vendorConnectors
    .map((item) => `
      <article class="source-card">
        <div>
          <span class="source-status">${item.status}</span>
          <h3>${item.name}</h3>
        </div>
        <p>${item.method}</p>
        <strong>${item.note}</strong>
      </article>
    `)
    .join("");
  insights.innerHTML = `
    <div class="metric"><span>公司价格</span><strong>${summary.companyCount}</strong></div>
    <div class="metric"><span>外部参考</span><strong>${summary.externalCount}</strong></div>
    <div class="metric"><span>覆盖品类</span><strong>${summary.categoryCount}</strong></div>
    <div class="metric"><span>价格周期</span><strong>${summary.range}</strong></div>
  `;
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

function parseCsv(text, fallbackSourceType = "company") {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1)
    .map((line) => {
      const cells = splitCsvLine(line);
      return headers.reduce((row, header, index) => {
        row[header] = cells[index] || "";
        return row;
      }, {});
    })
    .map((row) => normalizeRecord(row, fallbackSourceType))
    .filter(Boolean);
}

function setupDataImport() {
  const input = document.querySelector("#quoteUpload");
  if (!input) return;
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : null;
    const rows = file.name.toLowerCase().endsWith(".json")
      ? (Array.isArray(parsed) ? parsed : parsed.records || []).map((row) => normalizeRecord(row, "company")).filter(Boolean)
      : parseCsv(text, "company");
    if (!rows.length) {
      document.querySelector("#sourceSummary").textContent = "未识别到有效价格数据，请检查字段：日期、料号、品类、供应商、单价、数量、币种。";
      return;
    }
    companyRecords = collapseCompanyPrices(rows);
    dataMode = `公司价格 · ${file.name}`;
    renderDataSources();
    renderCategories();
    renderResult();
    renderAttribution();
  });
  renderDataSources();
}

async function loadCompanyPriceBook() {
  try {
    const response = await fetch(`./data/company-procurement-prices.json?ts=${Date.now()}`);
    if (!response.ok) return;
    const data = await response.json();
    const rows = (Array.isArray(data) ? data : data.records || [])
      .map((row) => normalizeRecord(row, "company"))
      .filter(Boolean);
    if (!rows.length) return;

    companyRecords = collapseCompanyPrices(rows);
    dataMode = "公司价格";
  } catch (error) {
    console.warn("Company price book load skipped:", error);
  }
}

async function loadPriceHistory() {
  try {
    const response = await fetch(`./data/price-history.json?ts=${Date.now()}`);
    if (!response.ok) return;
    const data = await response.json();
    const rows = (data.records || []).map((row) => normalizeRecord(row, "external")).filter(Boolean);
    if (!rows.length) return;

    externalRecords = rows;
  } catch (error) {
    console.warn("Price history load skipped:", error);
  }
}

function getProfile(part) {
  return profiles.find((profile) => profile.match.test(part)) || fallbackProfile;
}

function volumeText(volume) {
  return {
    small: "小批量询价更易受MOQ和现货渠道影响",
    medium: "量产阶段适合用阶梯价和季度锁价压缩波动",
    large: "高频拉动建议绑定预测、备货和年度返利"
  }[volume];
}

function scenarioText(scenario) {
  return {
    consumer: "消费电子可优先评估多品牌替代和交期弹性",
    industrial: "工业控制需要兼顾温区、生命周期和批次稳定",
    auto: "车规/高可靠场景需优先保留认证与失效风险余量"
  }[scenario];
}

function renderResult() {
  const part = document.querySelector("#partInput").value.trim() || "未输入物料";
  const volume = document.querySelector("#volumeSelect").value;
  const scenario = document.querySelector("#scenarioSelect").value;
  const profile = getProfile(part);
  const panel = document.querySelector("#resultPanel");
  const quoteGroup = findQuoteRecords(part, profile.category);
  const stats = priceStats(quoteGroup.records);
  const quoteRows = quoteGroup.records
    .slice(-4)
    .map((item) => `
      <div class="quote-row">
        <span>${item.date}</span>
        <strong>${item.supplier}</strong>
        <span>${item.part}</span>
        <b>${item.currency} ${item.unitPrice}</b>
      </div>
    `)
    .join("");

  panel.innerHTML = `
    <div class="result-header">
      <div>
        <span class="eyebrow">Analysis Result</span>
        <div class="result-code">${part}</div>
      </div>
      <span class="risk-pill">${profile.risk}</span>
    </div>
    <div class="result-grid">
      <div class="metric"><span>识别品类</span><strong>${profile.category}</strong></div>
      <div class="metric"><span>当前价格</span><strong>${priceMetricText(quoteGroup, stats)}</strong></div>
      <div class="metric"><span>价格口径</span><strong>${priceBasisText(quoteGroup)}</strong></div>
    </div>
    <div class="metric">
      <span>关键规格</span>
      <strong>${profile.spec}</strong>
    </div>
    <section class="quote-panel">
      <div class="quote-head">
        <h3>${quoteGroup.title}</h3>
        <span>${quoteGroup.mode || dataMode}</span>
      </div>
      ${renderPricePanel(quoteGroup, stats, quoteRows)}
    </section>
    ${renderCostBreakdown(profile)}
    <div class="result-columns">
      <section>
        <h3>价差来源</h3>
        <ul class="driver-list">
          ${profile.drivers.map((item) => `<li>${item}</li>`).join("")}
          <li>${volumeText(volume)}。</li>
          <li>${scenarioText(scenario)}。</li>
        </ul>
      </section>
      <section>
        <h3>采购建议</h3>
        <ul class="action-list">
          ${profile.actions.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>
    </div>
  `;
}

function setupAnalyzer() {
  const form = document.querySelector("#analyzerForm");
  const footerInput = document.querySelector("#footerSearch");
  const footerBtn = document.querySelector("#footerSearchBtn");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult();
  });
  document.querySelector("#volumeSelect").addEventListener("change", renderResult);
  document.querySelector("#scenarioSelect").addEventListener("change", renderResult);
  footerBtn.addEventListener("click", () => {
    const value = footerInput.value.trim();
    if (value) {
      document.querySelector("#partInput").value = value;
      const basePartInput = document.querySelector("#basePartInput");
      if (basePartInput) basePartInput.value = value;
      renderResult();
      renderAttribution();
      document.querySelector("#analyzer").scrollIntoView({ behavior: "smooth" });
    }
  });
  renderResult();
}

function setupAttribution() {
  const form = document.querySelector("#attributionForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderAttribution();
  });
  ["basePartInput", "comparePartInput", "targetPriceInput", "targetSourceInput"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (input) input.addEventListener("change", renderAttribution);
  });
  renderAttribution();
}

function setupHeroCanvas() {
  const canvas = document.querySelector("#heroCanvas");
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let frame = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    frame += 0.006;
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    for (let i = 0; i < 28; i += 1) {
      const y = ((i * 47 + frame * 1400) % (height + 160)) - 80;
      const start = width * (0.12 + ((i % 5) * 0.06));
      const end = width * (0.58 + ((i % 4) * 0.08));
      const alpha = 0.07 + (i % 4) * 0.025;
      context.strokeStyle = `rgba(98, 227, 214, ${alpha})`;
      context.beginPath();
      context.moveTo(start, y);
      context.lineTo(end, y + Math.sin(frame + i) * 24);
      context.lineTo(end + 90, y + 34);
      context.stroke();
      context.fillStyle = `rgba(98, 227, 214, ${alpha + 0.08})`;
      context.fillRect(end + 88, y + 32, 4, 4);
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

async function init() {
  await loadCompanyPriceBook();
  await loadPriceHistory();
  renderCategories();
  setupDataImport();
  setupAnalyzer();
  setupAttribution();
  setupHeroCanvas();
}

init();
