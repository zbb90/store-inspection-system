import React, { useState, useRef } from 'react';
import {
  Layout,
  Card,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Tag,
  Tabs,
  Upload,
  Select,
  TimePicker,
  DatePicker,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  CameraOutlined,
  VideoCameraOutlined,
  UploadOutlined,
  LoginOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;
const { TabPane } = Tabs;
const { TextArea } = Input;

const VideoMonitorLayout = () => {
  const [hikvisionModalVisible, setHikvisionModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hikvisionConfig, setHikvisionConfig] = useState({
    serverUrl: '',
    username: '',
    password: '',
    deviceId: '',
  });
  const [isHikvisionLoggedIn, setIsHikvisionLoggedIn] = useState(false);
  const [hikvisionDevices, setHikvisionDevices] = useState([]);
  const [form] = Form.useForm();
  const videoRef = useRef(null);

  // 海康云眸登录
  const handleHikvisionLogin = async (values) => {
    try {
      // 这里应该调用海康云眸API进行登录
      // 暂时模拟登录成功
      setHikvisionConfig(values);
      setIsHikvisionLoggedIn(true);
      setHikvisionModalVisible(false);
      
      // 模拟获取设备列表
      const mockDevices = [
        { id: '120514699_1', name: '前门监控', status: 'online' },
        { id: '576001_back', name: '后厨监控', status: 'online' },
        { id: '576001_bar', name: '吧台监控', status: 'online' },
        { id: '576001_mix', name: '调饮区域', status: 'online' },
      ];
      setHikvisionDevices(mockDevices);
      
      message.success('海康云眸登录成功，已获取设备列表');
    } catch (error) {
      message.error('登录失败：' + error.message);
    }
  };

  // 处理视频上传
  const handleUpload = async (file) => {
    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      message.error('只能上传视频文件！');
      return false;
    }
    
    const isLt2G = file.size / 1024 / 1024 / 1024 < 2;
    if (!isLt2G) {
      message.error('视频文件大小不能超过2GB！');
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

        setVideos([...videos, videoInfo]);
        message.success('视频上传成功');
      } else {
        message.error('上传失败：' + result.error);
      }
    } catch (error) {
      message.error('上传失败：' + error.message);
    }
    
    return false;
  };

  // 添加海康监控视频
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

    setVideos([...videos, videoInfo]);
    setCurrentVideo(videoInfo);
    form.resetFields();
    message.success('海康监控视频添加成功');
  };

  // 播放/暂停视频
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 全屏播放
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
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
    <Layout style={{ height: '100vh' }}>
      {/* 左侧视频监控区域 */}
      <Content style={{ padding: '16px', background: '#1a1a1a' }}>
        <Card
          title={
            <Space>
              <span style={{ color: '#fff' }}>视频监控</span>
              <Tag color="blue">576001 | 温岭大溪一店 | 新台州仓库</Tag>
            </Space>
          }
          style={{ height: '100%', background: '#1a1a1a', border: '1px solid #333' }}
          bodyStyle={{ padding: '8px', height: 'calc(100% - 60px)' }}
          extra={
            <Space>
              {isHikvisionLoggedIn ? (
                <Tag color="green">已登录: {hikvisionConfig.deviceId}</Tag>
              ) : (
                <Button
                  type="primary"
                  icon={<LoginOutlined />}
                  onClick={() => setHikvisionModalVisible(true)}
                  size="small"
                >
                  海康登录
                </Button>
              )}
              <Button
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
                size="small"
              >
                上传视频
              </Button>
            </Space>
          }
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 视频播放区域 */}
            <div style={{ flex: 1, background: '#000', borderRadius: '8px', marginBottom: '16px', position: 'relative' }}>
              {currentVideo ? (
                <>
                  <video
                    ref={videoRef}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    src={currentVideo.url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    您的浏览器不支持视频播放
                  </video>
                  {/* 视频控制按钮 */}
                  <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)' }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={togglePlay}
                        size="small"
                      >
                        {isPlaying ? '暂停' : '播放'}
                      </Button>
                      <Button
                        icon={<FullscreenOutlined />}
                        onClick={toggleFullscreen}
                        size="small"
                      >
                        全屏
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                      >
                        下载
                      </Button>
                      <Button
                        icon={<CameraOutlined />}
                        size="small"
                      >
                        截图
                      </Button>
                    </Space>
                  </div>
                </>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#666',
                  flexDirection: 'column'
                }}>
                  <VideoCameraOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                  <p>请选择或上传视频文件</p>
                </div>
              )}
            </div>

                         {/* 视频列表 */}
             <div style={{ height: '120px', overflow: 'auto' }}>
               <Tabs defaultActiveKey="1" size="small">
                 <TabPane tab={`视频列表 (${videos.length})`} key="1">
                   <div style={{ display: 'flex', gap: '8px', overflow: 'auto' }}>
                     {videos.map((video) => (
                       <Card
                         key={video.id}
                         size="small"
                         style={{ 
                           width: '200px', 
                           cursor: 'pointer',
                           border: currentVideo?.id === video.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                         }}
                         onClick={() => setCurrentVideo(video)}
                       >
                         <div style={{ height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <VideoCameraOutlined style={{ fontSize: 24, color: '#999' }} />
                         </div>
                         <div style={{ marginTop: '8px' }}>
                           <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{video.name}</div>
                           <div style={{ fontSize: '10px', color: '#666' }}>
                             {video.type === 'hikvision' ? '海康监控' : '上传视频'}
                           </div>
                           <div style={{ fontSize: '10px', color: '#666' }}>
                             {formatFileSize(video.size)}
                           </div>
                         </div>
                       </Card>
                     ))}
                   </div>
                 </TabPane>
                 {isHikvisionLoggedIn && (
                   <TabPane tab={`海康设备 (${hikvisionDevices.length})`} key="2">
                     <div style={{ display: 'flex', gap: '8px', overflow: 'auto' }}>
                       {hikvisionDevices.map((device) => (
                         <Card
                           key={device.id}
                           size="small"
                           style={{ 
                             width: '200px', 
                             cursor: 'pointer',
                             border: '1px solid #d9d9d9'
                           }}
                           onClick={() => {
                             // 模拟添加海康监控视频
                             const videoInfo = {
                               id: Date.now(),
                               name: `海康监控_${device.name}`,
                               type: 'hikvision',
                               deviceId: device.id,
                               deviceName: device.name,
                               startTime: '09:00:00',
                               endTime: '10:00:00',
                               date: new Date().toISOString().split('T')[0],
                               description: `${device.name}监控视频`,
                               url: `hikvision://${device.id}/${new Date().toISOString().split('T')[0]}/09:00:00`,
                             };
                             setVideos([...videos, videoInfo]);
                             setCurrentVideo(videoInfo);
                             message.success(`已添加${device.name}监控视频`);
                           }}
                         >
                           <div style={{ height: '60px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <VideoCameraOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                           </div>
                           <div style={{ marginTop: '8px' }}>
                             <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{device.name}</div>
                             <div style={{ fontSize: '10px', color: '#52c41a' }}>
                               <span style={{ color: '#52c41a' }}>●</span> 在线
                             </div>
                             <div style={{ fontSize: '10px', color: '#666' }}>
                               点击添加监控
                             </div>
                           </div>
                         </Card>
                       ))}
                     </div>
                   </TabPane>
                 )}
               </Tabs>
             </div>
          </div>
        </Card>
      </Content>

      {/* 右侧记录区域 */}
      <Sider width={400} style={{ background: '#fff', padding: '16px' }}>
        <Card title="巡店记录" style={{ height: '100%' }}>
          <Form layout="vertical">
            <Form.Item label="门店信息">
              <Input placeholder="选择门店" />
            </Form.Item>
            <Form.Item label="巡店员">
              <Input placeholder="选择巡店员" />
            </Form.Item>
            <Form.Item label="巡店日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="监控时段">
              <Space>
                <TimePicker placeholder="开始时间" />
                <span>-</span>
                <TimePicker placeholder="结束时间" />
              </Space>
            </Form.Item>
            <Form.Item label="检查项目">
              <TextArea rows={4} placeholder="记录检查发现的问题..." />
            </Form.Item>
            <Form.Item label="总体评价">
              <Select placeholder="选择评价">
                <Select.Option value="优秀">优秀</Select.Option>
                <Select.Option value="良好">良好</Select.Option>
                <Select.Option value="合格">合格</Select.Option>
                <Select.Option value="需改进">需改进</Select.Option>
                <Select.Option value="不合格">不合格</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" block>
                保存记录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Sider>

      {/* 海康云眸登录弹窗 */}
      <Modal
        title="海康云眸登录"
        open={hikvisionModalVisible}
        onCancel={() => setHikvisionModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleHikvisionLogin}
          initialValues={hikvisionConfig}
        >
          <Form.Item
            name="serverUrl"
            label="服务器地址"
            rules={[{ required: true, message: '请输入服务器地址' }]}
          >
            <Input placeholder="例如：https://hikvision.example.com" />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="deviceId"
            label="设备ID"
            rules={[{ required: true, message: '请输入设备ID' }]}
          >
            <Input placeholder="例如：576001" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                登录
              </Button>
              <Button onClick={() => setHikvisionModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传视频弹窗 */}
      <Modal
        title="上传视频"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Upload.Dragger
          beforeUpload={handleUpload}
          accept="video/*"
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽视频文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 MP4、AVI、MOV 等格式，文件大小不超过2GB
          </p>
        </Upload.Dragger>
      </Modal>
    </Layout>
  );
};

export default VideoMonitorLayout;
