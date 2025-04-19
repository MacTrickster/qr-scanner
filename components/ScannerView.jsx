import React from "react";

export default function ScannerView({ scannerRef, skipScanner }) {
  return (
    <div>
      <div id="reader" ref={scannerRef}></div>
      <p className="instruction">Наведіть камеру на QR-код для сканування</p>
      
      {/* Кнопка для пропуску сканера */}
      <button 
        className="skip-btn" 
        onClick={skipScanner}
      >
        ⏭️ Пропустити сканер
      </button>
    </div>
  );
}
