# 另面 OTHER SIDE

原创职业探索 H5：50题、10维度、45组组合、80个职业方向及对应7天计划。

## 体验

- 体验入口为包含 `?t=专属编号` 的完整链接；进入后直接开始，没有购买提示或示例报告入口。
- 管理页 `/admin`，管理密钥见本机被 Git 忽略的 `admin-access.txt`。
- 管理端批量生成、复制专属链接或导出CSV。每个买家发一个链接。
- 首次点击开始才计时24小时；进度云端保存，原链接可跨设备续答。
- 提交后锁定本次结果，重复打开只显示报告。未完成链接可以停用。
- 分享卡不会包含专属链接；完整长图包含展开的详细解读与当前选中的职业计划。

## 技术与存储

React + Vinext + Cloudflare Worker / D1，ECharts雷达图，自绘分享卡、html-to-image完整长图。题目与文案位于 `lib/content/`。报告原始答案、分数、职业列表保存于D1；升级题库时须保留旧版解释代码，或增加完整文案快照迁移。

需要微型后端才能可靠跨浏览器锁定结果，不能仅将HTML拖入GitHub Pages。当前以Sites的私有站点部署，店主可预览；正式发货前需配置面向买家的访问方式。不要将管理密钥或本机 `.dev.vars` 发给买家。

这个方案降低转卖链接的价值，但不能阻止他人复制题库、页面代码或未使用的链接。持有专属链接的人可查看该链接的进度/报告；不采集真实姓名与联系方式。

## 本地开发

Node.js >=22.13；安装 `npm ci`。在根目录 `.dev.vars` 设置 `ADMIN_KEY`（至少32字节随机值）。执行 `npm run db:generate` 生成新增迁移，`npm run build` 构建。将 `.dev.vars` 复制到 `dist/server/.dev.vars` 用于本地Worker，勿提交这些文件。

首次本地数据库初始化：
```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_marvelous_leopardon.sql
```

`npm run start` 启动本地Worker。`node scripts/check-invitations.mjs` 使用8787端口运行测试，会创建3条本地测试链接。`npx tsc --noEmit` 类型检查。

## 运维

`.openai/hosting.json` 绑定现有Sites项目和D1，管理密钥为站点运行时secret `ADMIN_KEY`。发布包含 `drizzle/` 迁移；严禁把本地数据库当作生产数据覆盖。批量链接导出妥善保存，定期检查销量与用量。需要公开发货时先确认访问范围与数据库备份方案。

自评倾向不等于实际能力认证。图谱为5—25原始分，不提供虚构人群百分位或就业成功率；同分、低分和一致作答均有独立处理。
