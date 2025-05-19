import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../components/AuthProvider';
// useRouter is not directly needed here anymore for redirection if auth.login handles it
// import { useRouter } from 'next/router'; 

const { Title } = Typography;

const LoginPage = () => {
  const auth = useAuth(); // auth context is now reliably available because AuthProvider wraps LoginPage
  // const router = useRouter(); // Not needed if auth.login handles redirection
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await auth.login(values.username, values.password);
    } catch (error) {
      message.error('Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
        <Space direction="vertical" size="large" style={{width: '100%', alignItems: 'center'}}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Đăng nhập</Title>
            {error && <Alert message={error} type="error" showIcon style={{marginBottom: '24px'}}/>}
            <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            style={{width: '100%'}}
            >
            <Form.Item
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập username!' }]}
            >
                <Input 
                prefix={<UserOutlined />} 
                placeholder="username"
                size="large"
                />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
                <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu"
                size="large"
                />
            </Form.Item>
            <Form.Item>
                <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ width: '100%' }}
                size="large"
                >
                Đăng nhập
                </Button>
            </Form.Item>
            </Form>
        </Space>
      </Card>
    </div>
  );
};

// LoginPage should not use the default AuthProvider layout which would redirect it
LoginPage.getLayout = function getLayout(page) {
  return page; // Render the page as-is, without AuthProvider wrapper
};

export default LoginPage; 