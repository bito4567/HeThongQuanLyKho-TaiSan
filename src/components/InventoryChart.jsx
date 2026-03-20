const InventoryChart = () => {
  const data = [
    { label: 'T2', value: 65 },
    { label: 'T3', value: 45 },
    { label: 'T4', value: 85 },
    { label: 'T5', value: 30 },
    { label: 'T6', value: 95 },
    { label: 'T7', value: 55 },
    { label: 'CN', value: 70 },
  ]

  return (
    <div className="chart-container">
      <div className="chart-bars">
        {data.map((item, i) => (
          <div key={i} className="chart-bar-wrapper">
            <div 
              className="chart-bar" 
              style={{ 
                height: `${item.value}%`,
                animationDelay: `${i * 0.1}s`,
                opacity: 1
              }}
            >
              <span className="bar-tooltip">{item.value}%</span>
            </div>
            <span className="bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InventoryChart
