import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import './App.css';

// Pages
import Login from './pages/Login';
import MainPOS from './pages/MainPOS';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLogin = (password: string): boolean => {
    // Simple authentication for now
    if (password === 'admin123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="app-container">
        <MainPOS />
      </div>
    </ConfigProvider>
  );
};

export default App; 