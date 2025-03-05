import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useState } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render(
        (decodedText) => {
          setQrData(decodedText);
          setScanning(false);
          sendToGoogleSheets(decodedText);
          scanner.clear();
        },
        (errorMessage) => {
          console.error(errorMessage);
        }
      );
    }
  }, [scanning]);

  const sendToGoogleSheets = async (data) => {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzXPhtUKQQ7JvGifJmlyteCO1VMoHhxidOEd8zP47MjUWjUGDskd4aMVmy6w4hN9qtD/exec"; // Замініть на ваш URL
    try {
      await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData: data }),
      });
    } catch (error) {
      console.error("Помилка відправки даних:", error);
    }
  };

  return (
    <div className="container">
      <h1>📷 Сканер QR-кодів</h1>
      {scanning ? <div id="reader"></div> : <p>✅ Відскановано: {qrData}</p>}
      {!scanning && <button onClick={() => setScanning(true)}>🔄 Сканувати ще раз</button>}
    </div>
  );
}
