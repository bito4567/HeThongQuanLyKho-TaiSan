import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('wms_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Mock login logic with specific passwords
    let mockUser = null;
    
    if (email === 'admin@wms.com' && password === 'admin123') {
      mockUser = { id: 1, name: 'Hệ thống Admin', email, role: 'admin' };
    } else if (email === 'manager@wms.com' && password === 'manager123') {
      mockUser = { id: 2, name: 'Quản lý Kho', email, role: 'manager' };
    } else if (email === 'staff@wms.com' && password === 'staff123') {
      mockUser = { id: 3, name: 'Nhân viên Kho', email, role: 'staff' };
    }

    if (mockUser) {
      setUser(mockUser);
      localStorage.setItem('wms_user', JSON.stringify(mockUser));
      return mockUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wms_user');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const roles = {
      admin: ['all', 'manage_users', 'view_reports', 'manage_inventory', 'stock_movement', 'inventory_audit'],
      manager: ['view_reports', 'manage_inventory', 'stock_movement', 'inventory_audit', 'approve_movement'],
      staff: ['stock_movement', 'view_inventory', 'update_quantity']
    };
    
    if (user.role === 'admin') return true;
    return roles[user.role]?.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
