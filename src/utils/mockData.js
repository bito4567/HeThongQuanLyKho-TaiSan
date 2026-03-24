export const MOCK_INVENTORY = [
  { id: 'PRO001', name: 'Laptop Dell XPS 15', category: 'Laptops', stock: 15, price: '35,000,000 ₫', status: 'In Stock', supplierId: 'SUP001', arrivalDate: '2024-03-01' },
  { id: 'PRO002', name: 'iPhone 15 Pro', category: 'Phones', stock: 8, price: '28,000,000 ₫', status: 'Low Stock', supplierId: 'SUP002', arrivalDate: '2024-03-05' },
  { id: 'PRO003', name: 'Samsung S24 Ultra', category: 'Phones', stock: 25, price: '26,000,000 ₫', status: 'In Stock', supplierId: 'SUP003', arrivalDate: '2024-03-10' },
  { id: 'PRO004', name: 'MacBook Pro M3', category: 'Laptops', stock: 5, price: '45,000,000 ₫', status: 'Low Stock', supplierId: 'SUP002', arrivalDate: '2024-03-12' },
  { id: 'PRO005', name: 'Sony WH-1000XM5', category: 'Audio', stock: 42, price: '8,500,000 ₫', status: 'In Stock', supplierId: 'SUP005', arrivalDate: '2024-02-25' },
  { id: 'PRO006', name: 'Logitech MX Master 3S', category: 'Accessories', stock: 65, price: '2,500,000 ₫', status: 'In Stock', supplierId: 'SUP005', arrivalDate: '2024-03-15' },
  { id: 'PRO007', name: 'Keychron K2 V2', category: 'Accessories', stock: 0, price: '1,800,000 ₫', status: 'Out of Stock', supplierId: 'SUP004', arrivalDate: '2024-01-20' },
];

export const MOCK_SUPPLIERS = [
  { id: 'SUP001', name: 'Công ty TNHH Dell Việt Nam', contact: '024-1234-5678' },
  { id: 'SUP002', name: 'Apple Authorized Reseller', contact: '028-8888-9999' },
  { id: 'SUP003', name: 'Samsung Electronics Vina', contact: '1800-588-889' },
  { id: 'SUP004', name: 'Công ty CP Thế Giới Di Động', contact: '1800-1060' },
  { id: 'SUP005', name: 'Logitech Asia Pacific', contact: 'contact@logitech.com' },
];

export const INBOUND_TYPES = [
  { id: 'MUA_HANG', name: 'Mua hàng' },
  { id: 'TRA_HANG', name: 'Trả hàng từ khách' },
  { id: 'DIEU_CHUYEN', name: 'Điều chuyển nội bộ' },
  { id: 'KHAC', name: 'Nhập khác' },
];
