const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const dayjs = require('dayjs');
const multer = require('multer');
const { getDatabase } = require('./database-config');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 创建上传目录（仅本地环境）
if (!process.env.VERCEL) {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传视频文件'));
    }
  }
});

// 初始化数据库
const db = getDatabase();

// 创建表
db.serialize(() => {
  // 门店信息表
  db.run(`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_code VARCHAR(50) UNIQUE NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    city VARCHAR(50),
    district VARCHAR(50),
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 巡店员信息表
  db.run(`CREATE TABLE IF NOT EXISTS inspectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 巡店记录表
  db.run(`CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    inspector_id INTEGER NOT NULL,
    inspection_date DATE NOT NULL,
    inspection_time VARCHAR(20),
    monitor_check_time VARCHAR(50),
    arrival_time VARCHAR(10),
    departure_time VARCHAR(10),
    duration_minutes INTEGER,
    overall_rating VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    videos TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
  )`);

  // 巡店检查项目表
  db.run(`CREATE TABLE IF NOT EXISTS inspection_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    category VARCHAR(50),
    item_name VARCHAR(100),
    result VARCHAR(20),
    score INTEGER,
    remarks TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id)
  )`);

  // 问题记录表
  db.run(`CREATE TABLE IF NOT EXISTS inspection_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL,
    issue_type VARCHAR(50),
    description TEXT,
    severity VARCHAR(20),
    image_url TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id)
  )`);
});

// API路由

// 获取所有门店
app.get('/api/stores', (req, res) => {
  db.all("SELECT * FROM stores ORDER BY store_code", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 添加门店
app.post('/api/stores', (req, res) => {
  const { store_code, store_name, city, district, address } = req.body;
  db.run(
    "INSERT INTO stores (store_code, store_name, city, district, address) VALUES (?, ?, ?, ?, ?)",
    [store_code, store_name, city, district, address],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// 获取所有巡店员
app.get('/api/inspectors', (req, res) => {
  db.all("SELECT * FROM inspectors ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 添加巡店员
app.post('/api/inspectors', (req, res) => {
  const { employee_id, name, department } = req.body;
  db.run(
    "INSERT INTO inspectors (employee_id, name, department) VALUES (?, ?, ?)",
    [employee_id, name, department],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

// 创建巡店记录
app.post('/api/inspections', (req, res) => {
  const {
    store_id,
    inspector_id,
    inspection_date,
    inspection_time,
    monitor_check_time,
    arrival_time,
    departure_time,
    duration_minutes,
    overall_rating,
    items,
    issues,
    videos
  } = req.body;

  db.run(
    `INSERT INTO inspections 
    (store_id, inspector_id, inspection_date, inspection_time, monitor_check_time, 
     arrival_time, departure_time, duration_minutes, overall_rating, status, videos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [store_id, inspector_id, inspection_date, inspection_time, monitor_check_time,
     arrival_time, departure_time, duration_minutes, overall_rating, 'completed', JSON.stringify(videos || [])],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const inspectionId = this.lastID;
      
      // 插入检查项目
      if (items && items.length > 0) {
        items.forEach(item => {
          db.run(
            "INSERT INTO inspection_items (inspection_id, category, item_name, result, score, remarks) VALUES (?, ?, ?, ?, ?, ?)",
            [inspectionId, item.category, item.item_name, item.result, item.score, item.remarks]
          );
        });
      }
      
      // 插入问题记录
      if (issues && issues.length > 0) {
        issues.forEach(issue => {
          db.run(
            "INSERT INTO inspection_issues (inspection_id, issue_type, description, severity) VALUES (?, ?, ?, ?)",
            [inspectionId, issue.issue_type, issue.description, issue.severity]
          );
        });
      }
      
      res.json({ id: inspectionId, message: '巡店记录创建成功' });
    }
  );
});

// 获取巡店记录列表
app.get('/api/inspections', (req, res) => {
  const { start_date, end_date, store_id, inspector_id } = req.query;
  
  let query = `
    SELECT 
      i.*,
      s.store_code,
      s.store_name,
      s.city,
      ins.name as inspector_name,
      ins.employee_id
    FROM inspections i
    JOIN stores s ON i.store_id = s.id
    JOIN inspectors ins ON i.inspector_id = ins.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (start_date) {
    query += " AND i.inspection_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND i.inspection_date <= ?";
    params.push(end_date);
  }
  if (store_id) {
    query += " AND i.store_id = ?";
    params.push(store_id);
  }
  if (inspector_id) {
    query += " AND i.inspector_id = ?";
    params.push(inspector_id);
  }
  
  query += " ORDER BY i.inspection_date DESC, i.created_at DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 获取巡店详情
app.get('/api/inspections/:id', (req, res) => {
  const inspectionId = req.params.id;
  
  const inspection = {};
  
  // 获取基本信息
  db.get(
    `SELECT 
      i.*,
      s.store_code,
      s.store_name,
      s.city,
      s.district,
      ins.name as inspector_name,
      ins.employee_id
    FROM inspections i
    JOIN stores s ON i.store_id = s.id
    JOIN inspectors ins ON i.inspector_id = ins.id
    WHERE i.id = ?`,
    [inspectionId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '记录不存在' });
      
      inspection.basic = row;
      
      // 获取检查项目
      db.all(
        "SELECT * FROM inspection_items WHERE inspection_id = ?",
        [inspectionId],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          inspection.items = items;
          
          // 获取问题记录
          db.all(
            "SELECT * FROM inspection_issues WHERE inspection_id = ?",
            [inspectionId],
            (err, issues) => {
              if (err) return res.status(500).json({ error: err.message });
              inspection.issues = issues;
              res.json(inspection);
            }
          );
        }
      );
    }
  );
});

// 导出Excel报表
app.get('/api/export/inspections', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      i.inspection_date as '巡店日期',
      s.store_code as '门店编号',
      s.store_name as '门店名称',
      s.city as '城市',
      ins.employee_id as '巡店员工号',
      ins.name as '巡店员姓名',
      i.arrival_time as '到店时间',
      i.departure_time as '离店时间',
      i.duration_minutes as '巡店时长(分钟)',
      i.overall_rating as '总体评价',
      i.monitor_check_time as '监控查看时段'
    FROM inspections i
    JOIN stores s ON i.store_id = s.id
    JOIN inspectors ins ON i.inspector_id = ins.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (start_date) {
    query += " AND i.inspection_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND i.inspection_date <= ?";
    params.push(end_date);
  }
  
  query += " ORDER BY i.inspection_date DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // 创建工作簿
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, '巡店记录');
    
    // 生成文件名
    const filename = `巡店记录_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    const filepath = path.join(__dirname, 'exports', filename);
    
    // 确保导出目录存在
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    // 写入文件
    xlsx.writeFile(wb, filepath);
    
    // 发送文件
    res.download(filepath, filename, (err) => {
      if (err) console.error('下载错误:', err);
      // 下载完成后删除临时文件
      fs.unlinkSync(filepath);
    });
  });
});

// 获取统计数据
app.get('/api/statistics', (req, res) => {
  const { start_date, end_date } = req.query;
  const stats = {};
  
  let dateFilter = "";
  const params = [];
  
  if (start_date) {
    dateFilter += " AND inspection_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += " AND inspection_date <= ?";
    params.push(end_date);
  }
  
  // 总巡店次数
  db.get(
    `SELECT COUNT(*) as total FROM inspections WHERE 1=1 ${dateFilter}`,
    params,
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalInspections = row.total;
      
      // 按评价统计
      db.all(
        `SELECT overall_rating, COUNT(*) as count 
         FROM inspections 
         WHERE 1=1 ${dateFilter}
         GROUP BY overall_rating`,
        params,
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.ratingDistribution = rows;
          
          // 平均巡店时长
          db.get(
            `SELECT AVG(duration_minutes) as avg_duration 
             FROM inspections 
             WHERE duration_minutes > 0 ${dateFilter}`,
            params,
            (err, row) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.avgDuration = Math.round(row.avg_duration || 0);
              
              res.json(stats);
            }
          );
        }
      );
    }
  );
});

// 文件上传API
app.post('/api/upload/video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  
  const fileInfo = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    path: req.file.path,
    url: `/uploads/${req.file.filename}`
  };
  
  res.json({
    success: true,
    file: fileInfo
  });
});

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '巡店监控审核系统运行正常',
    timestamp: new Date().toISOString()
  });
});

// 静态文件服务
app.use('/uploads', express.static(uploadDir));

// 生产环境下提供静态文件
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`环境变量: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, RAILWAY_ENVIRONMENT=${process.env.RAILWAY_ENVIRONMENT}`);
  console.log(`健康检查端点: http://localhost:${PORT}/`);
});
