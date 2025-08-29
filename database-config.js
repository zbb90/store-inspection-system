const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库配置
const getDatabase = () => {
  // 如果是Vercel环境，使用内存数据库（临时）
  if (process.env.VERCEL) {
    console.log('使用内存数据库（Vercel环境）');
    return new sqlite3.Database(':memory:');
  }
  
  // 如果是Railway环境，使用内存数据库（临时）
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('使用内存数据库（Railway环境）');
    return new sqlite3.Database(':memory:');
  }
  
  // 本地环境使用文件数据库
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }
  
  const dbPath = path.join(dbDir, 'inspection.db');
  console.log('使用本地数据库:', dbPath);
  return new sqlite3.Database(dbPath);
};

module.exports = { getDatabase };
