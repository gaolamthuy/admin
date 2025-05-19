import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Typography, Card, Row, Col, Statistic, Space } from 'antd';
import { PrinterOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const DashboardPage = () => {
  return (
    <Space direction="vertical" size="large" style={{width: '100%'}}>
      <Title level={2}>Welcome to the Print Service Dashboard</Title>
      <Paragraph>
        This is your central hub for managing print services, customers, and products.
        Navigate using the sidebar menu.
      </Paragraph>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Print Jobs (Sample)"
              value={12}
              prefix={<PrinterOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Registered Customers (Sample)"
              value={125}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Product SKUs (Sample)"
              value={88}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

DashboardPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage; 