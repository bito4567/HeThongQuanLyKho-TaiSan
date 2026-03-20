import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Bell, Monitor, Globe, Shield } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  const settingSections = [
    {
      title: 'Giao diện & Cá nhân hóa',
      description: 'Tùy chỉnh cách hệ thống hiển thị trên thiết bị của bạn.',
      items: [
        { 
          id: 'theme', 
          label: 'Chế độ hiển thị', 
          icon: theme === 'dark' ? Moon : Sun,
          action: (
            <div className={`theme-toggle ${theme}`} onClick={toggleTheme}>
              <div className="toggle-thumb">
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </div>
            </div>
          )
        },
        { id: 'font', label: 'Kích thước chữ', icon: Monitor, action: <span className="action-text">Mặc định</span> },
      ]
    },
    {
      title: 'Thông báo',
      description: 'Cấu hình cách bạn nhận thông tin về kho hàng.',
      items: [
        { id: 'stock_alert', label: 'Cảnh báo tồn kho thấp', icon: Bell, action: <input type="checkbox" defaultChecked /> },
        { id: 'email', label: 'Báo cáo hàng ngày qua Email', icon: Globe, action: <input type="checkbox" /> },
      ]
    },
    {
      title: 'Bảo mật',
      description: 'Quản lý mật khẩu và quyền truy cập.',
      items: [
        { id: 'password', label: 'Thay đổi mật khẩu', icon: Shield, action: <button className="text-btn">Cập nhật</button> },
      ]
    }
  ];

  return (
    <div className="settings-container animate-fade-in">
      <header className="settings-header">
        <h1 className="text-gradient">Cài đặt hệ thống</h1>
        <p className="subtitle">Quản lý tùy chọn cá nhân và cấu hình WMS</p>
      </header>

      <div className="settings-content">
        {settingSections.map((section, idx) => (
          <section key={idx} className="settings-section glass-card">
            <div className="section-info">
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>
            <div className="section-items">
              {section.items.map((item) => (
                <div key={item.id} className="setting-item">
                  <div className="item-label">
                    <item.icon size={20} className="item-icon" />
                    <span>{item.label}</span>
                  </div>
                  <div className="item-action">
                    {item.action}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Settings;
