const params = new URLSearchParams(location.search);
const variant = Math.min(3, Math.max(1, Number(params.get("v")) || 1));
const privateHost = params.get("mode") !== "public"
  && /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(location.hostname);
const staticDataUrl = (name) => new URL(`../data/${name}`, location.href).href;
document.body.classList.add(`variant-${variant}`, "click-motion");
if (variant === 2) document.body.classList.add("deep-observatory");
document.title = variant === 2 ? "MarketLens | 深空观测舱" : `MarketLens UI Concept ${variant}`;

const clock = document.querySelector("#clockValue");
const formatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

function updateClock() {
  clock.textContent = formatter.format(new Date());
}

updateClock();
setInterval(updateClock, 1000);

const canvas = document.querySelector("#ambientField");
const context = canvas.getContext("2d");

function drawStaticField() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = innerWidth;
  const height = innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  if (variant === 2) {
    const horizon = height * .26;
    const vanishingX = width * .66;

    context.save();
    context.lineWidth = 1;

    for (let index = 0; index <= 16; index += 1) {
      const endX = -width * .18 + index / 16 * width * 1.36;
      context.beginPath();
      context.moveTo(vanishingX, horizon);
      context.lineTo(endX, height + 80);
      context.strokeStyle = index % 5 === 0
        ? "rgba(209, 170, 97, .055)"
        : "rgba(112, 223, 202, .038)";
      context.stroke();
    }

    for (let index = 0; index < 11; index += 1) {
      const progress = index / 10;
      const y = horizon + progress * progress * (height - horizon + 28);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.strokeStyle = index % 4 === 0
        ? "rgba(105, 154, 193, .055)"
        : "rgba(112, 223, 202, .032)";
      context.stroke();
    }

    const fractures = [
      [0.04, .18, .22, .09, .34, .2],
      [.42, .06, .54, .17, .67, .08],
      [.72, .16, .82, .05, .97, .14],
      [.08, .62, .18, .48, .3, .57],
      [.69, .68, .81, .51, .96, .62]
    ];
    fractures.forEach((points, index) => {
      context.beginPath();
      context.moveTo(points[0] * width, points[1] * height);
      context.lineTo(points[2] * width, points[3] * height);
      context.lineTo(points[4] * width, points[5] * height);
      context.strokeStyle = index % 2
        ? "rgba(209, 170, 97, .07)"
        : "rgba(112, 223, 202, .075)";
      context.stroke();
    });

    for (let index = 0; index < 28; index += 1) {
      const x = (Math.sin(index * 12.9898) * 43758.5453 % 1 + 1) % 1 * width;
      const y = (Math.sin(index * 28.233 + 1.7) * 19341.239 % 1 + 1) % 1 * height;
      const size = index % 6 === 0 ? 4 : 2;
      context.beginPath();
      context.moveTo(x - size, y);
      context.lineTo(x + size, y);
      context.moveTo(x, y - size);
      context.lineTo(x, y + size);
      context.strokeStyle = index % 7 === 0
        ? "rgba(209, 170, 97, .2)"
        : "rgba(151, 226, 214, .14)";
      context.stroke();
    }

    context.restore();
    return;
  }

  const lineCount = variant === 2 ? 7 : 8;
  for (let index = 0; index < lineCount; index += 1) {
    context.beginPath();
    for (let x = -40; x <= width + 40; x += 24) {
      const baseline = height * (0.14 + index * 0.13);
      const amplitude = variant === 3 ? 22 + index * 2 : 10 + index * 1.5;
      const y = baseline + Math.sin(x * 0.005 + index * 0.72) * amplitude + Math.cos(x * 0.0018) * 7;
      if (x === -40) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = variant === 1
      ? "rgba(121, 218, 204, .05)"
      : variant === 2
        ? "rgba(201, 177, 96, .04)"
        : "rgba(111, 191, 198, .05)";
    context.lineWidth = 1;
    context.stroke();
  }
}

addEventListener("resize", drawStaticField);
drawStaticField();

const pulseTargets = [
  ".primary-nav button",
  ".control-deck button",
  ".material-list button",
  ".range-tabs button",
  ".breadth-strip > div",
  ".commodity-stream article",
  ".quote-head button",
  ".chart-area",
  ".concept-component-search button",
  ".component-result-row",
  ".drawer-close"
].join(",");

document.addEventListener("click", (event) => {
  if (variant !== 2) return;
  const target = event.target.closest(pulseTargets);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const x = event.clientX > 0 ? event.clientX : rect.left + rect.width / 2;
  const y = event.clientY > 0 ? event.clientY : rect.top + rect.height / 2;
  const burst = document.createElement("span");
  burst.className = "signal-burst";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  document.body.append(burst);
  burst.addEventListener("animationend", () => burst.remove(), { once: true });

  target.classList.remove("control-pulse");
  void target.offsetWidth;
  target.classList.add("control-pulse");
  target.addEventListener("animationend", () => target.classList.remove("control-pulse"), { once: true });

  target.querySelector(".interaction-sweep")?.remove();
  const sweep = document.createElement("span");
  sweep.className = "interaction-sweep";
  target.append(sweep);
  sweep.addEventListener("animationend", () => sweep.remove(), { once: true });
}, true);

function flashMarketValues() {
  const targets = document.querySelectorAll(".breadth-strip > div, .quote-value, .price-line");
  targets.forEach((target, index) => {
    setTimeout(() => {
      target.classList.remove("value-flash");
      void target.offsetWidth;
      target.classList.add("value-flash");
    }, index * 45);
  });
}

const refreshButton = document.querySelector(".refresh");
refreshButton.addEventListener("click", () => {
  if (refreshButton.classList.contains("is-loading")) return;
  refreshButton.classList.add("is-loading");
  refreshButton.textContent = "同步中";
  setTimeout(() => {
    flashMarketValues();
    refreshButton.classList.remove("is-loading");
    refreshButton.textContent = "刷新行情";
  }, 720);
});

const autoButton = document.querySelector(".auto");
autoButton.classList.add("active");
autoButton.setAttribute("aria-pressed", "true");
autoButton.addEventListener("click", () => {
  const active = autoButton.classList.toggle("active");
  autoButton.setAttribute("aria-pressed", String(active));
});

const conceptNavButtons = Array.from(document.querySelectorAll(".primary-nav button"));
const conceptViewTargets = {
  overview: ".hero-row",
  commodities: ".commodity-stream",
  breadth: ".breadth-strip",
  magnet: ".rare-workspace"
};

function updateConceptViewUrl(view) {
  const url = new URL(location.href);
  if (view === "components") url.searchParams.set("view", "components");
  else url.searchParams.delete("view");
  history.replaceState(null, "", url);
}

function activateConceptView(view, { updateUrl = true, scroll = true } = {}) {
  const componentMode = view === "components";
  document.body.classList.toggle("component-mode", componentMode);
  conceptNavButtons.forEach((item) => item.classList.toggle("active", item.dataset.conceptView === view));
  const activeNavItem = conceptNavButtons.find((item) => item.dataset.conceptView === view);
  requestAnimationFrame(() => activeNavItem?.scrollIntoView({ behavior: scroll ? "smooth" : "auto", block: "nearest", inline: "center" }));
  if (updateUrl) updateConceptViewUrl(view);

  if (componentMode) {
    ensureDefaultComponentQuery();
    if (scroll) document.querySelector("#componentLab")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  closeDrawer();
  const target = document.querySelector(conceptViewTargets[view] || conceptViewTargets.overview);
  if (scroll) requestAnimationFrame(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

conceptNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.conceptHref) {
      location.href = button.dataset.conceptHref;
      return;
    }
    activateConceptView(button.dataset.conceptView || "overview");
  });
});

const chartArea = document.querySelector(".chart-area");
const chartSvg = chartArea.querySelector("svg");
const chartPath = chartSvg.querySelector(".chart-line");
const chartFill = chartSvg.querySelector(".chart-fill");
const svgNs = "http://www.w3.org/2000/svg";

chartPath.id = "rareEarthLivePath";
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const liveChartDot = document.createElementNS(svgNs, "circle");
  liveChartDot.classList.add("live-chart-dot");
  liveChartDot.setAttribute("r", "3.5");
  const liveChartMotion = document.createElementNS(svgNs, "animateMotion");
  liveChartMotion.setAttribute("dur", "5.2s");
  liveChartMotion.setAttribute("begin", "-1.4s");
  liveChartMotion.setAttribute("repeatCount", "indefinite");
  const liveChartPath = document.createElementNS(svgNs, "mpath");
  liveChartPath.setAttribute("href", "#rareEarthLivePath");
  liveChartMotion.append(liveChartPath);
  liveChartDot.append(liveChartMotion);
  chartSvg.append(liveChartDot);
}

const guide = document.createElementNS(svgNs, "line");
guide.classList.add("motion-guide");
guide.setAttribute("y1", "18");
guide.setAttribute("y2", "194");
const halo = document.createElementNS(svgNs, "circle");
halo.classList.add("motion-dot-halo");
halo.setAttribute("r", "10");
const tracker = document.createElementNS(svgNs, "circle");
tracker.classList.add("motion-dot");
tracker.setAttribute("r", "4");
chartSvg.append(guide, halo, tracker);

const chartTooltip = document.createElement("div");
chartTooltip.className = "motion-tooltip";
chartArea.append(chartTooltip);
chartArea.tabIndex = 0;
chartArea.setAttribute("role", "application");
chartArea.setAttribute("aria-label", "点击趋势图查看对应日期价格");

let rareEarthProducts = [];
let selectedProductId = "prnd-alloy";
let selectedRange = "3M";
let currentSeries = [];
let currentPoints = [];

const materialIds = ["prnd-alloy", "prnd-oxide", "dyfe-alloy", "dysprosium-oxide"];
const materialButtons = Array.from(document.querySelectorAll(".material-list button"));
materialButtons.forEach((button, index) => {
  button.dataset.productId = materialIds[index];
});

function formatPrice(value) {
  return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(2)}%`;
}

function formatAxis(value) {
  return `${(Number(value || 0) / 10000).toFixed(1)}万`;
}

function changeClass(element, value) {
  element.classList.remove("up", "down", "flat");
  element.classList.add(Number(value) > 0 ? "up" : Number(value) < 0 ? "down" : "flat");
}

function rangeSeries(series) {
  if (selectedRange === "3M" || series.length <= 31) return series;
  const end = new Date(`${series.at(-1).date}T00:00:00Z`).getTime();
  const cutoff = end - 30 * 86400000;
  return series.filter((point) => new Date(`${point.date}T00:00:00Z`).getTime() >= cutoff);
}

function buildChart(series, animate = true) {
  const values = series.map((point) => Number(point.value));
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = Math.max(high - low, high * .02, 1);
  const min = low - span * .08;
  const max = high + span * .08;
  currentPoints = series.map((point, index) => ({
    ...point,
    x: series.length === 1 ? 450 : index / (series.length - 1) * 900,
    y: 18 + (max - Number(point.value)) / (max - min) * 176
  }));

  const lineData = currentPoints.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  chartPath.setAttribute("d", lineData);
  chartFill.setAttribute("d", `${lineData} L900 215 L0 215 Z`);

  const axisLabels = Array.from(document.querySelectorAll(".axis span"));
  axisLabels.forEach((label, index) => {
    label.textContent = formatAxis(max - index / Math.max(axisLabels.length - 1, 1) * (max - min));
  });

  const dateLabels = Array.from(document.querySelectorAll(".dates span"));
  const middle = series[Math.floor((series.length - 1) / 2)];
  [series[0], middle, series.at(-1)].forEach((point, index) => {
    dateLabels[index].textContent = point.date.slice(5);
  });

  chartPath.classList.remove("is-redrawing");
  if (animate) {
    void chartPath.getBoundingClientRect();
    chartPath.classList.add("is-redrawing");
  }
  chartTooltip.classList.remove("visible");
  guide.classList.remove("visible");
  halo.classList.remove("visible", "clicked");
  tracker.classList.remove("visible");
}

function renderSelectedProduct({ animate = true } = {}) {
  const product = rareEarthProducts.find((item) => item.id === selectedProductId);
  if (!product || !Array.isArray(product.series) || !product.series.length) return;

  materialButtons.forEach((button) => button.classList.toggle("active", button.dataset.productId === product.id));
  const detail = document.querySelector(".rare-detail");
  detail.classList.remove("switching");
  if (animate) {
    void detail.offsetWidth;
    detail.classList.add("switching");
  }
  detail.style.setProperty("--chart", product.color || "#73cdbf");
  document.documentElement.style.setProperty("--chart", product.color || "#73cdbf");

  const priceLine = document.querySelector(".price-line");
  priceLine.querySelector("span").textContent = `${product.role} · ${product.priceDate}`;
  priceLine.querySelector("h3").textContent = product.name;
  priceLine.querySelector("strong").innerHTML = `${formatPrice(product.price)} <small>${product.unit}</small>`;
  const daily = priceLine.querySelector("em");
  daily.textContent = formatPercent(product.dailyChange);
  changeClass(daily, product.dailyChange);

  currentSeries = rangeSeries(product.series);
  const first = Number(currentSeries[0].value);
  const last = Number(currentSeries.at(-1).value);
  const periodChange = first ? (last - first) / first * 100 : 0;
  const values = currentSeries.map((point) => Number(point.value));
  const statLabels = Array.from(document.querySelectorAll(".rare-stats span"));
  statLabels[0].textContent = selectedRange === "1M" ? "近1月涨跌" : "近3月涨跌";
  const stats = Array.from(document.querySelectorAll(".rare-stats strong"));
  stats[0].textContent = formatPercent(periodChange);
  changeClass(stats[0], periodChange);
  stats[1].textContent = `${formatPrice(Math.max(...values))} ${product.unit}`;
  stats[2].textContent = `${formatPrice(Math.min(...values))} ${product.unit}`;
  stats[3].textContent = product.priceDate;

  const footer = document.querySelector(".rare-detail footer");
  footer.querySelector("span").textContent = `${currentSeries[0].date} 至 ${currentSeries.at(-1).date} · ${currentSeries.length}个日历价格点`;
  footer.querySelector("strong").textContent = product.source;
  buildChart(currentSeries, animate);
}

materialButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedProductId = button.dataset.productId;
    renderSelectedProduct();
  });
});

document.querySelectorAll(".range-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".range-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedRange = button.textContent.includes("1") ? "1M" : "3M";
    renderSelectedProduct();
  });
});

function showChartPoint(index) {
  const point = currentPoints[Math.max(0, Math.min(currentPoints.length - 1, index))];
  if (!point) return;
  guide.setAttribute("x1", point.x.toFixed(2));
  guide.setAttribute("x2", point.x.toFixed(2));
  halo.setAttribute("cx", point.x.toFixed(2));
  halo.setAttribute("cy", point.y.toFixed(2));
  tracker.setAttribute("cx", point.x.toFixed(2));
  tracker.setAttribute("cy", point.y.toFixed(2));
  guide.classList.add("visible");
  halo.classList.add("visible", "clicked");
  tracker.classList.add("visible");

  chartTooltip.innerHTML = `<span>${point.date}</span><strong>${formatPrice(point.value)} 元/吨</strong>`;
  chartTooltip.classList.add("visible");
  const svgRect = chartSvg.getBoundingClientRect();
  const areaRect = chartArea.getBoundingClientRect();
  const viewBox = chartSvg.viewBox.baseVal;
  const left = svgRect.left - areaRect.left + point.x / viewBox.width * svgRect.width;
  const top = svgRect.top - areaRect.top + point.y / viewBox.height * svgRect.height;
  chartTooltip.style.left = `${Math.max(78, Math.min(chartArea.clientWidth - 78, left))}px`;
  chartTooltip.style.top = `${Math.max(54, top)}px`;
}

chartSvg.addEventListener("click", (event) => {
  if (!currentSeries.length) return;
  const rect = chartSvg.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  showChartPoint(Math.round(ratio * (currentSeries.length - 1)));
});

chartArea.addEventListener("keydown", (event) => {
  if (!currentSeries.length || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const visibleIndex = Number(chartArea.dataset.activeIndex || currentSeries.length - 1);
  const nextIndex = event.key === "ArrowLeft" ? visibleIndex - 1 : visibleIndex + 1;
  chartArea.dataset.activeIndex = String(Math.max(0, Math.min(currentSeries.length - 1, nextIndex)));
  showChartPoint(Number(chartArea.dataset.activeIndex));
});

const drawerBackdrop = document.createElement("button");
drawerBackdrop.className = "interaction-backdrop";
drawerBackdrop.setAttribute("aria-label", "关闭详情");
const drawer = document.createElement("aside");
drawer.className = "data-drawer";
drawer.setAttribute("aria-hidden", "true");
drawer.innerHTML = `
  <header><span id="drawerKicker">MARKET DETAIL</span><button class="drawer-close" aria-label="关闭详情">×</button></header>
  <div class="drawer-body">
    <h2 id="drawerTitle">行情详情</h2>
    <div class="drawer-value"><strong id="drawerValue">—</strong><em id="drawerChange">—</em></div>
    <div class="drawer-chart" id="drawerChart"></div>
    <dl>
      <div><dt>数据口径</dt><dd id="drawerSource">—</dd></div>
      <div><dt>后台状态</dt><dd>已同步最新快照</dd></div>
      <div><dt>更新时间</dt><dd id="drawerTime">—</dd></div>
    </dl>
  </div>`;
document.body.append(drawerBackdrop, drawer);

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  drawer.setAttribute("aria-hidden", "true");
  document.querySelectorAll(".selected-detail").forEach((item) => item.classList.remove("selected-detail"));
}

function openDrawer({ title, value, change, source, chart = "", target, kicker = "MARKET DETAIL" }) {
  document.querySelectorAll(".selected-detail").forEach((item) => item.classList.remove("selected-detail"));
  target?.classList.add("selected-detail");
  document.querySelector("#drawerKicker").textContent = kicker;
  document.querySelector("#drawerTitle").textContent = title;
  document.querySelector("#drawerValue").textContent = value;
  const changeNode = document.querySelector("#drawerChange");
  changeNode.textContent = change;
  changeClass(changeNode, Number(String(change).replace("%", "")));
  document.querySelector("#drawerSource").textContent = source;
  document.querySelector("#drawerTime").textContent = clock.textContent;
  document.querySelector("#drawerChart").innerHTML = chart;
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
}

drawer.querySelector(".drawer-close").addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);
addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
});

const quoteCards = Array.from(document.querySelectorAll(".commodity-stream article"));
quoteCards.forEach((card) => {
  card.tabIndex = 0;
  const open = () => openDrawer({
    title: card.querySelector("h2").textContent,
    value: card.querySelector(".quote-value strong").textContent,
    change: card.querySelector(".quote-value em").textContent,
    source: card.querySelector(".quote-head span").textContent,
    chart: card.querySelector("svg").outerHTML,
    target: card
  });
  card.addEventListener("click", (event) => {
    if (event.target.closest(".quote-head button")) return;
    open();
  });
  card.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });

  const watchButton = card.querySelector(".quote-head button");
  watchButton.textContent = "☆";
  watchButton.setAttribute("aria-pressed", "false");
  watchButton.addEventListener("click", () => {
    const watched = watchButton.classList.toggle("is-watched");
    watchButton.textContent = watched ? "★" : "☆";
    watchButton.setAttribute("aria-pressed", String(watched));
  });
});

function formatMarketNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

async function loadStaticMarketData() {
  try {
    const response = await fetch(staticDataUrl("market.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const byId = new Map((payload.commodities || []).map((item) => [item.id, item]));
    ["copper", "gold", "silver", "wti"].forEach((id, index) => {
      const card = quoteCards[index];
      const item = byId.get(id);
      if (!card || !item || !Number.isFinite(Number(item.price))) return;
      card.dataset.commodityId = id;
      card.querySelector("h2").textContent = item.name;
      card.querySelector(".quote-head span").textContent = `${item.code} · ${item.source}`;
      card.querySelector(".quote-value strong").textContent = formatMarketNumber(item.price, Math.abs(Number(item.price)) < 100 ? 3 : 2);
      const changeNode = card.querySelector(".quote-value em");
      changeNode.textContent = formatPercent(item.change);
      changeClass(changeNode, item.change);
    });

    const metrics = Array.from(document.querySelectorAll(".breadth-strip > div"));
    const overview = payload.overview || {};
    const breadth = payload.aShareBreadth || {};
    const values = [
      ["上证指数", overview.shanghai?.price, overview.shanghai?.change, overview.shanghai?.source],
      ["深证成指", overview.shenzhen?.price, overview.shenzhen?.change, overview.shenzhen?.source],
      ["美元/人民币", overview.usdcny?.price, overview.usdcny?.change, overview.usdcny?.source],
      ["上涨股数", breadth.rising, null, `A/B股共${breadth.total || "—"}只`],
      ["下跌股数", breadth.falling, null, payload.sources?.breadth || "东方财富公开口径"]
    ];
    values.forEach(([label, value, change, detail], index) => {
      const metric = metrics[index];
      if (!metric || !Number.isFinite(Number(value))) return;
      metric.querySelector("span").textContent = label;
      metric.querySelector("strong").textContent = index >= 3 ? formatMarketNumber(value, 0) : formatMarketNumber(value, index === 2 ? 4 : 2);
      const changeNode = metric.querySelector("em");
      changeNode.textContent = Number.isFinite(Number(change)) ? formatPercent(change) : detail;
      if (Number.isFinite(Number(change))) changeClass(changeNode, change);
      else changeNode.className = "";
    });
    document.body.dataset.marketStatus = "ready";
  } catch (error) {
    document.body.dataset.marketStatus = "stale";
    console.warn("Static market data unavailable:", error.message);
  }
}

loadStaticMarketData();

document.querySelectorAll(".breadth-strip > div").forEach((metric) => {
  metric.tabIndex = 0;
  const open = () => {
    const title = metric.querySelector("span").textContent;
    const value = metric.querySelector("strong").textContent;
    const change = metric.querySelector("em").textContent;
    const source = title.includes("股数") ? "东方财富公开口径" : "公开行情快照";
    openDrawer({ title, value, change, source, target: metric, kicker: "MARKET BREADTH" });
  };
  metric.addEventListener("click", open);
  metric.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });
});

async function loadRareEarthData() {
  document.body.dataset.rareEarthStatus = "loading";
  try {
    const endpoints = privateHost ? ["/api/rare-earth", staticDataUrl("rare-earth.json")] : [staticDataUrl("rare-earth.json")];
    let payload = null;
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        payload = await response.json();
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!payload) throw lastError || new Error("稀土价格数据暂不可用");
    rareEarthProducts = Array.isArray(payload.products) ? payload.products : [];
    let availableMaterialCount = 0;
    materialButtons.forEach((button) => {
      const product = rareEarthProducts.find((item) => item.id === button.dataset.productId);
      button.hidden = !product;
      if (!product) return;
      availableMaterialCount += 1;
      button.querySelector("strong").textContent = product.name;
      button.querySelector("small").textContent = `${product.role} · ${product.priceDate}`;
      const changeNode = button.querySelector("em");
      changeNode.textContent = formatPercent(product.dailyChange);
      changeClass(changeNode, product.dailyChange);
    });
    document.querySelector(".material-list").style.setProperty("--material-count", String(Math.max(availableMaterialCount, 1)));
    if (!rareEarthProducts.some((product) => product.id === selectedProductId)) {
      selectedProductId = rareEarthProducts[0]?.id || "";
    }
    renderSelectedProduct({ animate: false });
    document.body.dataset.rareEarthStatus = rareEarthProducts.length ? "ready" : "empty";
  } catch (error) {
    document.body.dataset.rareEarthStatus = "error";
    console.warn("Rare-earth interaction data unavailable:", error.message);
  }
}

loadRareEarthData();

const conceptComponentForm = document.querySelector("#conceptComponentSearch");
const conceptComponentInput = document.querySelector("#conceptComponentMpn");
const conceptComponentSearchButton = document.querySelector("#conceptComponentSearchButton");
const conceptComponentState = document.querySelector("#conceptComponentState strong");
const conceptComponentSummary = document.querySelector("#conceptComponentSummary");
const conceptComponentResults = document.querySelector("#conceptComponentResults");
const conceptComponentDetail = document.querySelector("#conceptComponentDetail");
const componentAccess = document.querySelector("#componentAccess");
const componentAccessForm = document.querySelector("#componentAccessForm");
const componentAccessKey = document.querySelector("#componentAccessKey");
const componentAccessButton = document.querySelector("#componentAccessButton");
const componentAccessState = document.querySelector("#componentAccessState");
let conceptComponentQuotes = [];
let selectedConceptQuoteId = "";
let componentQueryStarted = false;
let secureComponentDatabase = null;

function escapeComponentMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function componentMoney(value, currency = "CNY") {
  const number = Number(value || 0);
  const digits = Math.abs(number) < 1 ? 4 : 2;
  return `${currency === "CNY" ? "¥" : `${currency} `}${number.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`;
}

function componentSource(quote) {
  const internal = quote.sourceType === "internal" || quote.source === "公司内部数据库";
  return { internal, label: internal ? "公司内部数据库" : "网上数据库" };
}

function componentDisplaySpec(quote) {
  const packages = Array.isArray(quote.packageOptions) && quote.packageOptions.length
    ? quote.packageOptions.join(" / ")
    : "封装待补充";
  return [quote.displaySpec || quote.category || "规格待补充", packages].filter(Boolean).join(" · ");
}

function selectedConceptQuote() {
  return conceptComponentQuotes.find((quote) => quote.id === selectedConceptQuoteId) || conceptComponentQuotes[0] || null;
}

function decodeBase64(value) {
  const binary = atob(String(value || ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function decryptComponentDatabase(passphrase) {
  const response = await fetch(staticDataUrl("component-quotes.secure.json"), { cache: "no-store" });
  if (!response.ok) throw new Error(`加密数据库不可用 (${response.status})`);
  const envelope = await response.json();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: decodeBase64(envelope.salt),
    iterations: Number(envelope.iterations) || 250000,
    hash: "SHA-256"
  }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const clear = await crypto.subtle.decrypt({
    name: "AES-GCM",
    iv: decodeBase64(envelope.iv)
  }, key, decodeBase64(envelope.ciphertext));
  const payload = JSON.parse(new TextDecoder().decode(clear));
  if (!Array.isArray(payload.quotes)) throw new Error("内部数据库格式不正确");
  return payload;
}

function normalizeComponentSearch(value) {
  return String(value || "").toLowerCase().replace(/[\s\-_/.,]+/g, "");
}

function searchSecureComponentDatabase(query) {
  const expected = normalizeComponentSearch(query);
  if (!expected || !secureComponentDatabase) return [];
  return secureComponentDatabase.quotes
    .map((quote) => {
      const primary = [quote.model, quote.materialCode].filter(Boolean).map(normalizeComponentSearch);
      const secondary = [quote.displaySpec, quote.spec, quote.category].filter(Boolean).map(normalizeComponentSearch);
      let score = null;
      if (primary.some((value) => value === expected)) score = 0;
      else if (primary.some((value) => value.startsWith(expected))) score = 1;
      else if (primary.some((value) => value.includes(expected))) score = 2;
      else if (secondary.some((value) => value.includes(expected))) score = 3;
      return { quote, score };
    })
    .filter((entry) => entry.score !== null)
    .sort((left, right) => left.score - right.score || Number(left.quote.price) - Number(right.quote.price))
    .slice(0, 40)
    .map((entry) => entry.quote);
}

async function unlockComponentDatabase(passphrase) {
  componentAccessButton.disabled = true;
  componentAccessButton.textContent = "解锁中";
  componentAccessState.textContent = "正在校验访问口令...";
  try {
    secureComponentDatabase = await decryptComponentDatabase(passphrase);
    componentAccess.classList.add("is-unlocked");
    componentAccessState.textContent = `已解锁 ${secureComponentDatabase.quotes.length} 条内部物料，刷新页面后自动清除。`;
    componentAccessForm.hidden = true;
    conceptComponentSearchButton.disabled = false;
    componentAccessKey.value = "";
    componentQueryStarted = false;
    await searchConceptComponent(conceptComponentInput.value || "GD25Q32C");
  } catch (error) {
    secureComponentDatabase = null;
    componentAccessState.textContent = error.name === "OperationError" ? "访问口令不正确，请重新输入。" : (error.message || "内部数据库解锁失败");
    componentAccessKey.select();
  } finally {
    componentAccessButton.disabled = false;
    componentAccessButton.textContent = "解锁数据";
  }
}

function renderConceptComponentResults() {
  const internalCount = conceptComponentQuotes.filter((quote) => componentSource(quote).internal).length;
  conceptComponentSummary.textContent = `${conceptComponentQuotes.length} 条记录 · 内部 ${internalCount}`;

  if (!conceptComponentQuotes.length) {
    conceptComponentResults.innerHTML = '<div class="component-empty">未找到匹配的内部物料记录</div>';
    conceptComponentDetail.innerHTML = '<div class="component-empty">暂无可计算的参数成本</div>';
    return;
  }

  const selected = selectedConceptQuote();
  selectedConceptQuoteId = selected.id;
  conceptComponentResults.innerHTML = conceptComponentQuotes.map((quote) => {
    const source = componentSource(quote);
    const active = quote.id === selectedConceptQuoteId ? " active" : "";
    return `
      <button class="component-result-row${active}" type="button" data-component-quote-id="${escapeComponentMarkup(quote.id)}">
        <span class="component-result-main">
          <span><strong>${escapeComponentMarkup(quote.model || "未标注型号")}</strong><em>${escapeComponentMarkup(quote.materialCode || "物料编码待补充")}</em></span>
          <small>${escapeComponentMarkup(componentDisplaySpec(quote))}</small>
        </span>
        <span class="component-result-price">
          <i class="component-source-badge ${source.internal ? "internal" : "external"}">${source.label}</i>
          <strong>${componentMoney(quote.price, quote.currency)}</strong>
          <small>${escapeComponentMarkup(quote.supplier || "供应商待补充")}</small>
        </span>
      </button>
    `;
  }).join("");
  renderConceptComponentDetail(selected);
}

function renderConceptComponentDetail(quote) {
  if (!quote) {
    conceptComponentDetail.innerHTML = '<div class="component-empty">暂无选中物料</div>';
    return;
  }

  const source = componentSource(quote);
  const model = quote.costModel || {};
  const bom = model.manufacturerBom || {};
  const drivers = Array.isArray(model.drivers) ? model.drivers : [];
  const unmodeled = Array.isArray(model.unmodeled) ? model.unmodeled : [];
  const components = Array.isArray(bom.components) ? bom.components : [];

  conceptComponentDetail.innerHTML = `
    <section class="component-identity">
      <div>
        <span>${escapeComponentMarkup(quote.category || "电子物料")}</span>
        <h2>${escapeComponentMarkup(quote.model || "未标注型号")}</h2>
        <p>${escapeComponentMarkup(quote.materialCode || "物料编码待补充")} · ${escapeComponentMarkup(componentDisplaySpec(quote))}</p>
      </div>
      <div class="component-anchor-price"><span>${source.label}历史单价</span><strong>${componentMoney(quote.price, quote.currency)}</strong><small>${escapeComponentMarkup(quote.supplier || "供应商待补充")}</small></div>
    </section>

    <div class="component-cost-summary">
      <div class="primary"><span>预估厂内成本</span><strong>${bom.available ? componentMoney(bom.manufacturingCost, quote.currency) : "—"}</strong><small>${bom.available ? `参考价的 ${Number(bom.costRatio || 0).toFixed(0)}%` : "数据不足"}</small></div>
      <div><span>参数理论参考价</span><strong>${model.available ? componentMoney(model.theoreticalPrice, quote.currency) : "—"}</strong><small>${model.sampleSize ? `${model.sampleSize} 条内部同品类样本` : "等待样本"}</small></div>
      <div><span>厂内成本区间</span><strong>${bom.available ? `${componentMoney(bom.rangeLow, quote.currency)} - ${componentMoney(bom.rangeHigh, quote.currency)}` : "—"}</strong><small>粗颗粒估算区间</small></div>
    </div>

    <section class="component-driver-section">
      <header><div><span>PARAMETER IMPACT</span><h3>规格参数金额影响</h3></div><strong>${drivers.length} 项已量化</strong></header>
      <div class="component-driver-grid">
        ${drivers.length ? drivers.map((driver) => `
          <div class="component-driver-row">
            <span><strong>${escapeComponentMarkup(driver.label)}</strong><small>基准 ${escapeComponentMarkup(driver.reference)}${escapeComponentMarkup(driver.unit || "")} → 当前 ${escapeComponentMarkup(driver.value)}${escapeComponentMarkup(driver.unit || "")}</small></span>
            <b>${Number(driver.amount || 0) >= 0 ? "+" : "-"}${componentMoney(Math.abs(Number(driver.amount || 0)), quote.currency)}</b>
          </div>
        `).join("") : '<div class="component-empty compact">暂无可量化参数</div>'}
      </div>
      ${unmodeled.length ? `<div class="component-unmodeled">${unmodeled.map((item) => `<span><strong>${escapeComponentMarkup(item.label)}</strong><small>${escapeComponentMarkup(item.reason)}</small></span>`).join("")}</div>` : ""}
    </section>

    <section class="component-bom-section">
      <header><div><span>MANUFACTURER BOM</span><h3>预估厂家 BOM</h3></div><strong>${escapeComponentMarkup(bom.confidence || "待确认")}置信度</strong></header>
      <div class="component-bom-list">
        ${components.length ? components.map((item) => `
          <div class="component-bom-row">
            <div><strong>${escapeComponentMarkup(item.name)}</strong><small>${escapeComponentMarkup(item.note)}</small></div>
            <span><i style="width:${Math.max(0, Math.min(100, Number(item.share || 0)))}%"></i></span>
            <em>${Number(item.share || 0).toFixed(1)}%</em>
            <b>${componentMoney(item.amount, quote.currency)}</b>
          </div>
        `).join("") : '<div class="component-empty compact">厂家 BOM 暂无可用拆分</div>'}
      </div>
      <footer><span>${escapeComponentMarkup(bom.note || model.scope || "内部历史价格参考模型")}</span><strong>${escapeComponentMarkup(quote.sourceDetail || quote.source || source.label)}</strong></footer>
    </section>
  `;
}

async function searchConceptComponent(mpn) {
  const query = String(mpn || "").trim();
  if (query.length < 2) {
    conceptComponentState.textContent = "请输入至少两个字符";
    return;
  }
  if (!privateHost && !secureComponentDatabase) {
    conceptComponentState.textContent = "请先输入访问口令，解锁公司内部数据库";
    componentAccessKey?.focus();
    return;
  }

  componentQueryStarted = true;
  conceptComponentSearchButton.disabled = true;
  conceptComponentSearchButton.textContent = "建模中";
  conceptComponentState.textContent = `正在读取 ${query}`;

  try {
    let payload;
    if (privateHost) {
      const response = await fetch(`/api/component-quotes?${new URLSearchParams({ mpn: query })}`, { cache: "no-store" });
      payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "物料查询失败");
    } else {
      const quotes = searchSecureComponentDatabase(query);
      payload = {
        quotes,
        message: quotes.length ? `加密内部数据库已返回 ${quotes.length} 条记录。` : "加密内部数据库未找到匹配记录。"
      };
    }
    conceptComponentQuotes = Array.isArray(payload.quotes) ? payload.quotes : [];
    selectedConceptQuoteId = conceptComponentQuotes.find((quote) => quote.costModel?.available)?.id || conceptComponentQuotes[0]?.id || "";
    renderConceptComponentResults();
    const internalCount = conceptComponentQuotes.filter((quote) => componentSource(quote).internal).length;
    const onlineCount = conceptComponentQuotes.length - internalCount;
    conceptComponentState.textContent = conceptComponentQuotes.length
      ? `已匹配 ${conceptComponentQuotes.length} 条 · 内部 ${internalCount} · 网上 ${onlineCount}`
      : (payload.message || "未找到匹配记录");
  } catch (error) {
    conceptComponentQuotes = [];
    selectedConceptQuoteId = "";
    renderConceptComponentResults();
    conceptComponentState.textContent = error.message || "物料查询失败";
  } finally {
    conceptComponentSearchButton.disabled = false;
    conceptComponentSearchButton.textContent = "查询物料";
  }
}

function ensureDefaultComponentQuery() {
  if (!componentQueryStarted) searchConceptComponent(conceptComponentInput.value || "GD25Q32C");
}

componentAccess.hidden = privateHost;
if (!privateHost) {
  conceptComponentSearchButton.disabled = true;
  conceptComponentState.textContent = "等待解锁公司内部数据库";
}

componentAccessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  unlockComponentDatabase(componentAccessKey.value);
});

conceptComponentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchConceptComponent(new FormData(conceptComponentForm).get("mpn"));
});

conceptComponentResults.addEventListener("click", (event) => {
  const row = event.target.closest("[data-component-quote-id]");
  if (!row) return;
  selectedConceptQuoteId = row.dataset.componentQuoteId;
  conceptComponentResults.querySelectorAll(".component-result-row").forEach((item) => item.classList.toggle("active", item === row));
  renderConceptComponentDetail(selectedConceptQuote());
});

if (new URLSearchParams(location.search).get("view") === "components") {
  activateConceptView("components", { updateUrl: false, scroll: false });
}
