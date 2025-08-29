# 使用Node.js官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 可选：构建前端（如果存在client）
RUN if [ -f ./client/package.json ]; then cd client && npm install && npm run build; fi

# 暴露端口
EXPOSE 3000
ENV PORT=3000

# 启动应用
CMD ["npm", "start"]
