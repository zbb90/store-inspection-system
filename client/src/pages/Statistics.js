import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { statisticsAPI } from '../services/api';

const { RangePicker } = DatePicker;

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalInspections: 0,
    avgDuration: 0,
    ratingDistribution: [],
  });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      const res = await statisticsAPI.getStats(params);
      setStats(res.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [dateRange, loadStatistics]);

  const handleDateChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const COLORS = {
    '优秀': '#52c41a',
    '良好': '#1890ff',
    '合格': '#faad14',
    '需改进': '#ff7a45',
    '不合格': '#f5222d',
  };

  const pieData = stats.ratingDistribution.map(item => ({
    name: item.overall_rating,
    value: item.count,
  }));

  const barData = stats.ratingDistribution.map(item => ({
    rating: item.overall_rating,
    count: item.count,
  }));

  return (
    <Spin spinning={loading}>
      <Card
        title="统计分析"
        extra={
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            allowClear={false}
          />
        }
      >
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card className="stats-card">
              <Statistic
                title="总巡店次数"
                value={stats.totalInspections}
                prefix={<CheckCircleOutlined />}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stats-card">
              <Statistic
                title="平均巡店时长"
                value={stats.avgDuration}
                prefix={<ClockCircleOutlined />}
                suffix="分钟"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stats-card">
              <Statistic
                title="优秀率"
                value={
                  stats.totalInspections > 0
                    ? (
                        ((stats.ratingDistribution.find(r => r.overall_rating === '优秀')?.count || 0) /
                          stats.totalInspections) *
                        100
                      ).toFixed(1)
                    : 0
                }
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stats-card">
              <Statistic
                title="需改进/不合格率"
                value={
                  stats.totalInspections > 0
                    ? (
                        ((stats.ratingDistribution
                          .filter(r => ['需改进', '不合格'].includes(r.overall_rating))
                          .reduce((sum, r) => sum + r.count, 0)) /
                          stats.totalInspections) *
                        100
                      ).toFixed(1)
                    : 0
                }
                suffix="%"
                valueStyle={{ color: '#ff7a45' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="评价分布（饼图）">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="评价分布（柱状图）">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1890ff">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.rating]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* 分析建议 */}
        <Card title="数据分析" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Card type="inner" title="巡店效率">
                <p>平均巡店时长为 <strong>{stats.avgDuration}</strong> 分钟</p>
                <p style={{ marginTop: 8, color: '#666' }}>
                  {stats.avgDuration < 30
                    ? '巡店时间偏短，建议增加巡店深度'
                    : stats.avgDuration > 60
                    ? '巡店时间较长，可优化巡店流程'
                    : '巡店时长适中'}
                </p>
              </Card>
            </Col>
            <Col span={8}>
              <Card type="inner" title="质量分析">
                <p>
                  优秀率：
                  <strong>
                    {stats.totalInspections > 0
                      ? (
                          ((stats.ratingDistribution.find(r => r.overall_rating === '优秀')?.count || 0) /
                            stats.totalInspections) *
                          100
                        ).toFixed(1)
                      : 0}%
                  </strong>
                </p>
                <p style={{ marginTop: 8, color: '#666' }}>
                  {((stats.ratingDistribution.find(r => r.overall_rating === '优秀')?.count || 0) /
                    stats.totalInspections) *
                    100 >
                  50
                    ? '门店整体表现良好'
                    : '需加强门店管理培训'}
                </p>
              </Card>
            </Col>
            <Col span={8}>
              <Card type="inner" title="重点关注">
                <p>
                  需改进/不合格占比：
                  <strong style={{ color: '#ff7a45' }}>
                    {stats.totalInspections > 0
                      ? (
                          ((stats.ratingDistribution
                            .filter(r => ['需改进', '不合格'].includes(r.overall_rating))
                            .reduce((sum, r) => sum + r.count, 0)) /
                            stats.totalInspections) *
                          100
                        ).toFixed(1)
                      : 0}%
                  </strong>
                </p>
                <p style={{ marginTop: 8, color: '#666' }}>
                  {((stats.ratingDistribution
                    .filter(r => ['需改进', '不合格'].includes(r.overall_rating))
                    .reduce((sum, r) => sum + r.count, 0)) /
                    stats.totalInspections) *
                    100 >
                  20
                    ? '问题门店较多，需重点整改'
                    : '整体质量可控'}
                </p>
              </Card>
            </Col>
          </Row>
        </Card>
      </Card>
    </Spin>
  );
};

export default Statistics;
