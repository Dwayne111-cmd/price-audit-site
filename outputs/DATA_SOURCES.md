# 价格数据口径说明

当前网站把公司价格表和外部平台价分开使用，不把两种价格混成一个主价格池。

## 优先级

1. 公司价格表：`outputs/data/company-procurement-prices.json` 或页面临时导入的价格表。一颗料通常只有一个公司价格，用于料号分析和议价基准。
2. 外部参考价：`outputs/data/price-history.json`，由 `scripts/fetch-prices.mjs` 每日抓取 LCSC、DigiKey、Mouser、Octopart/Nexar、Findchips、TrustedParts、Arrow、Avnet、RS、TME 等公开来源。用于品类走势和公司表缺失物料的参考。
3. 暂无价格数据：当公司价格表和外部参考价都没有覆盖时，页面明确显示待采集或暂无价格数据。

## 公司价格表字段

JSON 推荐格式：

```json
{
  "records": [
    {
      "date": "2026-07-08",
      "part": "W25Q128JVSIQ",
      "category": "存储器 / Flash DRAM",
      "supplier": "公司价格表",
      "unitPrice": 4.4,
      "qty": 50000,
      "currency": "CNY",
      "sourceType": "company"
    }
  ]
}
```

CSV 可用字段：`日期,料号,品类,供应商,单价,数量,币种`。也兼容 `采购日期、物料编码、型号、采购供应商、采购单价、历史采购价、含税单价、采购数量` 等常见列名。

## 外部参考价

- `outputs/data/materials.json` 保存要抓取的物料库。
- `outputs/data/source-registry.json` 保存外部来源池。
- `scripts/fetch-prices.mjs` 每日抓取后写入 `outputs/data/price-history.json`。
- 自动抓取生成的记录会写入 `sourceType: "external"`，页面只把它作为缺料补充。

## GitHub Secrets

- `MATERIALS_URL`：可选，你们物料库 JSON/CSV 的导出地址。
- `MATERIALS_TOKEN`：可选，读取物料库接口的 Bearer Token。
- `SOURCE_REGISTRY_URL`：可选，外部维护的来源池 JSON。
- `SOURCE_REGISTRY_TOKEN`：可选，读取来源池时使用。
- `MOUSER_API_KEY`：可选，贸泽 API Key。
- `DIGIKEY_CLIENT_ID`：可选，得捷 API Client ID。
- `DIGIKEY_ACCESS_TOKEN`：可选，得捷 OAuth Access Token。
- `NEXAR_TOKEN`：可选，Octopart / Nexar GraphQL API Token。

## 页面显示规则

- 品类折线图：使用外部参考价的时间序列；没有外部趋势时显示待外部采集。
- 物料分析：先查输入料号的公司价格表；没有时才查外部参考价；再没有则显示暂无价格数据。
- 公司价格表：只显示一个“公司价格”，不显示最低/中位/最高。
- 来源标注：只显示“公司价格表”“外部参考价：来源名”或“待外部采集”，不再显示样本条数。
