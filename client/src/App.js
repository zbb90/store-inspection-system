import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  FormOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  TeamOutlined,
  ShopOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

// 导入页面组件
import InspectionForm from './pages/InspectionForm';
import InspectionList from './pages/InspectionList';
import Statistics from './pages/Statistics';
import StoreManagement from './pages/StoreManagement';
import InspectorManagement from './pages/InspectorManagement';
import VideoMonitorLayout from './components/VideoMonitorLayout';

const { Header, Content, Sider } = Layout;

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <FormOutlined />,
      label: <Link to="/">新建巡店记录</Link>,
    },
    {
      key: '/monitor',
      icon: <VideoCameraOutlined />,
      label: <Link to="/monitor">视频监控审核</Link>,
    },
    {
      key: '/list',
      icon: <UnorderedListOutlined />,
      label: <Link to="/list">巡店记录列表</Link>,
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">统计分析</Link>,
    },
    {
      key: '/stores',
      icon: <ShopOutlined />,
      label: <Link to="/stores">门店管理</Link>,
    },
    {
      key: '/inspectors',
      icon: <TeamOutlined />,
      label: <Link to="/inspectors">巡店员管理</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">巡店审核系统</div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }} />
        <Content style={{ margin: '16px' }}>
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<InspectionForm />} />
              <Route path="/monitor" element={<VideoMonitorLayout />} />
              <Route path="/list" element={<InspectionList />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/stores" element={<StoreManagement />} />
              <Route path="/inspectors" element={<InspectorManagement />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
