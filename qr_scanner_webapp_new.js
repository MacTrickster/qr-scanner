import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useState, useRef } from "react";

export default function QRScanner() {
  // Основний компонент - почнемо з вибору методу введення
  const [inputMethod, setInputMethod] = useState("choice"); // "choice", "manual", "scanner", "details"
  
  // Стан для даних товару та сканера
  const [qrData, setQrData] = useState("");
  const [productName, setProductName] = useState("");
  const [originalProductName, setOriginalProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [manualProductCode, setManualProductCode] = useState("");
  const [scanning, setScanning] = useState(false);
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
  
  // Референси
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  
  // URL Google Apps Script
  const scriptUrl = "https://script.google.com/macros/s/AKfycbxkVmlNC0LLTAiRv5h4trEObR5AOvH8kpz6-XSRVo1sMMxhGLHPy6nFm-XlYMFWXFCnEw/exec";

  // Опції дій для різних станцій
  const actionOptions = {
    "Склад": ["Прийнято", "В Ремонт", "Видано", "Замовлено", "Прийнято Замовлення"],
    "Ремонт": ["Брак", "Склад"],
    "Виробництво": ["В Ремонт", "Залишки"]
  };
  
  // Функції для вибору методу введення
  const chooseManualEntry = () => {
    setInputMethod("manual");
    setError(null);
    setStatus("");
  };
  
  const chooseQrScanner = () => {
    setInputMethod("scanner");
    setScanning(true);
    setError(null);
    setStatus("");
  };
  
  // Пошук товару за введеним кодом
  const handleManualCodeSubmit = async () => {
    if (!manualProductCode.trim()) {
      setError("Будь ласка, введіть код товару.");
      return;
    }
    
    setIsRefreshing(true);
    setStatus("Пошук товару...");
    
    try {
      const stockData = await fetchStockInfo(manualProductCode);
      
      if (stockData && stockData.success && stockData.found) {
        // Товар знайдено, переходимо до деталей
        setProductCode(manualProductCode);
        setProductName(stockData.productName || "");
        setOriginalProductName(stockData.productName || "");
        setStockInfo({
          available: stockData.stock,
          inRepair: stockData.inRepair || 0,
          ordered: stockData.ordered || 0,
          inProduction: stockData.inProduction || 0,
          code: stockData.code,
          found: stockData.found
        });
        setIsNewItem(false);
        setInputMethod("details");
        setStatus("");
      } else {
        // Товар не знайдено, пропонуємо створити новий
        setError("Товар з таким кодом не знайдено в базі. Ви можете створити новий товар.");
        setProductCode(manualProductCode);
        setIsNewItem(true);
      }
    } catch (error) {
      console.error("Помилка при пошуку товару:", error);
      setError("Помилка при пошуку товару. Спробуйте знову.");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Продовження після створення нового товару
  const continueWithNewItem = () => {
    if (!productName.trim()) {
      setError("Будь ласка, введіть назву товару.");
      return;
    }
    
    setInputMethod("details");
    setError(null);
    setStatus("");
  };

  // Ініціалізація камери та контроль відображення при зміні станів
  useEffect(() => {
    if (scanning && inputMethod === "scanner" && !html5QrcodeRef.current) {
      initializeScanner();
    } else if (scanning && inputMethod === "scanner" && html5QrcodeRef.current) {
      startScanner();
    }
    
    // Встановлюємо правильні опції для дій
    if (station && actionOptions[station]) {
      const isCurrentActionAvailable = actionOptions[station].includes(action);
      if (!isCurrentActionAvailable && actionOptions[station].length > 0) {
        setAction(actionOptions[station][0]);
      }
    }
    
    // Очищення ресурсів при розмонтуванні
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
  }, [scanning, station, action, inputMethod]);

  // Відновлення оригінальної назви при знятті галочки "Новий товар"
  useEffect(() => {
    if (!isNewItem && originalProductName) {
      setProductName(originalProductName);
    }
  }, [isNewItem, originalProductName]);

  // Перевірка обмежень кількості при зміні параметрів
  useEffect(() => {
    if (stockInfo && !isNewItem) {
      validateQuantityConstraints();
    }
  }, [quantity, station, action, stockInfo]);

  // Функція для перевірки обмежень кількості
  const validateQuantityConstraints = () => {
    if (!stockInfo) return true;
    
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
    // Перевірка для Виробництва
    else if (station === "Виробництво") {
      if ((action === "В Ремонт" || action === "Залишки") && stockInfo.inProduction < quantity) {
        setError(`Недостатньо товару в роботі! Наявно: ${stockInfo.inProduction}, запитано: ${quantity}`);
        return false;
      }
    }
    
    // Якщо всі перевірки пройдені
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
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
        
        window[callbackName] = (data) => {
          document.body.removeChild(script);
          delete window[callbackName];
          resolve(data);
        };
        
        script.onerror = () => {
          document.body.removeChild(script);
          delete window[callbackName];
          reject(new Error("Не вдалося отримати дані про товар"));
        };
        
        const url = `${scriptUrl}?action=getInventory&code=${encodeURIComponent(code)}&callback=${callbackName}`;
        script.src = url;
        
        document.body.appendChild(script);
        
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

  // Ініціалізація сканера
  const initializeScanner = async () => {
    try {
      html5QrcodeRef.current = new Html5Qrcode("reader");
      
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length) {
        let selectedDeviceId = devices[0].id;
        
        for (const device of devices) {
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
        setInputMethod("manual");
      }
    } catch (err) {
      console.error("Помилка ініціалізації сканера:", err);
      setInputMethod("manual");
    }
  };

  // Запуск сканера
  const startScanner = (deviceId = null) => {
    if (!html5QrcodeRef.current) return;
    
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
      processQrData(decodedText);
      setScanning(false);
      
      html5QrcodeRef.current.stop().catch(error => {
        console.error("Failed to stop camera:", error);
      });
    };
    
    const qrCodeErrorCallback = (error) => {
      // Ігноруємо помилки сканування
    };
    
    if (deviceId) {
      html5QrcodeRef.current.start(
        { deviceId: { exact: deviceId } },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch((err) => {
        console.error("Помилка запуску камери:", err);
        
        html5QrcodeRef.current.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        ).catch((err2) => {
          console.error("Помилка запуску камери за замовчуванням:", err2);
          setInputMethod("manual");
        });
      });
    } else {
      html5QrcodeRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch((err) => {
        console.error("Помилка запуску камери за замовчуванням:", err);
        setInputMethod("manual");
      });
    }
  };

  // Обробка даних після сканування QR-коду
  const processQrData = async (newQrData) => {
    setQrData(newQrData);
    
    const parsedData = parseQrData(newQrData);
    setProductName(parsedData.productName);
    setOriginalProductName(parsedData.productName);
    setProductCode(parsedData.productCode);
    
    if (parsedData.productCode) {
      await refreshStockInfo(parsedData.productCode);
      setInputMethod("details");
    } else {
      setError("QR-код не містить коду товару. Спробуйте інший QR-код або введіть код вручну.");
      setInputMethod("choice");
    }
  };

  // Оновлення інформації про запаси
  const refreshStockInfo = async (code = null) => {
    const productCodeToUse = code || productCode;
    if (!productCodeToUse) {
      setError("Код товару відсутній. Спочатку відскануйте QR-код або введіть код вручну.");
      return;
    }

    try {
      setIsRefreshing(true);
      setStatus("Отримання даних про наявність...");
      const stockData = await fetchStockInfo(productCodeToUse);
      
      if (stockData && stockData.success) {
        setStockInfo({
          available: stockData.stock,
          inRepair: stockData.inRepair || 0,
          ordered: stockData.ordered || 0,
          inProduction: stockData.inProduction || 0,
          code: stockData.code,
          found: stockData.found
        });
        
        // Якщо отримали назву товару від API, оновлюємо її
        if (stockData.productName && !isNewItem) {
          setProductName(stockData.productName);
          setOriginalProductName(stockData.productName);
        }
        
        setStatus("");
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

  // Відправка даних
  const sendToGoogleSheets = () => {
    if (!validateQuantityConstraints()) {
      return;
    }
    
    setError(null);
    setStatus("Відправка даних...");
    setIsSubmitting(true);
    
    const form = document.createElement("form");
    form.method = "POST";
    form.action = scriptUrl;
    form.target = "hidden-iframe";
    
    // Додаємо поля форми
    const addField = (name, value) => {
      const field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      field.value = value;
      form.appendChild(field);
    };
    
    addField("timestamp", new Date().toISOString());
    addField("productName", productName);
    addField("productCode", isNewItem ? "" : productCode);
    addField("station", station);
    addField("action", action);
    addField("team", action === "Видано" ? team : "");
    addField("quantity", quantity);
    addField("isNewItem", isNewItem ? "Так" : "Ні");
    
    document.body.appendChild(form);
    form.submit();
    
    setTimeout(() => {
      refreshStockInfo();
      setStatus("Дані відправлено");
      setIsSubmitting(false);
    }, 3000);
    
    document.body.removeChild(form);
  };
  
  // Повернення до початкового стану
  const scanAgain = () => {
    setInputMethod("choice");
    setScanning(false);
    setStatus("");
    setError(null);
    setQrData("");
    setProductName("");
    setOriginalProductName("");
    setProductCode("");
    setManualProductCode("");
    setStation("Склад");
    setAction(actionOptions["Склад"][0] || "");
    setQuantity(1);
    setTeam("Команді A");
    setIsNewItem(false);
    setStockInfo(null);
  };

  // Обробка зміни кількості
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    } else if (e.target.value === "") {
      setQuantity("");
    }
  };

  // Обробка зміни станції
  const handleStationChange = (e) => {
    const newStation = e.target.value;
    setStation(newStation);
    
    if (actionOptions[newStation] && actionOptions[newStation].length > 0) {
      setAction(actionOptions[newStation][0]);
    } else {
      setAction("");
    }
  };

  // Обробка зміни статусу "Новий товар"
  const handleNewItemChange = (e) => {
    setIsNewItem(e.target.checked);
  };

  // Перевірка чи кнопка відправки має бути відключена
  const isSubmitDisabled = () => {
    if (isSubmitting || isRefreshing || quantity === "" || quantity < 1 || !productName || 
        (!isNewItem && !productCode)) {
      return true;
    }
    
    if (!isNewItem && stockInfo) {
      if (station === "Склад") {
        if ((action === "В Ремонт" || action === "Видано") && stockInfo.available < quantity) {
          return true;
        }
        if (action === "Прийнято Замовлення" && stockInfo.ordered < quantity) {
          return true;
        }
      } else if (station === "Ремонт") {
        if ((action === "Склад" || action === "Брак") && stockInfo.inRepair < quantity) {
          return true;
        }
      } else if (station === "Виробництво") {
        if ((action === "В Ремонт" || action === "Залишки") && stockInfo.inProduction < quantity) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Рендеринг контенту в залежності від обраного методу
  const renderContent = () => {
    switch (inputMethod) {
      case "choice":
        return (
          <div className="choice-container">
            <h2>Оберіть спосіб введення даних:</h2>
            <div className="method-buttons">
              <button className="manual-btn" onClick={chooseManualEntry}>
                ⌨️ Введення коду вручну
              </button>
              <button className="scan-btn" onClick={chooseQrScanner}>
                📷 Сканувати QR-код
              </button>
            </div>
          </div>
        );
        
      case "manual":
        return (
          <div className="manual-entry-container">
            <h2>Введіть код товару:</h2>
            <div className="manual-input-group">
              <input
                type="text"
                value={manualProductCode}
                onChange={(e) => setManualProductCode(e.target.value)}
                className="input-field code-field"
                placeholder="Введіть код товару"
              />
              <button 
                onClick={handleManualCodeSubmit}
                disabled={isRefreshing || !manualProductCode.trim()}
                className="submit-btn"
              >
                {isRefreshing ? "Пошук..." : "Пошук товару"}
              </button>
            </div>
            
            {isNewItem && (
              <div className="new-item-container">
                <p>Створення нового товару з кодом: <strong>{productCode}</strong></p>
                <div className="manual-input-group">
                  <label htmlFor="newProductName">Назва товару:</label>
                  <input
                    id="newProductName"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="input-field name-field"
                    placeholder="Введіть назву товару"
                  />
                </div>
                <button 
                  onClick={continueWithNewItem}
                  disabled={!productName.trim()}
                  className="continue-btn"
                >
                  Продовжити
                </button>
              </div>
            )}
            
            <button onClick={scanAgain} className="back-btn">
              ⬅️ Назад
            </button>
          </div>
        );
        
      case "scanner":
        return (
          <div>
            <div id="reader" ref={scannerRef}></div>
            <p className="instruction">Наведіть камеру на QR-код для сканування</p>
            <button onClick={scanAgain} className="back-btn">
              ⬅️ Назад
            </button>
          </div>
        );
        
      case "details":
        return (
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
                  readOnly={!isNewItem}
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
              
              {/* Код товару */}
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
                    {stockInfo.available > 0 && stockInfo.available < 5 && 
                      <span className="stock-warning"> (Мало на складі!)</span>}
                  </div>
                  
                  <div className="repair-info">
                    <span className="stock-label">В ремонті:</span>
                    <span className="stock-count">{stockInfo.inRepair}</span>
                  </div>
                  
                  <div className="ordered-info">
                    <span className="stock-label">Замовлено:</span>
                    <span className="stock-count">{stockInfo.ordered}</span>
                  </div>
                  
                  <div className="production-info">
                    <span className="stock-label">В роботі:</span>
                    <span className="stock-count">{stockInfo.inProduction}</span>
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
        );
        
      default:
        return <div>Помилка: Невідомий режим</div>;
    }
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
      
      {/* Основний вміст - змінюється на основі inputMethod */}
      {renderContent()}
      
      {/* Відображення помилок загальних для всіх екранів */}
      {error && inputMethod !== "details" && inputMethod !== "manual" && (
        <p className="error">{error}</p>
      )}
      
      <style jsx>{`
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        h1, h2 {
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
        .choice-container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .manual-entry-container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .new-item-container {
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        .method-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 20px;
        }
        .manual-input-group {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 10px;
        }
        .manual-input-group label {
          min-width: 120px;
          text-align: left;
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
        .stock-badge, .repair-info, .ordered-info, .production-info {
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
        .production-info {
          background-color: #f0f4c3;
          color: #827717;
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
        .submit-btn, .manual-btn, .continue-btn {
          background-color: #4285f4;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .submit-btn:hover, .manual-btn:hover, .continue-btn:hover {
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
        .back-btn {
          background-color: #9e9e9e;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
          margin-top: 15px;
        }
        .back-btn:hover {
          background-color: #757575;
        }
        .submit-btn:disabled, .refresh-btn:disabled, .scan-btn:disabled, .manual-btn:disabled, .continue-btn:disabled, .back-btn:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
