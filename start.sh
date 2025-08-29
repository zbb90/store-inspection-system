#!/bin/bash

echo "巡店监控审核系统启动中..."
echo "================================"

# 检查 node 是否安装
if ! command -v node &> /dev/null
then
    echo "错误：未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "安装前端依赖..."
    cd client && npm install && cd ..
fi

# 初始化数据库
if [ ! -f "database/inspection.db" ]; then
    echo "初始化数据库..."
    node init-data.js
fi

# 启动服务
echo "启动后端服务..."
npm start &

echo "等待后端启动..."
sleep 3

echo "启动前端服务..."
cd client && npm start

echo "================================"
echo "系统已启动！"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:3001"
