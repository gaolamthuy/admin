import React, { useState, useEffect } from 'react';
import { Button, Card } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import SettingsModal, { Settings } from '../components/SettingsModal';

// Storage key for settings
const SETTINGS_STORAGE_KEY = 'app_settings';

const SettingsModalExample: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    autoPrint: false
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    // Save settings to localStorage
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    console.log('Settings saved to localStorage:', newSettings);
  };

  return (
    <Card title="Settings Example" style={{ maxWidth: 600, margin: '24px auto' }}>
      <p>Current auto-print setting: <strong>{settings.autoPrint ? 'Enabled' : 'Disabled'}</strong></p>
      
      <Button 
        type="primary" 
        icon={<SettingOutlined />} 
        onClick={showModal}
      >
        Open Settings
      </Button>
      
      <SettingsModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </Card>
  );
};

export default SettingsModalExample; 