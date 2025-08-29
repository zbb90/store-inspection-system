const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dayjs = require('dayjs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const ts = dayjs().format('YYYYMMDD-HHmmss-SSS');
    cb(null, `${base}-${ts}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('只允许上传视频文件'));
  }
});

// 静态资源
app.use('/uploads', express.static(uploadsDir));

// 健康检查
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'store-inspection-system lite running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 简单内存数据
const memory = {
  videos: [],
  inspections: []
};

// 上传视频
app.post('/api/upload/video', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有上传文件' });
  const file = {
    id: memory.videos.length + 1,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    createdAt: new Date().toISOString()
  };
  memory.videos.push(file);
  res.json({ success: true, file });
});

// 列出视频
app.get('/api/videos', (req, res) => {
  res.json(memory.videos);
});

// 最简巡检记录
app.post('/api/inspections', (req, res) => {
  const record = { id: memory.inspections.length + 1, ...req.body, createdAt: new Date().toISOString() };
  memory.inspections.push(record);
  res.json({ success: true, record });
});

app.get('/api/inspections', (req, res) => {
  res.json(memory.inspections);
});

// 生产环境：提供前端静态文件
const clientBuild = path.join(__dirname, 'client', 'build');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server(LITE) running at http://0.0.0.0:${PORT}`);
});
