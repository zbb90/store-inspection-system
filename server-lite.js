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

// 内存数据存储
const memory = {
  videos: [],
  stores: [
    { id: 1, store_code: 'SH001', store_name: '上海南京路店', city: '上海', district: '黄浦区', address: '南京路步行街123号' },
    { id: 2, store_code: 'BJ001', store_name: '北京王府井店', city: '北京', district: '东城区', address: '王府井大街456号' },
    { id: 3, store_code: 'GZ001', store_name: '广州天河店', city: '广州', district: '天河区', address: '天河路789号' }
  ],
  inspectors: [
    { id: 1, employee_id: 'EMP001', name: '张三', department: '运营部' },
    { id: 2, employee_id: 'EMP002', name: '李四', department: '质控部' },
    { id: 3, employee_id: 'EMP003', name: '王五', department: '运营部' }
  ],
  inspections: [],
  inspection_items: []
};

// 门店相关API
app.get('/api/stores', (req, res) => {
  res.json(memory.stores);
});

app.post('/api/stores', (req, res) => {
  const store = { 
    id: memory.stores.length + 1, 
    ...req.body, 
    created_at: new Date().toISOString() 
  };
  memory.stores.push(store);
  res.json({ success: true, store });
});

// 巡检员相关API
app.get('/api/inspectors', (req, res) => {
  res.json(memory.inspectors);
});

app.post('/api/inspectors', (req, res) => {
  const inspector = { 
    id: memory.inspectors.length + 1, 
    ...req.body, 
    created_at: new Date().toISOString() 
  };
  memory.inspectors.push(inspector);
  res.json({ success: true, inspector });
});

// 视频相关API
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

app.get('/api/videos', (req, res) => {
  res.json(memory.videos);
});

// 巡检记录API
app.post('/api/inspections', (req, res) => {
  const inspection = { 
    id: memory.inspections.length + 1, 
    ...req.body, 
    created_at: new Date().toISOString() 
  };
  memory.inspections.push(inspection);
  
  // 如果有检查项目，也保存
  if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items.forEach(item => {
      memory.inspection_items.push({
        id: memory.inspection_items.length + 1,
        inspection_id: inspection.id,
        ...item
      });
    });
  }
  
  res.json({ success: true, inspection });
});

app.get('/api/inspections', (req, res) => {
  const { start_date, end_date, store_id, inspector_id } = req.query;
  let filtered = [...memory.inspections];
  
  if (start_date) {
    filtered = filtered.filter(i => i.inspection_date >= start_date);
  }
  if (end_date) {
    filtered = filtered.filter(i => i.inspection_date <= end_date);
  }
  if (store_id) {
    filtered = filtered.filter(i => i.store_id == store_id);
  }
  if (inspector_id) {
    filtered = filtered.filter(i => i.inspector_id == inspector_id);
  }
  
  res.json(filtered);
});

app.get('/api/inspections/:id', (req, res) => {
  const inspection = memory.inspections.find(i => i.id == req.params.id);
  if (!inspection) return res.status(404).json({ error: '巡检记录不存在' });
  
  // 附加检查项目
  const items = memory.inspection_items.filter(item => item.inspection_id == inspection.id);
  
  res.json({ ...inspection, items });
});

// 统计API
app.get('/api/statistics', (req, res) => {
  const { start_date, end_date } = req.query;
  let filtered = [...memory.inspections];
  
  if (start_date) {
    filtered = filtered.filter(i => i.inspection_date >= start_date);
  }
  if (end_date) {
    filtered = filtered.filter(i => i.inspection_date <= end_date);
  }
  
  const stats = {
    totalInspections: filtered.length,
    ratingDistribution: [],
    avgDuration: 0
  };
  
  // 按评价统计
  const ratings = {};
  filtered.forEach(i => {
    if (i.overall_rating) {
      ratings[i.overall_rating] = (ratings[i.overall_rating] || 0) + 1;
    }
  });
  stats.ratingDistribution = Object.entries(ratings).map(([rating, count]) => ({
    overall_rating: rating,
    count
  }));
  
  // 平均时长
  const durations = filtered.filter(i => i.duration_minutes > 0).map(i => i.duration_minutes);
  if (durations.length > 0) {
    stats.avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }
  
  res.json(stats);
});

// 导出功能
app.get('/api/export/inspections', (req, res) => {
  const { format = 'json', start_date, end_date } = req.query;
  let filtered = [...memory.inspections];
  
  if (start_date) {
    filtered = filtered.filter(i => i.inspection_date >= start_date);
  }
  if (end_date) {
    filtered = filtered.filter(i => i.inspection_date <= end_date);
  }
  
  if (format === 'json') {
    res.json(filtered);
  } else {
    // 简单CSV导出
    const csv = [
      'ID,门店ID,巡检员ID,巡检日期,评价,时长,创建时间',
      ...filtered.map(i => `${i.id},${i.store_id},${i.inspector_id},${i.inspection_date},${i.overall_rating || ''},${i.duration_minutes || ''},${i.created_at}`)
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inspections-${dayjs().format('YYYYMMDD')}.csv`);
    res.send(csv);
  }
});

// 生产环境：提供前端静态文件
const clientBuild = path.join(__dirname, 'client', 'build');
if (fs.existsSync(clientBuild)) {
  console.log('提供静态文件服务:', clientBuild);
  app.use(express.static(clientBuild));
  
  // 所有非API路由都返回index.html（SPA路由）
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientBuild, 'index.html'));
    }
  });
} else {
  console.log('前端构建目录不存在:', clientBuild);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server(LITE) running at http://0.0.0.0:${PORT}`);
  console.log(`Memory stores: ${memory.stores.length}, inspectors: ${memory.inspectors.length}`);
});
