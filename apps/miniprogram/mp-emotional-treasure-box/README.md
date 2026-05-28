# Emotional Treasure Box Miniprogram

情绪宝藏盒小程序项目。

当前后端服务由 monorepo 中的 Express API 提供：

```bash
cd /Users/kayn/Developer/projects/mine-projects/workspace
NODE_ENV=development pnpm --filter server-emotional-box dev
```

小程序 API 地址配置在 `miniprogram/app.js` 的 `globalData.apiBaseUrl`。
