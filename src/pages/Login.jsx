import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    login(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <LogIn size={40} color="var(--primary)" />
          </div>
          <h1 className="text-gradient">Đăng nhập WMS</h1>
          <p className="subtitle">Hệ thống quản lý kho doanh nghiệp</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <User size={18} />
              <input 
                type="email" 
                placeholder="admin@wms.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <p className="hint">Thử: admin@wms.com, manager@wms.com, staff@wms.com</p>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn">
            <span>Truy cập hệ thống</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <p>Chưa có tài khoản? <a href="#">Liên hệ Admin</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
