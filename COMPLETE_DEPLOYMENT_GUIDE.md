# 完整部署教程

## 一、项目文件说明

您现在看到的 `github-upload` 文件夹包含了所有需要上传到GitHub的文件，文件结构保持不变，确保项目能够正常运行。

```
github-upload/
├── src/                  # 源代码目录
├── index.html            # 入口HTML文件
├── package.json          # 项目配置文件
├── package-lock.json     # 依赖锁定文件
├── vite.config.js        # Vite配置文件
├── vercel.json           # Vercel部署配置
├── .gitignore            # Git忽略文件配置
├── GITHUB_UPLOAD_GUIDE.md  # GitHub上传指南
├── VERCEL_DEPLOYMENT_GUIDE.md  # Vercel部署指南
├── QUICK_DEPLOY_GUIDE.md  # 快速部署指南
└── COMPLETE_DEPLOYMENT_GUIDE.md  # 完整部署教程
```

## 二、上传到GitHub的步骤

### 方法1：使用GitHub Desktop（最简单）

#### 步骤1：下载并安装GitHub Desktop
1. 访问 [GitHub Desktop官网](https://desktop.github.com/)
2. 点击「Download for Windows」
3. 安装并启动GitHub Desktop

#### 步骤2：登录GitHub账号
1. 打开GitHub Desktop
2. 点击「Sign in to GitHub.com」
3. 使用您的GitHub账号登录

#### 步骤3：创建新仓库
1. 点击「File」→「New repository」
2. 在「Name」字段中输入仓库名称（如：bdxt-zj-system）
3. 在「Local path」字段中，点击「Choose...」并选择 `c:\Users\dyb\Desktop\bdxt-zj\github-upload` 文件夹
4. 勾选「Initialize this repository with a README」（可选）
5. 点击「Create repository」

#### 步骤4：发布仓库到GitHub
1. 仓库创建完成后，点击「Publish repository」按钮
2. 在弹出的窗口中，确认仓库名称
3. 选择「Public」或「Private」
4. 点击「Publish Repository」

### 方法2：使用Git命令行

#### 步骤1：安装Git（如果尚未安装）
1. 访问 [Git官网](https://git-scm.com/downloads)
2. 下载并安装Git for Windows
3. 安装时保持默认设置即可

#### 步骤2：配置Git
打开命令提示符（CMD）或PowerShell：

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

#### 步骤3：初始化Git仓库

```bash
cd c:\Users\dyb\Desktop\bdxt-zj\github-upload
git init
git add .
git commit -m "初始提交"
```

#### 步骤4：在GitHub上创建仓库
1. 登录GitHub
2. 点击右上角的「+」→「New repository」
3. 输入仓库名称（如：bdxt-zj-system）
4. 点击「Create repository」

#### 步骤5：关联并推送

```bash
git remote add origin https://github.com/your-username/bdxt-zj-system.git
git push -u origin master
```

## 三、Vercel部署步骤

### 步骤1：登录Vercel
1. 访问 [Vercel官网](https://vercel.com/)
2. 点击右上角的「Sign In」
3. 使用GitHub账号登录（推荐）

### 步骤2：导入GitHub仓库
1. 登录后，点击「New Project」
2. 在「Import Git Repository」页面，找到您刚创建的仓库（如：your-username/bdxt-zj-system）
3. 点击仓库名称右侧的「Import」按钮

### 步骤3：配置部署设置
1. 在「Configure Project」页面：
   - **Framework Preset**：选择「Vite」
   - **Build Command**：保持默认的 `npm run build`
   - **Output Directory**：保持默认的 `dist`
   - 其他设置保持默认

2. 点击「Deploy」按钮开始部署

### 步骤4：访问部署后的网站
1. 部署完成后，您将看到「Deployment Complete」页面
2. 点击「Visit」按钮，或直接访问提供的URL（格式：https://bdxt-zj-system.vercel.app）

## 四、常见问题解决

### 1. 上传失败
- **问题**：Git命令报错「fatal: not a git repository」
- **解决**：确保您在 `github-upload` 文件夹内执行命令

- **问题**：无法推送，提示「permission denied」
- **解决**：检查GitHub账号是否有权限，或使用SSH密钥认证

### 2. 部署失败
- **问题**：Vercel部署提示「Build failed」
- **解决**：确保package.json中有正确的build脚本，检查依赖是否完整

- **问题**：网站显示白屏
- **解决**：检查vercel.json中的路由配置，确保SPA应用能正常工作

### 3. 功能无法使用
- **问题**：注册登录功能无法使用
- **解决**：检查Supabase配置是否正确，确保API密钥和URL有效

## 五、自定义域名配置（可选）

如果您有自己的域名，可以按照以下步骤配置：

1. **在Vercel中添加域名**
   - 进入项目设置
   - 点击「Domains」选项卡
   - 输入您的域名（如：example.com）
   - 点击「Add」

2. **配置DNS记录**
   - 登录您的域名提供商（如阿里云）
   - 进入DNS管理页面
   - 添加Vercel提供的A记录或CNAME记录

3. **验证域名**
   - 等待DNS记录生效（通常5-10分钟）
   - 在Vercel控制台中验证域名

## 六、后续维护

1. **更新代码**：修改 `github-upload` 文件夹中的文件，然后使用Git命令推送更新
2. **查看日志**：在Vercel控制台中查看部署日志和访问统计
3. **备份数据**：定期备份Supabase数据库中的数据

---

如果您在部署过程中遇到任何问题，可以随时参考本教程或其他指南文件。祝您部署成功！