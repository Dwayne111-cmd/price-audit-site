# 开放 API 使用说明

这个服务用于把网站里的电子料价格查询能力开放给小艺 Crew、工作流、Webhook 或其他系统调用。

## 本地启动

```powershell
.\start-api.cmd
```

默认地址：

```text
http://127.0.0.1:8787
```

## 接口

### 健康检查

```text
GET /api/health
```

### 查询公司价格

```text
GET /api/company-price?part=W25Q128JVSIQ
```

返回公司价格表中的单颗料价格。没有命中时返回 `404`。

### 分析物料

```text
GET /api/analyze-part?part=W25Q128JVSIQ
```

返回：

- 识别品类
- 当前价格
- 价格口径：公司价格表 / 外部参考价 / 暂无价格数据
- 关键规格
- 价差因素参考权重
- 成本组成参考
- 采购动作建议

### 价差归因

```text
GET /api/attribute-price-difference?part=W25Q128JVSIQ&comparePart=MX25L12835F
```

也可以直接对比目标价或供应商报价：

```text
GET /api/attribute-price-difference?part=W25Q128JVSIQ&targetPrice=3.8&targetSource=供应商A
```

返回：
- 基准料号价格，公司价格表优先
- 对比料号、目标价或供应商报价
- 价差金额和比例
- 归因因素占比
- 采购复核动作

### 查询品类走势

```text
GET /api/category-trend?category=MLCC
```

返回外部参考价的时间序列。当前 `price-history.json` 为空时会返回 `awaiting-collection`。

## 鉴权

本地默认不启用鉴权。部署公网时建议设置环境变量：

```powershell
$env:API_TOKEN="你的长随机密钥"
.\start-api.cmd
```

调用时加：

```text
Authorization: Bearer 你的长随机密钥
```

## 给小艺 Crew 配置工具时的建议

工具名称：电子料价差分析

接口地址：

```text
https://你的域名/api/analyze-part
```

参数：

```json
{
  "part": "用户输入的物料编码或规格型号"
}
```

工具描述：

```text
当用户询问电子料、物料编码、规格型号、公司价格或价差原因时，调用该接口查询公司价格表、外部参考价和采购分析建议。
```

## 安全提醒

公司价格属于敏感数据。部署到公网时，不建议直接公开 `outputs/data/company-procurement-prices.json`。正式上线建议把公司价格表移动到服务器私有目录，只允许 API 读取，并开启 `API_TOKEN`。
