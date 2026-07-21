const originalCartonRates = [
  { material: "AB楞 160/110/110/110/160", product: "血氧仪BM1000、国内、国际事业部", rates: [4.1, 3.751, 4.45, 3.4, null, null] },
  { material: "AB楞 250美牛/130A/110/110B/200", product: "BP5S", rates: [null, 6.16, null, 5.09, null, null] },
  { material: "AB楞 200美牛/170A/80/130B/200", product: "WYZE / iHealth 体脂秤、体重秤", rates: [5.3, 4.983, 5.82, 4.983, null, null] },
  { material: "AB楞 200美牛/130A/80/130B/200", product: "小米血压计 BPX1", rates: [5.2, 4.75, 6.6, 4.75, null, null] },
  { material: "AB楞 190/170A/80/130B/200", product: "试剂盒美版", rates: [4.63, 4.68, 4.65, 4.45, null, null] },
  { material: "BC楞 180/110/70/110/130", product: "PT3 / PT3SBT / PT5 / 血氧仪 PO3", rates: [3.85, 3.74, 4.46, 3.6, null, null] },
  { material: "BC楞 170/120/110/120/140", product: "PT1", rates: [3.93, 3.883, 4.37, 3.883, null, null] },
  { material: "BE楞 250美牛/130/110/110/200", product: "血压计 550bt", rates: [5.72, 5.39, null, 4.521, null, null] },
  { material: "BE楞 200/110/80/110/160", product: "体脂秤纸托架2", rates: [4.06, 3.685, 4.46, 3.685, null, null] },
  { material: "BE楞 160/110/80/110/160", product: "体脂秤纸托板", rates: [3.95, 3.377, 4.29, 3.377, null, null] },
  { material: "BE楞 160/120/110/120/130", product: "国内、国际事业部", rates: [3.83, 3.685, 4.24, 3.3, null, null] },
  { material: "B楞 160/120/160", product: "国内、国际事业部", rates: [3.09, 2.618, 3.08, 2.3, null, null] },
  { material: "E楞 160/110/160", product: "体脂秤纸托架1、国内事业部", rates: [2.93, 2.739, 2.96, 2.25, null, null] },
  { material: "E楞 140/120/140", product: "PT1、血糖仪耗材外箱垫板", rates: [2.6, 2.508, 2.84, 2.508, null, null] },
  { material: "E楞 130/120/130", product: "国际事业部", rates: [2.6, 2.508, 2.71, 2.508, null, null] },
  { material: "110F楞+140白挂面", product: "瓦楞彩盒", rates: [1.43, 1.43, null, 1.43, 1.8, 2.6] }
];

const supplierNames = ["嘉正", "汇源", "艺虹", "荣采", "鹏龙", "博阳鸿"];
const state = {
  rates: originalCartonRates.map((item) => ({ ...item, rates: [...item.rates] })),
  form: { dimensionMode: "内径", materialIndex: 0, length: 200, width: 100, height: 50, quantity: 1000, otherProcess: 0, variance: 0.05 }
};

const els = {
  dimensionMode: document.querySelector("#dimensionMode"), cartonMaterial: document.querySelector("#cartonMaterial"), cartonLength: document.querySelector("#cartonLength"), cartonWidth: document.querySelector("#cartonWidth"), cartonHeight: document.querySelector("#cartonHeight"), orderQuantity: document.querySelector("#orderQuantity"), otherProcess: document.querySelector("#otherProcess"), processVariance: document.querySelector("#processVariance"), cartonRate: document.querySelector("#cartonRate"), cartonRateSource: document.querySelector("#cartonRateSource"), supplierWinner: document.querySelector("#supplierWinner"), cartonSelectionNote: document.querySelector("#cartonSelectionNote"), cartonResultState: document.querySelector("#cartonResultState"), cartonTotalPrice: document.querySelector("#cartonTotalPrice"), cartonDescriptor: document.querySelector("#cartonDescriptor"), cartonArea: document.querySelector("#cartonArea"), materialCost: document.querySelector("#materialCost"), productCost: document.querySelector("#productCost"), orderTotal: document.querySelector("#orderTotal"), cartonTrace: document.querySelector("#cartonTrace"), orderArea: document.querySelector("#orderArea"), minimumQty: document.querySelector("#minimumQty"), minimumMessage: document.querySelector("#minimumMessage"), setupFee: document.querySelector("#setupFee"), cartonRateRows: document.querySelector("#cartonRateRows"), resetCarton: document.querySelector("#resetCarton"), restoreCartonRates: document.querySelector("#restoreCartonRates")
};

function money(value, digits = 2) { return `CNY ${Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`; }
function number(value, digits = 2) { return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function rateData() { return state.rates[state.form.materialIndex]; }
function standardRate(item) { return Math.min(...item.rates.filter((value) => Number.isFinite(value))); }
function winningSupplier(item) { const rate = standardRate(item); const index = item.rates.findIndex((value) => value === rate); return supplierNames[index] || "未标注供应商"; }

function renderMaterialOptions() {
  els.cartonMaterial.innerHTML = state.rates.map((item, index) => `<option value="${index}" ${index === state.form.materialIndex ? "selected" : ""}>${item.material}</option>`).join("");
}

function renderRateTable() {
  els.cartonRateRows.innerHTML = state.rates.map((item, itemIndex) => {
    const active = itemIndex === state.form.materialIndex;
    const supplierCells = item.rates.map((rate, supplierIndex) => rate === null ? "<td class=\"empty-cell\">-</td>" : `<td><input aria-label="${item.material} ${supplierNames[supplierIndex]} 报价" class="carton-rate-input" type="number" min="0" step="0.001" value="${rate}" data-material-index="${itemIndex}" data-supplier-index="${supplierIndex}" /></td>`).join("");
    return `<tr class="${active ? "selected" : ""}"><td>${item.material}</td><td>${item.product}</td><td><strong>${number(standardRate(item), 3)}</strong></td>${supplierCells}</tr>`;
  }).join("");
}

function renderQuote() {
  renderMaterialOptions();
  const item = rateData();
  const length = Math.max(0, Number(state.form.length) || 0);
  const width = Math.max(0, Number(state.form.width) || 0);
  const height = Math.max(0, Number(state.form.height) || 0);
  const quantity = Math.max(1, Math.floor(Number(state.form.quantity) || 1));
  const otherProcess = Math.max(0, Number(state.form.otherProcess) || 0);
  const variance = Math.max(0, Number(state.form.variance) || 0);
  const isInner = state.form.dimensionMode === "内径";
  const expandedLength = isInner ? 2 * (length + width) + 80 : 2 * (length + width) + 40;
  const expandedWidth = isInner ? width + height + 60 : width + height + 40;
  const area = (expandedLength * expandedWidth) / 1_000_000;
  const rate = standardRate(item);
  const materialCost = area * rate;
  const productCost = materialCost + otherProcess;
  const totalPrice = productCost * (1 + variance);
  const orderArea = area * quantity;
  const quantityToMinimum = area > 0 ? Math.ceil(200 / area) : 0;

  els.cartonLength.value = length || ""; els.cartonWidth.value = width || ""; els.cartonHeight.value = height || ""; els.orderQuantity.value = quantity || ""; els.otherProcess.value = otherProcess || ""; els.processVariance.value = variance;
  els.cartonRate.textContent = `${money(rate, 3)} / ㎡`;
  els.cartonRateSource.textContent = `纸箱 V1.4 · ${item.material}`;
  els.supplierWinner.textContent = winningSupplier(item);
  els.cartonSelectionNote.textContent = `标准价取 ${supplierNames.length} 家供应商有效报价中的最低值。`;
  els.cartonResultState.textContent = area > 0 ? "已匹配" : "待补参数";
  els.cartonResultState.classList.toggle("warning", area <= 0);
  els.cartonTotalPrice.textContent = money(totalPrice, 5);
  els.cartonDescriptor.textContent = `${state.form.dimensionMode} · ${item.material}`;
  els.cartonArea.textContent = `${number(area, 6)} ㎡`;
  els.materialCost.textContent = money(materialCost, 5);
  els.productCost.textContent = money(productCost, 5);
  els.orderTotal.textContent = money(totalPrice * quantity, 2);
  els.cartonTrace.textContent = `(${number(expandedLength, 2)} × ${number(expandedWidth, 2)} ÷ 1,000,000 × ${number(rate, 3)} + ${number(otherProcess, 4)}) × (1 + ${number(variance, 3)}) = ${number(totalPrice, 5)}`;
  els.orderArea.textContent = `${number(orderArea, 3)} ㎡`;
  els.minimumQty.textContent = area > 0 ? `${quantityToMinimum.toLocaleString("zh-CN")} 个` : "-";
  els.minimumMessage.textContent = orderArea < 200 ? `当前订单面积低于 200㎡；V1.4 记录开机费 ${money(350)}，但产品总价公式未引用该费用。` : "当前订单面积达到 200㎡；开机费提示不影响产品总价公式。";
  els.setupFee.textContent = money(350);
  renderRateTable();
}

function resetCarton() { state.form = { dimensionMode: "内径", materialIndex: 0, length: 200, width: 100, height: 50, quantity: 1000, otherProcess: 0, variance: 0.05 }; els.dimensionMode.value = "内径"; renderQuote(); }

function bindEvents() {
  els.dimensionMode.addEventListener("change", (event) => { state.form.dimensionMode = event.target.value; renderQuote(); });
  els.cartonMaterial.addEventListener("change", (event) => { state.form.materialIndex = Number(event.target.value); renderQuote(); });
  [[els.cartonLength, "length"], [els.cartonWidth, "width"], [els.cartonHeight, "height"], [els.orderQuantity, "quantity"], [els.otherProcess, "otherProcess"], [els.processVariance, "variance"]].forEach(([input, key]) => input.addEventListener("input", (event) => { state.form[key] = event.target.value; renderQuote(); }));
  els.cartonRateRows.addEventListener("input", (event) => { const input = event.target.closest("[data-material-index]"); if (!input) return; const material = state.rates[Number(input.dataset.materialIndex)]; material.rates[Number(input.dataset.supplierIndex)] = Math.max(0, Number(input.value) || 0); renderQuote(); });
  els.resetCarton.addEventListener("click", resetCarton);
  els.restoreCartonRates.addEventListener("click", () => { state.rates = originalCartonRates.map((item) => ({ ...item, rates: [...item.rates] })); renderQuote(); });
}

bindEvents();
resetCarton();
