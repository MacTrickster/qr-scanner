import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useState, useRef } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemStatus, setItemStatus] = useState("Отримано"); // Default status
  const [quantity, setQuantity] = useState(1); // Default quantity
  const [team, setTeam] = useState("Команді A"); // Default team
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const currentCameraIdRef = useRef(null);
  
  // Google Apps Script web app URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbzkk2sndJkGhIUTODWQ0E-Dnyn3eEqbYkZKGL5Yubr_lh9cGrChvdnQdBdDUAeaFmQniA/exec";

  useEffect(() => {
    // Ініціалізуємо сканер при першому завантаженні компонента
    if (!html5QrcodeRef.current) {
      html5QrcodeRef.current = new Html5Qrcode("reader");
      // Виявлення камер та ініціалізація відбудеться, коли сканер перейде в режим сканування
    }
    
    // Якщо ми знаходимось в режимі сканування і камера ще не ініціалізована або нам потрібно перезапустити
    if (scanning) {
      if (!cameraInitialized) {
        initializeCamera();
      } else if (currentCameraIdRef.current) {
        startScannerWithCamera(currentCameraIdRef.current);
      }
    } else if (!scanning && html5QrcodeRef.current) {
      // Якщо ми не в режимі сканування, але камера працює, вимикаємо її
      html5QrcodeRef.current.stop().catch(err => {
        console.log("Помилка при зупиненні камери:", err);
      });
    }
    
    // Очищення при розмонтуванні компонента
    return () => {
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().catch(error => {
            console.error("Failed to stop camera:", error);
          });
        } catch (e) {
          console.log("Scanner cleanup error:", e);
        }
      }
    };
  }, [scanning, cameraInitialized]);

  const initializeCamera = async () => {
    try {
      // Отримуємо список доступних камер
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length) {
        console.log("Знайдено камери:", devices);
        
        // Шукаємо задню камеру (environment)
        let selectedDeviceId = devices[0].id; // за замовчуванням - перша камера
        
        // Спробуємо знайти задню камеру
        for (const device of devices) {
          console.log("Перевіряємо камеру:", device.label || device.id);
          // Задні камери зазвичай мають "environment" в назві або ідентифікаторі
          if ((device.label && (
                device.label.toLowerCase().includes("back") || 
                device.label.toLowerCase().includes("rear") || 
                device.label.toLowerCase().includes("задня") ||
                device.label.toLowerCase().includes("основна"))) || 
              (device.id && device.id.toLowerCase().includes("environment"))) {
            selectedDeviceId = device.id;
            console.log("Обрано задню камеру:", device.label || device.id);
            break;
          }
        }
        
        currentCameraIdRef.current = selectedDeviceId;
        setCameraInitialized(true);
        startScannerWithCamera(selectedDeviceId);
      } else {
        console.error("Камери не знайдено на пристрої");
        alert("Камери не знайдено на вашому пристрої!");
      }
    } catch (err) {
      console.error("Помилка ініціалізації камери:", err);
      // Спробуємо запустити з facingMode, якщо ідентифікатор пристрою недоступний
      startScannerWithCamera(null);
    }
  };

  const startScannerWithCamera = (deviceId = null) => {
    if (!html5QrcodeRef.current) {
      console.error("Сканер не ініціалізовано");
      return;
    }
    
    // Зупиняємо поточне сканування, якщо воно виконується
    html5QrcodeRef.current.stop().catch(() => {
      // Ігноруємо помилку, якщо сканер вже зупинено
    }).finally(() => {
      // Конфігурація сканера
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        focusMode: "continuous",
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };
      
      // Колбек успішного сканування
      const qrCodeSuccessCallback = (decodedText) => {
        setQrData(decodedText);
        setScanning(false);
      };
      
      // Колбек помилки сканування (нормальний при відсутності QR-коду в кадрі)
      const qrCodeErrorCallback = (error) => {
        // Спеціально не логуємо, щоб не засмічувати консоль
      };
      
      console.log("Запуск камери. DeviceId:", deviceId || "facingMode:environment");
      
      // Запускаємо сканер з визначеною камерою або з задньою камерою за замовчуванням
      if (deviceId) {
        html5QrcodeRef.current.start(
          { deviceId: { exact: deviceId } },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        ).catch((err) => {
          console.error("Помилка запуску з конкретною камерою:", err);
          
          // Спробуємо запустити з будь-якою задньою камерою
          html5QrcodeRef.current.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          ).catch((err2) => {
            console.error("Помилка запуску із задньою камерою:", err2);
            
            // Якщо все не вдалося, спробуємо запустити з будь-якою доступною камерою
            html5QrcodeRef.current.start(
              null,
              config,
              qrCodeSuccessCallback,
              qrCodeErrorCallback
            ).catch((err3) => {
              console.error("Помилка запуску з будь-якою камерою:", err3);
              alert("Не вдалося запустити камеру. Перезавантажте сторінку або перевірте дозволи камери.");
            });
          });
        });
      } else {
        // Якщо deviceId не вказано, використовуємо задню камеру
        html5QrcodeRef.current.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        ).catch((err) => {
          console.error("Помилка запуску із задньою камерою:", err);
          
          // Якщо не вдалося з задньою камерою, спробуємо з будь-якою
          html5QrcodeRef.current.start(
            null,
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          ).catch((err2) => {
            console.error("Помилка запуску з будь-якою камерою:", err2);
            alert("Не вдалося запустити камеру. Перезавантажте сторінку або перевірте дозволи камери.");
          });
        });
      }
    });
  };

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
    
    // Додаємо поле команди, якщо вибрано "Видано зі складу"
    if (itemStatus === "Видано зі складу") {
      const teamField = document.createElement("input");
      teamField.type = "hidden";
      teamField.name = "team";
      teamField.value = team;
      form.appendChild(teamField);
    }
    
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
    setTeam("Команді A"); // Reset to default team
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
          <div id="reader" ref={scannerRef}></div>
          <p className="instruction">Наведіть камеру на QR-код для сканування</p>
        </div>
      ) : (
        <div className="result-container">
          <div className="option-group">
            <label htmlFor="qrDataEdit">Відскановано:</label>
            <input
              id="qrDataEdit"
              type="text"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              className="input-field qr-input"
            />
          </div>
          
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
                <option value="Видано зі складу">Видано зі складу</option>
                <option value="Брак">Брак</option>
              </select>
            </div>
            
            {/* Показувати вибір команди тільки якщо вибрано "Видано зі складу" */}
            {itemStatus === "Видано зі складу" && (
              <div className="option-group">
                <label htmlFor="team">Кому:</label>
                <select 
                  id="team" 
                  value={team} 
                  onChange={(e) => setTeam(e.target.value)}
                  className="input-field"
                >
                  <option value="Команді A">Команді A</option>
                  <option value="Команді B">Команді B</option>
                  <option value="Команді C">Команді C</option>
                  <option value="Команді D">Команді D</option>
                </select>
              </div>
            )}
            
            <div className="option-group">
              <label htmlFor="quantity">Кількість:</label>
              <input 
                id="quantity" 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={handleQuantityChange}
                className="input-field quantity-field"
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
          min-height: 300px;
          position: relative;
          background-color: #f0f0f0;
        }
        #reader video {
          border-radius: 8px;
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
          min-width: 80px;
          text-align: left;
        }
        .input-field {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          max-width: 200px;
        }
        .quantity-field {
          max-width: 100px;
          width: 100px;
        }
        .qr-input {
          width: 100%;
          max-width: none;
          font-size: 14px;
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
