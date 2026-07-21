const slotNames = ["封皮", "内页1", "内页2", "内页3", "内页4", "内页5", "内页6", "内页7", "内页8"];
const inputIds = ["height", "width", "binding", "pages", "quantity", "otherProcess", "variance"];
const processIds = ["onlineOil", "cut", "dieCut", "collate"];
const input = Object.fromEntries(inputIds.map((id) => [id, document.querySelector(`#${id}`)]));
const elements = Object.fromEntries(["databaseState", "runState", "resultState", "total", "descriptor", "cost", "orderTotal", "standardPrice", "referenceMoq", "trace", "bookletRows", "costRows", "detailRows"].map((id) => [id, document.querySelector(`#${id}`)]));
let database;

const number = (value, digits = 2) => Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = (value, digits = 2) => `CNY ${number(value, digits)}`;
const numeric = (element) => Number(element.value) || 0;
const selected = (element) => element.value;
const checked = (id) => document.querySelector(`#${id}`).checked;

function materialOptions() { return '<option value="">未使用</option><option value="胶板">胶板</option><option value="铜板">铜板</option>'; }
function formatOptions() { return '<option value="">未选择</option><option value="正度">正度</option><option value="大度">大度</option><option value="特规">特规</option>'; }
function openOptions() { return '<option value="1">1 开</option><option value="2">2 开</option>'; }
function layoutOptions() { return '<option value="自翻">自翻</option><option value="正背">正背</option>'; }

function buildRows() {
  elements.bookletRows.innerHTML = slotNames.map((name, index) => `<tr data-slot="${index}"><th scope="row">${name}</th><td><select data-field="material" aria-label="${name} 材质">${materialOptions()}</select></td><td><input data-field="gsm" aria-label="${name} 克重" type="number" min="0" step="1"></td><td><select data-field="format" aria-label="${name} 纸面尺寸">${formatOptions()}</select></td><td><select data-field="open" aria-label="${name} 开型">${openOptions()}</select></td><td><select data-field="layout" aria-label="${name} 拼版">${layoutOptions()}</select></td><td><input data-field="yield" aria-label="${name} 得数" type="number" min="0" step="1"></td><td><input data-field="frontNormal" aria-label="${name} 正面普通印色" type="number" min="0" step="1"></td><td><input data-field="frontSpot" aria-label="${name} 正面专色" type="number" min="0" step="1"></td><td><input data-field="backNormal" aria-label="${name} 背面普通印色" type="number" min="0" step="1"></td><td><input data-field="backSpot" aria-label="${name} 背面专色" type="number" min="0" step="1"></td><td><input class="booklet-size" data-field="fullLength" aria-label="${name} 特规全开长" type="number" min="0" step="1"></td><td><input class="booklet-size" data-field="fullWidth" aria-label="${name} 特规全开宽" type="number" min="0" step="1"></td><td><input class="booklet-size" data-field="halfLength" aria-label="${name} 特规对开长" type="number" min="0" step="1"></td><td><input class="booklet-size" data-field="halfWidth" aria-label="${name} 特规对开宽" type="number" min="0" step="1"></td></tr>`).join("");
  elements.bookletRows.querySelectorAll("input, select").forEach((field) => field.addEventListener(field.tagName === "SELECT" ? "change" : "input", calculate));
}

function readProduct() {
  return {
    height: numeric(input.height), width: numeric(input.width), binding: selected(input.binding), pages: numeric(input.pages),
    quantity: Math.max(numeric(input.quantity), 1), otherProcess: numeric(input.otherProcess), variance: numeric(input.variance)
  };
}

function readSlot(row, index) {
  const field = (name) => row.querySelector(`[data-field="${name}"]`);
  const slot = {
    index, name: slotNames[index], material: selected(field("material")), gsm: numeric(field("gsm")), format: selected(field("format")),
    open: selected(field("open")), layout: selected(field("layout")), yield: numeric(field("yield")),
    frontNormal: numeric(field("frontNormal")), frontSpot: numeric(field("frontSpot")), backNormal: numeric(field("backNormal")), backSpot: numeric(field("backSpot")),
    fullLength: numeric(field("fullLength")), fullWidth: numeric(field("fullWidth")), halfLength: numeric(field("halfLength")), halfWidth: numeric(field("halfWidth"))
  };
  slot.used = Boolean(slot.material && slot.gsm > 0 && slot.format && slot.yield > 0);
  return slot;
}

function slotAreas(slot) {
  if (slot.format === "特规") return { full: slot.fullLength * slot.fullWidth / 1000000, half: slot.halfLength * slot.halfWidth / 1000000 };
  if (!database.paperFormats[slot.format]) return { full: 0, half: 0 };
  const format = database.paperFormats[slot.format];
  return { full: format.full[0] * format.full[1] / 1000000, half: format.half[0] * format.half[1] / 1000000 };
}

function setupForColours(colours, printSheets) {
  if (!colours || printSheets >= 3000) return 0;
  if (colours === 6) return database.printing.machineSetup["6"];
  if (colours === 5) return database.printing.machineSetup["5"];
  if (colours > 1) return database.printing.machineSetup["2to4"];
  return database.printing.machineSetup["1"];
}

function calculateSlot(slot, product) {
  if (!slot.used) return { ...slot, area: 0, printSheets: 0, paperCost: 0, printCost: 0, makeReady: 0, setup: 0, colourFee: 0, plateFee: 0, frontTotal: 0, backTotal: 0, blankSelfFlip: false };
  const areas = slotAreas(slot);
  const area = slot.open === "1" ? areas.full : areas.half;
  const paperPrice = database.paperPricesPerTon[slot.material];
  const paperSheetPrice = area * slot.gsm * paperPrice / 1000000;
  const printSheets = Math.ceil(product.quantity / slot.yield);
  const frontTotal = slot.frontNormal + slot.frontSpot;
  const backTotal = slot.backNormal + slot.backSpot;
  const frontSetup = setupForColours(frontTotal, printSheets);
  const backSetup = setupForColours(backTotal, printSheets);
  const setup = slot.layout === "正背" ? frontSetup + backSetup : printSheets >= 1500 ? 0 : slot.index < 2 ? frontSetup : Math.max(frontSetup, backSetup);
  const frontColourFee = (slot.frontNormal + slot.frontSpot * 2) * database.printing.colourOrder;
  const backColourFee = (slot.backNormal + slot.backSpot * 2) * database.printing.colourOrder;
  const colourFee = slot.layout === "正背" ? frontColourFee + backColourFee : Math.max(frontColourFee, backColourFee) * 2;
  const frontPlate = frontTotal * database.printing.plate;
  const backPlate = backTotal * database.printing.plate;
  const plateFee = slot.layout === "正背" ? frontPlate + backPlate : Math.max(frontPlate, backPlate);
  const printCost = (setup + plateFee) / product.quantity + (setup > 0 ? 0 : colourFee / 1000 / slot.yield);
  const printedSides = slot.layout === "正背" ? frontTotal + backTotal : Math.max(frontTotal, backTotal);
  const makeReady = (printedSides + 2) * 50 * paperSheetPrice / product.quantity;
  return { ...slot, area, printSheets, paperSheetPrice, paperCost: paperSheetPrice / slot.yield, printCost, makeReady, setup, colourFee, plateFee, frontTotal, backTotal, blankSelfFlip: slot.layout === "自翻" };
}

function processResult(id, enabled, product, slots, plateSets) {
  const process = database.processes[id];
  if (!enabled || !slots[0].used) return { label: process.label, enabled, standard: 0, actual: 0, setup: 0, state: "未选择" };
  const cover = slots[0];
  const allPrintSheets = slots.reduce((sum, slot) => sum + slot.printSheets, 0);
  const hands = Math.ceil(product.pages / 16);
  let setup = 0;
  let standard = 0;
  let rule = "";
  if (id === "onlineOil") {
    setup = cover.printSheets * cover.area / 1000000 < 2000 ? process.setup : 0;
    standard = cover.area / cover.yield * process.rate;
    rule = "按 V2.1 封皮印张面积阈值";
  } else if (id === "cut") {
    setup = Math.ceil(product.pages / 4) * product.quantity < 15000 ? process.setup : 0;
    standard = Math.ceil(product.pages / 4) * process.rate;
    rule = "页数/4后的数量小于 15,000";
  } else if (id === "dieCut") {
    setup = allPrintSheets < 3000 ? process.setup : 0;
    standard = allPrintSheets * process.rate / product.quantity;
    rule = "总印数小于 3,000 张";
  } else if (id === "collate") {
    setup = hands * product.quantity < 4000 ? process.setup : 0;
    standard = hands * process.rate;
    rule = "配页手数小于 4,000";
  } else if (id === "saddle") {
    setup = hands * product.quantity < 3000 ? process.setup : 0;
    standard = product.pages < 16 ? process.tiers.lt16 : product.pages < 20 ? process.tiers.lt20 : product.pages < 24 ? process.tiers.lt24 : product.pages < 32 ? process.tiers.lt32 : process.tiers.gte32;
    rule = "骑马钉手数小于 3,000";
  } else if (id === "perfect") {
    setup = plateSets * product.quantity < 4000 ? process.setup : 0;
    standard = plateSets * process.rate;
    rule = "印版套数小于 4,000";
  }
  return { label: process.label, enabled: true, setup, standard, actual: setup > 0 ? setup / product.quantity : standard, state: `${setup > 0 ? "触发开机费" : "标准工费"}：${rule}` };
}

function renderCostRows(rows, productCost) {
  elements.costRows.innerHTML = rows.map((row) => { const percent = productCost > 0 ? Math.max(2, row.amount / productCost * 100) : 0; return `<div class="cost-row"><div><span>${row.label}</span><strong>${money(row.amount, 5)}</strong></div><i><b style="width:${Math.min(100, percent)}%"></b></i><strong>${number(percent, 1)}%</strong></div>`; }).join("");
}

function renderDetails(slots, processes) {
  const paperRows = slots.filter((slot) => slot.used).map((slot) => `<tr><td>${slot.name} 印费</td><td>${slot.setup > 0 ? "触发开机费" : "标准印费"}</td><td>${money(slot.printCost, 5)}</td></tr>`);
  const processRows = processes.map((process) => `<tr><td>${process.label}</td><td>${process.enabled ? process.state : "未选择"}</td><td>${process.enabled ? money(process.actual, 5) : "-"}</td></tr>`);
  elements.detailRows.innerHTML = [...paperRows, ...processRows].join("") || '<tr><td colspan="3">待配置纸张与印刷参数</td></tr>';
}

function calculate() {
  if (!database) return;
  const product = readProduct();
  const slots = Array.from(elements.bookletRows.querySelectorAll("tr")).map((row, index) => calculateSlot(readSlot(row, index), product));
  const usedSlots = slots.filter((slot) => slot.used);
  const plateSets = slots.filter((slot) => slot.frontTotal > 0).length + slots.filter((slot) => slot.backTotal > 0).length - slots.filter((slot) => slot.blankSelfFlip).length;
  const paperCost = slots.reduce((sum, slot) => sum + slot.paperCost, 0);
  const printCost = slots.reduce((sum, slot) => sum + slot.printCost, 0);
  const makeReady = slots.reduce((sum, slot) => sum + slot.makeReady, 0);
  const selectedProcesses = [
    processResult("onlineOil", checked("onlineOil"), product, slots, plateSets),
    processResult("cut", checked("cut"), product, slots, plateSets),
    processResult("dieCut", checked("dieCut"), product, slots, plateSets),
    processResult("collate", checked("collate"), product, slots, plateSets),
    processResult(product.binding === "胶装" ? "perfect" : "saddle", true, product, slots, plateSets)
  ];
  const postActual = selectedProcesses.reduce((sum, process) => sum + process.actual, 0) + product.otherProcess;
  const postStandard = selectedProcesses.reduce((sum, process) => sum + process.standard, 0) + product.otherProcess;
  const productCost = paperCost + printCost + postActual + makeReady;
  const total = productCost * (1 + product.variance);
  const colourStandard = slots.reduce((sum, slot) => sum + (slot.used ? slot.colourFee / 1000 / slot.yield : 0), 0);
  const plateStandard = slots.reduce((sum, slot) => sum + slot.plateFee, 0) / 10000;
  const standardPrice = paperCost + postStandard + colourStandard + plateStandard;
  const allSetups = slots.reduce((sum, slot) => sum + slot.setup, 0);
  const referenceMoq = standardPrice > 0 ? Math.ceil((allSetups + 550) / standardPrice) : 0;

  elements.resultState.textContent = usedSlots.length ? "已匹配" : "待录入";
  elements.runState.textContent = usedSlots.length ? `已配置 ${usedSlots.length} 组纸张 · 总印数 ${number(slots.reduce((sum, slot) => sum + slot.printSheets, 0), 0)} 张 · 印版套数 ${number(plateSets, 0)}` : "先配置封皮或内页纸张，再自动展开每组印费与调机成本。";
  elements.total.textContent = money(total, 5);
  elements.cost.textContent = money(productCost, 5);
  elements.orderTotal.textContent = money(total * product.quantity, 2);
  elements.standardPrice.textContent = money(standardPrice, 5);
  elements.referenceMoq.textContent = referenceMoq ? `${number(referenceMoq, 0)} 个` : "-";
  elements.descriptor.textContent = `${number(product.height, 2)} × ${number(product.width, 2)}mm · ${number(product.pages, 0)}P · ${number(product.quantity, 0)} 个`;
  elements.trace.textContent = `D29 ${money(paperCost, 5)} + T55 ${money(printCost, 5)} + I75 ${money(postActual, 5)} + B75 ${money(makeReady, 5)} = B77 ${money(productCost, 5)}；B77 × (1+${number(product.variance, 3)}) = B78 ${money(total, 5)}`;
  renderCostRows([{ label: "纸张成本 D29", amount: paperCost }, { label: "印费 T55", amount: printCost }, { label: "印后合计 I75", amount: postActual }, { label: "纸张调机加放 B75", amount: makeReady }], productCost);
  renderDetails(slots, selectedProcesses);
}

function reset() {
  const defaults = { height: 0, width: 0, pages: 0, quantity: 1000, otherProcess: 0, variance: database.variance };
  inputIds.forEach((id) => { if (Object.prototype.hasOwnProperty.call(defaults, id)) input[id].value = defaults[id]; });
  input.binding.value = "骑马钉";
  elements.bookletRows.querySelectorAll("tr").forEach((row) => { row.querySelectorAll("input").forEach((field) => { field.value = 0; }); row.querySelector('[data-field="material"]').value = ""; row.querySelector('[data-field="format"]').value = ""; row.querySelector('[data-field="open"]').value = "1"; row.querySelector('[data-field="layout"]').value = "自翻"; });
  processIds.forEach((id) => { document.querySelector(`#${id}`).checked = false; });
  calculate();
}

inputIds.forEach((id) => input[id].addEventListener(input[id].tagName === "SELECT" ? "change" : "input", calculate));
processIds.forEach((id) => document.querySelector(`#${id}`).addEventListener("change", calculate));
document.querySelector("#resetBooklet").addEventListener("click", reset);

fetch("data/booklet-v2.1.json").then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then((data) => { database = data; elements.databaseState.textContent = `${data.cells.length} 条 V2.1 数据`; buildRows(); reset(); }).catch(() => { elements.databaseState.textContent = "数据库待检查"; elements.runState.textContent = "成本库未能加载"; });
