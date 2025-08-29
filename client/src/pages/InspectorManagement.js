import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { inspectorAPI } from '../services/api';

const InspectorManagement = () => {
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadInspectors();
  }, []);

  const loadInspectors = async () => {
    setLoading(true);
    try {
      const res = await inspectorAPI.getAll();
      setInspectors(res.data);
    } catch (error) {
      message.error('加载巡店员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await inspectorAPI.create(values);
      message.success('添加成功');
      setModalVisible(false);
      loadInspectors();
    } catch (error) {
      if (error.response?.data?.error?.includes('UNIQUE')) {
        message.error('工号已存在');
      } else {
        message.error('添加失败');
      }
    }
  };

  const columns = [
    {
      title: '工号',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleDateString(),
    },
  ];

  return (
    <>
      <Card
        title="巡店员管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加巡店员
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={inspectors}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="添加巡店员"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ department: '' }}
        >
          <Form.Item
            name="employee_id"
            label="工号"
            rules={[
              { required: true, message: '请输入工号' },
              { max: 50, message: '工号最多50个字符' },
            ]}
          >
            <Input placeholder="例如：E001" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入姓名' },
              { max: 50, message: '姓名最多50个字符' },
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="department"
            label="部门"
            rules={[{ max: 50, message: '部门名最多50个字符' }]}
          >
            <Input placeholder="例如：运营部" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InspectorManagement;
