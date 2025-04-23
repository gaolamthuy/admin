import React, { useState, useEffect } from 'react';
import { Modal, Form, Switch, Button, Divider, Typography, message } from 'antd';
import { SettingOutlined, PrinterOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
}

export interface Settings {
  autoPrint: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  visible, 
  onClose, 
  settings,
  onSaveSettings
}) => {
  const [form] = Form.useForm();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(settings);
      setLocalSettings(settings);
    }
  }, [visible, settings, form]);

  const handleSave = () => {
    form.validateFields()
      .then(values => {
        onSaveSettings(values);
        message.success('Lưu cài đặt thành công');
        onClose();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title={<><SettingOutlined /> Cài đặt</>}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Lưu
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
      >
        <Divider orientation="left">In hóa đơn</Divider>
        
        <Form.Item
          name="autoPrint"
          valuePropName="checked"
          label={<Text strong>Tự động in hóa đơn sau khi thanh toán</Text>}
        >
          <Switch
            checkedChildren={<PrinterOutlined />}
            unCheckedChildren={<PrinterOutlined />}
          />
        </Form.Item>
        
        <Text type="secondary">
          Khi bật chức năng này, hóa đơn sẽ tự động được in ngay sau khi thanh toán thành công.
        </Text>
      </Form>
    </Modal>
  );
};

export default SettingsModal; 