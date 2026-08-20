# TestPilot 个人测试工作台

面向个人测试工程师的本地工作台，使用黄色作为主题色，数据保存在本机 SQLite。

## 启动

双击 `start.command`，或在终端执行：

```bash
./start.command
```

浏览器打开：<http://127.0.0.1:3344>

首次进入时，如果检测到旧版浏览器数据，页面会询问是否备份并迁移到 SQLite。迁移文件保存在 `data/backups`，迁移过程具有幂等保护。

## 主要功能

- 首页指标、快捷单任务与组合任务
- 项目 → 模块 → 子模块三级配置
- 用例树、分页搜索、批量选择、XLSX/CSV/JSON 导出
- Bug、日志、SQL 独立任务表单、列表、详情与审核入库
- 可在线执行的回归清单
- 统一测试报告与 Markdown/PDF 下载
- 可编辑、版本化、带引用保护的知识库
- 父子任务结构的自定义全链路
- OpenAI、通义千问、DeepSeek 和自定义兼容模型配置

API Key 通过 macOS 钥匙串保存，SQLite 仅记录脱敏状态。

## 开发校验

```bash
pnpm run check
pnpm run build
```

生产构建后可运行 `pnpm start`。服务端与前端统一使用 `3344` 端口。
