import React from "react";

export default function StockInfoDisplay({ stockInfo }) {
  return (
    <div className="stock-info">
      <div className={`stock-badge ${stockInfo.available < 5 ? 'low-stock' : 'normal-stock'}`}>
        <span className="stock-label">Склад:</span>
        <span className="stock-count">{stockInfo.available}</span>
        {stockInfo.available === 0 && <span className="stock-alert">(Немає)</span>}
        {stockInfo.available > 0 && stockInfo.available < 5 && <span className="stock-warning">(Мало)</span>}
      </div>
      
      <div className="repair-info">
        <span className="stock-label">Ремонт:</span>
        <span className="stock-count">{stockInfo.inRepair}</span>
      </div>
      
      <div className="ordered-info">
        <span className="stock-label">Замовлено:</span>
        <span className="stock-count">{stockInfo.ordered}</span>
      </div>
    </div>
  );
}
