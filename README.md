# GHIC 手柄配置工具（Vue 3 + Vite）

网页连接：https://ghic.ghic-rd10.workers.dev

## 发布流程（Cloudflare）

改完代码后，在终端运行：

```
pnpm run deploy
```

自动完成：构建 → 上传到 Cloudflare → 几十秒后线上生效（浏览器 Ctrl+F5 强刷看最新版）。

> 首次使用前需要运行过一次 `npx wrangler login` 授权（已做过则不用）。

## 升级工具（exe）管理

- 下载文件托管在 GitHub 公开仓库 `ghic-download` 的 Releases：
  https://github.com/hankielao/ghic-download/releases/tag/1.0
- 新增/更新 exe：到上面的 Release 页面 → Edit → Attach binaries 拖入新文件 → Update release
- 然后修改 `src/views/Download.vue` 里的 files 列表（文件名/描述/大小/下载地址）→ `pnpm run deploy`

## 源码备份（GitHub 私有仓库，可选）

源码仓库：https://github.com/hankielao/ghic （私有）

VS Code 里提交 + 同步即可备份；GitHub 网络不通时会报 `Failed to connect to github.com` 超时，本地提交不丢，等网络恢复再同步即可，不影响网站发布。
