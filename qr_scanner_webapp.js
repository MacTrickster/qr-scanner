import React, { useState } from "react";
import { QrReader } from "react-qr-reader";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = async (data) => {
    if (data) {
      setQrData(data.text);
      setIsScanning(false); // Зупиняємо сканування після першого виявлення

      // Відправка даних у Google Apps Script
      const scriptUrl = "https://script.google.com/macros/s/AKfycbzXPhtUKQQ7JvGifJmlyteCO1VMoHhxidOEd8zP47MjUWjUGDskd4aMVmy6w4hN9qtD/exec"; // Замініть на свій URL
      try {
        await fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ qrData: data.text }),
        });
      } catch (error) {
        console.error("Помилка відправки даних:", error);
      }
    }
  };

  return (
    <div className="container">
      <h1>📷 Сканер QR-кодів</h1>
      {isScanning ? (
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: "environment" }}
          style={{ width: "100%" }}
        />
      ) : (
        <button onClick={() => setIsScanning(true)}>🔄 Сканувати ще раз</button>
      )}
      <p>{qrData}</p>
    </div>
  );
}
