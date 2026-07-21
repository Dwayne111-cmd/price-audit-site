const inputIds = [
  "length", "width", "material", "gsm", "paperFormat", "openType", "layout", "yield", "quantity",
  "customFullLength", "customFullWidth", "customHalfLength", "customHalfWidth",
  "frontNormal", "frontSpot", "backNormal", "backSpot", "folds", "otherProcess", "variance"
];
const processIds = ["onlineOil", "brightFilm", "matteFilm", "cut", "dieCut", "fold"];
const input = Object.fromEntries(inputIds.map((id) => [id, document.querySelector(`#${id}`)]));
const elements = Object.fromEntries([
  "databaseState", "paperPrice", "paperPriceSource", "sheetArea", "sheetAreaSource", "runState", "resultState",
  "total", "descriptor", "cost", "orderTotal", "standardPrice", "referenceMoq", "trace", "costRows", "processRows"
].map((id) => [id, document.querySelector(`#${id}`)]));

let database;

const number = (value, digits = 2) => Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = (value, digits = 2) => `CNY ${number(value, digits)}`;
const valueOf = (id) => Number(input[id].value) || 0;
const checked = (id) => document.querySelector(`#${id}`).checked;

function read() {
  return Object.fromEntries(inputIds.map((id) => [id, input[id].tagName === "SELECT" ? input[id].value : valueOf(id)]));
}

function sheetAreas(v) {
  if (v.paperFormat === "特规") {
    return {
      full: (v.customFullLength * v.customFullWidth) / 1000000,
      half: (v.customHalfLength * v.customHalfWidth) / 1000000
    };
  }
  const format = database.paperFormats[v.paperFormat];
  return {
    full: (format.full[0] * format.full[1]) / 1000000,
    half: (format.half[0] * format.half[1]) / 1000000
  };
}

function setupForColours(colours, printSheets) {
  if (!colours || printSheets >= 3000) return 0;
  if (colours === 6) return database.printing.machineSetup["6"];
  if (colours === 5) return database.printing.machineSetup["5"];
  if (colours > 1) return database.printing.machineSetup["2to4"];
  return database.printing.machineSetup["1"];
}

function processCost(id, enabled, context) {
  const rate = database.processes[id];
  if (!enabled || !context.quantity || !context.yield) return { label: rate.label, enabled, setup: 0, standard: 0, actual: 0, condition: "未选择" };

  let setup = 0;
  let standard = 0;
  let condition = "达到标准工费条件";
  if (id === "onlineOil") {
    setup = context.printSheets * context.areas.half < 2000 ? rate.setup : 0;
    standard = context.areas.half / context.yield * 2 * rate.rate;
    condition = "印张面积小于 2,000㎡ 收取开机费";
  } else if (id === "brightFilm") {
    setup = context.printSheets * context.selectedArea * 2 < 450 ? rate.setup : 0;
    standard = context.selectedArea / context.yield * 2 * rate.rate;
    condition = "覆膜面积小于 450㎡ 收取开机费";
  } else if (id === "matteFilm") {
    setup = context.printSheets * context.selectedArea * 2 < 400 ? rate.setup : 0;
    standard = context.selectedArea / context.yield * 2 * rate.rate;
    condition = "覆膜面积小于 400㎡ 收取开机费";
  } else if (id === "cut") {
    setup = context.quantity < 15000 ? rate.setup : 0;
    standard = rate.rate;
    condition = "订单小于 15,000 个收取开机费";
  } else if (id === "dieCut") {
    setup = context.printSheets < 3000 ? rate.setup : 0;
    standard = rate.rate / context.yield;
    condition = "印数小于 3,000 张收取开机费";
  } else if (id === "fold") {
    setup = context.quantity < 4000 ? rate.setup : 0;
    standard = context.folds <= 4 ? rate.rate4OrLess : rate.rateOver4;
    condition = "订单小于 4,000 个收取开机费";
  }

  const conditionState = setup > 0 ? `触发开机费：${condition}` : `标准工费：${condition}`;
  return { label: rate.label, enabled, setup, standard, actual: setup > 0 ? setup / context.quantity : standard, condition: conditionState };
}

function renderCostRows(rows, productCost) {
  elements.costRows.innerHTML = rows.map((row) => {
    const percent = productCost > 0 ? Math.max(2, (row.amount / productCost) * 100) : 0;
    return `<div class="cost-row"><div><span>${row.label}</span><strong>${money(row.amount, 5)}</strong></div><i><b style="width:${Math.min(percent, 100)}%"></b></i><strong>${number(percent, 1)}%</strong></div>`;
  }).join("");
}

function renderProcessRows(rows) {
  elements.processRows.innerHTML = rows.map((row) => `<tr><td>${row.label}</td><td>${row.enabled ? row.condition : "未选择"}</td><td>${row.enabled ? money(row.actual, 5) : "-"}</td></tr>`).join("");
}

function calculate() {
  if (!database) return;
  const v = read();
  const quantity = Math.max(v.quantity, 1);
  const yieldCount = Math.max(v.yield, 1);
  const areas = sheetAreas(v);
  const selectedArea = v.openType === "1" ? areas.full : areas.half;
  const paperTonPrice = database.paperPricesPerTon[v.material];
  const printSheets = Math.ceil(quantity / yieldCount);
  const paperSheetPrice = selectedArea * v.gsm * paperTonPrice / 1000000;
  const paperCost = paperSheetPrice / yieldCount;
  const productArea = v.length * v.width / 1000000 * 1.03;

  const frontColours = v.frontNormal + v.frontSpot;
  const backColours = v.backNormal + v.backSpot;
  const frontSetup = setupForColours(frontColours, printSheets);
  const backSetup = setupForColours(backColours, printSheets);
  const frontColourFee = (v.frontNormal + v.frontSpot * 2) * database.printing.colourOrder;
  const backColourFee = (v.backNormal + v.backSpot * 2) * database.printing.colourOrder;
  const frontPlate = frontColours * database.printing.plate;
  const backPlate = backColours * database.printing.plate;
  const doubleSided = v.layout === "正背";
  const machineSetup = doubleSided ? frontSetup + backSetup : printSheets >= 1500 ? 0 : Math.max(frontSetup, backSetup);
  const colourFee = doubleSided ? frontColourFee + backColourFee : Math.max(frontColourFee, backColourFee) * 2;
  const plateFee = doubleSided ? frontPlate + backPlate : Math.max(frontPlate, backPlate);
  const printingCost = (machineSetup + plateFee) / quantity + (machineSetup > 0 ? 0 : colourFee / 1000 / yieldCount);

  const context = { quantity, yield: yieldCount, printSheets, areas, selectedArea, folds: v.folds };
  const processRows = processIds.map((id) => processCost(id, checked(id), context));
  const processActual = processRows.reduce((sum, row) => sum + row.actual, 0) + v.otherProcess;
  const processStandard = processRows.reduce((sum, row) => sum + row.standard, 0) + v.otherProcess;
  const processCount = processRows.filter((row) => row.enabled).length;
  const makeReady = (processCount + frontColours + backColours) * 50 * paperSheetPrice / quantity;
  const productCost = paperCost + printingCost + processActual + makeReady;
  const total = productCost * (1 + v.variance);
  const standardPrice = paperCost + colourFee / 1000 / yieldCount + processStandard + 0.01;
  const referenceMoq = standardPrice > 0 ? Math.ceil(790 / standardPrice) : 0;

  elements.paperPrice.textContent = money(paperTonPrice, 2);
  elements.paperPriceSource.textContent = `${v.material} · 纸价20260515`;
  elements.sheetArea.textContent = `${number(selectedArea, 6)} ㎡`;
  elements.sheetAreaSource.textContent = `${v.paperFormat} · ${v.openType === "1" ? "全开" : "对开"}`;
  elements.runState.textContent = `印数 ${number(printSheets, 0)} 张 · 单张纸价 ${money(paperSheetPrice, 5)}`;
  elements.resultState.textContent = v.length && v.width && v.gsm ? "已匹配" : "待录入";
  elements.total.textContent = money(total, 5);
  elements.cost.textContent = money(productCost, 5);
  elements.orderTotal.textContent = money(total * quantity, 2);
  elements.standardPrice.textContent = money(standardPrice, 5);
  elements.referenceMoq.textContent = referenceMoq ? `${number(referenceMoq, 0)} 个` : "-";
  elements.descriptor.textContent = `${number(v.length, 2)} × ${number(v.width, 2)}mm · ${number(quantity, 0)} 个 · ${number(printSheets, 0)} 张`;
  elements.trace.textContent = `B15 ${money(paperCost, 5)} + C29 ${money(printingCost, 5)} + I46 ${money(processActual, 5)} + B46 ${money(makeReady, 5)} = B48 ${money(productCost, 5)}；B48 × (1+${number(v.variance, 3)}) = B49 ${money(total, 5)}`;
  renderCostRows([
    { label: "纸张成本 B15", amount: paperCost },
    { label: "印费 C29", amount: printingCost },
    { label: "印后合计 I46", amount: processActual },
    { label: "纸张调机加放 B46", amount: makeReady }
  ], productCost);
  renderProcessRows(processRows);
}

function reset() {
  const defaults = {
    length: 0, width: 0, gsm: 0, yield: 1, quantity: 1000, customFullLength: 0, customFullWidth: 0,
    customHalfLength: 0, customHalfWidth: 0, frontNormal: 0, frontSpot: 0, backNormal: 0, backSpot: 0,
    folds: 0, otherProcess: 0, variance: 0.05
  };
  inputIds.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(defaults, id)) input[id].value = defaults[id];
  });
  input.material.value = "胶板";
  input.paperFormat.value = "正度";
  input.openType.value = "1";
  input.layout.value = "自翻";
  processIds.forEach((id) => { document.querySelector(`#${id}`).checked = false; });
  calculate();
}

inputIds.forEach((id) => input[id].addEventListener("input", calculate));
inputIds.filter((id) => input[id].tagName === "SELECT").forEach((id) => input[id].addEventListener("change", calculate));
processIds.forEach((id) => document.querySelector(`#${id}`).addEventListener("change", calculate));
document.querySelector("#resetLeaflet").addEventListener("click", reset);

fetch("data/leaflet-v2.0.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    database = data;
    const cellCount = Array.isArray(data.cells) ? data.cells.length : 0;
    elements.databaseState.textContent = `${cellCount} 条 V2.0 数据`;
    reset();
  })
  .catch(() => {
    elements.databaseState.textContent = "数据库待检查";
    elements.runState.textContent = "成本库未能加载";
  });
