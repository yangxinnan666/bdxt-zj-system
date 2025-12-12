# GitHub上传与Vercel部署指南

## 一、准备上传的文件

以下是需要上传到GitHub的文件和目录：

```
bdxt-zj/
├── src/                  # 源代码目录
├── index.html            # 入口HTML文件
├── package.json          # 项目配置文件
├── package-lock.json     # 依赖锁定文件
├── vite.config.js        # Vite配置文件
├── vercel.json           # Vercel部署配置
├── .gitignore            # Git忽略文件配置
└── README.md             # 项目说明文件（如果有）
```

> **注意**：不需要上传`node_modules`和`dist`目录，因为Vercel会自动构建项目。

## 二、上传到GitHub的步骤

### 方法1：使用Git命令（推荐）

1. **初始化Git仓库**
   打开命令提示符（CMD）或PowerShell，进入项目目录：
   ```bash
   cd c:\Users\dyb\Desktop\bdxt-zj
   git init
   ```

2. **添加文件到暂存区**
   ```bash
   git add .
   ```

3. **提交更改**
   ```bash
   git commit -m "初始提交"
   ```

4. **在GitHub上创建新仓库**
   - 登录GitHub，点击右上角的「+」按钮
   - 选择「New repository」
   - 输入仓库名称（如`bdxt-zj-system`）
   - 选择「Public」或「Private」
   - 点击「Create repository」

5. **关联本地仓库与GitHub仓库**
   ```bash
   git remote add origin https://github.com/your-username/bdxt-zj-system.git
   ```
   （将`your-username`替换为你的GitHub用户名）

6. **推送到GitHub**
   ```bash
   git push -u origin master
   ```
   （如果使用的是main分支，将master改为main）

### 方法2：使用GitHub Desktop

1. **下载并安装GitHub Desktop**：https://desktop.github.com/
2. **登录GitHub账号**
3. **点击「Add」→「Add Existing Repository」**
4. **选择项目目录**（`c:\Users\dyb\Desktop\bdxt-zj`）
5. **点击「Publish repository」**
6. **输入仓库名称**，选择「Public」或「Private」
7. **点击「Publish Repository」**

## 三、Vercel部署步骤

1. **登录Vercel**：https://vercel.com/

2. **导入GitHub仓库**
   - 点击「New Project」
   - 在「Import Git Repository」中找到你的项目仓库
   - 点击「Import」

3. **配置部署设置**
   - **Framework Preset**：选择「Vite」
   - **Build Command**：`npm run build`
   - **Output Directory**：`dist`
   - 其他设置保持默认
   - 点击「Deploy」

4. **访问部署后的网站**
   - 部署完成后，点击「Visit」按钮
   - 或直接访问提供的URL（如：https://bdxt-zj-system.vercel.app）

## 四、常见问题解决

1. **上传失败**：检查Git是否正确安装，GitHub账号是否有推送权限
2. **部署失败**：确保package.json中有正确的build脚本，依赖是否完整
3. **网站无法访问**：检查路由配置，确保vercel.json中的路由规则正确

---

如果需要更详细的说明，请参考`VERCEL_DEPLOYMENT_GUIDE.md`文件。