const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '巡店监控审核系统运行正常',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// 测试端点
app.get('/test', (req, res) => {
  res.json({ message: '测试端点正常工作' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`环境变量: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
  console.log(`健康检查端点: http://0.0.0.0:${PORT}/`);
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
