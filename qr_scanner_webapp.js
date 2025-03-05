import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useState } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitMethod, setSubmitMethod] = useState("direct"); // "direct", "jsonp", or "image"

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      });
      
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
      
      // Cleanup function
      return () => {
        try {
          scanner.clear();
        } catch (e) {
          console.log("Scanner cleanup error:", e);
        }
      };
    }
  }, [scanning]);

  const sendToGoogleSheets = async (data) => {
    setStatus("Відправка даних...");
    setError("");
    
    // Use the current selected submission method
    if (submitMethod === "direct") {
      await sendDirect(data);
    } else if (submitMethod === "jsonp") {
      sendJsonp(data);
    } else {
      sendImageBased(data);
    }
  };
  
  const sendDirect = async (data) => {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyrM0mi8yxYe_rcois0HIklhBs9c1CC34qy2M8xqFWGmcBrdHSKXM9ilq3EMbs4ik5P/exec"; 
    
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ qrData: data }),
        mode: "cors"
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      setStatus(result.message || "Дані успішно відправлено");
      console.log("Відповідь сервера:", result);
    } catch (error) {
      console.error("Помилка прямої відправки:", error);
      setError("Спроба прямої відправки не вдалася. Спробуємо альтернативний метод...");
      
      // Try alternative method
      setSubmitMethod("image");
      sendImageBased(data);
    }
  };
  
  const sendImageBased = (data) => {
    setStatus("Використання альтернативного методу відправки...");
    const encodedData = encodeURIComponent(data);
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyrM0mi8yxYe_rcois0HIklhBs9c1CC34qy2M8xqFWGmcBrdHSKXM9ilq3EMbs4ik5P/exec";
    const timestamp = new Date().getTime();
    
    try {
      const img = document.createElement("img");
      img.width = 1;
      img.height = 1;
      img.style.position = "absolute";
      img.style.opacity = "0.01";
      img.src = `${scriptUrl}?qrData=${encodedData}&timestamp=${timestamp}&method=image`;
      
      img.onload = () => {
        setStatus("Дані відправлено альтернативним методом");
        document.body.removeChild(img);
      };
      
      img.onerror = () => {
        setStatus("Дані можливо відправлено (неможливо підтвердити)");
        document.body.removeChild(img);
        setError("Не вдалося підтвердити успішну відправку даних");
      };
      
      document.body.appendChild(img);
    } catch (err) {
      setError("Всі методи відправки не вдалися. Будь ласка, спробуйте пізніше.");
      console.error("Помилка альтернативного методу:", err);
    }
  };
  
  const handleMethodChange = (method) => {
    setSubmitMethod(method);
    if (qrData && qrData !== "Скануй QR-код...") {
      sendToGoogleSheets(qrData);
    }
  };

  return (
    <div className="container">
      <h1>📷 Сканер QR-кодів</h1>
      
      {scanning ? (
        <div>
          <div id="reader"></div>
          <p className="instruction">Наведіть камеру на QR-код для сканування</p>
        </div>
      ) : (
        <div className="result-container">
          <p className="result">✅ Відскановано: <span className="data">{qrData}</span></p>
          
          {status && <p className="status">{status}</p>}
          {error && <p className="error">{error}</p>}
          
          <div className="method-selector">
            <p>Метод відправки:</p>
            <div className="buttons">
              <button 
                className={`method-btn ${submitMethod === 'direct' ? 'active' : ''}`}
                onClick={() => handleMethodChange('direct')}
              >
                Прямий
              </button>
              <button 
                className={`method-btn ${submitMethod === 'image' ? 'active' : ''}`}
                onClick={() => handleMethodChange('image')}
              >
                Альтернативний
              </button>
            </div>
          </div>
          
          <button className="scan-btn" onClick={() => setScanning(true)}>
            🔄 Сканувати ще раз
          </button>
        </div>
      )}
      
      <style jsx>{`
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        #reader {
          width: 100%;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
        }
        .instruction {
          color: #666;
          margin-top: 15px;
          font-size: 14px;
        }
        .result-container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .result {
          font-weight: bold;
          margin-bottom: 15px;
        }
        .data {
          word-break: break-all;
          font-weight: normal;
          color: #4285f4;
        }
        .status {
          color: #4285f4;
          padding: 10px;
          background-color: #e8f0fe;
          border-radius: 4px;
        }
        .error {
          color: #ea4335;
          padding: 10px;
          background-color: #fce8e6;
          border-radius: 4px;
        }
        .method-selector {
          margin: 20px 0;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        .buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }
        .method-btn {
          background-color: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .method-btn.active {
          background-color: #4285f4;
          color: white;
          border-color: #4285f4;
        }
        .scan-btn {
          background-color: #34a853;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 15px;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .scan-btn:hover {
          background-color: #2d9249;
        }
      `}</style>
    </div>
  );
}
