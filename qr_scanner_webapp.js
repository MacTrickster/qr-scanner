import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useState } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

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
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxaJngExEvAkgGbw3oR1TZ5b-ogzI2yCtK-bnPxWKGNb_c7NJlAZwJUFmFCuhqxJ_EA/exec"; 
    setStatus("Відправка даних...");
    setError("");
    
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ qrData: data }),
        mode: "cors" // Explicitly set CORS mode
      });
      
      const result = await response.json();
      setStatus(result.message || "Дані успішно відправлено");
      console.log("Відповідь сервера:", result);
    } catch (error) {
      setError("Помилка відправки даних: " + error.message);
      console.error("Помилка відправки даних:", error);
      
      // Fallback method using image-based approach (works in some CORS restricted environments)
      if (error.message.includes("CORS")) {
        tryImageBasedSubmission(data);
      }
    }
  };
  
  // Fallback method for CORS issues
  const tryImageBasedSubmission = (data) => {
    setStatus("Спроба альтернативного методу відправки...");
    const encodedData = encodeURIComponent(data);
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxaJngExEvAkgGbw3oR1TZ5b-ogzI2yCtK-bnPxWKGNb_c7NJlAZwJUFmFCuhqxJ_EA/exec";
    const img = document.createElement("img");
    img.width = 1;
    img.height = 1;
    img.src = `${scriptUrl}?qrData=${encodedData}&timestamp=${new Date().getTime()}`;
    img.onload = () => setStatus("Дані відправлено альтернативним методом");
    img.onerror = () => setStatus("Дані можливо відправлено");
    document.body.appendChild(img);
    setTimeout(() => document.body.removeChild(img), 5000);
  };

  return (
    <div className="container">
      <h1>📷 Сканер QR-кодів</h1>
      {scanning ? <div id="reader"></div> : (
        <div>
          <p>✅ Відскановано: {qrData}</p>
          {status && <p className="status">{status}</p>}
          {error && <p className="error">{error}</p>}
          <button onClick={() => setScanning(true)}>🔄 Сканувати ще раз</button>
        </div>
      )}
      
      <style jsx>{`
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        #reader {
          width: 100%;
          margin: 0 auto;
        }
        button {
          background-color: #4285f4;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 15px;
        }
        .status {
          color: #4285f4;
        }
        .error {
          color: #ea4335;
        }
      `}</style>
    </div>
  );
}
