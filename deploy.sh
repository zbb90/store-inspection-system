#!/bin/bash

echo "🚀 巡店监控审核系统 - 一键部署脚本"
echo "=================================="

# 检查Node.js
if ! command -v node &> /dev/null
then
    echo "❌ 错误：未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null
then
    echo "❌ 错误：未检测到 npm，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装依赖
echo "📦 安装后端依赖..."
npm install

echo "📦 安装前端依赖..."
cd client && npm install && cd ..

# 构建前端
echo "🔨 构建前端应用..."
cd client && npm run build && cd ..

# 检查Vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "📥 安装 Vercel CLI..."
    npm install -g vercel
fi

echo "🌐 开始部署到 Vercel..."
echo "请按照提示完成部署："
echo "1. 如果首次使用，需要登录 Vercel"
echo "2. 选择项目名称（或使用默认名称）"
echo "3. 选择部署目录（当前目录）"
echo "4. 等待部署完成"

# 部署到Vercel
vercel --prod

echo "🎉 部署完成！"
echo "=================================="
echo "您的应用已部署到公网，伙伴们可以通过以下方式访问："
echo "1. 查看终端输出的部署URL"
echo "2. 在 Vercel 控制台查看项目"
echo "3. 分享URL给伙伴们使用"
echo ""
echo "💡 提示："
echo "- 首次访问可能需要几秒钟加载"
echo "- 建议配置自定义域名"
echo "- 定期备份重要数据"
