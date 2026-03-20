import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_INVENTORY } from '../utils/mockData';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage or use mock data
    const savedInventory = localStorage.getItem('wms_inventory');
    const savedTransactions = localStorage.getItem('wms_transactions');

    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    } else {
      setInventory(MOCK_INVENTORY);
    }

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setTransactions([]);
    }
    
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

  const getProductBySku = (sku) => {
    return inventory.find(item => item.id === sku);
  };

  return (
    <InventoryContext.Provider value={{ 
      inventory, 
      transactions, 
      updateStock, 
      addTransaction, 
      getProductBySku,
      loading 
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
