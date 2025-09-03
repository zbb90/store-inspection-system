#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
门店筛选系统 - 简化本地版本
不需要复杂依赖，可以直接运行
"""

import os
import tempfile
import zipfile
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
import re
from datetime import date

app = Flask(__name__)
app.secret_key = 'simple_store_filter_2025'

# 配置
UPLOAD_FOLDER = 'temp_uploads'
RESULTS_FOLDER = 'temp_results'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class SimpleStoreFilter:
    """简化的门店筛选系统"""
    
    def __init__(self, upload_folder):
        self.upload_folder = upload_folder
        self.results = {}
    
    def process_files(self):
        """处理上传的文件"""
        try:
            # 查找食安门店文件
            food_safety_count = self.process_food_safety()
            new_store_count = self.process_new_stores() 
            cd_count = self.process_cd_stores()
            ab_count = self.process_ab_stores()
            
            self.results = {
                '食安门店': food_safety_count,
                '新开店': new_store_count, 
                'CD级门店': cd_count,
                'AB级门店': ab_count,
                '总计': food_safety_count + new_store_count + cd_count + ab_count
            }
            
            return True
        except Exception as e:
            print(f"处理失败: {e}")
            return False
    
    def process_food_safety(self):
        """处理食安门店"""
        food_safety_file = None
        for filename in os.listdir(self.upload_folder):
            if '食安' in filename and filename.endswith(('.xlsx', '.xls')):
                food_safety_file = os.path.join(self.upload_folder, filename)
                break
        
        if not food_safety_file:
            return 0
            
        try:
            xl = pd.ExcelFile(food_safety_file)
            sheet_names = xl.sheet_names
            
            # 尝试找到Sheet5或第一个sheet
            sheet_to_read = 'Sheet5' if 'Sheet5' in sheet_names else sheet_names[0]
            df = xl.parse(sheet_to_read, dtype=str)
            
            # 查找门店编码列
            store_codes = set()
            for col in df.columns:
                col_data = df[col].astype(str).str.strip()
                for value in col_data:
                    if re.match(r'^\d{4,9}$', value):
                        store_codes.add(value)
            
            # 保存结果
            result_file = os.path.join(RESULTS_FOLDER, '食安门店列表.txt')
            with open(result_file, 'w', encoding='utf-8') as f:
                for code in sorted(store_codes):
                    f.write(f"{code}\n")
            
            return len(store_codes)
        except Exception as e:
            print(f"食安门店处理失败: {e}")
            return 0
    
    def process_new_stores(self):
        """处理新开店"""
        store_file = None
        for filename in os.listdir(self.upload_folder):
            if '门店' in filename and '全量' in filename and filename.endswith(('.xlsx', '.xls')):
                store_file = os.path.join(self.upload_folder, filename)
                break
        
        if not store_file:
            return 0
            
        try:
            df = pd.read_excel(store_file, dtype={'门店编码': str})
            
            # 查找开业日期相关列
            date_cols = [col for col in df.columns if '开业' in str(col) or '日期' in str(col)]
            if not date_cols:
                return 0
            
            # 筛选7、8月开业的门店
            new_stores = []
            for _, row in df.iterrows():
                for date_col in date_cols:
                    date_val = row.get(date_col)
                    if pd.notna(date_val):
                        try:
                            date_dt = pd.to_datetime(date_val, errors='coerce')
                            if pd.notna(date_dt) and date_dt.year == 2025 and date_dt.month in [7, 8]:
                                new_stores.append(row.get('门店编码', ''))
                                break
                        except:
                            continue
            
            # 保存结果
            new_stores = [code for code in new_stores if code and str(code) != 'nan']
            result_file = os.path.join(RESULTS_FOLDER, '新开店列表.txt')
            with open(result_file, 'w', encoding='utf-8') as f:
                for code in new_stores:
                    f.write(f"{code}\n")
            
            return len(new_stores)
        except Exception as e:
            print(f"新开店处理失败: {e}")
            return 0
    
    def process_cd_stores(self):
        """处理CD级门店"""
        grade_file = None
        for filename in os.listdir(self.upload_folder):
            if '等级' in filename and filename.endswith(('.xlsx', '.xls')):
                grade_file = os.path.join(self.upload_folder, filename)
                break
        
        if not grade_file:
            return 0
            
        try:
            df = pd.read_excel(grade_file, dtype={'门店编码': str})
            
            # 查找相关列
            grade_col = None
            for col in df.columns:
                if '等级' in str(col) or '评分' in str(col):
                    grade_col = col
                    break
            
            if not grade_col:
                return 0
            
            # 筛选CD级门店
            cd_stores = []
            for _, row in df.iterrows():
                grade = str(row.get(grade_col, '')).upper()
                if grade in ['C', 'D']:
                    store_code = row.get('门店编码', '')
                    if store_code and str(store_code) != 'nan':
                        cd_stores.append(store_code)
            
            # 保存结果
            result_file = os.path.join(RESULTS_FOLDER, 'CD级门店列表.txt')
            with open(result_file, 'w', encoding='utf-8') as f:
                for code in cd_stores:
                    f.write(f"{code}\n")
            
            return len(cd_stores)
        except Exception as e:
            print(f"CD级门店处理失败: {e}")
            return 0
    
    def process_ab_stores(self):
        """处理AB级门店"""
        grade_file = None
        for filename in os.listdir(self.upload_folder):
            if '等级' in filename and filename.endswith(('.xlsx', '.xls')):
                grade_file = os.path.join(self.upload_folder, filename)
                break
        
        if not grade_file:
            return 0
            
        try:
            df = pd.read_excel(grade_file, dtype={'门店编码': str})
            
            # 查找相关列
            grade_col = None
            for col in df.columns:
                if '等级' in str(col) or '评分' in str(col):
                    grade_col = col
                    break
            
            if not grade_col:
                return 0
            
            # 筛选AB级门店
            ab_stores = []
            for _, row in df.iterrows():
                grade = str(row.get(grade_col, '')).upper()
                if grade in ['A', 'B']:
                    store_code = row.get('门店编码', '')
                    if store_code and str(store_code) != 'nan':
                        ab_stores.append(store_code)
            
            # 保存结果
            result_file = os.path.join(RESULTS_FOLDER, 'AB级门店列表.txt')
            with open(result_file, 'w', encoding='utf-8') as f:
                for code in ab_stores:
                    f.write(f"{code}\n")
            
            return len(ab_stores)
        except Exception as e:
            print(f"AB级门店处理失败: {e}")
            return 0

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>门店筛选系统 - 简化版</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .upload-form { border: 2px dashed #ccc; padding: 30px; text-align: center; border-radius: 10px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            .btn:hover { background: #0056b3; }
            .file-input { margin: 20px 0; }
            .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
            .feature { padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
            .feature h3 { margin: 0 0 10px 0; color: #007bff; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏪 门店筛选系统</h1>
            <p>智能门店池自动筛选 - 本地简化版</p>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🛡️ 食安门店</h3>
                <p>筛选食安问题门店</p>
            </div>
            <div class="feature">
                <h3>🆕 新开店</h3>
                <p>7-8月新开业门店</p>
            </div>
            <div class="feature">
                <h3>📊 CD级门店</h3>
                <p>CD级别门店筛选</p>
            </div>
            <div class="feature">
                <h3>⭐ AB级门店</h3>
                <p>AB级别门店筛选</p>
            </div>
        </div>
        
        <form class="upload-form" method="post" action="/upload" enctype="multipart/form-data">
            <h2>📁 上传Excel数据文件</h2>
            <div class="file-input">
                <input type="file" name="files" multiple accept=".xlsx,.xls" required>
            </div>
            <p><small>支持上传多个Excel文件，包括门店信息、食安数据、等级明细等</small></p>
            <button type="submit" class="btn">🚀 开始筛选</button>
        </form>
    </body>
    </html>
    '''

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        flash('没有选择文件')
        return redirect(url_for('index'))
    
    files = request.files.getlist('files')
    
    if not files or all(file.filename == '' for file in files):
        flash('没有选择文件')
        return redirect(url_for('index'))
    
    # 清理之前的上传文件
    for filename in os.listdir(UPLOAD_FOLDER):
        os.remove(os.path.join(UPLOAD_FOLDER, filename))
    
    # 保存上传的文件
    uploaded_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            uploaded_files.append(filename)
    
    if not uploaded_files:
        flash('没有有效的Excel文件')
        return redirect(url_for('index'))
    
    # 处理文件
    filter_system = SimpleStoreFilter(UPLOAD_FOLDER)
    success = filter_system.process_files()
    
    if success:
        return redirect(url_for('results'))
    else:
        flash('文件处理失败，请检查文件格式')
        return redirect(url_for('index'))

@app.route('/results')
def results():
    # 读取处理结果
    results = {}
    result_files = {
        '食安门店': '食安门店列表.txt',
        '新开店': '新开店列表.txt', 
        'CD级门店': 'CD级门店列表.txt',
        'AB级门店': 'AB级门店列表.txt'
    }
    
    total = 0
    for category, filename in result_files.items():
        file_path = os.path.join(RESULTS_FOLDER, filename)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                count = len([line.strip() for line in f if line.strip()])
                results[category] = count
                total += count
        else:
            results[category] = 0
    
    results['总计'] = total
    
    return f'''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>筛选结果 - 门店筛选系统</title>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }}
            .header {{ text-align: center; color: #333; margin-bottom: 30px; }}
            .results {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
            .result-card {{ padding: 20px; border: 2px solid #007bff; border-radius: 10px; text-align: center; }}
            .result-card h3 {{ margin: 0 0 10px 0; color: #007bff; }}
            .result-card .count {{ font-size: 2em; font-weight: bold; color: #333; }}
            .total {{ background: #007bff; color: white; }}
            .btn {{ background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px; text-decoration: none; display: inline-block; }}
            .btn:hover {{ background: #218838; }}
            .btn-secondary {{ background: #6c757d; }}
            .btn-secondary:hover {{ background: #5a6268; }}
            .actions {{ text-align: center; margin: 30px 0; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 筛选完成！</h1>
            <p>处理时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="results">
            <div class="result-card">
                <h3>🛡️ 食安门店</h3>
                <div class="count">{results['食安门店']}</div>
                <p>家门店</p>
            </div>
            <div class="result-card">
                <h3>🆕 新开店</h3>
                <div class="count">{results['新开店']}</div>
                <p>家门店</p>
            </div>
            <div class="result-card">
                <h3>📊 CD级门店</h3>
                <div class="count">{results['CD级门店']}</div>
                <p>家门店</p>
            </div>
            <div class="result-card">
                <h3>⭐ AB级门店</h3>
                <div class="count">{results['AB级门店']}</div>
                <p>家门店</p>
            </div>
            <div class="result-card total">
                <h3>📊 总计</h3>
                <div class="count">{results['总计']}</div>
                <p>家门店</p>
            </div>
        </div>
        
        <div class="actions">
            <a href="/download" class="btn">📥 下载结果文件</a>
            <a href="/" class="btn btn-secondary">🔄 重新筛选</a>
        </div>
    </body>
    </html>
    '''

@app.route('/download')
def download():
    # 创建ZIP文件
    zip_path = os.path.join(RESULTS_FOLDER, '门店筛选结果.zip')
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for filename in os.listdir(RESULTS_FOLDER):
            if filename.endswith('.txt'):
                file_path = os.path.join(RESULTS_FOLDER, filename)
                zipf.write(file_path, filename)
    
    return send_file(zip_path, as_attachment=True, download_name=f'门店筛选结果_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip')

if __name__ == '__main__':
    print("🚀 启动门店筛选系统简化版...")
    print("📱 访问地址: http://localhost:5000")
    print("🛑 按 Ctrl+C 停止服务")
    app.run(debug=True, host='0.0.0.0', port=5000)
