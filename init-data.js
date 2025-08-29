const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 读取初始数据
const initialData = require('./stores.json');

// 创建数据库目录
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// 连接数据库
const db = new sqlite3.Database(path.join(dbDir, 'inspection.db'));

console.log('开始初始化数据...');

db.serialize(() => {
  // 插入门店数据
  const storeStmt = db.prepare(
    "INSERT OR IGNORE INTO stores (store_code, store_name, city, district, address) VALUES (?, ?, ?, ?, ?)"
  );
  
  initialData.stores.forEach(store => {
    storeStmt.run(
      store.store_code,
      store.store_name,
      store.city,
      store.district,
      store.address,
      (err) => {
        if (err) {
          console.error('插入门店失败:', err);
        } else {
          console.log(`插入门店: ${store.store_name}`);
        }
      }
    );
  });
  
  storeStmt.finalize();
  
  // 插入巡店员数据
  const inspectorStmt = db.prepare(
    "INSERT OR IGNORE INTO inspectors (employee_id, name, department) VALUES (?, ?, ?)"
  );
  
  initialData.inspectors.forEach(inspector => {
    inspectorStmt.run(
      inspector.employee_id,
      inspector.name,
      inspector.department,
      (err) => {
        if (err) {
          console.error('插入巡店员失败:', err);
        } else {
          console.log(`插入巡店员: ${inspector.name}`);
        }
      }
    );
  });
  
  inspectorStmt.finalize();
  
  console.log('数据初始化完成！');
});

db.close();
