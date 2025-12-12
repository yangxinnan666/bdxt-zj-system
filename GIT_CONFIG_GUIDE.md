# Git配置指南

## 1. 用户名设置说明

Git用户名可以**自定义**，不需要与GitHub账号名完全一致，它只是用于标识提交记录的作者信息。您可以使用：
- 您的真实姓名
- 您的GitHub用户名
- 您习惯使用的昵称

## 2. 配置命令

请打开命令提示符（CMD）或PowerShell，执行以下命令：

```bash
# 配置用户名（示例：使用GitHub用户名或真实姓名）
git config --global user.name "您想设置的用户名"

# 配置邮箱（使用您提供的邮箱）
git config --global user.email "2597252592@qq.com"
```

## 3. 验证配置

配置完成后，可以执行以下命令验证：

```bash
git config --list
```

您将看到类似以下输出：
```
user.name=您设置的用户名
user.email=2597252592@qq.com
```

## 4. 继续上传步骤

配置完成后，请回到`COMPLETE_DEPLOYMENT_GUIDE.md`文件，继续执行**方法2：使用Git命令行**的后续步骤：

1. 初始化Git仓库
2. 在GitHub上创建仓库
3. 关联并推送代码

如果您在GitHub上还没有账号，可以先访问[GitHub官网](https://github.com/)注册一个。

---

如果有任何问题，请随时查看其他指南文件或联系技术支持。