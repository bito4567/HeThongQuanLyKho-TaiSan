import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight,
  Package, BarChart3, ShieldCheck, Boxes
} from 'lucide-react';
import './Login.css';

const FeatureItem = ({ icon: Icon, title, desc }) => (
  <div className="lp-feature">
    <div className="lp-feature-icon">
      <Icon size={20} />
    </div>
    <div>
      <p className="lp-feature-title">{title}</p>
      <p className="lp-feature-desc">{desc}</p>
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="lp-root">
      {/* Animated background blobs */}
      <div className="lp-blob lp-blob-1" />
      <div className="lp-blob lp-blob-2" />
      <div className="lp-blob lp-blob-3" />

      <div className="lp-container">
        {/* ─── LEFT PANEL ─── */}
        <div className="lp-left">
          {/* Logo */}
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <Boxes size={28} />
            </div>
            <span className="lp-brand-name">WMS Pro</span>
          </div>

          {/* Hero text */}
          <div className="lp-hero">
            <h1 className="lp-hero-title">
              Hệ thống<br />
              <span className="lp-hero-grad">Quản Lý Kho</span><br />
              Thông Minh
            </h1>
            <p className="lp-hero-sub">
              Tối ưu vận hành, kiểm soát hàng tồn kho và theo dõi tài sản trên một nền tảng duy nhất.
            </p>
          </div>

          {/* Warehouse illustration (SVG inline) */}
          <div className="lp-illustration" aria-hidden="true">
            <svg viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Floor */}
              <rect x="10" y="160" width="320" height="8" rx="4" fill="rgba(99,102,241,0.25)" />
              {/* Building */}
              <rect x="30" y="80" width="280" height="80" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
              {/* Roof */}
              <path d="M20 82 L170 30 L320 82" stroke="rgba(99,102,241,0.5)" strokeWidth="2" strokeLinejoin="round" fill="rgba(99,102,241,0.07)" />
              {/* Door */}
              <rect x="145" y="120" width="50" height="40" rx="3" fill="rgba(99,102,241,0.25)" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
              <line x1="170" y1="120" x2="170" y2="160" stroke="rgba(99,102,241,0.4)" strokeWidth="1" />
              {/* Windows */}
              <rect x="55" y="100" width="50" height="35" rx="3" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
              <rect x="235" y="100" width="50" height="35" rx="3" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
              {/* Shelves (inside windows) */}
              <line x1="55" y1="115" x2="105" y2="115" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
              <line x1="55" y1="125" x2="105" y2="125" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
              <line x1="235" y1="115" x2="285" y2="115" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
              <line x1="235" y1="125" x2="285" y2="125" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
              {/* Boxes on floor */}
              <rect x="40" y="143" width="22" height="17" rx="2" fill="rgba(99,102,241,0.35)" stroke="rgba(99,102,241,0.6)" strokeWidth="1" />
              <rect x="66" y="148" width="17" height="12" rx="2" fill="rgba(99,102,241,0.25)" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
              <rect x="260" y="143" width="22" height="17" rx="2" fill="rgba(16,185,129,0.35)" stroke="rgba(16,185,129,0.6)" strokeWidth="1" />
              <rect x="286" y="148" width="17" height="12" rx="2" fill="rgba(16,185,129,0.25)" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
              {/* Forklift silhouette */}
              <rect x="200" y="148" width="30" height="12" rx="2" fill="rgba(245,158,11,0.3)" stroke="rgba(245,158,11,0.6)" strokeWidth="1" />
              <rect x="228" y="138" width="4" height="22" rx="1" fill="rgba(245,158,11,0.5)" />
              <rect x="228" y="138" width="14" height="3" rx="1" fill="rgba(245,158,11,0.6)" />
              <circle cx="204" cy="162" r="4" fill="rgba(245,158,11,0.5)" stroke="rgba(245,158,11,0.8)" strokeWidth="1" />
              <circle cx="222" cy="162" r="4" fill="rgba(245,158,11,0.5)" stroke="rgba(245,158,11,0.8)" strokeWidth="1" />
              {/* Floating particles */}
              <circle cx="80" cy="55" r="3" fill="rgba(99,102,241,0.4)" />
              <circle cx="260" cy="50" r="2" fill="rgba(16,185,129,0.5)" />
              <circle cx="170" cy="15" r="2.5" fill="rgba(245,158,11,0.5)" />
              <circle cx="130" cy="65" r="1.5" fill="rgba(99,102,241,0.3)" />
              <circle cx="210" cy="60" r="1.5" fill="rgba(16,185,129,0.3)" />
            </svg>
          </div>

          {/* Features */}
          <div className="lp-features">
            <FeatureItem icon={Package} title="Quản lý nhập/xuất kho" desc="Theo dõi hàng hóa theo thời gian thực" />
            <FeatureItem icon={BarChart3} title="Báo cáo thống kê" desc="Dashboard phân tích dữ liệu chi tiết" />
            <FeatureItem icon={ShieldCheck} title="Phân quyền bảo mật" desc="Hệ thống RBAC đa tầng" />
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="lp-right">
          <div className="lp-form-card">
            <div className="lp-form-header">
              <h2 className="lp-form-title">Chào mừng trở lại</h2>
              <p className="lp-form-sub">Đăng nhập vào tài khoản của bạn</p>
            </div>

            <form className="lp-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="lp-error" role="alert">
                  <ShieldCheck size={15} />
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-email">Email</label>
                <div className="lp-input-wrap">
                  <Mail size={16} className="lp-input-icon" />
                  <input
                    id="lp-email"
                    type="email"
                    className="lp-input"
                    placeholder="admin@wms.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <p className="lp-hint">Thử: admin@wms.com · manager@wms.com · staff@wms.com</p>
              </div>

              {/* Password */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-password">Mật khẩu</label>
                <div className="lp-input-wrap">
                  <Lock size={16} className="lp-input-icon" />
                  <input
                    id="lp-password"
                    type={showPass ? 'text' : 'password'}
                    className="lp-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye-btn"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="lp-row">
                <label className="lp-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  <span className="lp-checkbox-custom" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="lp-forgot">Quên mật khẩu?</a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`lp-submit${loading ? ' lp-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="lp-spinner" />
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="lp-footer">
              Chưa có tài khoản?{' '}
              <a href="#" className="lp-footer-link">Liên hệ Admin</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
