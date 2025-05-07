import React, { useState } from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import "./App.css";

// Pages
import Login from "./pages/Login";
import MainPOS from "./pages/MainPOS";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLogin = (password: string): boolean => {
    // Simple authentication for now
    if (password === "admin123") {
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
          colorPrimary: "#1890ff",
        },
      }}
    >
      <AntdApp>
      <div className="app-container">
        <MainPOS />
      </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
