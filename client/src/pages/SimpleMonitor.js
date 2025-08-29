import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Upload, Table, Form, Select, Input, DatePicker, message } from 'antd';
import { UploadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const SimpleMonitor = () => {
  const [videos, setVideos] = useState([]);
  const [stores, setStores] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosRes, storesRes, inspectorsRes, inspectionsRes] = await Promise.all([
        fetch('/api/videos'),
        fetch('/api/stores'),
        fetch('/api/inspectors'),
        fetch('/api/inspections')
      ]);
      
      setVideos(await videosRes.json());
      setStores(await storesRes.json());
      setInspectors(await inspectorsRes.json());
      setInspections(await inspectionsRes.json());
    } catch (error) {
      message.error('数据加载失败');
    }
  };

  const handleUpload = async (file) => {
    console.log('开始上传文件:', file.name, file.size);
    
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });
      
      console.log('上传响应状态:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('上传成功:', result);
        message.success('视频上传成功');
        setVideos(prev => [...prev, result.file]);
        setCurrentVideo(result.file);
      } else {
        const errorText = await response.text();
        console.error('上传失败:', errorText);
        message.error(`上传失败: ${response.status}`);
      }
    } catch (error) {
      console.error('上传错误:', error);
      message.error(`上传错误: ${error.message}`);
    }
    
    return false; // 阻止默认上传
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        store_id: values.store_id,
        inspector_id: values.inspector_id,
        inspection_date: values.inspection_date?.format('YYYY-MM-DD'),
        monitor_check_time: values.monitor_check_time,
        overall_rating: values.overall_rating,
        duration_minutes: values.duration_minutes,
        videos: currentVideo ? [currentVideo.id] : []
      };
      
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        message.success('巡检记录提交成功');
        form.resetFields();
        loadData();
      } else {
        message.error('提交失败');
      }
    } catch (error) {
      message.error('提交错误');
    }
  };

  const videoColumns = [
    {
      title: '视频名称',
      dataIndex: 'originalname',
      key: 'name',
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'time',
      render: (time) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<PlayCircleOutlined />}
          size="small"
          onClick={() => setCurrentVideo(record)}
        >
          播放
        </Button>
      ),
    },
  ];

  const inspectionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '门店',
      dataIndex: 'store_id',
      render: (id) => stores.find(s => s.id === id)?.store_name || id,
    },
    {
      title: '巡检员',
      dataIndex: 'inspector_id',
      render: (id) => inspectors.find(i => i.id === id)?.name || id,
    },
    {
      title: '巡检日期',
      dataIndex: 'inspection_date',
    },
    {
      title: '评价',
      dataIndex: 'overall_rating',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={16}>
        {/* 左侧：视频区域 */}
        <Col span={12}>
          <Card title="视频监控" style={{ marginBottom: 16 }}>
            {currentVideo ? (
              <video
                controls
                style={{ width: '100%', maxHeight: '300px' }}
                src={currentVideo.url}
              />
            ) : (
              <div style={{ height: '300px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                请选择视频
              </div>
            )}
          </Card>
          
          <Card title="视频上传">
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
              accept="video/*"
              disabled={false}
            >
              <Button icon={<UploadOutlined />} type="primary">
                上传视频 (最大2GB)
              </Button>
            </Upload>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              支持格式: MP4, AVI, MOV 等视频文件
            </div>
          </Card>

          <Card title="视频列表" style={{ marginTop: 16 }}>
            <Table
              dataSource={videos}
              columns={videoColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 200 }}
            />
          </Card>
        </Col>

        {/* 右侧：巡检记录 */}
        <Col span={12}>
          <Card title="巡检记录">
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item name="store_id" label="门店" rules={[{ required: true }]}>
                <Select placeholder="选择门店">
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>
                      {store.store_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="inspector_id" label="巡检员" rules={[{ required: true }]}>
                <Select placeholder="选择巡检员">
                  {inspectors.map(inspector => (
                    <Option key={inspector.id} value={inspector.id}>
                      {inspector.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="inspection_date" label="巡检日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="monitor_check_time" label="监控时段">
                <Input placeholder="如：09:00-17:00" />
              </Form.Item>

              <Form.Item name="overall_rating" label="总体评价">
                <Select placeholder="选择评价">
                  <Option value="优秀">优秀</Option>
                  <Option value="良好">良好</Option>
                  <Option value="一般">一般</Option>
                  <Option value="较差">较差</Option>
                </Select>
              </Form.Item>

              <Form.Item name="duration_minutes" label="巡检时长(分钟)">
                <Input type="number" placeholder="分钟" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  提交巡检记录
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="历史记录" style={{ marginTop: 16 }}>
            <Table
              dataSource={inspections}
              columns={inspectionColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
              scroll={{ y: 200 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SimpleMonitor;
