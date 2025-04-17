import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useState, useRef } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceLocation, setSourceLocation] = useState("Отримано на склад");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [team, setTeam] = useState("Команді A");
  const [isNewItem, setIsNewItem] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  
  // Google Apps Script web app URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbyYMwneBX4I8j_Z_UDIrmE3atQLZtQlh5lmbDqUFD--qbyjPMn72p4Ejsg118WH-_X6/exec";

  // Визначення доступних "Переміщено В" для кожного "Переміщено З"
  const destinationOptions = {
    "Отримано на склад": ["Видано зі складу", "Ремонт"],
    "Ремонт": ["Відремонтовано", "Брак", "Не потребує ремонту"],
    "Видано зі складу": ["Ремонт"]
  };

  useEffect(() => {
    // Ініціалізуємо сканер при першому завантаженні компонента
    if (scanning && !html5QrcodeRef.current) {
      initializeScanner();
    } else if (scanning && html5QrcodeRef.current) {
      // Якщо сканер вже був ініціалізований, просто запускаємо його знову
      startScanner();
    }
    
    // Встановлюємо доступні опції для "Переміщено В" при зміні "Переміщено З"
    if (sourceLocation && destinationOptions[sourceLocation]) {
      setDestinationLocation(destinationOptions[sourceLocation][0] || "");
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
  }, [scanning, sourceLocation]);

  // Функція для розбору QR-коду на назву та код товару
  const parseQrData = (qrText) => {
    try {
      let productName = "";
      let productCode = "";
      
      // Шукаємо назву товару
      const nameMatch = qrText.match(/Name:\s*(.*?)(?=\s*Code:|$)/i);
      if (nameMatch && nameMatch[1]) {
        productName = nameMatch[1].trim();
      }
      
      // Шукаємо код товару
      const codeMatch = qrText.match(/Code:\s*([^:\n]+)(?:\n|$)/i);
      if (codeMatch && codeMatch[1]) {
        productCode = codeMatch[1].trim();
      }
      
      return { productName, productCode, rawData: qrText };
    } catch (e) {
      console.error("Помилка розбору QR-коду:", e);
      return { productName: "", productCode: "", rawData: qrText };
    }
  };

  // Функція для отримання інформації про запаси
  const fetchStockInfo = async (code) => {
    try {
      // JSONP запит для обходу CORS
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
        
        // Створюємо функцію зворотного виклику
        window[callbackName] = (data) => {
          document.body.removeChild(script);
          delete window[callbackName];
          resolve(data);
        };
        
        // Обробка помилок
        script.onerror = () => {
          document.body.removeChild(script);
          delete window[callbackName];
          reject(new Error("Не вдалося отримати дані про наявність товару"));
        };
        
        // Створюємо URL запиту
        const url = `${scriptUrl}?action=getInventory&code=${encodeURIComponent(code)}&callback=${callbackName}`;
        script.src = url;
        
        // Додаємо скрипт до документа
        document.body.appendChild(script);
        
        // Встановлюємо таймаут для запиту
        setTimeout(() => {
          if (window[callbackName]) {
            document.body.removeChild(script);
            delete window[callbackName];
            reject(new Error("Час очікування запиту вичерпано"));
          }
        }, 10000);
      });
    } catch (error) {
      console.error("Помилка при отриманні даних про запаси:", error);
      throw error;
    }
  };

  const initializeScanner = async () => {
    try {
      // Створюємо екземпляр Html5Qrcode замість Html5QrcodeScanner
      html5QrcodeRef.current = new Html5Qrcode("reader");
      
      // Отримуємо список доступних камер
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length) {
        // Шукаємо задню камеру (environment)
        let selectedDeviceId = devices[0].id; // за замовчуванням - перша камера
        
        // Спробуємо знайти задню камеру
        for (const device of devices) {
          // Задні камери зазвичай мають "environment" в назві або ідентифікаторі
          if (device.label && device.label.toLowerCase().includes("back") || 
              device.label && device.label.toLowerCase().includes("rear") ||
              device.id && device.id.toLowerCase().includes("environment")) {
            selectedDeviceId = device.id;
            break;
          }
        }
        
        startScanner(selectedDeviceId);
      } else {
        alert("Камери не знайдено на вашому пристрої!");
      }
    } catch (err) {
      console.error("Помилка ініціалізації сканера:", err);
    }
  };

  const startScanner = (deviceId = null) => {
    if (!html5QrcodeRef.current) return;
    
    // Опції камери - намагаємось використовувати задню камеру
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      focusMode: "continuous",
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };
    
    const qrCodeSuccessCallback = (decodedText) => {
      // Використовуємо функцію для обробки даних
      processQrData(decodedText);
      
      setScanning(false);
      
      // Зупиняємо сканер, але не видаляємо його екземпляр
      html5QrcodeRef.current.stop().catch(error => {
        console.error("Failed to stop camera:", error);
      });
    };
    
    const qrCodeErrorCallback = (error) => {
      // Ігноруємо помилки сканування, вони нормальні коли QR-код не видно
      // console.error("QR scan error:", error);
    };
    
    // Якщо передано конкретний ідентифікатор пристрою, використовуємо його
    if (deviceId) {
      html5QrcodeRef.current.start(
        { deviceId: { exact: deviceId } },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch((err) => {
        console.error("Помилка запуску камери:", err);
        
        // Якщо не вдалося запустити з заданим ID, спробуємо вибрати камеру за замовчуванням
        html5QrcodeRef.current.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        ).catch((err2) => {
          console.error("Помилка запуску камери за замовчуванням:", err2);
        });
      });
    } else {
      // Якщо ID не вказано, використовуємо facingMode: "environment" для задньої камери
      html5QrcodeRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch((err) => {
        console.error("Помилка запуску камери за замовчуванням:", err);
      });
    }
  };

  // Функція для обробки змін QR даних
  const processQrData = async (newQrData) => {
    setQrData(newQrData);
    
    // Parse the QR data
    const parsedData = parseQrData(newQrData);
    setProductName(parsedData.productName);
    setProductCode(parsedData.productCode);
    
    // Якщо є код товару, спробуйте отримати інформацію про запаси
    if (parsedData.productCode) {
      await refreshStockInfo(parsedData.productCode);
    }
  };

  // Функція для оновлення інформації про запаси
  const refreshStockInfo = async (code = null) => {
    const productCodeToUse = code || productCode;
    if (!productCodeToUse) {
      setError("Код товару відсутній. Спочатку відскануйте QR-код.");
      return;
    }

    try {
      setIsRefreshing(true);
      setStatus("Отримання даних про наявність...");
      const stockData = await fetchStockInfo(productCodeToUse);
      
      if (stockData && stockData.success) {
        setStockInfo({
          available: stockData.stock,
          code: stockData.code,
          found: stockData.found
        });
        setStatus("");
      } else {
        setStockInfo(null);
        setStatus("");
        setError("Не вдалося отримати дані про наявність товару");
      }
    } catch (error) {
      console.error("Помилка при отриманні даних про запаси:", error);
      setStockInfo(null);
      setStatus("");
      setError("Помилка при отриманні даних про запаси");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Form submission approach that bypasses CORS
  const sendToGoogleSheets = () => {
    // Перевіряємо обмеження переміщень на основі наявності
    if (sourceLocation === "Отримано на склад" && 
        (destinationLocation === "Видано зі складу" || destinationLocation === "Ремонт") && 
        stockInfo && stockInfo.available < quantity) {
      setError(`Недостатньо товару на складі! Наявно: ${stockInfo.available}, запитано: ${quantity}`);
      return;
    }
    
    // TODO: Додати перевірку для "Ремонт" -> ["Відремонтовано", "Брак", "Не потребує ремонту"]
    // (потрібно додати колонку з кількістю товарів в ремонті в stockInfo)
    
    setError(null);
    setStatus("Відправка даних...");
    setIsSubmitting(true);
    
    // Create a form element
    const form = document.createElement("form");
    form.method = "POST";
    form.action = scriptUrl;
    form.target = "hidden-iframe"; // Target the hidden iframe
    
    // Додаємо часову мітку
    const timestampField = document.createElement("input");
    timestampField.type = "hidden";
    timestampField.name = "timestamp";
    timestampField.value = new Date().toISOString();
    form.appendChild(timestampField);
    
    // Додаємо назву товару
    const nameField = document.createElement("input");
    nameField.type = "hidden";
    nameField.name = "productName";
    nameField.value = productName;
    form.appendChild(nameField);
    
    // Додаємо код товару - якщо це новий товар, відправляємо пусте поле
    const codeField = document.createElement("input");
    codeField.type = "hidden";
    codeField.name = "productCode";
    codeField.value = isNewItem ? "" : productCode;
    form.appendChild(codeField);
    
    // Додаємо джерело (Переміщено З)
    const sourceField = document.createElement("input");
    sourceField.type = "hidden";
    sourceField.name = "sourceLocation";
    sourceField.value = sourceLocation;
    form.appendChild(sourceField);
    
    // Додаємо призначення (Переміщено В)
    const destinationField = document.createElement("input");
    destinationField.type = "hidden";
    destinationField.name = "destinationLocation";
    destinationField.value = destinationLocation;
    form.appendChild(destinationField);
    
    // Додаємо команду, якщо вибрано "Видано зі складу"
    const teamField = document.createElement("input");
    teamField.type = "hidden";
    teamField.name = "team";
    teamField.value = destinationLocation === "Видано зі складу" ? team : "";
    form.appendChild(teamField);
    
    // Додаємо кількість
    const quantityField = document.createElement("input");
    quantityField.type = "hidden";
    quantityField.name = "quantity";
    quantityField.value = quantity;
    form.appendChild(quantityField);
    
    // Додаємо інформацію про новий товар
    const isNewItemField = document.createElement("input");
    isNewItemField.type = "hidden";
    isNewItemField.name = "isNewItem";
    isNewItemField.value = isNewItem ? "Так" : "Ні";
    form.appendChild(isNewItemField);
    
    // Append form to document
    document.body.appendChild(form);
    
    // Submit the form
    form.submit();
    
    // Set timeout for status update
    setTimeout(() => {
      // Оновлюємо дані про запаси після відправки
      refreshStockInfo();
      
      setStatus("Дані відправлено");
      setIsSubmitting(false);
    }, 3000);
    
    // Remove form from document
    document.body.removeChild(form);
  };
  
  const scanAgain = () => {
    setScanning(true);
    setStatus("");
    setError(null);
    setQrData("Скануй QR-код...");
    setProductName("");
    setProductCode("");
    setSourceLocation("Отримано на склад");
    setDestinationLocation(destinationOptions["Отримано на склад"][0] || "");
    setQuantity(1);
    setTeam("Команді A");
    setIsNewItem(false);
    setStockInfo(null);
  };

  // Handle quantity change with validation
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
      
      // Перевіряємо наявність достатньої кількості товару при зміні кількості
      if (sourceLocation === "Отримано на склад" && 
          (destinationLocation === "Видано зі складу" || destinationLocation === "Ремонт") && 
          stockInfo && stockInfo.available < value) {
        setError(`Недостатньо товару на складі! Наявно: ${stockInfo.available}, запитано: ${value}`);
      } else {
        setError(null);
      }
    } else if (e.target.value === "") {
      setQuantity("");
    }
  };

  // Обробник для зміни "Переміщено З"
  const handleSourceChange = (e) => {
    const newSource = e.target.value;
    setSourceLocation(newSource);
    // Встановлюємо першу доступну опцію для "Переміщено В"
    if (destinationOptions[newSource] && destinationOptions[newSource].length > 0) {
      setDestinationLocation(destinationOptions[newSource][0]);
    } else {
      setDestinationLocation("");
    }
  };

  // Обробник для зміни Новий Товар
  const handleNewItemChange = (e) => {
    const isNew = e.target.checked;
    setIsNewItem(isNew);
  };

  return (
    <div className="container">
      <h1>📦 Складська База</h1>
      
      {/* Hidden iframe for form submission */}
      <iframe 
        ref={iframeRef}
        name="hidden-iframe"
        style={{ display: "none" }}
        title="Submission Frame"
        onLoad={() => {
          // При успішному відправленні даних оновлюємо статус
          if (isSubmitting) {
            // Статус вже встановлюється в таймауті в sendToGoogleSheets
          }
        }}
      />
      
      {scanning ? (
        <div>
          <div id="reader" ref={scannerRef}></div>
          <p className="instruction">Наведіть камеру на QR-код для сканування</p>
        </div>
      ) : (
        <div className="result-container">
          <div className="options-container">
            {/* Назва товару */}
            <div className="option-group name-group">
              <label htmlFor="productName">Назва:</label>
              <input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="input-field name-field"
                readOnly={!isNewItem} // Редагування дозволено тільки для нових товарів
              />
            </div>
            
            {/* Галочка "Новий товар" */}
            <div className="option-group checkbox-group">
              <label htmlFor="isNewItem">Новий товар:</label>
              <input
                id="isNewItem"
                type="checkbox"
                checked={isNewItem}
                onChange={handleNewItemChange}
                className="checkbox-field"
              />
            </div>
            
            {/* Код товару - завжди тільки для читання */}
            <div className="option-group">
              <label htmlFor="productCode">Код:</label>
              <input
                id="productCode"
                type="text"
                value={productCode}
                className="input-field code-field"
                readOnly
              />
            </div>
            
            {/* Відображення інформації про запаси */}
            {stockInfo && (
              <div className="stock-info">
                <div className={`stock-badge ${stockInfo.available < 5 ? 'low-stock' : 'normal-stock'}`}>
                  <span className="stock-label">Наявність на складі:</span>
                  <span className="stock-count">{stockInfo.available}</span>
                  {stockInfo.available === 0 && <span className="stock-alert"> (Немає на складі!)</span>}
                  {stockInfo.available > 0 && stockInfo.available < 5 && <span className="stock-warning"> (Мало на складі!)</span>}
                </div>
              </div>
            )}
            
            {/* Переміщено З (джерело) */}
            <div className="option-group">
              <label htmlFor="sourceLocation">Переміщено з:</label>
              <select 
                id="sourceLocation" 
                value={sourceLocation} 
                onChange={handleSourceChange}
                className="input-field"
              >
                <option value="Отримано на склад">Отримано на склад</option>
                <option value="Ремонт">Ремонт</option>
                <option value="Видано зі складу">Видано зі складу</option>
              </select>
            </div>
            
            {/* Переміщено В (призначення) */}
            <div className="option-group">
              <label htmlFor="destinationLocation">Переміщено в:</label>
              <select 
                id="destinationLocation" 
                value={destinationLocation} 
                onChange={(e) => setDestinationLocation(e.target.value)}
                className="input-field"
                disabled={!sourceLocation || !destinationOptions[sourceLocation] || destinationOptions[sourceLocation].length === 0}
              >
                {sourceLocation && destinationOptions[sourceLocation]?.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Показувати вибір команди тільки якщо вибрано "Видано зі складу" */}
            {destinationLocation === "Видано зі складу" && (
              <div className="option-group">
                <label htmlFor="team">Команда:</label>
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
            
            {/* Кількість */}
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
          
          {/* Відображення статусу відправки */}
          {status && <p className="status">{status}</p>}
          
          {/* Відображення помилок */}
          {error && <p className="error">{error}</p>}
          
          <div className="buttons-container">
            <button 
              className="submit-btn" 
              onClick={sendToGoogleSheets}
              disabled={isSubmitting || isRefreshing || quantity === "" || quantity < 1 || !productName || 
                (!isNewItem && !productCode) || 
                (sourceLocation === "Отримано на склад" && 
                 (destinationLocation === "Видано зі складу" || destinationLocation === "Ремонт") && 
                 stockInfo && stockInfo.available < quantity)}
            >
              {isSubmitting ? "Відправка..." : "📤 Відправити дані"}
            </button>
            
            <button 
              className="refresh-btn" 
              onClick={() => refreshStockInfo()}
              disabled={isSubmitting || isRefreshing || (!productCode && !isNewItem)}
            >
              {isRefreshing ? "Оновлення..." : "🔄 Оновити дані"}
            </button>
            
            <button 
              className="scan-btn" 
              onClick={scanAgain}
              disabled={isSubmitting || isRefreshing}
            >
              📷 Сканувати інший QR-код
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
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .submit-btn:hover {
          background-color: #3367d6;
        }
        .refresh-btn {
          background-color: #fbbc05;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .refresh-btn:hover {
          background-color: #f0b400;
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
        .submit-btn:disabled, .refresh-btn:disabled, .scan-btn:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }: 14px;
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
        .name-group {
          align-items: flex-start;
        }
        label {
          font-weight: 500;
          color: #333;
          margin-right: 10px;
          white-space: nowrap;
        }
        .input-field {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        .name-field {
          height: auto;
          min-height: 38px;
          word-wrap: break-word;
          text-align: left;
          overflow-wrap: break-word;
          white-space: normal;
        }
        .code-field {
          background-color: #f5f5f5;
          color: #666;
        }
        .quantity-field {
          max-width: 100px;
          width: 100px;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
        }
        .checkbox-field {
          width: auto;
          max-width: none;
          margin-left: auto;
          transform: scale(1.5);
        }
        select.input-field {
          background-color: white;
        }
        select.input-field:disabled {
          background-color: #f5f5f5;
          color: #888;
        }
        .status {
          color: #4285f4;
          padding: 10px;
          background-color: #e8f0fe;
          border-radius: 4px;
          margin: 15px 0;
        }
        .error {
          color: #d23f31;
          padding: 10px;
          background-color: #ffebee;
          border-radius: 4px;
          margin: 15px 0;
          font-weight: 500;
        }
        .stock-info {
          margin: 15px 0;
          padding: 12px;
          border-radius: 6px;
          background-color: #f5f5f5;
          text-align: center;
        }
        .stock-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 16px;
        }
        .normal-stock {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .low-stock {
          background-color: #ffebee;
          color: #c62828;
        }
        .stock-count {
          margin-left: 5px;
          font-size: 18px;
          font-weight: bold;
        }
        .stock-alert {
          color: #d32f2f;
          font-weight: bold;
        }
        .stock-warning {
          color: #f57c00;
          font-weight: bold;
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
        .refresh-btn {
          background-color: #fbbc05;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .refresh-btn:hover {
          background-color: #f0b400;
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
        .submit-btn:disabled, .refresh-btn:disabled, .scan-btn:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
