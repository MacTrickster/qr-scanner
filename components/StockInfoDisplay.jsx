import React from "react";

export default function StockInfoDisplay({ stockInfo }) {
  return (
    <div className="stock-info">
      <div className={`stock-badge ${stockInfo.available < 5 ? 'low-stock' : 'normal-stock'}`}>
        <span className="stock-label">📊 Наявність на складі:</span>
        <span className="stock-count">{stockInfo.available}</span>
        {stockInfo.available === 0 && <span className="stock-alert"> (Немає на складі!)</span>}
        {stockInfo.available > 0 && stockInfo.available < 5 && <span className="stock-warning"> (Мало на складі!)</span>}
      </div>
      
      {/* Інформація про кількість в ремонті */}
      <div className="repair-info">
        <span className="stock-label">🔧 В ремонті:</span>
        <span className="stock-count">{stockInfo.inRepair}</span>
      </div>
      
      {/* Інформація про замовлену кількість */}
      <div className="ordered-info">
        <span className="stock-label">🚚 Замовлено:</span>
        <span className="stock-count">{stockInfo.ordered}</span>
      </div>
      
      {/* Не відображаємо кількість "В роботі" згідно з вимогами */}
    </div>
  );
}
