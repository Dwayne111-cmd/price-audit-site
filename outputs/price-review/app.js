const originalRates = [
  { surface: "化金", thickness: "0.8-1.6", layers: 1, rate: 405, row: "43" },
  { surface: "化金", thickness: "0.8-1.6", layers: 2, rate: 480, row: "44" },
  { surface: "化金", thickness: "2.0", layers: 2, rate: 600, row: "45" },
  { surface: "化金", thickness: "2.5", layers: 2, rate: 750, row: "46" },
  { surface: "化金", thickness: "0.8-1.6", layers: 4, rate: 920, row: "47" },
  { surface: "喷锡", thickness: "0.8-1.6", layers: 1, rate: 360, row: "48" },
  { surface: "喷锡", thickness: "0.8-1.6", layers: 2, rate: 390, row: "49" },
  { surface: "喷锡", thickness: "2.0", layers: 2, rate: 520, row: "50" },
  { surface: "喷锡", thickness: "2.5", layers: 2, rate: 670, row: "51" },
  { surface: "喷锡", thickness: "0.8-1.6", layers: 4, rate: 640, row: "52" }
];

const costBaseline = [
  { name: "FR-4 双面 0.8mm", value: 88.74, group: "原材料" },
  { name: "油墨", value: 12.24, group: "原材料" },
  { name: "表面处理 · 化金", value: 110, group: "原材料" },
  { name: "表面处理 · 喷锡", value: 24.2, group: "原材料" },
  { name: "加工成本合计", value: 121.244, group: "加工" },
  { name: "其他成本合计", value: 117.176, group: "其他" }
];

const state = {
  rates: originalRates.map((item) => ({ ...item })),
  form: { surface: "喷锡", thickness: "0.8-1.6", layers: 2, length: 45, width: 27, panelCount: 15 },
  override: null
};

const els = {
  surface: document.querySelector("#surface"),
  thickness: document.querySelector("#thickness"),
  layers: document.querySelector("#layers"),
  length: document.querySelector("#length"),
  width: document.querySelector("#width"),
  panelCount: document.querySelector("#panelCount"),
  rateOverride: document.querySelector("#rateOverride"),
  selectedRate: document.querySelector("#selectedRate"),
  rateSource: document.querySelector("#rateSource"),
  selectionNote: document.querySelector("#selectionNote"),
  resultState: document.querySelector("#resultState"),
  boardPrice: document.querySelector("#boardPrice"),
  resultDescriptor: document.querySelector("#resultDescriptor"),
  areaValue: document.querySelector("#areaValue"),
  rateValue: document.querySelector("#rateValue"),
  panelPrice: document.querySelector("#panelPrice"),
  panelCountValue: document.querySelector("#panelCountValue"),
  calculationTrace: document.querySelector("#calculationTrace"),
  rateTableRows: document.querySelector("#rateTableRows"),
  costRows: document.querySelector("#costRows"),
  resetSample: document.querySelector("#resetSample"),
  restoreRates: document.querySelector("#restoreRates")
};

function rateKey({ surface, thickness, layers }) {
  return `${surface}|${thickness}|${layers}`;
}

function money(value, digits = 2) {
  return `CNY ${Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function number(value, digits = 2) {
  return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function selectedRate() {
  return state.rates.find((item) => rateKey(item) === rateKey(state.form)) || null;
}

function setOptions(select, values, selected) {
  select.innerHTML = values.map((value) => `<option value="${value}" ${String(value) === String(selected) ? "selected" : ""}>${value}</option>`).join("");
}

function syncSelectors() {
  const surfaces = [...new Set(state.rates.map((item) => item.surface))];
  if (!surfaces.includes(state.form.surface)) state.form.surface = surfaces[0];
  setOptions(els.surface, surfaces, state.form.surface);

  const thicknesses = [...new Set(state.rates.filter((item) => item.surface === state.form.surface).map((item) => item.thickness))];
  if (!thicknesses.includes(state.form.thickness)) state.form.thickness = thicknesses[0];
  setOptions(els.thickness, thicknesses, state.form.thickness);

  const layers = [...new Set(state.rates.filter((item) => item.surface === state.form.surface && item.thickness === state.form.thickness).map((item) => item.layers))];
  if (!layers.includes(state.form.layers)) state.form.layers = layers[0];
  setOptions(els.layers, layers, state.form.layers);
}

function renderRateTable() {
  els.rateTableRows.innerHTML = state.rates.map((item) => {
    const isSelected = rateKey(item) === rateKey(state.form);
    return `<tr class="${isSelected ? "selected" : ""}"><td>${item.surface}</td><td>${item.thickness}mm</td><td>${item.layers} 层</td><td><label class="table-rate"><span class="sr-only">${item.surface} ${item.thickness} ${item.layers} 层单价</span><input type="number" min="0" step="0.01" value="${item.rate}" data-rate-key="${rateKey(item)}" /> <em>CNY</em></label></td><td>R${item.row}</td><td>${isSelected ? "核价中" : "可选"}</td></tr>`;
  }).join("");
}

function renderCosts() {
  const max = Math.max(...costBaseline.map((item) => item.value));
  els.costRows.innerHTML = costBaseline.map((item) => `<div class="cost-row"><div><span>${item.group}</span><strong>${item.name}</strong></div><i><b style="width:${(item.value / max) * 100}%"></b></i><em>${money(item.value)}</em></div>`).join("");
}

function renderQuote() {
  syncSelectors();
  const rate = selectedRate();
  const length = Math.max(0, Number(state.form.length) || 0);
  const width = Math.max(0, Number(state.form.width) || 0);
  const panelCount = Math.max(1, Number(state.form.panelCount) || 1);
  const effectiveRate = state.override === null ? rate?.rate : state.override;
  const area = (length * width) / 1_000_000;
  const panelPrice = area * (effectiveRate || 0);
  const boardPrice = panelPrice / panelCount;
  const valid = Boolean(rate) && length > 0 && width > 0 && panelCount > 0 && Number.isFinite(effectiveRate);

  els.length.value = length || "";
  els.width.value = width || "";
  els.panelCount.value = panelCount || "";
  els.selectedRate.textContent = rate ? `${money(rate.rate)} / ㎡` : "未匹配";
  els.rateSource.textContent = rate ? `PCB V1.1 · 单价矩阵 R${rate.row}` : "当前组合未在 V1.1 矩阵中定义";
  els.rateOverride.value = state.override === null ? "" : state.override;
  els.selectionNote.textContent = rate ? `已匹配 ${rate.surface} · ${rate.thickness}mm · ${rate.layers} 层的 V1.1 基准单价。` : "当前组合未在 V1.1 单价矩阵中定义。";
  els.resultState.textContent = valid ? "已匹配" : "待补参数";
  els.resultState.classList.toggle("warning", !valid);
  els.boardPrice.textContent = money(boardPrice, 5);
  els.resultDescriptor.textContent = valid ? `${state.form.surface} · ${state.form.thickness}mm · ${state.form.layers} 层` : "请补全可匹配的工艺参数";
  els.areaValue.textContent = `${number(area, 6)} ㎡`;
  els.rateValue.textContent = money(effectiveRate, 2);
  els.panelPrice.textContent = money(panelPrice, 5);
  els.panelCountValue.textContent = `${panelCount} 拼`;
  els.calculationTrace.textContent = `${number(length, 2)} × ${number(width, 2)} ÷ 1,000,000 × ${number(effectiveRate, 2)} ÷ ${panelCount} = ${number(boardPrice, 5)}`;
  renderRateTable();
}

function resetSample() {
  state.form = { surface: "喷锡", thickness: "0.8-1.6", layers: 2, length: 45, width: 27, panelCount: 15 };
  state.override = null;
  renderQuote();
}

function bindEvents() {
  els.surface.addEventListener("change", (event) => { state.form.surface = event.target.value; state.override = null; renderQuote(); });
  els.thickness.addEventListener("change", (event) => { state.form.thickness = event.target.value; state.override = null; renderQuote(); });
  els.layers.addEventListener("change", (event) => { state.form.layers = Number(event.target.value); state.override = null; renderQuote(); });
  [[els.length, "length"], [els.width, "width"], [els.panelCount, "panelCount"]].forEach(([input, key]) => input.addEventListener("input", (event) => { state.form[key] = event.target.value; renderQuote(); }));
  els.rateOverride.addEventListener("input", (event) => { const value = event.target.value; state.override = value === "" ? null : Math.max(0, Number(value) || 0); renderQuote(); });
  els.rateTableRows.addEventListener("input", (event) => {
    const input = event.target.closest("[data-rate-key]");
    if (!input) return;
    const rate = state.rates.find((item) => rateKey(item) === input.dataset.rateKey);
    if (!rate) return;
    rate.rate = Math.max(0, Number(input.value) || 0);
    if (rateKey(rate) === rateKey(state.form)) state.override = null;
    renderQuote();
  });
  els.resetSample.addEventListener("click", resetSample);
  els.restoreRates.addEventListener("click", () => { state.rates = originalRates.map((item) => ({ ...item })); state.override = null; renderQuote(); });
}

renderCosts();
bindEvents();
resetSample();
