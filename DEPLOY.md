# 巡店监控审核系统 - 部署指南

## 方案一：Vercel部署（推荐）

### 1. 准备工作
- 注册 [Vercel](https://vercel.com) 账号
- 安装 [Vercel CLI](https://vercel.com/docs/cli)

### 2. 本地构建测试
```bash
# 构建前端
cd client
npm run build
cd ..

# 测试生产环境
NODE_ENV=production npm start
```

### 3. 部署到Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 4. 获取部署URL
部署成功后，Vercel会提供类似以下URL：
- 预览环境：`https://your-app-name.vercel.app`
- 生产环境：`https://your-app-name.vercel.app`

## 方案二：Railway部署

### 1. 注册Railway
- 访问 [Railway](https://railway.app)
- 使用GitHub账号登录

### 2. 连接GitHub仓库
- 将代码推送到GitHub
- 在Railway中导入GitHub仓库

### 3. 配置环境变量
- `NODE_ENV=production`
- `PORT=3000`

### 4. 部署
Railway会自动检测并部署应用

## 方案三：Heroku部署

### 1. 创建Procfile
```
web: node server.js
```

### 2. 配置package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "cd client && npm install && npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 3. 部署
```bash
heroku create your-app-name
git push heroku main
```

## 数据库配置

### 本地开发
- 使用SQLite文件数据库
- 数据存储在 `database/inspection.db`

### 生产环境
- Vercel：使用内存数据库（临时）
- Railway/Heroku：建议使用PostgreSQL
- 云数据库：推荐使用Supabase或PlanetScale

## 文件上传配置

### 本地环境
- 文件存储在 `uploads/` 目录
- 支持最大2GB文件上传

### 生产环境
- Vercel：使用Vercel Blob Storage
- Railway：使用Railway Storage
- Heroku：使用AWS S3或Cloudinary

## 环境变量配置

### 必需环境变量
```bash
NODE_ENV=production
PORT=3000
```

### 可选环境变量
```bash
# 数据库配置
DATABASE_URL=your_database_url

# 文件存储配置
UPLOAD_BUCKET=your_storage_bucket
```

## 域名配置

### 自定义域名
1. 在Vercel/Railway/Heroku中配置自定义域名
2. 更新DNS记录指向部署平台
3. 配置SSL证书

### 示例域名
- `https://inspection.yourcompany.com`
- `https://monitor.yourdomain.com`

## 性能优化

### 前端优化
- 启用Gzip压缩
- 使用CDN加速
- 图片懒加载

### 后端优化
- 数据库连接池
- API缓存
- 文件压缩

## 监控和维护

### 日志监控
- Vercel：内置日志查看
- Railway：实时日志流
- Heroku：Heroku Logs

### 性能监控
- 使用Vercel Analytics
- 配置错误报警
- 定期备份数据

## 安全配置

### HTTPS
- 自动SSL证书
- 强制HTTPS重定向

### 访问控制
- 添加身份验证
- 配置CORS策略
- 限制API访问频率

## 故障排除

### 常见问题
1. **构建失败**：检查Node.js版本和依赖
2. **数据库连接错误**：检查环境变量配置
3. **文件上传失败**：检查存储配置
4. **路由404**：检查前端路由配置

### 调试方法
- 查看部署日志
- 检查环境变量
- 测试API端点
- 验证数据库连接
