import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useState, useRef } from "react";

export default function QRScanner() {
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [productName, setProductName] = useState("");
  const [originalProductName, setOriginalProductName] = useState(""); // Зберігаємо оригінальну назву з QR коду
  const [productCode, setProductCode] = useState("");
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [station, setStation] = useState("Склад");
  const [action, setAction] = useState("Прийнято");
  const [quantity, setQuantity] = useState(1);
  const [team, setTeam] = useState("Команді A");
  const [isNewItem, setIsNewItem] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  
  // Google Apps Script web app URL - REPLACE THIS WITH YOUR DEPLOYED SCRIPT URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbywFvI46LtHK4OujZRxITp0O88mJRXQAhl1YH7erhkAE2gl-UMVbcDCgGnJjRXxHzjH/exec";

  // Визначення доступних дій для кожної станції
  const actionOptions = {
    "Склад": ["Прийнято", "В Ремонт", "Видано", "Замовлено", "Прийнято Замовлення"],
    "Ремонт": ["Брак", "Склад"],
    "Виробництво": ["В Ремонт", "Залишки"]
  };

  useEffect(() => {
    // Ініціалізуємо сканер при першому завантаженні компонента
    if (scanning && !html5QrcodeRef.current) {
      initializeScanner();
    } else if (scanning && html5QrcodeRef.current) {
      // Якщо сканер вже був ініціалізований, просто запускаємо його знову
      startScanner();
    }
    
    // Встановлюємо доступні опції для "Дія" при зміні "Станція"
    if (station && actionOptions[station]) {
      // Перевіряємо, чи поточна дія доступна для вибраної станції
      const isCurrentActionAvailable = actionOptions[station].includes(action);
      if (!isCurrentActionAvailable && actionOptions[station].length > 0) {
        setAction(actionOptions[station][0]); // Встановлюємо першу доступну дію
      }
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
  }, [scanning, station, action]);

  // При зміні статусу "Новий товар", відновлюємо оригінальну назву або дозволяємо редагування
  useEffect(() => {
    if (!isNewItem && originalProductName) {
      setProductName(originalProductName);
    }
  }, [isNewItem, originalProductName]);

  // Перевіряємо обмеження кількості при зміні кількості, станції або дії
  useEffect(() => {
    if (stockInfo && !isNewItem) {
      validateQuantityConstraints();
    }
  }, [quantity, station, action, stockInfo]);

  // Функція для перевірки обмежень кількості
  const validateQuantityConstraints = () => {
    if (!stockInfo) return;
    
    // Перевірка для Складу
    if (station === "Склад") {
      if ((action === "В Ремонт" || action === "Видано") && stockInfo.available < quantity) {
        setError(`Недостатньо товару на складі! Наявно: ${stockInfo.available}, запитано: ${quantity}`);
        return false;
      } else if (action === "Прийнято Замовлення" && stockInfo.ordered < quantity) {
        setError(`Недостатньо замовленого товару! Замовлено: ${stockInfo.ordered}, запитано: ${quantity}`);
        return false;
      }
    }
    // Перевірка для Ремонту
    else if (station === "Ремонт") {
      if ((action === "Склад" || action === "Брак") && stockInfo.inRepair < quantity) {
        setError(`Недостатньо товару в ремонті! Наявно: ${stockInfo.inRepair}, запитано: ${quantity}`);
        return false;
      }
    }
    // TODO: Додати перевірку для Виробництва коли буде логіка обліку виданих товарів
    
    // Якщо всі перевірки пройдені, скидаємо помилку
    setError(null);
    return true;
  };

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
    setOriginalProductName(parsedData.productName); // Зберігаємо оригінальну назву
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
          available: stockData.stock,            // Наявна кількість на складі (колонка B)
          inRepair: stockData.inRepair || 0,     // Кількість в ремонті (колонка C)
          ordered: stockData.ordered || 0,       // Замовлено (колонка D)
          code: stockData.code,
          found: stockData.found
        });
        setStatus("");
        
        // Перевіряємо обмеження кількості з новими даними
        setTimeout(() => validateQuantityConstraints(), 100);
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
    if (!validateQuantityConstraints()) {
      return; // Не продовжуємо, якщо не пройшли перевірку
    }
    
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
    
    // Додаємо станцію
    const stationField = document.createElement("input");
    stationField.type = "hidden";
    stationField.name = "station";
    stationField.value = station;
    form.appendChild(stationField);
    
    // Додаємо дію
    const actionField = document.createElement("input");
    actionField.type = "hidden";
    actionField.name = "action";
    actionField.value = action;
    form.appendChild(actionField);
    
    // Додаємо команду, якщо вибрано "Видано"
    const teamField = document.createElement("input");
    teamField.type = "hidden";
    teamField.name = "team";
    teamField.value = action === "Видано" ? team : "";
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
    setOriginalProductName("");
    setProductCode("");
    setStation("Склад");
    setAction(actionOptions["Склад"][0] || "");
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
      // Перевірка обмежень відбувається в useEffect
    } else if (e.target.value === "") {
      setQuantity("");
    }
  };

  // Обробник для зміни "Станція"
  const handleStationChange = (e) => {
    const newStation = e.target.value;
    setStation(newStation);
    // Встановлюємо першу доступну опцію для "Дія"
    if (actionOptions[newStation] && actionOptions[newStation].length > 0) {
      setAction(actionOptions[newStation][0]);
    } else {
      setAction("");
    }
  };

  // Обробник для зміни Новий Товар
  const handleNewItemChange = (e) => {
    const isNew = e.target.checked;
    setIsNewItem(isNew);
  };

  // Перевіряємо, чи кнопка відправки має бути відключена
  const isSubmitDisabled = () => {
    if (isSubmitting || isRefreshing || quantity === "" || quantity < 1 || !productName || 
        (!isNewItem && !productCode)) {
      return true;
    }
    
    // Перевірка обмежень для існуючих товарів
    if (!isNewItem && stockInfo) {
      // Склад
      if (station === "Склад") {
        if ((action === "В Ремонт" || action === "Видано") && stockInfo.available < quantity) {
          return true;
        }
        if (action === "Прийнято Замовлення" && stockInfo.ordered < quantity) {
          return true;
        }
      }
      // Ремонт
      else if (station === "Ремонт") {
        if ((action === "Склад" || action === "Брак") && stockInfo.inRepair < quantity) {
          return true;
        }
      }
      // TODO: Додати перевірки для Виробництва
    }
    
    return false;
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
                
                {/* Додаємо інформацію про кількість в ремонті */}
                <div className="repair-info">
                  <span className="stock-label">В ремонті:</span>
                  <span className="stock-count">{stockInfo.inRepair}</span>
                </div>
                
                {/* Додаємо інформацію про замовлену кількість */}
                <div className="ordered-info">
                  <span className="stock-label">Замовлено:</span>
                  <span className="stock-count">{stockInfo.ordered}</span>
                </div>
              </div>
            )}
            
            {/* Станція */}
            <div className="option-group">
              <label htmlFor="station">Станція:</label>
              <select 
                id="station" 
                value={station} 
                onChange={handleStationChange}
                className="input-field"
              >
                <option value="Склад">Склад</option>
                <option value="Ремонт">Ремонт</option>
                <option value="Виробництво">Виробництво</option>
              </select>
            </div>
            
            {/* Дія */}
            <div className="option-group">
              <label htmlFor="action">Дія:</label>
              <select 
                id="action" 
                value={action} 
                onChange={(e) => setAction(e.target.value)}
                className="input-field"
                disabled={!station || !actionOptions[station] || actionOptions[station].length === 0}
              >
                {station && actionOptions[station]?.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Показувати вибір команди тільки якщо вибрано "Видано" */}
            {action === "Видано" && (
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
              disabled={isSubmitDisabled()}
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
          text-align: left;
        }
        .stock-badge, .repair-info, .ordered-info {
          display: block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .stock-badge {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .repair-info {
          background-color: #fff3e0;
          color: #e65100;
        }
        .ordered-info {
          background-color: #e3f2fd;
          color: #0d47a1;
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
