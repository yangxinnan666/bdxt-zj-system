# Vercel部署指南

## 前置条件
- 确保您的项目已在GitHub/GitLab/Bitbucket等Git平台上创建仓库
- 项目已包含打包后的`dist`目录（执行过`npm run build`）

## 步骤1：注册/登录Vercel账号
1. 访问 [Vercel官网](https://vercel.com/)
2. 点击右上角的「Sign Up」或「Log In」
3. 可以使用GitHub、GitLab、Bitbucket或邮箱账号登录

## 步骤2：创建新项目
1. 登录后，点击左上角的「New Project」按钮
2. 在「Import Git Repository」页面，选择您的项目仓库
3. 点击「Import」按钮

## 步骤3：配置部署设置
1. 在配置页面，您可以看到项目名称已自动填写
2. 对于「Framework Preset」，选择「Vite」
3. 在「Build Command」中填写：`npm run build`
4. 在「Output Directory」中填写：`dist`
5. 点击「Deploy」按钮开始部署

## 步骤4：访问部署后的网站
1. 部署完成后，您将看到一个成功页面
2. 点击「Visit」按钮，或直接访问提供的URL（格式为：https://your-project.vercel.app）

## 步骤5：配置自定义域名（可选）
如果您有自己的域名，可以在Vercel控制台中添加：
1. 进入项目设置
2. 点击「Domains」选项卡
3. 输入您的域名，按照提示完成DNS配置

---

# 阿里云网站购买和域名配置指南

## 步骤1：购买阿里云域名
1. 访问 [阿里云官网](https://www.aliyun.com/)
2. 登录阿里云账号
3. 搜索「域名注册」并进入域名注册页面
4. 输入您想要的域名，点击「查询」查看是否可用
5. 选择可用的域名，点击「加入清单」
6. 点击右上角的「清单」图标，然后点击「立即结算」
7. 完成支付流程

## 步骤2：配置域名解析
1. 购买成功后，进入「控制台」
2. 点击「云解析DNS」进入DNS管理页面
3. 找到您刚购买的域名，点击「解析设置」
4. 点击「添加记录」，配置两条记录：
   - **记录类型**：A
     - **主机记录**：@
     - **记录值**：Vercel提供的IP地址（可在Vercel项目的Domains设置中获取）
   - **记录类型**：CNAME
     - **主机记录**：www
     - **记录值**：your-project.vercel.app（替换为您的Vercel项目URL）
5. 保存设置

## 步骤3：在Vercel中添加自定义域名
1. 回到Vercel项目控制台
2. 点击「Settings」→「Domains」
3. 输入您的阿里云域名（如：example.com）
4. 点击「Add」按钮
5. 按照Vercel提示完成验证和SSL证书配置

---

## 常见问题解决

1. **部署失败**：检查项目是否有`package.json`文件，确保依赖已正确安装
2. **网站访问显示404**：确保`dist`目录已正确生成，且Vercel配置中的Output Directory设置为`dist`
3. **域名访问失败**：检查DNS解析记录是否正确，等待DNS记录生效（通常需要5-10分钟）

---

如果您在部署过程中遇到任何问题，可以参考Vercel官方文档：https://vercel.com/docs