import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TransactionsChart = ({ transactions = [], days = 7 }) => {
  const chartData = useMemo(() => {
    // Generate dates for the last N days
    const dates = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d)
    }

    // Initialize data map
    const dataMap = {}
    dates.forEach(d => {
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      dataMap[dateStr] = { name: dateStr, Inbound: 0, Outbound: 0, rawDate: d }
    })

    // Aggregate transactions (only Approved and Confirmed ones)
    transactions.forEach(t => {
      if (t.status === 'Pending' || t.status === 'Rejected') return
      
      const tDate = new Date(t.timestamp)
      tDate.setHours(0, 0, 0, 0)
      
      // Check if it falls within our range
      if (tDate >= dates[0] && tDate <= dates[dates.length - 1]) {
        const dateStr = tDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        
        let qty = 0;
        if (t.totalQuantity) qty = t.totalQuantity;
        else if (t.items) qty = t.items.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);
        else qty = parseInt(t.quantity) || 0

        if (dataMap[dateStr]) {
          if (t.type === 'INBOUND') {
            dataMap[dateStr].Inbound += qty
          } else if (t.type === 'OUTBOUND') {
            dataMap[dateStr].Outbound += qty
          }
        }
      }
    })

    return Object.values(dataMap)
  }, [transactions, days])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {entry.name === 'Inbound' ? 'Nhập kho' : 'Xuất kho'}:
              </span>
              <span style={{ color: entry.color, fontWeight: 'bold' }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span style={{ color: 'var(--text-muted)' }}>{value === 'Inbound' ? 'Nhập kho' : 'Xuất kho'}</span>}
          />
          <Bar dataKey="Inbound" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000} />
          <Bar dataKey="Outbound" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TransactionsChart
