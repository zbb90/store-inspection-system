import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Form,
  DatePicker,
  Select,
  Row,
  Col,
  message,
  Divider,
  List,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { storeAPI, inspectorAPI, inspectionAPI } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const InspectionList = () => {
  const [inspections, setInspections] = useState([]);
  const [stores, setStores] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadInitialData();
    loadInspections();
  }, []);

  const loadInitialData = async () => {
    try {
      const [storesRes, inspectorsRes] = await Promise.all([
        storeAPI.getAll(),
        inspectorAPI.getAll(),
      ]);
      setStores(storesRes.data);
      setInspectors(inspectorsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const loadInspections = async (params = {}) => {
    setLoading(true);
    try {
      const res = await inspectionAPI.getList(params);
      setInspections(res.data);
    } catch (error) {
      message.error('加载巡店记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const params = {};
    if (values.dateRange) {
      params.start_date = values.dateRange[0].format('YYYY-MM-DD');
      params.end_date = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.store_id) params.store_id = values.store_id;
    if (values.inspector_id) params.inspector_id = values.inspector_id;
    
    setFilters(params);
    loadInspections(params);
  };

  const handleExport = async () => {
    try {
      const response = await inspectionAPI.export(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `巡店记录_${dayjs().format('YYYYMMDD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const showDetail = async (record) => {
    setLoading(true);
    try {
      const res = await inspectionAPI.getDetail(record.id);
      setCurrentDetail(res.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    const colors = {
      '优秀': 'green',
      '良好': 'blue',
      '合格': 'default',
      '需改进': 'orange',
      '不合格': 'red',
    };
    return colors[rating] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'green',
      'medium': 'orange',
      'high': 'red',
    };
    return colors[severity] || 'default';
  };

  const columns = [
    {
      title: '巡店日期',
      dataIndex: 'inspection_date',
      key: 'inspection_date',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.inspection_date).unix() - dayjs(b.inspection_date).unix(),
    },
    {
      title: '视频证据',
      key: 'videos',
      width: 100,
      render: (_, record) => {
        try {
          const videos = JSON.parse(record.videos || '[]');
          return (
            <Badge count={videos.length} size="small">
              <Tag color={videos.length > 0 ? 'green' : 'default'}>
                {videos.length > 0 ? '有视频' : '无视频'}
              </Tag>
            </Badge>
          );
        } catch (e) {
          return <Tag color="default">无视频</Tag>;
        }
      },
    },
    {
      title: '门店',
      key: 'store',
      render: (record) => (
        <Space direction="vertical" size={0}>
          <span>{record.store_code}</span>
          <span style={{ fontSize: 12, color: '#666' }}>{record.store_name}</span>
        </Space>
      ),
    },
    {
      title: '巡店员',
      key: 'inspector',
      render: (record) => (
        <Space direction="vertical" size={0}>
          <span>{record.inspector_name}</span>
          <span style={{ fontSize: 12, color: '#666' }}>{record.employee_id}</span>
        </Space>
      ),
    },
    {
      title: '巡店时段',
      dataIndex: 'inspection_time',
      key: 'inspection_time',
    },
    {
      title: '巡店时长',
      key: 'duration',
      render: (record) => (
        <Space direction="vertical" size={0}>
          <span>{record.arrival_time} - {record.departure_time}</span>
          <span style={{ fontSize: 12, color: '#666' }}>{record.duration_minutes}分钟</span>
        </Space>
      ),
    },
    {
      title: '总体评价',
      dataIndex: 'overall_rating',
      key: 'overall_rating',
      render: (rating) => (
        <Tag color={getRatingColor(rating)}>{rating}</Tag>
      ),
      filters: [
        { text: '优秀', value: '优秀' },
        { text: '良好', value: '良好' },
        { text: '合格', value: '合格' },
        { text: '需改进', value: '需改进' },
        { text: '不合格', value: '不合格' },
      ],
      onFilter: (value, record) => record.overall_rating === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card title="巡店记录查询" style={{ marginBottom: 16 }}>
        <Form onFinish={handleSearch} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dateRange" label="巡店日期">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="store_id" label="门店">
                <Select placeholder="全部门店" allowClear>
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>
                      {store.store_code} - {store.store_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="inspector_id" label="巡店员">
                <Select placeholder="全部巡店员" allowClear>
                  {inspectors.map(inspector => (
                    <Option key={inspector.id} value={inspector.id}>
                      {inspector.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    查询
                  </Button>
                  <Button onClick={() => loadInspections()}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title={`巡店记录列表（共${inspections.length}条）`}
        extra={
          <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={inspections}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="巡店详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {currentDetail && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="门店">
                {currentDetail.basic.store_code} - {currentDetail.basic.store_name}
              </Descriptions.Item>
              <Descriptions.Item label="巡店员">
                {currentDetail.basic.inspector_name} ({currentDetail.basic.employee_id})
              </Descriptions.Item>
              <Descriptions.Item label="巡店日期">
                {dayjs(currentDetail.basic.inspection_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="巡店时段">
                {currentDetail.basic.inspection_time}
              </Descriptions.Item>
              <Descriptions.Item label="到离店时间">
                {currentDetail.basic.arrival_time} - {currentDetail.basic.departure_time}
                （{currentDetail.basic.duration_minutes}分钟）
              </Descriptions.Item>
              <Descriptions.Item label="监控查看时段">
                {currentDetail.basic.monitor_check_time}
              </Descriptions.Item>
              <Descriptions.Item label="总体评价" span={2}>
                <Tag color={getRatingColor(currentDetail.basic.overall_rating)}>
                  {currentDetail.basic.overall_rating}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>检查项目</Divider>
            <Table
              dataSource={currentDetail.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '类别', dataIndex: 'category', width: 120 },
                { title: '项目', dataIndex: 'item_name', width: 150 },
                {
                  title: '结果',
                  dataIndex: 'result',
                  width: 100,
                  render: (result) => (
                    <Tag color={result === '合格' ? 'green' : result === '基本合格' ? 'orange' : 'red'}>
                      {result}
                    </Tag>
                  ),
                },
                { title: '评分', dataIndex: 'score', width: 80 },
                { title: '备注', dataIndex: 'remarks' },
              ]}
            />

            {currentDetail.issues && currentDetail.issues.length > 0 && (
              <>
                <Divider>问题记录</Divider>
                <List
                  dataSource={currentDetail.issues}
                  renderItem={(issue) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag>{issue.issue_type}</Tag>
                            <Tag color={getSeverityColor(issue.severity)}>
                              {issue.severity === 'low' ? '轻微' : issue.severity === 'medium' ? '一般' : '严重'}
                            </Tag>
                          </Space>
                        }
                        description={issue.description}
                      />
                    </List.Item>
                  )}
                />
              </>
            )}

            {currentDetail.basic.videos && (
              <>
                <Divider>视频证据</Divider>
                <List
                  dataSource={JSON.parse(currentDetail.basic.videos || '[]')}
                  renderItem={(video) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{video.name}</span>
                            <Tag color={video.type === 'hikvision' ? 'green' : 'blue'}>
                              {video.type === 'hikvision' ? '海康监控' : '上传视频'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <p>{video.description || '暂无描述'}</p>
                            {video.type === 'hikvision' && (
                              <p>设备: {video.deviceName} | 时间: {video.startTime} - {video.endTime}</p>
                            )}
                            <Button
                              type="link"
                              size="small"
                              onClick={() => window.open(video.url, '_blank')}
                            >
                              查看视频
                            </Button>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default InspectionList;
