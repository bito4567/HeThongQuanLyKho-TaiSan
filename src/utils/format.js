export const formatCurrency = (amount, compact = false) => {
  if (amount === undefined || amount === null || amount === '') return '0 ₫';
  
  let num;
  if (typeof amount === 'number') {
    num = amount;
  } else {
    const cleanStr = String(amount).replace(/[^0-9-]/g, '');
    num = parseInt(cleanStr) || 0;
  }
  
  if (compact && num >= 1000000) {
    // Custom compact for Vietnamese context or simple B/M
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2).replace('.', ',') + ' Tỷ ₫';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.', ',') + ' Tr ₫';
    }
  }
  
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
};

export const formatNumber = (num) => {
  if (num === undefined || num === null || num === '') return '0';
  const val = typeof num === 'number' ? num : (parseInt(num) || 0);
  return new Intl.NumberFormat('vi-VN').format(val);
};

export const parseCurrencyToNumber = (currencyStr) => {
  if (!currencyStr) return 0;
  return parseInt(String(currencyStr).replace(/[^0-9-]/g, '')) || 0;
};
