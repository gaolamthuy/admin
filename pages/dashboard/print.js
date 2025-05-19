import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Typography, Table, Tag, Space, Button } from 'antd';

const { Title, Paragraph } = Typography;

// Sample columns for the table
const columns = [
  {
    title: 'Job ID',
    dataIndex: 'jobId',
    key: 'jobId',
    render: text => <a>{text}</a>,
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Service Type',
    dataIndex: 'serviceType',
    key: 'serviceType',
  },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    render: status => {
      let color = 'geekblue';
      if (status === 'Completed') {
        color = 'green';
      } else if (status === 'Pending') {
        color = 'volcano';
      } else if (status === 'In Progress') {
        color = 'processing';
      }
      return (
        <Tag color={color} key={status}>
          {status.toUpperCase()}
        </Tag>
      );
    },
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a>View Details</a>
        <a>Edit</a>
        <a>Delete</a>
      </Space>
    ),
  },
];

// Sample data for the table
const data = [
  {
    key: '1',
    jobId: 'PJ-001',
    customerName: 'John Brown',
    serviceType: 'Color Printing',
    status: 'Completed',
    createdAt: '2023-10-26 10:00',
  },
  {
    key: '2',
    jobId: 'PJ-002',
    customerName: 'Jim Green',
    serviceType: 'B&W Copies',
    status: 'In Progress',
    createdAt: '2023-10-27 11:30',
  },
  {
    key: '3',
    jobId: 'PJ-003',
    customerName: 'Joe Black',
    serviceType: 'Poster Printing',
    status: 'Pending',
    createdAt: '2023-10-28 09:15',
  },
];

const PrintServicePage = () => {
  return (
    <Space direction="vertical" size="large" style={{width: '100%'}}>
      <Title level={3}>Print Service Management</Title>
      <Paragraph>
        This is the Print Service Page. Manage all print jobs and related tasks here.
      </Paragraph>
      <Button type="primary" style={{ marginBottom: 16 }}>
        Add New Print Job
      </Button>
      <Table columns={columns} dataSource={data} rowKey="key" />
    </Space>
  );
};

PrintServicePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default PrintServicePage; 