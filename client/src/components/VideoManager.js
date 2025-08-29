import React, { useState, useRef } from 'react';
import {
  Card,
  Upload,
  Button,
  Input,
  Space,
  message,
  Modal,
  Form,
  TimePicker,
  DatePicker,
  Row,
  Col,
  Tag,
  List,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
const { TextArea } = Input;

const VideoManager = ({ value = [], onChange }) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [hikvisionModalVisible, setHikvisionModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [form] = Form.useForm();
  const fileInputRef = useRef();

  // 处理视频上传
  const handleUpload = async (file) => {
    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      message.error('只能上传视频文件！');
      return false;
    }
    
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('视频文件大小不能超过100MB！');
      return false;
    }

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        const videoInfo = {
          id: Date.now(),
          name: file.name,
          type: 'upload',
          url: result.file.url,
          size: file.size,
          uploadTime: new Date().toISOString(),
          description: '',
          filename: result.file.filename,
        };

        const newVideos = [...value, videoInfo];
        onChange?.(newVideos);
        message.success('视频上传成功');
      } else {
        message.error('上传失败：' + result.error);
      }
    } catch (error) {
      message.error('上传失败：' + error.message);
    }
    
    return false; // 阻止默认上传行为
  };

  // 添加海康云眸视频
  const handleHikvisionAdd = async (values) => {
    const videoInfo = {
      id: Date.now(),
      name: `海康监控_${values.deviceName}_${values.startTime.format('HH:mm')}`,
      type: 'hikvision',
      deviceId: values.deviceId,
      deviceName: values.deviceName,
      startTime: values.startTime.format('HH:mm:ss'),
      endTime: values.endTime.format('HH:mm:ss'),
      date: values.date.format('YYYY-MM-DD'),
      description: values.description,
      url: `hikvision://${values.deviceId}/${values.date.format('YYYY-MM-DD')}/${values.startTime.format('HH:mm:ss')}`,
    };

    const newVideos = [...value, videoInfo];
    onChange?.(newVideos);
    setHikvisionModalVisible(false);
    form.resetFields();
    message.success('海康监控视频添加成功');
  };

  // 删除视频
  const handleDelete = (videoId) => {
    const newVideos = value.filter(v => v.id !== videoId);
    onChange?.(newVideos);
    message.success('视频删除成功');
  };

  // 播放视频
  const handlePlay = (video) => {
    setCurrentVideo(video);
  };

  // 获取视频类型标签
  const getVideoTypeTag = (type) => {
    const tags = {
      upload: { color: 'blue', text: '上传视频' },
      hikvision: { color: 'green', text: '海康监控' },
    };
    const tag = tags[type] || { color: 'default', text: '未知' };
    return <Tag color={tag.color}>{tag.text}</Tag>;
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <Card
        title="视频管理"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              上传视频
            </Button>
            <Button
              icon={<VideoCameraOutlined />}
              onClick={() => setHikvisionModalVisible(true)}
            >
              添加海康监控
            </Button>
          </Space>
        }
      >
        {value.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无视频，请上传或添加海康监控视频</p>
          </div>
        ) : (
          <List
            dataSource={value}
            renderItem={(video) => (
              <List.Item
                actions={[
                  <Tooltip title="播放视频">
                    <Button
                      type="link"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handlePlay(video)}
                    >
                      播放
                    </Button>
                  </Tooltip>,
                  <Tooltip title="查看详情">
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handlePlay(video)}
                    >
                      详情
                    </Button>
                  </Tooltip>,
                  <Popconfirm
                    title="确定要删除这个视频吗？"
                    onConfirm={() => handleDelete(video.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ width: 80, height: 60, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <VideoCameraOutlined style={{ fontSize: 24, color: '#999' }} />
                    </div>
                  }
                  title={
                    <Space>
                      <span>{video.name}</span>
                      {getVideoTypeTag(video.type)}
                    </Space>
                  }
                  description={
                    <div>
                      <p>{video.description || '暂无描述'}</p>
                      <Space size="small">
                        <span>大小: {video.size ? formatFileSize(video.size) : '未知'}</span>
                        {video.type === 'hikvision' && (
                          <>
                            <span>设备: {video.deviceName}</span>
                            <span>时间: {video.startTime} - {video.endTime}</span>
                          </>
                        )}
                        <span>添加时间: {dayjs(video.uploadTime || video.date).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 上传视频弹窗 */}
      <Modal
        title="上传视频"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Upload.Dragger
          ref={fileInputRef}
          beforeUpload={handleUpload}
          accept="video/*"
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽视频文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 MP4、AVI、MOV 等格式，文件大小不超过100MB
          </p>
        </Upload.Dragger>
      </Modal>

      {/* 海康云眸弹窗 */}
      <Modal
        title="添加海康监控视频"
        open={hikvisionModalVisible}
        onCancel={() => setHikvisionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleHikvisionAdd}
          initialValues={{
            date: dayjs(),
            startTime: dayjs().subtract(1, 'hour'),
            endTime: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deviceId"
                label="设备ID"
                rules={[{ required: true, message: '请输入设备ID' }]}
              >
                <Input placeholder="例如：HK001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deviceName"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="例如：前门监控" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="date"
            label="监控日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="视频描述">
            <TextArea rows={3} placeholder="请输入视频描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setHikvisionModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 视频播放弹窗 */}
      <Modal
        title="视频播放"
        open={!!currentVideo}
        onCancel={() => setCurrentVideo(null)}
        footer={null}
        width={800}
      >
        {currentVideo && (
          <div>
            <video
              controls
              style={{ width: '100%', maxHeight: '400px' }}
              src={currentVideo.url}
            >
              您的浏览器不支持视频播放
            </video>
            <div style={{ marginTop: 16 }}>
              <h4>{currentVideo.name}</h4>
              <p>{currentVideo.description || '暂无描述'}</p>
              {currentVideo.type === 'hikvision' && (
                <div>
                  <p>设备: {currentVideo.deviceName}</p>
                  <p>时间: {currentVideo.startTime} - {currentVideo.endTime}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideoManager;
