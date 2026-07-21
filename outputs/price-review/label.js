const ids = ["length", "height", "quantity", "material", "process", "materialType", "variable"];
const input = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`)]));
const elements = Object.fromEntries(["databaseState", "variableState", "matchState", "rateSource", "rateDetail", "resultState", "cost", "descriptor", "area", "rate", "variablePrice", "allocation", "trace", "orderCost", "setupFee", "orderTotal", "variableRows"].map((id) => [id, document.querySelector(`#${id}`)]));
let database;
const n = (value, digits = 2) => Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = (value, digits = 2) => `CNY ${n(value, digits)}`;
const numeric = (element) => Number(element.value) || 0;

function populateMaterials() {
  const materials = [...new Set(database.rates.map((row) => row.material))];
  input.material.innerHTML = materials.map((material) => `<option value="${material}">${material}</option>`).join("");
  populateProcesses();
}

function populateProcesses() {
  const processes = [...new Set(database.rates.filter((row) => row.material === input.material.value).map((row) => row.process))];
  input.process.innerHTML = processes.map((process) => `<option value="${process}">${process}</option>`).join("");
}

function renderVariableRules() {
  elements.variableRows.innerHTML = database.variableRules.map((rule) => `<tr><td>${rule.row}</td><td>${rule.lengthMin} - ${rule.lengthMax}</td><td>${rule.heightMin} - ${rule.heightMax}</td><td>${rule.materialType}</td><td>${money(rule.price, 3)}</td></tr>`).join("");
}

function calculate() {
  if (!database) return;
  const length = numeric(input.length);
  const height = numeric(input.height);
  const quantity = Math.max(numeric(input.quantity), 1);
  const selectedRate = database.rates.find((row) => row.material === input.material.value && row.process === input.process.value);
  const hasDimensions = length > 0 && height > 0;
  const area = hasDimensions && length >= height ? length * height * 1.03 / 100 : null;
  const variableRule = input.variable.checked ? database.variableRules.find((rule) => length >= rule.lengthMin && length < rule.lengthMax && height >= rule.heightMin && height < rule.heightMax && input.materialType.value === rule.materialType) : undefined;
  const valid = Boolean(selectedRate && area !== null && (!input.variable.checked || variableRule));
  const variablePrice = variableRule ? variableRule.price : 0;
  const cost = valid ? (selectedRate.standardRate * area + variablePrice) * 1.13 : 0;
  const allocation = cost > 0 ? Math.ceil(selectedRate.setupFee / cost * 1.13) : 0;

  elements.area.textContent = !hasDimensions ? "-" : area === null ? "长度必须大于等于高度" : `${n(area, 4)} cm²`;
  elements.rate.textContent = money(selectedRate?.standardRate, 5);
  elements.variablePrice.textContent = money(variablePrice, 5);
  elements.cost.textContent = money(cost, 5);
  elements.allocation.textContent = allocation ? `${n(allocation, 0)} 个` : "-";
  elements.orderCost.textContent = money(cost, 5);
  elements.setupFee.textContent = money(selectedRate?.setupFee, 2);
  elements.orderTotal.textContent = money(cost * quantity, 2);
  elements.descriptor.textContent = `${n(length, 2)} × ${n(height, 2)}mm · ${n(quantity, 0)} 个`;
  elements.rateSource.textContent = selectedRate ? `${selectedRate.process} · ${selectedRate.material}` : "未找到标准价";
  elements.rateDetail.textContent = selectedRate ? `V2.0 第 ${selectedRate.row} 行 · ${selectedRate.unit} · 开机费 ${money(selectedRate.setupFee, 2)}` : "请调整材质或工艺";
  elements.variableState.textContent = input.variable.checked ? (variableRule ? `命中第 ${variableRule.row} 条变量打印规则` : "未命中变量打印阶梯") : "变量打印未启用";
  elements.matchState.textContent = !hasDimensions ? "等待尺寸录入" : area === null ? "标签长度必须大于等于高度" : valid ? "参数已匹配" : "等待完整参数";
  elements.resultState.textContent = valid ? "已匹配" : "待录入";
  elements.trace.textContent = valid ? `(${n(selectedRate.standardRate, 5)} × ${n(area, 4)} + ${n(variablePrice, 5)}) × 1.13 = ${n(cost, 5)}；开机费 ${n(selectedRate.setupFee, 2)} ÷ ${n(cost, 5)} × 1.13 = ${n(allocation, 0)} 个` : "请填写长度、高度、材质与工艺；变量打印需要命中对应尺寸阶梯。";
}

function reset() {
  input.length.value = 0; input.height.value = 0; input.quantity.value = 1000; input.materialType.value = "纸类"; input.variable.checked = false; populateMaterials(); calculate();
}

input.length.addEventListener("input", calculate);
input.height.addEventListener("input", calculate);
input.quantity.addEventListener("input", calculate);
input.material.addEventListener("change", () => { populateProcesses(); calculate(); });
input.process.addEventListener("change", calculate);
input.materialType.addEventListener("change", calculate);
input.variable.addEventListener("change", calculate);
document.querySelector("#resetLabel").addEventListener("click", reset);

fetch("data/label-v2.0.json").then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then((data) => { database = data; elements.databaseState.textContent = `${data.cells.length} 条 V2.0 数据`; renderVariableRules(); reset(); }).catch(() => { elements.databaseState.textContent = "数据库待检查"; });
