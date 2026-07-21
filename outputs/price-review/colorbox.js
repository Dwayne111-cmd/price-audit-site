const ids = ["l", "w", "h", "tongue", "glue", "qty", "paper", "print", "post", "paperReady", "filmReady", "die", "variance"];
const E = Object.fromEntries(ids.map((id) => [id, document.querySelector(`#${id}`)]));
const out = Object.fromEntries(["total", "area", "cost", "order", "perK", "trace", "descriptor"].map((id) => [id, document.querySelector(`#${id}`)]));

const n = (value, digits = 2) => Number(value || 0).toLocaleString("zh-CN", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits
});
const money = (value, digits = 2) => `CNY ${n(value, digits)}`;

function values() {
  return Object.fromEntries(ids.map((id) => [id, Number(E[id].value) || 0]));
}

function calc() {
  const v = values();
  const area = ((2 * (v.l + v.w) + v.glue) * (v.h + 2 * (v.w + v.tongue)) * 1.05) / 1000000;
  const cost = v.paper + v.print + v.post + v.paperReady + v.filmReady + v.die;
  const total = cost * (1 + v.variance);

  out.area.textContent = `${n(area, 6)} ㎡`;
  out.cost.textContent = money(cost, 5);
  out.total.textContent = money(total, 5);
  out.order.textContent = money(total * v.qty, 2);
  out.perK.textContent = money(total * 1000, 2);
  out.descriptor.textContent = `${n(v.l, 2)} × ${n(v.w, 2)} × ${n(v.h, 2)}mm · ${n(v.qty, 0)} 个`;
  out.trace.textContent = `[2(${n(v.l, 2)}+${n(v.w, 2)})+${n(v.glue, 2)}] × [${n(v.h, 2)}+2(${n(v.w, 2)}+${n(v.tongue, 2)})] × 1.05 ÷ 1,000,000 = ${n(area, 6)}㎡；(${n(v.paper, 5)}+${n(v.print, 5)}+${n(v.post, 5)}+${n(v.paperReady, 5)}+${n(v.filmReady, 5)}+${n(v.die, 5)}) × (1+${n(v.variance, 3)}) = ${n(total, 5)}`;
}

ids.forEach((id) => E[id].addEventListener("input", calc));

document.querySelector("#resetColorbox").addEventListener("click", () => {
  ids.forEach((id) => {
    E[id].value = id === "qty" ? 1000 : id === "variance" ? 0.05 : 0;
  });
  calc();
});

fetch("data/colorbox-v2.1.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((database) => {
    const count = Array.isArray(database.cells) ? database.cells.length : 0;
    document.querySelector("#databaseState").textContent = `${count} 条 V2.1 数据`;
    document.querySelector("#dbCount").textContent = `已载入 ${count} 个原始成本/公式单元格`;
  })
  .catch(() => {
    document.querySelector("#databaseState").textContent = "数据库待检查";
  });

document.querySelector("#resetColorbox").click();
