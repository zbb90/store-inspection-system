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
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { storeAPI } from '../services/api';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await storeAPI.getAll();
      setStores(res.data);
    } catch (error) {
      message.error('加载门店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStore(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingStore(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await storeAPI.delete(id);
      message.success('删除成功');
      loadStores();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingStore) {
        await storeAPI.update(editingStore.id, values);
        message.success('更新成功');
      } else {
        await storeAPI.create(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      loadStores();
    } catch (error) {
      message.error(editingStore ? '更新失败' : '添加失败');
    }
  };

  const columns = [
    {
      title: '门店编号',
      dataIndex: 'store_code',
      key: 'store_code',
      width: 120,
    },
    {
      title: '门店名称',
      dataIndex: 'store_name',
      key: 'store_name',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'district',
      key: 'district',
      width: 100,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个门店吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="门店管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加门店
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={stores}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingStore ? '编辑门店' : '添加门店'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ city: '', district: '', address: '' }}
        >
          <Form.Item
            name="store_code"
            label="门店编号"
            rules={[
              { required: true, message: '请输入门店编号' },
              { max: 50, message: '门店编号最多50个字符' },
            ]}
          >
            <Input placeholder="例如：SH001" />
          </Form.Item>
          <Form.Item
            name="store_name"
            label="门店名称"
            rules={[
              { required: true, message: '请输入门店名称' },
              { max: 100, message: '门店名称最多100个字符' },
            ]}
          >
            <Input placeholder="例如：上海徐汇店" />
          </Form.Item>
          <Form.Item
            name="city"
            label="城市"
            rules={[{ max: 50, message: '城市名最多50个字符' }]}
          >
            <Input placeholder="例如：上海" />
          </Form.Item>
          <Form.Item
            name="district"
            label="区域"
            rules={[{ max: 50, message: '区域名最多50个字符' }]}
          >
            <Input placeholder="例如：徐汇区" />
          </Form.Item>
          <Form.Item name="address" label="详细地址">
            <Input.TextArea rows={3} placeholder="请输入详细地址" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStore ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StoreManagement;
