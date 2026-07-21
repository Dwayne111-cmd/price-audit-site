const commodities = [
  { id: "gold", name: "黄金", code: "XAU/USD", unit: "美元/盎司", price: null, change: null, color: "#d97706", favorite: true },
  { id: "silver", name: "国际银价", code: "SLVPRUSD", unit: "美元/盎司", price: null, change: null, color: "#b7c4cf", favorite: true },
  { id: "wti", name: "国际原油", code: "WTI", unit: "美元/桶", price: null, change: null, color: "#155eef", favorite: true },
  { id: "copper", name: "国际铜价", code: "XCU/USD", unit: "美元/吨", price: null, change: null, color: "#b45309", favorite: false }
];

const canUseDashboardApi = ["127.0.0.1", "localhost"].includes(location.hostname) && location.port === "8900";

const sectors = [];
let alerts = [];
let fundWatch = [];

const attributionRecords = [];

const state = {
  range: "2Y",
  search: "",
  sectorGroup: "all",
  alertLevel: "all",
  threshold: 3,
  alertsEnabled: true,
  autoRefresh: true,
  tick: 60,
  selectedCommodity: "copper",
  selectedFund: "001877",
  fundRange: "1Y",
  selectedAttribution: "",
  selectedAnchor: "",
  costView: "amount",
  comparisonCosts: [],
  componentSearchLinks: [],
  componentSearchMeta: null,
  liveConnected: false,
  history: new Map(),
  lastUpdated: null
};

const els = {
  commodityCards: document.querySelector("#commodityCards"),
  trendChart: document.querySelector("#trendChart"),
  chartTitle: document.querySelector("#chartTitle"),
  chartTooltip: document.querySelector("#chartTooltip"),
  chartLegend: document.querySelector("#chartLegend"),
  attributionRows: document.querySelector("#attributionRows"),
  attributionDetail: document.querySelector("#attributionDetail"),
  attributionSummary: document.querySelector("#attributionSummary"),
  componentSearchForm: document.querySelector("#componentSearchForm"),
  componentSearchButton: document.querySelector("#componentSearchButton"),
  componentSearchState: document.querySelector("#componentSearchState"),
  componentSources: document.querySelector("#componentSources"),
  manualQuoteForm: document.querySelector("#manualQuoteForm"),
  manualQuoteToggle: document.querySelector("#manualQuoteToggle"),
  watchList: document.querySelector("#watchList"),
  fundList: document.querySelector("#fundList"),
  fundDataState: document.querySelector("#fundDataState"),
  fundCode: document.querySelector("#fundCode"),
  fundTitle: document.querySelector("#fundTitle"),
  fundDescriptor: document.querySelector("#fundDescriptor"),
  fundStats: document.querySelector("#fundStats"),
  fundTrendChart: document.querySelector("#fundTrendChart"),
  fundChartTooltip: document.querySelector("#fundChartTooltip"),
  fundChartRange: document.querySelector("#fundChartRange"),
  fundSource: document.querySelector("#fundSource"),
  fundRangeTabs: document.querySelector("#fundRangeTabs"),
  searchInput: document.querySelector("#searchInput"),
  sectorFilter: document.querySelector("#sectorFilter"),
  thresholdSlider: document.querySelector("#thresholdSlider"),
  thresholdValue: document.querySelector("#thresholdValue"),
  alertToggle: document.querySelector("#alertToggle"),
  rangeTabs: document.querySelector("#rangeTabs"),
  alertTabs: document.querySelector("#alertTabs"),
  refreshNow: document.querySelector("#refreshNow"),
  autoRefresh: document.querySelector("#autoRefresh"),
  clearWatch: document.querySelector("#clearWatch"),
  nextRefresh: document.querySelector("#nextRefresh"),
  marketStatus: document.querySelector("#marketStatus"),
  dataSource: document.querySelector("#dataSource"),
  tickerShanghai: document.querySelector("#tickerShanghai"),
  tickerShanghaiChange: document.querySelector("#tickerShanghaiChange"),
  tickerShenzhen: document.querySelector("#tickerShenzhen"),
  tickerShenzhenChange: document.querySelector("#tickerShenzhenChange"),
  tickerUsdCny: document.querySelector("#tickerUsdCny"),
  tickerUsdCnyChange: document.querySelector("#tickerUsdCnyChange"),
  tickerUpSectors: document.querySelector("#tickerUpSectors"),
  tickerUpSectorsMeta: document.querySelector("#tickerUpSectorsMeta"),
  tickerDownSectors: document.querySelector("#tickerDownSectors"),
  tickerDownSectorsMeta: document.querySelector("#tickerDownSectorsMeta"),
  chartDataStatus: document.querySelector("#chartDataStatus"),
  chartUpdatedAt: document.querySelector("#chartUpdatedAt"),
  marketClock: document.querySelector("#marketClock"),
};

const navItems = [...document.querySelectorAll(".nav-item")];
const viewTargets = {
  overview: document.querySelector(".topbar"),
  commodities: document.querySelector("#commodityCards"),
  breadth: document.querySelector(".ticker-strip"),
  funds: document.querySelector("#fundWorkspace"),
  attribution: document.querySelector("#attributionWorkspace")
};

function setActiveView(view) {
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const target = viewTargets[item.dataset.view];
    if (!target) return;
    setActiveView(item.dataset.view);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const current = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;
    const view = Object.entries(viewTargets).find(([, target]) => target === current.target)?.[0];
    if (view) setActiveView(view);
  }, { rootMargin: "-24% 0px -58%", threshold: [0.15, 0.4, 0.7] });

  Object.values(viewTargets).filter(Boolean).forEach((target) => observer.observe(target));
}

function hasNumber(value) {
  return Number.isFinite(value);
}

function formatPrice(item) {
  if (!hasNumber(item.price)) return "—";
  return item.price > 1000 ? item.price.toLocaleString("zh-CN", { maximumFractionDigits: 0 }) : item.price.toFixed(2);
}

function signed(value) {
  if (!hasNumber(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function changeClass(value) {
  if (!hasNumber(value)) return "flat";
  if (value > 0.05) return "up";
  if (value < -0.05) return "down";
  return "flat";
}

function groupName(group) {
  return { defense: "军事/航天", finance: "金融", cycle: "周期资源", tech: "科技制造" }[group] || "其他";
}

function updateMarketClock() {
  els.marketClock.textContent = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
}

function seriesFor(item) {
  const selectedRangeHistory = state.history.get(`${item.id}:${state.range}`);
  const sparklineHistory = state.history.get(`${item.id}:sparkline`);
  const points = selectedRangeHistory?.length ? selectedRangeHistory : sparklineHistory;
  return points?.map((entry) => entry.value) || [];
}

function chartSeriesFor(item) {
  const liveHistory = state.history.get(`${item.id}:${state.range}`);
  return liveHistory?.map((entry) => entry.value) || [];
}

function historyPointFor(item, index) {
  const liveHistory = state.history.get(`${item.id}:${state.range}`);
  return liveHistory?.[index] || null;
}

async function loadSparklineHistory(item) {
  const key = `${item.id}:sparkline`;
  if (state.history.has(key)) return;
  if (!canUseDashboardApi) return loadStaticHistory(item, "1M", key).then(() => renderCards());
  try {
    const response = await fetch(`/api/history?id=${encodeURIComponent(item.id)}&range=1M`);
    if (!response.ok) throw new Error("Sparkline history unavailable");
    const payload = await response.json();
    if (!Array.isArray(payload.points) || payload.points.length < 2) throw new Error("Insufficient sparkline history");
    state.history.set(key, payload.points);
    renderCards();
  } catch (error) {
    console.warn(`Sparkline history unavailable for ${item.id}:`, error.message);
  }
}

function loadSparklineHistories() {
  return Promise.all(commodities.map(loadSparklineHistory));
}

function sparklineSvg(item) {
  const data = seriesFor(item);
  if (data.length < 2) {
    const status = item.unavailable
      ? "公开报价需授权"
      : hasNumber(item.price)
        ? "暂无可验证历史数据"
        : "行情数据加载中";
    return `<div class="sparkline-unavailable">${status}</div>`;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 166;
    const y = 34 - ((v - min) / (max - min || 1)) * 30;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `<svg class="sparkline" viewBox="0 0 166 40" aria-hidden="true"><polyline points="${pts.join(" ")}" fill="none" stroke="${item.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderCards() {
  const term = state.search.trim();
  const list = commodities.filter((item) => `${item.name}${item.code}`.includes(term));
  const cards = list.map((item, index) => `
    <article class="metric-card" data-id="${item.id}" style="--metric-color:${item.color}; --motion-index:${index}">
      <div class="metric-top">
        <div>
          <h3>${item.name}</h3>
          <small>${item.code} · ${item.unit} · ${item.source || "待连接"}</small>
        </div>
        <button class="star ${item.favorite ? "active" : ""}" data-fav-commodity="${item.id}" title="加入自选">★</button>
      </div>
      <div>
        <span class="price">${formatPrice(item)}</span>
        <span class="change ${changeClass(item.change)}">${signed(item.change)}</span>
      </div>
      <div class="metric-bottom">${sparklineSvg(item)}</div>
    </article>
  `).join("");
  const loopCards = term ? cards : `${cards}${cards}`;
  els.commodityCards.innerHTML = `<div class="commodity-track-content${term ? " filtered" : ""}">${loopCards}</div>`;
}

function renderChart() {
  const canvas = els.trendChart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * dpr));
  canvas.height = Math.max(220, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 20, right: 20, bottom: 32, left: 50 };
  ctx.clearRect(0, 0, w, h);

  const active = commodities.find((item) => item.id === state.selectedCommodity) || commodities[0];
  const rangeLabel = { "1D": "1日", "5D": "5日", "1M": "1月", "6M": "6月", "1Y": "1年", "2Y": "近2年" }[state.range] || state.range;
  els.chartTitle.textContent = `${active.name} ${rangeLabel}价格走势`;
  const lines = [active].filter((item, index, arr) => (
    item
    && hasNumber(item.price)
    && chartSeriesFor(item).length >= 2
    && arr.findIndex((x) => x.id === item.id) === index
  ));
  if (!lines.length) {
    ctx.fillStyle = "#11171b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8fa3ad";
    ctx.textAlign = "center";
    ctx.font = "13px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("等待商品行情与趋势数据", w / 2, h / 2);
    ctx.textAlign = "left";
    els.chartLegend.innerHTML = "<span>等待公开历史行情返回</span>";
    return;
  }
  const all = lines.flatMap((item) => chartSeriesFor(item));
  const min = Math.min(...all);
  const max = Math.max(...all);

  ctx.fillStyle = "#11171b";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#25343b";
  ctx.lineWidth = 1;
  ctx.font = "12px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#8fa3ad";

  for (let i = 0; i <= 5; i++) {
    const y = pad.top + ((h - pad.top - pad.bottom) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    const label = max - ((max - min) / 5) * i;
    ctx.fillText(label > 1000 ? Math.round(label).toLocaleString("zh-CN") : label.toFixed(1), 10, y + 4);
  }

  lines.forEach((item, lineIndex) => {
    const data = chartSeriesFor(item);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);
      const y = pad.top + (1 - (v - min) / (max - min || 1)) * (h - pad.top - pad.bottom);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = item.color;
    ctx.lineWidth = lineIndex === 0 ? 3 : 2;
    ctx.stroke();
  });

  const activeHistory = state.history.get(`${active.id}:${state.range}`);
  const labels = activeHistory?.length
    ? [activeHistory[0].label, activeHistory[Math.floor(activeHistory.length / 2)].label, activeHistory[activeHistory.length - 1].label]
    : state.range === "2Y" ? ["2024", "2025", "2026"] : ["起点", "中段", "当前"];
  ctx.fillStyle = "#8fa3ad";
  labels.forEach((label, i) => {
    const x = pad.left + (i / (labels.length - 1)) * (w - pad.left - pad.right);
    ctx.fillText(label, x - 12, h - 16);
  });

  els.chartLegend.innerHTML = lines.map((item) => `<span><i class="legend-dot" style="background:${item.color}"></i>${item.name}</span>`).join("");
  flashChart();
}

function formatQuotePrice(value) {
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: value < 1 ? 4 : 2, maximumFractionDigits: value < 1 ? 4 : 2 });
}

function moneyPerPiece(value, currency) {
  return `${currency || "CNY"} ${formatQuotePrice(value)}/件`;
}

function signedMoney(value, currency) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${currency || "CNY"} ${formatQuotePrice(Math.abs(value))}/件`;
}

function quoteById(id) {
  return attributionRecords.find((record) => record.id === id) || null;
}

function quoteLabel(record) {
  return `${record.supplier} · ${moneyPerPiece(record.quote, record.currency)}`;
}

function quoteTierLabel(record) {
  return record.quantity ? `${record.quantity.toLocaleString("zh-CN")}件阶梯` : "公开单价";
}

function quoteSourceMeta(record) {
  const internal = record.sourceType === "internal";
  return {
    type: internal ? "internal" : "external",
    label: internal ? "受保护报价库" : "公开渠道",
    detail: record.sourceDetail || record.source || (internal ? "本地导入报价" : "公开渠道报价")
  };
}

function quoteSourceBadge(record) {
  const source = quoteSourceMeta(record);
  return `<span class="quote-source-badge ${source.type}">${source.label}</span>`;
}

function comparisonPair() {
  const current = quoteById(state.selectedAttribution);
  const anchor = quoteById(state.selectedAnchor);
  return { current, anchor };
}

function costVisualMetric(value, total) {
  return state.costView === "share" ? `${((value / total) * 100).toFixed(1)}%` : formatQuotePrice(value);
}

function costContribution(cost, record) {
  const totalDelta = record.quote - record.anchor;
  if (Math.abs(totalDelta) < 0.001) return "—";
  return `${Math.abs(((cost.quote - cost.anchor) / totalDelta) * 100).toFixed(1)}%`;
}

function renderCostEntry() {
  return `
    <div class="cost-entry-form" data-cost-entry>
      <label><span>归因项</span><select data-cost-name><option>原厂与核心规格</option><option>封测与品质</option><option>渠道与服务</option><option>库存与交期</option><option>税运与付款条件</option><option>其他</option></select></label>
      <label><span>当前成本</span><input data-cost-quote type="number" min="0" step="0.0001" placeholder="0.0000" /></label>
      <label><span>锚点成本</span><input data-cost-anchor type="number" min="0" step="0.0001" placeholder="0.0000" /></label>
      <label class="cost-entry-note"><span>证据 / 备注</span><input data-cost-note type="text" placeholder="规格、税运、交期或报价条件" /></label>
      <button type="button" class="ghost-button" data-add-cost>添加归因</button>
    </div>
  `;
}

function renderCostBreakdown(record) {
  const amountScale = Math.max(record.quote, record.anchor);
  const costs = state.comparisonCosts;
  return `
    <section class="cost-breakdown" aria-label="${record.model} 成本归因">
      <div class="cost-heading">
        <div><span>成本归因录入</span><small>单位：${record.currency}/件 · 仅使用你确认的成本与证据</small></div>
        <div class="cost-view-toggle" role="group" aria-label="成本拆分口径">
          <button type="button" class="${state.costView === "amount" ? "active" : ""}" data-cost-view="amount">金额</button>
          <button type="button" class="${state.costView === "share" ? "active" : ""}" data-cost-view="share">占比</button>
        </div>
      </div>
      ${renderCostEntry()}
      <div class="cost-list">
        ${costs.length ? costs.map((cost, index) => {
          const actualDelta = cost.quote - cost.anchor;
          const quoteWidth = state.costView === "share" ? (cost.quote / record.quote) * 100 : (cost.quote / amountScale) * 100;
          const anchorWidth = state.costView === "share" ? (cost.anchor / record.anchor) * 100 : (cost.anchor / amountScale) * 100;
          return `
            <div class="cost-row">
              <div class="cost-row-head"><div><strong>${cost.name}</strong><span>${cost.note || "未补充证据"}</span></div><b class="cost-contribution-brief">价差贡献 ${costContribution(cost, record)}</b></div>
              <div class="cost-price-grid">
                <span><small>当前</small><b>${formatQuotePrice(cost.quote)}</b></span>
                <span><small>锚点</small><b>${formatQuotePrice(cost.anchor)}</b></span>
                <span class="${actualDelta >= 0 ? "up" : "down"}"><small>实际差额</small><b>${actualDelta > 0 ? "+" : ""}${formatQuotePrice(actualDelta)}</b></span>
              </div>
              <div class="cost-bars" aria-label="当前 ${costVisualMetric(cost.quote, record.quote)}，锚点 ${costVisualMetric(cost.anchor, record.anchor)}">
                <div class="cost-bar"><span>当</span><i><b class="quote" style="width:${quoteWidth}%"></b></i><strong>${costVisualMetric(cost.quote, record.quote)}</strong></div>
                <div class="cost-bar"><span>锚</span><i><b class="anchor" style="width:${anchorWidth}%"></b></i><strong>${costVisualMetric(cost.anchor, record.anchor)}</strong></div>
              </div>
              <button type="button" class="cost-remove" data-remove-cost="${index}" title="删除归因项">删除</button>
            </div>
          `;
        }).join("") : `<div class="empty-state attribution-empty">公开渠道报价只能形成价差，尚未录入可验证的成本归因。</div>`}
      </div>
    </section>
  `;
}

function renderSourceLinks() {
  els.componentSources.innerHTML = state.componentSearchLinks.length ? state.componentSearchLinks.map((item) => `
    <a href="${item.url}" target="_blank" rel="noreferrer" class="source-link">${item.label}<span>公开页面</span></a>
  `).join("") : "";
}

function comparisonOptions(selectedId) {
  return attributionRecords.map((record) => `<option value="${record.id}" ${record.id === selectedId ? "selected" : ""}>${quoteLabel(record)}</option>`).join("");
}

function renderComparisonDetail(current, anchor) {
  const selectors = `
    <div class="comparison-selects">
      <label><span>当前报价</span><select data-comparison-role="current">${comparisonOptions(current?.id)}</select></label>
      <label><span>对比锚点</span><select data-comparison-role="anchor">${comparisonOptions(anchor?.id)}</select></label>
    </div>
  `;
  if (!current || !anchor || current.id === anchor.id) {
    return `${selectors}<div class="empty-state attribution-empty">至少选择两条不同的渠道报价，才能形成价差对比。</div>`;
  }
  if (current.currency !== anchor.currency) {
    return `${selectors}<div class="empty-state attribution-empty">当前报价与锚点币种不同，暂不计算价差。请选择相同币种，或录入换汇后的同口径报价。</div>`;
  }

  const actualDelta = current.quote - anchor.quote;
  const delta = (actualDelta / anchor.quote) * 100;
  const status = actualDelta > 0 ? "high" : "review";
  const record = { model: current.model, quote: current.quote, anchor: anchor.quote, currency: current.currency };
  const action = actualDelta > 0
    ? `向 ${current.supplier} 核对数量阶梯、税运、库存与交期，并以 ${anchor.supplier} 的 ${moneyPerPiece(anchor.quote, anchor.currency)} 作为询价锚点。`
    : `核验 ${current.supplier} 的批次、交期与真伪保障，确认其低价条件可被采购执行。`;
  return `
    ${selectors}
    <div class="detail-model"><div><strong>${current.model}</strong><span>${current.spec || current.category || "规格待补充"}</span></div><span class="risk-tag ${status}">${actualDelta > 0 ? "高价待核" : "低价待核"}</span></div>
    <div class="detail-stats">
      <div><span>当前报价</span><strong>${moneyPerPiece(current.quote, current.currency)}</strong><div class="quote-origin"><small>${current.supplier} · ${quoteTierLabel(current)}</small>${quoteSourceBadge(current)}</div></div>
      <div><span>对比锚点</span><strong>${moneyPerPiece(anchor.quote, anchor.currency)}</strong><div class="quote-origin"><small>${anchor.supplier} · ${quoteTierLabel(anchor)}</small>${quoteSourceBadge(anchor)}</div></div>
      <div><span>实际价差</span><strong class="${actualDelta >= 0 ? "up" : "down"}">${signedMoney(actualDelta, current.currency)}</strong></div>
      <div><span>相对锚点</span><strong class="${actualDelta >= 0 ? "up" : "down"}">${signed(delta)}</strong><small>报价口径需复核含税与交期</small></div>
    </div>
    ${renderCostBreakdown(record)}
    <section class="quote-evidence"><div class="factor-title"><span>报价来源证据</span><small>数据库分类与原始渠道</small></div><div class="quote-evidence-grid"><div class="quote-evidence-item"><span>当前数据库</span>${quoteSourceBadge(current)}<strong>${quoteSourceMeta(current).detail}</strong></div><div class="quote-evidence-item"><span>当前库存</span><strong>${current.stock ?? "—"}</strong></div><div class="quote-evidence-item"><span>当前交期</span><strong>${current.lead || "—"}</strong></div><div class="quote-evidence-item"><span>锚点数据库</span>${quoteSourceBadge(anchor)}<strong>${quoteSourceMeta(anchor).detail}</strong></div><div class="quote-evidence-item"><span>锚点库存</span><strong>${anchor.stock ?? "—"}</strong></div><div class="quote-evidence-item"><span>锚点交期</span><strong>${anchor.lead || "—"}</strong></div></div></section>
    <div class="procurement-action"><span>采购动作</span><strong>${action}</strong></div>
  `;
}

function renderEmptyAttributionDetail() {
  return `
    <div class="detail-model">
      <div><strong>价差归因</strong><span>等待可比较报价</span></div>
      <span class="data-state">未建立对比</span>
    </div>
    <div class="detail-stats">
      <div><span>当前报价</span><strong>—</strong></div>
      <div><span>对比锚点</span><strong>—</strong></div>
      <div><span>实际价差</span><strong>—</strong></div>
      <div><span>相对锚点</span><strong>—</strong><small>等待可比较报价</small></div>
    </div>
    <section class="cost-breakdown">
      <div class="cost-heading"><div><span>成本归因</span><small>仅显示已录入且可验证的成本项</small></div></div>
      <div class="empty-state attribution-empty">暂无可验证成本项</div>
    </section>
  `;
}

function renderAttribution() {
  renderSourceLinks();
  const list = attributionRecords;
  const sourceLabels = [...new Set(list.map((record) => quoteSourceMeta(record).label))];
  els.attributionSummary.textContent = list.length ? `来源：${sourceLabels.join(" / ")}` : "尚未查询";
  if (!list.length) {
    els.attributionRows.innerHTML = `<div class="empty-state attribution-empty">输入物料型号与规格后查询；外网静态版可先手动录入供应商报价并做价差归因。</div>`;
    els.attributionDetail.innerHTML = renderEmptyAttributionDetail();
    return;
  }

  const current = quoteById(state.selectedAttribution) || list[0];
  if (state.selectedAttribution !== current.id) state.selectedAttribution = current.id;
  const anchor = quoteById(state.selectedAnchor) || list.find((record) => record.id !== current.id) || null;
  if (anchor && state.selectedAnchor !== anchor.id) state.selectedAnchor = anchor.id;
  els.attributionRows.innerHTML = list.map((record) => {
    const isCurrent = record.id === current.id;
    const isAnchor = anchor && record.id === anchor.id;
    return `
      <button class="quote-row ${isCurrent ? "active" : ""} ${isAnchor ? "anchor" : ""}" type="button" data-attribution-id="${record.id}">
        <span class="quote-supplier"><strong>${record.supplier}</strong>${quoteSourceBadge(record)}</span>
        <span class="quote-material"><strong>${record.model}</strong><small>${record.spec || record.category || "规格待补充"}</small></span>
        <span class="quote-price">${moneyPerPiece(record.quote, record.currency)}</span>
        <span class="quote-stock">${record.stock ?? "—"}</span>
        <span class="quote-lead">${record.lead || "—"}</span>
      </button>
    `;
  }).join("");
  els.attributionDetail.innerHTML = renderComparisonDetail(current, anchor);
}

function renderSectors() {
  const term = state.search.trim();
  let list = sectors
    .filter((item) => state.sectorGroup === "all" || item.group === state.sectorGroup)
    .filter((item) => item.name.includes(term) || !term);

  list = list.sort((a, b) => b.change - a.change);

  if (!list.length) {
    els.sectorRows.innerHTML = `<tr><td colspan="7"><div class="empty-state">等待东方财富公开板块行情</div></td></tr>`;
    renderHeatMap([]);
    return;
  }

  const visible = list.slice(0, 10);
  els.sectorRows.innerHTML = visible.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <div class="sector-name"><strong>${item.name}</strong></div>
        <div class="sector-sub">${groupName(item.group)}</div>
      </td>
      <td><span class="change ${changeClass(item.change)}">${signed(item.change)}</span></td>
      <td><div class="heat-bar"><span style="width:${item.heat}%"></span></div></td>
      <td>${item.flow >= 0 ? "+" : ""}${item.flow.toFixed(1)}亿</td>
      <td>${item.breadth}</td>
      <td><button class="star ${item.favorite ? "active" : ""}" data-fav-sector="${item.name}" title="加入自选">★</button></td>
    </tr>
  `).join("");

  renderHeatMap(visible);
}

function renderHeatMap(list = sectors) {
  const show = list.length ? list : sectors;
  if (!show.length) {
    els.heatMap.innerHTML = `<div class="empty-state">暂无板块数据</div>`;
    els.upCount.textContent = "—";
    els.downCount.textContent = "—";
    return;
  }
  els.heatMap.innerHTML = show.slice(0, 6).map((item) => {
    const intensity = Math.min(1, Math.max(0.2, Math.abs(item.change) / 5));
    const color = item.change >= 0
      ? `rgba(217, 45, 32, ${0.56 + intensity * 0.38})`
      : `rgba(7, 148, 85, ${0.48 + intensity * 0.38})`;
    return `<div class="heat-cell" style="background:${color}"><strong>${item.name}</strong><span>${signed(item.change)} · 热度${item.heat}</span></div>`;
  }).join("");
  els.upCount.textContent = sectors.filter((item) => item.change >= 0).length;
  els.downCount.textContent = sectors.filter((item) => item.change < 0).length;
}

function renderWatchList() {
  const watchedCommodities = commodities.filter((item) => item.favorite).map((item) => ({
    name: item.name,
    meta: `${formatPrice(item)} ${item.unit}`,
    change: item.change
  }));
  const watchedSectors = sectors.filter((item) => item.favorite).map((item) => ({
    name: item.name,
    meta: `${groupName(item.group)} · 热度${item.heat}`,
    change: item.change
  }));
  const list = [...watchedCommodities, ...watchedSectors];
  els.watchList.innerHTML = list.length ? list.map((item) => `
    <div class="watch-item">
      <div><strong>${item.name}</strong><div class="muted">${item.meta}</div></div>
      <span class="change ${changeClass(item.change)}">${signed(item.change)}</span>
    </div>
  `).join("") : `<div class="empty-state">暂无自选，点击星标加入关注</div>`;
}

function formatFundNav(value) {
  return hasNumber(value) ? Number(value).toFixed(4) : "—";
}

function fundSeriesForRange(fund, range = state.fundRange) {
  const days = { "1M": 31, "3M": 93, "6M": 186, "1Y": 366, "2Y": 732 }[range] || 366;
  const series = Array.isArray(fund?.series) ? fund.series : [];
  if (!series.length) return [];
  const cutoff = Date.now() - days * 24 * 60 * 60_000;
  const visible = series.filter((point) => point.timestamp >= cutoff);
  return visible.length >= 2 ? visible : series.slice(-Math.min(series.length, 2));
}

function fundChange(current, reference) {
  if (!hasNumber(current) || !hasNumber(reference) || reference === 0) return null;
  return ((current - reference) / reference) * 100;
}

function fundMetrics(fund) {
  const series = Array.isArray(fund?.series) ? fund.series : [];
  const latest = series[series.length - 1];
  if (!latest) return {};
  const currentValue = latest.value;
  const changeAt = (offset) => fundChange(currentValue, series[Math.max(0, series.length - 1 - offset)]?.value);
  const year = new Date(latest.timestamp).getFullYear();
  const ytdStart = series.find((point) => point.date >= `${year}-01-01`) || series[0];
  const oneYear = fundSeriesForRange(fund, "1Y");
  const oneYearValues = oneYear.map((point) => point.value);
  const min = Math.min(...oneYearValues);
  const max = Math.max(...oneYearValues);
  const position = max > min ? ((currentValue - min) / (max - min)) * 100 : 50;
  return {
    latest,
    fiveDay: changeAt(5),
    oneMonth: changeAt(22),
    ytd: fundChange(currentValue, ytdStart?.value),
    oneYear: fundChange(currentValue, oneYear[0]?.value),
    position: Math.max(0, Math.min(100, position))
  };
}

function fundSparklineSvg(fund) {
  const points = fundSeriesForRange(fund, "3M");
  if (points.length < 2) return `<span class="fund-sparkline-empty">历史净值待加载</span>`;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const polyline = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 28 - ((value - min) / (max - min || 1)) * 22;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg class="fund-sparkline" viewBox="0 0 100 32" aria-hidden="true"><polyline points="${polyline}" fill="none" stroke="${fund.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
}

function drawFundChart(fund) {
  const canvas = els.fundTrendChart;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * dpr));
  canvas.height = Math.max(180, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const pad = { top: 18, right: 18, bottom: 30, left: 52 };
  ctx.fillStyle = "#11171b";
  ctx.fillRect(0, 0, width, height);
  const points = fundSeriesForRange(fund);
  if (points.length < 2) {
    ctx.fillStyle = "#84979e";
    ctx.font = "12px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("等待公开历史净值", width / 2, height / 2);
    ctx.textAlign = "left";
    return;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  ctx.strokeStyle = "#26363d";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#82959d";
  ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
  for (let index = 0; index <= 4; index += 1) {
    const y = pad.top + (plotHeight / 4) * index;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    const label = max - ((max - min) / 4) * index;
    ctx.fillText(label.toFixed(3), 6, y + 4);
  }

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad.left + (index / (points.length - 1)) * plotWidth;
    const y = pad.top + (1 - (point.value - min) / (max - min || 1)) * plotHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = fund.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const labels = [points[0].date, points[Math.floor(points.length / 2)].date, points[points.length - 1].date];
  ctx.fillStyle = "#82959d";
  labels.forEach((label, index) => {
    const x = pad.left + (index / (labels.length - 1)) * plotWidth;
    ctx.fillText(label.slice(5), x - 14, height - 10);
  });
}

function renderFundDetail(fund) {
  if (!fund) {
    els.fundCode.textContent = "—";
    els.fundTitle.textContent = "基金趋势";
    els.fundDescriptor.textContent = "等待公开历史净值";
    els.fundStats.innerHTML = "";
    els.fundChartRange.textContent = "—";
    drawFundChart(null);
    return;
  }
  const metrics = fundMetrics(fund);
  const rangeLabel = { "1M": "近1月", "3M": "近3月", "6M": "近6月", "1Y": "近1年", "2Y": "近2年" }[state.fundRange];
  els.fundCode.textContent = fund.code;
  els.fundTitle.textContent = fund.name;
  els.fundDescriptor.textContent = `${fund.type} · 最新确认净值日期 ${fund.navDate}`;
  els.fundStats.innerHTML = [
    ["最新确认净值", formatFundNav(fund.nav)],
    ["当日涨跌", signed(fund.dailyChange), changeClass(fund.dailyChange)],
    ["近1月", signed(metrics.oneMonth), changeClass(metrics.oneMonth)],
    ["近1年位置", `${metrics.position?.toFixed(0) ?? "—"}%`]
  ].map(([label, value, tone]) => `<div><span>${label}</span><strong class="${tone || ""}">${value}</strong></div>`).join("");
  els.fundChartRange.textContent = `${rangeLabel} · ${fundSeriesForRange(fund).length} 个确认净值点`;
  els.fundSource.textContent = fund.source || "东方财富公开历史净值";
  drawFundChart(fund);
}

function renderFunds() {
  if (!fundWatch.length) {
    els.fundList.innerHTML = `<div class="empty-state">等待公开基金净值</div>`;
    renderFundDetail(null);
    return;
  }
  const selected = fundWatch.find((fund) => fund.code === state.selectedFund) || fundWatch[0];
  state.selectedFund = selected.code;
  els.fundList.innerHTML = fundWatch.map((fund, index) => {
    const metrics = fundMetrics(fund);
    return `
      <button class="fund-row ${fund.code === selected.code ? "active" : ""}" type="button" data-fund-code="${fund.code}">
        <span class="fund-row-index">0${index + 1}</span>
        <span class="fund-row-main"><strong>${fund.name}</strong><small>${fund.code} · ${fund.type} · ${fund.navDate || "净值待确认"}</small></span>
        <span class="fund-row-nav"><small>确认净值</small><strong>${formatFundNav(fund.nav)}</strong></span>
        <span class="change ${changeClass(fund.dailyChange)}">${signed(fund.dailyChange)}</span>
        <span class="fund-row-spark">${fundSparklineSvg(fund)}</span>
      </button>
    `;
  }).join("");
  renderFundDetail(selected);
}

let fundsInFlight = false;

async function loadFunds() {
  if (fundsInFlight || location.protocol === "file:") return;
  if (!canUseDashboardApi) {
    els.fundDataState.textContent = "加载静态净值";
    try {
      const payload = await fetchStaticJson("funds.json");
      fundWatch = Array.isArray(payload.funds) ? payload.funds : [];
      els.fundDataState.textContent = fundWatch.length ? `已同步 ${fundWatch.length} 只基金净值` : "静态净值暂不可用";
      renderFunds();
    } catch (error) {
      els.fundDataState.textContent = "静态净值暂不可用";
      els.fundList.innerHTML = `<div class="empty-state">${error.message || "基金净值暂不可用"}</div>`;
      renderFundDetail(null);
    }
    return;
  }
  fundsInFlight = true;
  els.fundDataState.textContent = "加载确认净值";
  try {
    const response = await fetch("/api/funds");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "基金净值请求失败");
    fundWatch = Array.isArray(payload.funds) ? payload.funds : [];
    els.fundDataState.textContent = fundWatch.length ? `已确认 ${fundWatch.length} 只基金净值` : "公开净值暂不可用";
    renderFunds();
  } catch (error) {
    els.fundDataState.textContent = "公开净值暂不可用";
    els.fundList.innerHTML = `<div class="empty-state">${error.message || "基金净值请求失败"}</div>`;
    renderFundDetail(null);
    console.warn("Fund data unavailable:", error.message);
  } finally {
    fundsInFlight = false;
  }
}

function buildAlerts() {
  const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const sectorAlerts = sectors
    .filter((item) => hasNumber(item.change) && Math.abs(item.change) >= state.threshold)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 4)
    .map((item) => ({
      title: `${item.name} ${signed(item.change)}`,
      target: "东方财富公开板块",
      level: Math.abs(item.change) >= 4 ? "high" : "medium",
      delta: signed(item.change),
      time,
      body: `上涨/下跌家数 ${item.breadth} · 资金流 ${item.flow >= 0 ? "+" : ""}${item.flow.toFixed(1)}亿（公开口径）`
    }));
  const commodityAlerts = commodities
    .filter((item) => hasNumber(item.change) && Math.abs(item.change) >= state.threshold)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 3)
    .map((item) => ({
      title: `${item.name} 日内变动 ${signed(item.change)}`,
      target: "Twelve Data",
      level: Math.abs(item.change) >= 3 ? "high" : "medium",
      delta: signed(item.change),
      time,
      body: `${item.code} · ${item.unit} · 免费公开数据源`
    }));
  return [...sectorAlerts, ...commodityAlerts];
}

function renderAlerts() {
  if (!state.alertsEnabled) {
    els.alertFeed.innerHTML = `<div class="empty-state">异动提醒已关闭</div>`;
    return;
  }

  const term = state.search.trim();
  const list = alerts.filter((item) => {
    const matchText = !term || `${item.title}${item.target}${item.body}`.includes(term);
    const matchLevel = state.alertLevel === "all" || item.level === state.alertLevel || (state.alertLevel === "watch" && item.target.includes("关注"));
    const matchThreshold = Math.abs(parseFloat(item.delta)) >= state.threshold || item.level === "high";
    return matchText && matchLevel && matchThreshold;
  });

  els.alertFeed.innerHTML = list.length ? list.map((item) => `
    <article class="alert-item">
      <span class="severity ${item.level}"></span>
      <div>
        <strong class="alert-title">${item.title}</strong>
        <div class="alert-meta"><span>${item.time} · ${item.target}</span><span>${item.body}</span></div>
      </div>
      <span class="tag ${item.delta.startsWith("-") ? "down" : "up"}">${item.delta}</span>
    </article>
  `).join("") : `<div class="empty-state">当前筛选下暂无异动</div>`;
}

function flashValue(element) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  element.classList.remove("value-flash");
  window.requestAnimationFrame(() => element.classList.add("value-flash"));
  window.setTimeout(() => element.classList.remove("value-flash"), 600);
}

function setTextWithFlash(element, value) {
  const nextValue = String(value);
  const changed = element.textContent !== nextValue;
  element.textContent = nextValue;
  if (changed && nextValue !== "—") flashValue(element);
}

function flashChart() {
  const chartWrap = els.trendChart?.closest(".chart-wrap");
  if (!chartWrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  chartWrap.classList.remove("is-chart-refreshing");
  window.requestAnimationFrame(() => chartWrap.classList.add("is-chart-refreshing"));
  window.setTimeout(() => chartWrap.classList.remove("is-chart-refreshing"), 750);
}

function setTicker(valueEl, changeEl, quote, maximumFractionDigits = 2) {
  if (!quote || !hasNumber(quote.price)) {
    setTextWithFlash(valueEl, "—");
    changeEl.textContent = "公开数据暂不可用";
    changeEl.className = "flat";
    return;
  }
  setTextWithFlash(valueEl, quote.price.toLocaleString("zh-CN", { maximumFractionDigits }));
  changeEl.textContent = signed(quote.change);
  changeEl.className = quote.change > 0.05 ? "rise" : quote.change < -0.05 ? "fall" : "flat";
}

function updateOverview(overview, aShareBreadth) {
  setTicker(els.tickerShanghai, els.tickerShanghaiChange, overview?.shanghai, 2);
  setTicker(els.tickerShenzhen, els.tickerShenzhenChange, overview?.shenzhen, 2);
  setTicker(els.tickerUsdCny, els.tickerUsdCnyChange, overview?.usdcny, 4);
  const availableBreadth = aShareBreadth && Number.isFinite(aShareBreadth.total);
  setTextWithFlash(els.tickerUpSectors, availableBreadth ? aShareBreadth.rising.toLocaleString("zh-CN") : "—");
  els.tickerUpSectorsMeta.textContent = availableBreadth ? `A股共${aShareBreadth.total.toLocaleString("zh-CN")}只` : "等待A股统计";
  els.tickerUpSectorsMeta.className = "flat";
  setTextWithFlash(els.tickerDownSectors, availableBreadth ? aShareBreadth.falling.toLocaleString("zh-CN") : "—");
  els.tickerDownSectorsMeta.textContent = availableBreadth ? "东方财富公开口径" : "等待A股统计";
  els.tickerDownSectorsMeta.className = "flat";
}

function renderAll() {
  renderCards();
  renderChart();
  renderAttribution();
  renderWatchList();
  renderFunds();
}

function replaceMarketItems(target, next, favoriteKey) {
  const favorites = new Set(target.filter((item) => item.favorite).map((item) => item[favoriteKey]));
  target.splice(0, target.length, ...next.map((item) => ({ ...item, favorite: favorites.has(item[favoriteKey]) })));
}

function staticDataUrl(pathname) {
  return `./data/${pathname}?v=${Date.now()}`;
}

async function fetchStaticJson(pathname) {
  const response = await fetch(staticDataUrl(pathname), { cache: "no-store" });
  if (!response.ok) throw new Error(`静态数据暂不可用：${pathname}`);
  return response.json();
}

async function loadStaticHistory(item, range, cacheKey = `${item.id}:${range}`) {
  try {
    const payload = await fetchStaticJson(`history/${item.id}-${range}.json`);
    if (!Array.isArray(payload.points) || payload.points.length < 2) throw new Error("静态趋势点不足");
    state.history.set(cacheKey, payload.points);
    if (cacheKey === `${item.id}:${state.range}`) {
      els.chartDataStatus.textContent = payload.source || "公开行情";
      els.chartUpdatedAt.textContent = payload.refreshedAt
        ? new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(payload.refreshedAt))
        : "静态数据";
      renderChart();
    }
    return true;
  } catch (error) {
    if (cacheKey === `${item.id}:${state.range}`) {
      els.chartDataStatus.textContent = "趋势不可用";
      els.chartUpdatedAt.textContent = "等待下一次自动采集";
      renderChart();
    }
    console.warn("Static history unavailable:", error.message);
    return false;
  }
}

async function loadHistory() {
  const item = commodities.find((entry) => entry.id === state.selectedCommodity);
  if (!item || location.protocol === "file:") return;
  if (!canUseDashboardApi) {
    els.chartDataStatus.textContent = "加载静态趋势";
    await loadStaticHistory(item, state.range);
    return;
  }
  if (!hasNumber(item.price)) {
    els.chartDataStatus.textContent = "等待报价";
    return;
  }
  els.chartDataStatus.textContent = "加载中";
  try {
    const response = await fetch(`/api/history?id=${encodeURIComponent(item.id)}&range=${encodeURIComponent(state.range)}`);
    if (!response.ok) throw new Error((await response.json()).error || "趋势数据暂不可用");
    const payload = await response.json();
    state.history.set(`${item.id}:${state.range}`, payload.points);
    els.chartDataStatus.textContent = payload.source || "公开行情";
    els.chartUpdatedAt.textContent = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    renderChart();
  } catch (error) {
    els.chartDataStatus.textContent = "趋势不可用";
    console.warn("History data unavailable:", error.message);
  }
}

let refreshInFlight = false;

async function refreshMarket({ withHistory = false } = {}) {
  if (refreshInFlight || location.protocol === "file:") return;
  if (!canUseDashboardApi) {
    try {
      const payload = await fetchStaticJson("market.json");
      replaceMarketItems(commodities, Array.isArray(payload.commodities) ? payload.commodities : commodities, "id");
      replaceMarketItems(sectors, Array.isArray(payload.sectors) ? payload.sectors : [], "name");
      updateOverview(payload.overview, payload.aShareBreadth);
      state.liveConnected = true;
      state.tick = 60;
      state.lastUpdated = payload.refreshedAt || null;
      els.marketStatus.textContent = "静态数据已同步";
      els.dataSource.textContent = "公开延迟行情";
      els.nextRefresh.textContent = payload.refreshedAt
        ? `更新于 ${new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(payload.refreshedAt))}`
        : "等待下一次自动采集";
      renderAll();
      if (withHistory) await Promise.all([loadHistory(), loadSparklineHistories()]);
      return true;
    } catch (error) {
      state.liveConnected = false;
      els.marketStatus.textContent = "静态数据暂不可用";
      els.dataSource.textContent = "等待自动采集";
      els.nextRefresh.textContent = error.message || "静态数据暂不可用";
      renderAll();
      return false;
    }
  }
  refreshInFlight = true;
  els.refreshNow.disabled = true;
  els.refreshNow.textContent = "正在刷新";
  try {
    const response = await fetch("/api/market");
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "实时数据请求失败");
    replaceMarketItems(commodities, payload.commodities, "id");
    replaceMarketItems(sectors, payload.sectors, "name");
    updateOverview(payload.overview, payload.aShareBreadth);
    state.liveConnected = true;
    state.tick = 60;
    state.lastUpdated = payload.refreshedAt || new Date().toISOString();
    els.marketStatus.textContent = payload.aShareStatus?.isTradingDay === true
      ? "公开数据监测中"
      : payload.aShareStatus?.isTradingDay === false
        ? "公开数据 · 非交易日"
        : payload.aShareStatus?.limited
          ? "公开数据监测中 · 日历限频"
          : "公开数据监测中 · 日历待校验";
      els.dataSource.textContent = "Twelve · Alpha · Metalprice · 东方财富延迟 · 腾讯 · TuShare";
    renderAll();
    if (withHistory) await Promise.all([loadHistory(), loadSparklineHistories()]);
    return true;
  } catch (error) {
    state.liveConnected = false;
    els.marketStatus.textContent = "公开数据暂不可用";
    els.dataSource.textContent = "保留上次成功数据";
    els.nextRefresh.textContent = error.message || "数据源暂不可用";
    console.warn("Live data unavailable:", error.message);
    return false;
  } finally {
    refreshInFlight = false;
    els.refreshNow.disabled = false;
    els.refreshNow.textContent = "刷新行情";
  }
}

function setComponentSearchState(message, tone = "") {
  els.componentSearchState.textContent = message;
  els.componentSearchState.className = `component-search-state ${tone}`.trim();
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function resetComparisonCosts() {
  state.comparisonCosts = [];
}

function normalizeComponentQuote(quote, index) {
  const sourceHint = [quote.source, quote.sourceName, quote.importedFrom, quote.database]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const sourceType = quote.sourceType === "internal" || quote.database === "internal" || quote.importedFrom === "excel" || /excel|\.xlsx?\b|公司内部|内部数据库/.test(sourceHint)
    ? "internal"
    : "external";
  const source = quote.source || (sourceType === "internal" ? "Excel 导入报价" : "公开渠道报价");
  return {
    id: quote.id || `quote-${Date.now()}-${index}`,
    model: quote.model || quote.mpn || state.componentSearchMeta?.mpn || "未标注型号",
    category: quote.category || state.componentSearchMeta?.spec || "规格待补充",
    spec: quote.spec || state.componentSearchMeta?.spec || state.componentSearchMeta?.package || "规格待补充",
    supplier: quote.supplier || "未标注供应商",
    quote: Number(quote.price ?? quote.quote),
    currency: quote.currency || "CNY",
    quantity: optionalNumber(quote.quantity),
    stock: optionalNumber(quote.stock),
    lead: quote.lead || "—",
    source,
    sourceDetail: quote.sourceDetail || quote.sourceName || source,
    sourceType,
    sourceUrl: quote.sourceUrl || ""
  };
}

function applyQuoteResults(quotes, links = []) {
  const normalized = quotes.map(normalizeComponentQuote).filter((quote) => Number.isFinite(quote.quote) && quote.quote >= 0);
  attributionRecords.splice(0, attributionRecords.length, ...normalized);
  state.componentSearchLinks = links;
  state.selectedAttribution = normalized[0]?.id || "";
  state.selectedAnchor = normalized[1]?.id || "";
  resetComparisonCosts();
  renderAttribution();
}

async function searchComponentQuotes(formData) {
  const mpn = String(formData.get("mpn") || "").trim();
  const spec = String(formData.get("spec") || "").trim();
  const packageName = String(formData.get("package") || "").trim();
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  if (mpn.length < 2) {
    setComponentSearchState("请输入至少两个字符的型号 / MPN。", "error");
    return;
  }
  if (location.protocol === "file:") {
    setComponentSearchState("请通过本机服务打开看板，才能查询渠道报价。", "error");
    return;
  }
  if (!canUseDashboardApi) {
    state.componentSearchMeta = { mpn, spec, package: packageName, quantity };
    setComponentSearchState("外网静态版未连接抓价后端。可点击“录入报价”，先用供应商报价做价差归因。", "warning");
    return;
  }
  state.componentSearchMeta = { mpn, spec, package: packageName, quantity };
  els.componentSearchButton.disabled = true;
  els.componentSearchButton.textContent = "查询中";
  setComponentSearchState(`正在查询 ${mpn} 的公开渠道报价...`);
  try {
    const params = new URLSearchParams({ mpn, spec, package: packageName, quantity: String(quantity) });
    const response = await fetch(`/api/component-quotes?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "渠道报价查询失败");
    applyQuoteResults(Array.isArray(payload.quotes) ? payload.quotes : [], Array.isArray(payload.searchLinks) ? payload.searchLinks : []);
    setComponentSearchState(payload.quotes?.length
      ? `已返回 ${payload.quotes.length} 条可比较报价，选择两条即可归因。`
      : (payload.message || "未取得可验证报价。可打开公开页面，或手动录入供应商报价。"), payload.quotes?.length ? "success" : "warning");
  } catch (error) {
    attributionRecords.splice(0, attributionRecords.length);
    state.componentSearchLinks = [];
    state.selectedAttribution = "";
    state.selectedAnchor = "";
    resetComparisonCosts();
    renderAttribution();
    setComponentSearchState(error.message || "渠道报价查询失败。", "error");
  } finally {
    els.componentSearchButton.disabled = false;
    els.componentSearchButton.textContent = "查询报价";
  }
}

function addManualQuote(formData) {
  const mpn = String(new FormData(els.componentSearchForm).get("mpn") || "").trim();
  const price = Number(formData.get("price"));
  if (!mpn) {
    setComponentSearchState("请先输入物料型号，再录入供应商报价。", "error");
    return;
  }
  if (!Number.isFinite(price) || price < 0) {
    setComponentSearchState("请输入有效的单价。", "error");
    return;
  }
  const previousCurrent = state.selectedAttribution;
  const quote = normalizeComponentQuote({
    id: `manual-${Date.now()}`,
    model: mpn,
    spec: String(new FormData(els.componentSearchForm).get("spec") || "").trim(),
    category: String(new FormData(els.componentSearchForm).get("package") || "").trim(),
    supplier: String(formData.get("supplier") || "手动录入"),
    price,
    currency: String(formData.get("currency") || "CNY"),
    stock: formData.get("stock"),
    lead: String(formData.get("lead") || "—"),
    quantity: Number(new FormData(els.componentSearchForm).get("quantity")) || null,
    source: "手动录入报价",
    sourceType: "external"
  }, attributionRecords.length);
  attributionRecords.unshift(quote);
  state.selectedAttribution = quote.id;
  state.selectedAnchor = previousCurrent && previousCurrent !== quote.id ? previousCurrent : attributionRecords.find((item) => item.id !== quote.id)?.id || "";
  resetComparisonCosts();
  els.manualQuoteForm.reset();
  els.manualQuoteForm.hidden = true;
  setComponentSearchState(`已加入 ${quote.supplier} 的手动报价，可在右侧选择对比锚点。`, "success");
  renderAttribution();
}

els.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderAll();
});

els.rangeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-range]");
  if (!button) return;
  state.range = button.dataset.range;
  els.rangeTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderChart();
  loadHistory();
});

els.fundRangeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-fund-range]");
  if (!button) return;
  state.fundRange = button.dataset.fundRange;
  els.fundRangeTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderFunds();
});

els.componentSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchComponentQuotes(new FormData(els.componentSearchForm));
});

els.manualQuoteToggle.addEventListener("click", () => {
  els.manualQuoteForm.hidden = !els.manualQuoteForm.hidden;
  if (!els.manualQuoteForm.hidden) els.manualQuoteForm.querySelector("input[name='supplier']").focus();
});

els.manualQuoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addManualQuote(new FormData(els.manualQuoteForm));
});

els.attributionDetail.addEventListener("click", (event) => {
  const costViewButton = event.target.closest("button[data-cost-view]");
  if (costViewButton) {
    state.costView = costViewButton.dataset.costView;
    renderAttribution();
    return;
  }
  const addCostButton = event.target.closest("button[data-add-cost]");
  if (addCostButton) {
    const entry = addCostButton.closest("[data-cost-entry]");
    const quote = Number(entry.querySelector("[data-cost-quote]").value);
    const anchor = Number(entry.querySelector("[data-cost-anchor]").value);
    if (!Number.isFinite(quote) || !Number.isFinite(anchor) || quote < 0 || anchor < 0) {
      setComponentSearchState("请为归因项填写当前成本和锚点成本。", "error");
      return;
    }
    state.comparisonCosts.push({
      name: entry.querySelector("[data-cost-name]").value,
      quote,
      anchor,
      note: entry.querySelector("[data-cost-note]").value.trim()
    });
    renderAttribution();
    return;
  }
  const removeCostButton = event.target.closest("button[data-remove-cost]");
  if (removeCostButton) {
    state.comparisonCosts.splice(Number(removeCostButton.dataset.removeCost), 1);
    renderAttribution();
  }
});

els.attributionDetail.addEventListener("change", (event) => {
  const selector = event.target.closest("select[data-comparison-role]");
  if (!selector) return;
  const previousPair = `${state.selectedAttribution}:${state.selectedAnchor}`;
  if (selector.dataset.comparisonRole === "current") state.selectedAttribution = selector.value;
  if (selector.dataset.comparisonRole === "anchor") state.selectedAnchor = selector.value;
  if (state.selectedAttribution === state.selectedAnchor) {
    state.selectedAnchor = attributionRecords.find((record) => record.id !== state.selectedAttribution)?.id || "";
  }
  if (previousPair !== `${state.selectedAttribution}:${state.selectedAnchor}`) resetComparisonCosts();
  renderAttribution();
});

document.addEventListener("click", (event) => {
  const commodityButton = event.target.closest("[data-fav-commodity]");
  const sectorButton = event.target.closest("[data-fav-sector]");
  const attributionRow = event.target.closest("[data-attribution-id]");
  const fundRow = event.target.closest("[data-fund-code]");
  const card = event.target.closest(".metric-card");

  if (fundRow) {
    state.selectedFund = fundRow.dataset.fundCode;
    renderFunds();
    return;
  }

  if (attributionRow) {
    const previousPair = `${state.selectedAttribution}:${state.selectedAnchor}`;
    state.selectedAttribution = attributionRow.dataset.attributionId;
    if (state.selectedAttribution === state.selectedAnchor) {
      state.selectedAnchor = attributionRecords.find((record) => record.id !== state.selectedAttribution)?.id || "";
    }
    if (previousPair !== `${state.selectedAttribution}:${state.selectedAnchor}`) resetComparisonCosts();
    renderAttribution();
    return;
  }

  if (commodityButton) {
    const item = commodities.find((entry) => entry.id === commodityButton.dataset.favCommodity);
    if (item) item.favorite = !item.favorite;
    renderAll();
    return;
  }

  if (sectorButton) {
    const item = sectors.find((entry) => entry.name === sectorButton.dataset.favSector);
    if (item) item.favorite = !item.favorite;
    renderAll();
    return;
  }

  if (card) {
    state.selectedCommodity = card.dataset.id;
    renderChart();
    loadHistory();
  }
});

els.refreshNow.addEventListener("click", async () => {
  if (location.protocol === "file:") {
    els.nextRefresh.textContent = "请通过本机服务打开看板";
    return;
  }
  const [refreshed] = await Promise.all([refreshMarket({ withHistory: true }), loadFunds()]);
  if (refreshed) els.nextRefresh.textContent = "刚刚刷新";
});

els.autoRefresh.addEventListener("click", () => {
  state.autoRefresh = !state.autoRefresh;
  els.autoRefresh.classList.toggle("active", state.autoRefresh);
});

els.clearWatch.addEventListener("click", () => {
  commodities.forEach((item) => item.favorite = false);
  sectors.forEach((item) => item.favorite = false);
  renderAll();
});

els.trendChart.addEventListener("mousemove", (event) => {
  const rect = els.trendChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, (x - 50) / (rect.width - 70)));
  const active = commodities.find((item) => item.id === state.selectedCommodity) || commodities[0];
  const data = chartSeriesFor(active);
  if (!data.length) return;
  const index = Math.round(percent * (data.length - 1));
  const point = historyPointFor(active, index);
  const exactPrice = data[index].toLocaleString("zh-CN", { maximumFractionDigits: 6 });
  els.chartTooltip.hidden = false;
  els.chartTooltip.style.left = `${Math.min(rect.width - 180, Math.max(8, x + 12))}px`;
  els.chartTooltip.style.top = `${Math.max(12, event.clientY - rect.top - 46)}px`;
  els.chartTooltip.innerHTML = `<strong>${active.name}</strong><br>${point?.label || state.range} · ${exactPrice} ${active.unit}`;
});

els.trendChart.addEventListener("mouseleave", () => {
  els.chartTooltip.hidden = true;
});

els.fundTrendChart.addEventListener("mousemove", (event) => {
  const fund = fundWatch.find((item) => item.code === state.selectedFund);
  const points = fundSeriesForRange(fund);
  if (!points.length) return;
  const rect = els.fundTrendChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, (x - 52) / (rect.width - 70)));
  const point = points[Math.round(percent * (points.length - 1))];
  els.fundChartTooltip.hidden = false;
  els.fundChartTooltip.style.left = `${Math.min(rect.width - 176, Math.max(8, x + 12))}px`;
  els.fundChartTooltip.style.top = `${Math.max(10, event.clientY - rect.top - 50)}px`;
  els.fundChartTooltip.innerHTML = `<strong>${fund.name}</strong><br>${point.date} · ${formatFundNav(point.value)}<br>${signed(point.change)}`;
});

els.fundTrendChart.addEventListener("mouseleave", () => {
  els.fundChartTooltip.hidden = true;
});

window.addEventListener("resize", () => {
  renderChart();
  renderFundDetail(fundWatch.find((fund) => fund.code === state.selectedFund));
});

updateMarketClock();
window.requestAnimationFrame(() => document.body.classList.add("motion-ready"));
setInterval(() => {
  updateMarketClock();
  if (!canUseDashboardApi) {
    els.nextRefresh.textContent = state.lastUpdated ? "每日自动同步" : "等待自动采集";
    return;
  }
  if (!state.autoRefresh) {
    els.nextRefresh.textContent = "自动刷新已暂停";
    return;
  }
  state.tick -= 1;
  if (state.tick <= 0) {
    refreshMarket();
    loadFunds();
    state.tick = 60;
  }
  els.nextRefresh.textContent = `自动刷新 ${state.tick}s`;
}, 1000);

renderAll();
if (location.protocol !== "file:" && canUseDashboardApi) {
  refreshMarket({ withHistory: true });
  loadFunds();
} else if (location.protocol !== "file:") {
  refreshMarket({ withHistory: false });
  loadHistory();
  loadFunds();
}
