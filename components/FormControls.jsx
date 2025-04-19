import React from "react";

export default function FormControls({
  isSubmitting,
  isRefreshing,
  isNewItem,
  productCode,
  isSubmitDisabled,
  sendToGoogleSheets,
  refreshStockInfo,
  scanAgain
}) {
  return (
    <div className="buttons-container">
      <button 
        className="submit-btn" 
        onClick={sendToGoogleSheets}
        disabled={isSubmitDisabled()}
      >
        {isSubmitting ? "⏳ Відправка..." : "📤 Відправити дані"}
      </button>
      
      {!isNewItem && (
        <button 
          className="refresh-btn" 
          onClick={() => refreshStockInfo()}
          disabled={isSubmitting || isRefreshing || (!productCode && !isNewItem) || productCode === "XXXXXX"}
        >
          {isRefreshing ? "⏳ Оновлення..." : "🔄 Оновити дані"}
        </button>
      )}
      
      <button 
        className="scan-btn" 
        onClick={scanAgain}
        disabled={isSubmitting || isRefreshing}
      >
        📷 Сканувати інший QR-код
      </button>
    </div>
  );
}
