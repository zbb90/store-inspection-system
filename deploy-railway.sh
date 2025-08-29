#!/bin/bash

echo "🚂 Railway部署脚本 - 巡店监控审核系统"
echo "======================================"

# 检查Git
if ! command -v git &> /dev/null
then
    echo "❌ 错误：未检测到 Git，请先安装 Git"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null
then
    echo "❌ 错误：未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Git 版本: $(git --version)"
echo "✅ Node.js 版本: $(node --version)"

# 检查是否已初始化Git仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
fi

# 添加所有文件到Git
echo "📝 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Initial commit: 巡店监控审核系统"

# 检查是否已连接远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "🌐 请先在GitHub上创建仓库，然后运行以下命令："
    echo ""
    echo "git remote add origin https://github.com/你的用户名/仓库名.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    echo "然后访问 Railway 控制台进行部署："
    echo "https://railway.app/dashboard"
    echo ""
    echo "在Railway中："
    echo "1. 点击 'New Project'"
    echo "2. 选择 'Deploy from GitHub repo'"
    echo "3. 选择您的仓库"
    echo "4. 等待自动部署完成"
    exit 0
fi

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push origin main

echo "🎉 代码已推送到GitHub！"
echo "======================================"
echo "接下来请在Railway中部署："
echo ""
echo "1. 访问 Railway 控制台："
echo "   https://railway.app/dashboard"
echo ""
echo "2. 点击 'New Project'"
echo ""
echo "3. 选择 'Deploy from GitHub repo'"
echo ""
echo "4. 选择您的仓库"
echo ""
echo "5. 配置环境变量："
echo "   NODE_ENV=production"
echo "   PORT=3000"
echo ""
echo "6. 等待自动部署完成"
echo ""
echo "7. 获取部署URL并分享给伙伴们"
