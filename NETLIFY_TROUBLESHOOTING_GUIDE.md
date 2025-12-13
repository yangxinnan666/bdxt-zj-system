# Netlify 网站无法访问诊断指南

如果你的 Netlify 网站（如 https://arpt06.netlify.app/）突然无法访问，以下是排查步骤：

## 1. 检查 Netlify 部署状态

1. 登录 Netlify 账户：https://app.netlify.com/
2. 在仪表板中找到你的站点（arpt06）
3. 查看顶部的部署状态指示器：
   - 🟢 绿色：部署成功
   - 🟡 黄色：部署进行中
   - 🔴 红色：部署失败

## 2. 检查构建日志

1. 在站点页面中，点击 "Deploys" 选项卡
2. 查看最近的部署记录
3. 点击失败的部署记录，查看详细日志
4. 查找错误信息，特别是构建阶段的错误

## 3. 常见问题排查

### 构建失败
- 检查是否有依赖安装错误
- 确认构建命令是否正确执行
- 查看是否有代码错误导致构建失败

### 部署成功但网站无法访问
- 检查 `netlify.toml` 配置是否正确
- 确认 `publish` 目录是否包含正确的文件
- 检查重定向规则是否配置正确

### DNS 问题
- 如果使用自定义域名，检查 DNS 记录是否正确
- 确认域名是否已正确指向 Netlify

## 4. 尝试重新部署

1. 在 Netlify 站点页面中，点击 "Deploys" 选项卡
2. 点击 "Trigger deploy" 按钮
3. 选择 "Deploy site" 重新部署

## 5. 联系 Netlify 支持

如果以上步骤都无法解决问题，可以联系 Netlify 支持团队：
- 访问 https://support.netlify.com/hc/en-us/requests/new
- 提供你的站点名称、部署日志和问题描述

## 本地验证

你可以在本地验证网站是否能正常运行：

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 本地预览
npm run preview
```

然后访问 http://localhost:4173 查看本地预览效果。