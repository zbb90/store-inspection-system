import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Card,
  Row,
  Col,
  Radio,
  InputNumber,
  message,
  Space,
  Divider,
  Tag,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { storeAPI, inspectorAPI, inspectionAPI } from '../services/api';
import VideoManager from '../components/VideoManager';

const { Option } = Select;

const InspectionForm = () => {
  const [form] = Form.useForm();
  const [stores, setStores] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);

  // 巡店检查项目配置
  const inspectionCategories = [
    {
      category: '店面形象',
      items: [
        { name: '门头清洁', code: 'facade_clean' },
        { name: '橱窗展示', code: 'window_display' },
        { name: '店内卫生', code: 'store_hygiene' },
        { name: '货架整洁', code: 'shelf_tidy' },
      ],
    },
    {
      category: '人员管理',
      items: [
        { name: '员工仪容', code: 'staff_appearance' },
        { name: '服务态度', code: 'service_attitude' },
        { name: '专业知识', code: 'professional_knowledge' },
        { name: '人员到岗', code: 'staff_attendance' },
      ],
    },
    {
      category: '商品管理',
      items: [
        { name: '商品陈列', code: 'product_display' },
        { name: '价签准确', code: 'price_accuracy' },
        { name: '库存充足', code: 'inventory_adequate' },
        { name: '促销执行', code: 'promotion_execution' },
      ],
    },
    {
      category: '营运规范',
      items: [
        { name: '收银规范', code: 'cashier_standard' },
        { name: '安全管理', code: 'safety_management' },
        { name: '设备运行', code: 'equipment_operation' },
        { name: '证照齐全', code: 'license_complete' },
      ],
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

  const calculateDuration = (arrival, departure) => {
    if (!arrival || !departure) return 0;
    const start = dayjs(arrival, 'HH:mm');
    const end = dayjs(departure, 'HH:mm');
    return end.diff(start, 'minute');
  };

  const onTimeChange = () => {
    const arrival = form.getFieldValue('arrival_time');
    const departure = form.getFieldValue('departure_time');
    if (arrival && departure) {
      const duration = calculateDuration(
        arrival.format('HH:mm'),
        departure.format('HH:mm')
      );
      form.setFieldsValue({ duration_minutes: duration });
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 准备检查项目数据
      const items = [];
      inspectionCategories.forEach(cat => {
        cat.items.forEach(item => {
          const fieldName = `item_${item.code}`;
          if (values[fieldName]) {
            items.push({
              category: cat.category,
              item_name: item.name,
              result: values[fieldName].result,
              score: values[fieldName].score || 0,
              remarks: values[fieldName].remarks || '',
            });
          }
        });
      });

      // 准备提交数据
      const submitData = {
        store_id: values.store_id,
        inspector_id: values.inspector_id,
        inspection_date: values.inspection_date.format('YYYY-MM-DD'),
        inspection_time: values.inspection_time,
        monitor_check_time: values.monitor_check_time,
        arrival_time: values.arrival_time.format('HH:mm'),
        departure_time: values.departure_time.format('HH:mm'),
        duration_minutes: values.duration_minutes,
        overall_rating: values.overall_rating,
        items,
        issues: values.issues || [],
        videos: videos,
      };

      await inspectionAPI.create(submitData);
      message.success('巡店记录保存成功');
      form.resetFields();
    } catch (error) {
      message.error('保存失败：' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="新建巡店记录" extra={dayjs().format('YYYY-MM-DD')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          inspection_date: dayjs(),
          inspection_time: '上午',
          issues: [{ issue_type: '', description: '', severity: 'low' }],
        }}
      >
        {/* 基本信息 */}
        <div className="inspection-form-section">
          <h3>基本信息</h3>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="store_id"
                label="门店"
                rules={[{ required: true, message: '请选择门店' }]}
              >
                <Select placeholder="请选择门店" showSearch optionFilterProp="children">
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>
                      {store.store_code} - {store.store_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="inspector_id"
                label="巡店员"
                rules={[{ required: true, message: '请选择巡店员' }]}
              >
                <Select placeholder="请选择巡店员">
                  {inspectors.map(inspector => (
                    <Option key={inspector.id} value={inspector.id}>
                      {inspector.name} ({inspector.employee_id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="inspection_date"
                label="巡店日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="inspection_time" label="巡店时段">
                <Radio.Group>
                  <Radio value="上午">上午</Radio>
                  <Radio value="下午">下午</Radio>
                  <Radio value="晚班">晚班</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="monitor_check_time"
                label="监控查看时段"
                rules={[{ required: true, message: '请填写监控查看时段' }]}
              >
                <Input placeholder="例如：2024-01-15 09:00-10:30" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="arrival_time"
                label="到店时间"
                rules={[{ required: true, message: '请选择到店时间' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  onChange={onTimeChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="departure_time"
                label="离店时间"
                rules={[{ required: true, message: '请选择离店时间' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  onChange={onTimeChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="duration_minutes" label="巡店时长（分钟）">
                <InputNumber style={{ width: '100%' }} disabled />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* 检查项目 */}
        <div className="inspection-form-section">
          <h3>检查项目</h3>
          {inspectionCategories.map((category, catIndex) => (
            <div key={catIndex} style={{ marginBottom: 24 }}>
              <Divider orientation="left">{category.category}</Divider>
              <Row gutter={16}>
                {category.items.map((item, itemIndex) => (
                  <Col span={12} key={itemIndex} style={{ marginBottom: 16 }}>
                    <Card size="small" title={item.name}>
                      <Form.Item
                        name={[`item_${item.code}`, 'result']}
                        label="检查结果"
                        rules={[{ required: true, message: '请选择检查结果' }]}
                      >
                        <Radio.Group>
                          <Radio value="合格">合格</Radio>
                          <Radio value="基本合格">基本合格</Radio>
                          <Radio value="不合格">不合格</Radio>
                        </Radio.Group>
                      </Form.Item>
                      <Form.Item
                        name={[`item_${item.code}`, 'score']}
                        label="评分（0-10）"
                      >
                        <InputNumber min={0} max={10} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name={[`item_${item.code}`, 'remarks']} label="备注">
                        <Input.TextArea rows={2} placeholder="请输入备注" />
                      </Form.Item>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>

        {/* 问题记录 */}
        <div className="inspection-form-section">
          <h3>问题记录</h3>
          <Form.List name="issues">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'issue_type']}
                        label="问题类型"
                      >
                        <Select placeholder="选择问题类型">
                          <Option value="卫生问题">卫生问题</Option>
                          <Option value="服务问题">服务问题</Option>
                          <Option value="商品问题">商品问题</Option>
                          <Option value="设备问题">设备问题</Option>
                          <Option value="人员问题">人员问题</Option>
                          <Option value="其他">其他</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        label="问题描述"
                      >
                        <Input.TextArea rows={2} placeholder="详细描述问题" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'severity']}
                        label="严重程度"
                      >
                        <Select>
                          <Option value="low">
                            <Tag color="green">轻微</Tag>
                          </Option>
                          <Option value="medium">
                            <Tag color="orange">一般</Tag>
                          </Option>
                          <Option value="high">
                            <Tag color="red">严重</Tag>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ paddingTop: 30 }}>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    添加问题记录
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>

        {/* 视频管理 */}
        <div className="inspection-form-section">
          <h3>视频证据</h3>
          <VideoManager value={videos} onChange={setVideos} />
        </div>

        {/* 总体评价 */}
        <div className="inspection-form-section">
          <h3>总体评价</h3>
          <Form.Item
            name="overall_rating"
            rules={[{ required: true, message: '请选择总体评价' }]}
          >
            <Radio.Group size="large">
              <Radio.Button value="优秀">优秀</Radio.Button>
              <Radio.Button value="良好">良好</Radio.Button>
              <Radio.Button value="合格">合格</Radio.Button>
              <Radio.Button value="需改进">需改进</Radio.Button>
              <Radio.Button value="不合格">不合格</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              提交巡店记录
            </Button>
            <Button size="large" onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InspectionForm;
