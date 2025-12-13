# Netlify 部署指南

## 简单步骤

1. **登录或注册Netlify账户**
   - 访问 https://www.netlify.com/ 并登录或注册一个新账户

2. **创建新站点**
   - 点击仪表板上的 "Add new site" 按钮
   - 选择 "Import an existing project"

3. **连接GitHub仓库**
   - 选择 "GitHub" 作为Git提供商
   - 授权Netlify访问你的GitHub账户
   - 搜索并选择仓库：`yangxinnan666/bdxt-zj-system`

4. **配置构建设置**
   - Netlify会自动检测到我们的 `netlify.toml` 配置文件
   - 确认以下设置：
     - Build command: `npm run build`
     - Publish directory: `dist`

5. **部署站点**
   - 点击 "Deploy site" 按钮
   - Netlify将开始构建和部署过程
   - 完成后，你将获得一个Netlify子域名（如：your-site-name.netlify.app）

6. **自定义域名（可选）**
   - 如果你有自己的域名，可以在Netlify设置中添加并配置

## 注意事项

- 确保你的GitHub仓库是公开的，或者你已经授权Netlify访问私有仓库
- 部署过程中如果遇到问题，可以查看Netlify的构建日志进行排查