import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useState, useRef } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemStatus, setItemStatus] = useState("Отримано"); // Default status
  const [quantity, setQuantity] = useState(1); // Default quantity
  const iframeRef = useRef(null);
  
  // Google Apps Script web app URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbxvYuFmmf-nHRHwQY2007jE7hY0E0d4sgRBeQHJa-KWAwpTTn_VHrIMvNjgH46lqJxZnA/exec";

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

  // Form submission approach that bypasses CORS
  const sendToGoogleSheets = () => {
    setStatus("Відправка даних...");
    setIsSubmitting(true);
    
    // Create a form element
    const form = document.createElement("form");
    form.method = "POST";
    form.action = scriptUrl;
    form.target = "hidden-iframe"; // Target the hidden iframe
    
    // Add form fields
    const qrField = document.createElement("input");
    qrField.type = "hidden";
    qrField.name = "qrData";
    qrField.value = qrData;
    
    const statusField = document.createElement("input");
    statusField.type = "hidden";
    statusField.name = "itemStatus";
    statusField.value = itemStatus;
    
    const quantityField = document.createElement("input");
    quantityField.type = "hidden";
    quantityField.name = "quantity";
    quantityField.value = quantity;
    
    const timestampField = document.createElement("input");
    timestampField.type = "hidden";
    timestampField.name = "timestamp";
    timestampField.value = new Date().toISOString();
    
    // Append fields to form
    form.appendChild(qrField);
    form.appendChild(statusField);
    form.appendChild(quantityField);
    form.appendChild(timestampField);
    
    // Append form to document
    document.body.appendChild(form);
    
    // Submit the form
    form.submit();
    
    // Set timeout for status update
    setTimeout(() => {
      setStatus("Дані відправлено");
      setIsSubmitting(false);
    }, 3000);
    
    // Remove form from document
    document.body.removeChild(form);
  };
  
  const scanAgain = () => {
    setScanning(true);
    setStatus("");
    setItemStatus("Отримано"); // Reset to default
    setQuantity(1); // Reset to default
  };

  // Handle quantity change with validation
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    } else if (e.target.value === "") {
      setQuantity("");
    }
  };

  return (
    <div className="container">
      <h1>📷 Сканер QR-кодів</h1>
      
      {/* Hidden iframe for form submission */}
      <iframe 
        ref={iframeRef}
        name="hidden-iframe"
        style={{ display: "none" }}
        title="Submission Frame"
      />
      
      {scanning ? (
        <div>
          <div id="reader"></div>
          <p className="instruction">Наведіть камеру на QR-код для сканування</p>
        </div>
      ) : (
        <div className="result-container">
          <p className="result">✅ Відскановано: <span className="data">{qrData}</span></p>
          
          <div className="options-container">
            <div className="option-group">
              <label htmlFor="itemStatus">Статус:</label>
              <select 
                id="itemStatus" 
                value={itemStatus} 
                onChange={(e) => setItemStatus(e.target.value)}
                className="input-field"
              >
                <option value="Отримано">Отримано</option>
                <option value="Видано">Видано</option>
                <option value="Брак">Брак</option>
              </select>
            </div>
            
            <div className="option-group">
              <label htmlFor="quantity">Кількість:</label>
              <input 
                id="quantity" 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={handleQuantityChange}
                className="input-field"
              />
            </div>
          </div>
          
          {status && <p className="status">{status}</p>}
          
          <div className="buttons-container">
            <button 
              className="submit-btn" 
              onClick={sendToGoogleSheets}
              disabled={isSubmitting || quantity === "" || quantity < 1}
            >
              {isSubmitting ? "Відправка..." : "📤 Відправити дані"}
            </button>
            
            <button 
              className="scan-btn" 
              onClick={scanAgain}
              disabled={isSubmitting}
            >
              🔄 Сканувати інший QR-код
            </button>
          </div>
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
        .options-container {
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        .option-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .option-group:last-child {
          margin-bottom: 0;
        }
        label {
          font-weight: 500;
          color: #333;
          margin-right: 10px;
        }
        .input-field {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          max-width: 200px;
        }
        select.input-field {
          background-color: white;
        }
        .status {
          color: #4285f4;
          padding: 10px;
          background-color: #e8f0fe;
          border-radius: 4px;
          margin: 15px 0;
        }
        .buttons-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .submit-btn {
          background-color: #4285f4;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .submit-btn:hover {
          background-color: #3367d6;
        }
        .scan-btn {
          background-color: #34a853;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .scan-btn:hover {
          background-color: #2d9249;
        }
        .submit-btn:disabled, .scan-btn:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
