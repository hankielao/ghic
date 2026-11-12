# GHIC 手柄配置工具（Vue 3 + Vite）

网页连接：https://hankielao.github.io/ghic/

## 发布流程（GitHub Pages）

改完代码后，在终端运行：

```
pnpm run deploy
```

自动完成：构建 → 提交 dist → 推送 gh-pages 分支（过几分钟后页面刷新才有最新的，浏览器 Ctrl+F5 强刷）。

> 常见报错 `Failed to connect to github.com`：国内网络访问 GitHub 超时，本地提交不丢，等网络恢复重跑一次即可。

## 升级工具（exe）管理

- 下载文件托管在 GitHub 公开仓库 `ghic-download` 的 Releases：
  https://github.com/hankielao/ghic-download/releases/tag/1.0
- 新增/更新 exe：到上面的 Release 页面 → Edit → Attach binaries 拖入新文件 → Update release
- 然后修改 `src/views/Download.vue` 里的 files 列表（文件名/描述/大小/下载地址）→ `pnpm run deploy`

## 源码备份（GitHub 仓库）

源码仓库：https://github.com/hankielao/ghic

VS Code 里提交 + 同步即可备份；GitHub 网络不通时会报超时，本地提交不丢，等网络恢复再同步即可。
