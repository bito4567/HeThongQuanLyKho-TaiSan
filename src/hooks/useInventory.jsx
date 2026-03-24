import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_INVENTORY, MOCK_SUPPLIERS } from '../utils/mockData';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage or use mock data
    const savedInventory = localStorage.getItem('wms_inventory');
    const savedTransactions = localStorage.getItem('wms_transactions');

    if (savedInventory) {
      const parsed = JSON.parse(savedInventory);
      const migrated = parsed.map(item => ({
        ...item,
        supplierId: item.supplierId || (MOCK_INVENTORY.find(m => m.id === item.id)?.supplierId || 'SUP001')
      }));
      setInventory(migrated);
    } else {
      setInventory(MOCK_INVENTORY);
    }

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setTransactions([]);
    }
    
    setSuppliers(MOCK_SUPPLIERS);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wms_inventory', JSON.stringify(inventory));
      localStorage.setItem('wms_transactions', JSON.stringify(transactions));
    }
  }, [inventory, transactions, loading]);

  const updateStock = (sku, quantityChange) => {
    setInventory(prev => prev.map(item => {
      if (item.id === sku) {
        const newStock = item.stock + quantityChange;
        let newStatus = 'In Stock';
        if (newStock <= 0) newStatus = 'Out of Stock';
        else if (newStock <= 10) newStatus = 'Low Stock';
        
        return { ...item, stock: newStock, status: newStatus };
      }
      return item;
    }));
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: transaction.id || `TXN${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  const approveTransaction = (id, approverName, role) => {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return false;

    let newStatus = t.status;
    let shouldUpdateStock = false;

    if (t.type === 'OUTBOUND') {
      if (t.status === 'PENDING_MANAGER' && role === 'manager') {
        newStatus = 'PENDING_ADMIN';
      } else if (t.status === 'PENDING_ADMIN' && role === 'admin') {
        newStatus = 'APPROVED';
        shouldUpdateStock = true;
      } else if (t.status === 'Pending' && role === 'manager') {
         newStatus = 'APPROVED';
         shouldUpdateStock = true;
      } else if (t.status === 'Pending' && role === 'admin') {
         newStatus = 'APPROVED';
         shouldUpdateStock = true;
      }
    } else {
      if (t.status === 'Pending') {
        newStatus = 'Approved';
        shouldUpdateStock = true;
      }
    }

    if (newStatus === t.status) return false;

    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, status: newStatus, approvedAt: new Date().toISOString(), approvedBy: approverName } : tx
    ));

    if (shouldUpdateStock) {
      t.items?.forEach(item => {
        if (t.type === 'INBOUND') {
          const qty = parseInt(item.quantity) || 1;
          updateStock(item.id, qty);
        }
        else if (t.type === 'OUTBOUND') {
          const qty = parseInt(item.quantity) || 1;
          updateStock(item.id, -qty);
        }
        else if (t.type === 'AUDIT') {
          const diff = parseInt(item.actual || 0) - parseInt(item.expected || 0);
          updateStock(item.id, diff);
        }
      });
    }
    return true;
  };

  const rejectTransaction = (id, approverName, role, note = '') => {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return false;

    let newStatus = 'Rejected';
    if (t.type === 'OUTBOUND') {
      if (role === 'admin') newStatus = 'CANCELLED';
      else if (role === 'manager') newStatus = 'REJECTED';
    }

    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, status: newStatus, rejectedAt: new Date().toISOString(), rejectedBy: approverName, rejectNote: note } : tx
    ));
    return true;
  };

  const addProduct = (product) => {
    setInventory(prev => [...prev, product]);
    
    // Log transaction
    addTransaction({
      type: 'TẠO_MỚI',
      productId: product.id,
      quantity: product.stock,
      notes: 'Thêm sản phẩm mới vào hệ thống'
    });
  };

  const updateProduct = (sku, updatedData) => {
    setInventory(prev => prev.map(item => 
      item.id === sku ? { ...item, ...updatedData } : item
    ));

    // Log update
    addTransaction({
      type: 'CẬP_NHẬT',
      productId: sku,
      quantity: 0,
      notes: 'Cập nhật thông tin sản phẩm'
    });
  };

  const deleteProduct = (sku) => {
    setInventory(prev => prev.filter(item => item.id !== sku));
    // Optional: Log deletion or handle related transactions
  };

  const generateNextSku = () => {
    const ids = inventory.map(item => {
      const match = item.id.match(/PRO(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    const maxId = Math.max(0, ...ids)
    return `PRO${(maxId + 1).toString().padStart(3, '0')}`
  }

  const getProductBySku = (sku) => {
    return inventory.find(item => item.id === sku);
  };

  return (
    <InventoryContext.Provider value={{ 
      inventory, 
      transactions, 
      suppliers,
      updateStock, 
      addTransaction, 
      addProduct,
      updateProduct,
      deleteProduct,
      generateNextSku,
      getProductBySku,
      approveTransaction,
      rejectTransaction,
      loading 
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
