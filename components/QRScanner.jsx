import React, { useEffect, useState, useRef } from "react";
import ScannerView from "./ScannerView";
import ProductForm from "./ProductForm";
import { fetchStockInfo } from "../utils/api";
import { parseQrData } from "../utils/qrParser";
import { actionOptions, validateQuantityConstraints } from "../utils/stockUtils";
import { submitFormData } from "../utils/formUtils";

const scriptUrl = "https://script.google.com/macros/s/AKfycbxPvG_dVuA5CO3R8qKj2TwQWPyyq2cKvWZQaZ865pn3Aoym5Nmuv4iG_3yeT3_hlueJGQ/exec";

export default function QRScanner() {
  // Стани
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
  
  // Refs
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

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
      validateQuantityConstraints(station, action, quantity, stockInfo, setError);
    }
  }, [quantity, station, action, stockInfo]);

  // Функція для пропуску сканера і створення нового товару
  const skipScanner = () => {
    setScanning(false);
    setProductCode("XXXXXX");
    setProductName("");
    setIsNewItem(true); // Автоматично встановлюємо "Новий товар"
    setStockInfo({
      available: 0,
      inRepair: 0,
      ordered: 0,
      inProduction: 0,
      code: "XXXXXX",
      found: false
    });
  };

  const initializeScanner = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      // Створюємо екземпляр Html5Qrcode
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
    if (!productCodeToUse || productCodeToUse === "XXXXXX") {
      // Для нових товарів без коду не робимо запит
      if (productCodeToUse === "XXXXXX") {
        return;
      }
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
          inProduction: stockData.inProduction || 0, // В роботі (колонка E)
          code: stockData.code,
          found: stockData.found
        });
        setStatus("");
        
        // Перевіряємо обмеження кількості з новими даними
        setTimeout(() => validateQuantityConstraints(station, action, quantity, stockInfo, setError), 100);
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

  // Функція для перевірки прийняття замовлення
  const checkOrderReceived = () => {
    // Перевірка чи це прийняття замовлення і чи перевищує кількість замовлену
    if (station === "Склад" && action === "Прийнято Замовлення" && 
        stockInfo && stockInfo.ordered > 0 && quantity > stockInfo.ordered) {
      
      // Показуємо діалогове вікно з питанням
      if (confirm(`Ви точно отримали більше, ніж замовили? 
Замовлено: ${stockInfo.ordered}
Вказано прийнято: ${quantity}

Натисніть "OK" щоб прийняти ${quantity} і додати корекцію на ${quantity - stockInfo.ordered}.
Натисніть "Скасувати" щоб повернутися до форми.`)) {
        
        // Користувач підтвердив - надсилаємо два запити
        // 1. Прийняття повної кількості
        sendOrderToGoogleSheets(quantity);
        // 2. Корекція на різницю
        
        setTimeout(() => {
          sendCorrectionToGoogleSheets(quantity - stockInfo.ordered);
        }, 6000); // Затримка в 6 секунд між запитами
        
        return true; // Повертаємо true, оскільки запит(и) вже відправлені
      } else {
        // Користувач відмовився - повертаємося до форми
        return false;
      }
    }
    
    // В інших випадках просто продовжуємо звичайну відправку
    return null;
  };

  // Функція для відправки замовленої кількості
  const sendOrderToGoogleSheets = (orderQuantity) => {
    setError(null);
    setStatus("Відправка даних прийняття замовлення...");
    setIsSubmitting(true);
    
    const formData = {
      timestamp: new Date().toISOString(),
      productName: productName,
      productCode: isNewItem ? "" : productCode,
      station: station,
      action: action,
      team: "",
      quantity: String(orderQuantity), // Явно конвертуємо в рядок
      isNewItem: isNewItem ? "Так" : "Ні"
    };
    
    submitFormData(formData, "hidden-iframe");
    
    // Set timeout for status update
    setTimeout(() => {
      refreshStockInfo();
      setStatus("Дані відправлено");
      setIsSubmitting(false);
    }, 3000);
  };

  // Функція для відправки корекції
  const sendCorrectionToGoogleSheets = (correctionQuantity) => {
    setStatus("Відправка даних корекції...");
    
    const formData = {
      timestamp: new Date().toISOString(),
      productName: productName,
      productCode: isNewItem ? "" : productCode,
      station: "Склад",
      action: "Корекція", // Спеціальна дія для корекції
      team: "",
      quantity: String(correctionQuantity), // Явно конвертуємо в рядок
      isNewItem: "Ні"
    };
    
    console.log("Відправляємо корекцію з кількістю:", correctionQuantity);
    
    submitFormData(formData, "hidden-iframe");
    
    // Set timeout for status update
    setTimeout(() => {
      refreshStockInfo();
      setStatus("Дані відправлено");
      setIsSubmitting(false);
    }, 3000);
  };

  // Основна функція відправки даних
  const sendToGoogleSheets = () => {
    // Для нових товарів не перевіряємо обмеження кількості
    if (!isNewItem) {
      // Перевіряємо обмеження переміщень на основі наявності
      if (!validateQuantityConstraints(station, action, quantity, stockInfo, setError)) {
        return; // Не продовжуємо, якщо не пройшли перевірку
      }
      
      // Перевірка на прийняття замовлення більше ніж замовлено
      const orderCheckResult = checkOrderReceived();
      if (orderCheckResult === false) {
        return; // Користувач відмовився від підтвердження
      } else if (orderCheckResult === true) {
        return; // Запити вже відправлені в функції checkOrderReceived
      }
      // Якщо orderCheckResult === null, продовжуємо звичайну відправку
    }
    
    setError(null);
    setStatus("Відправка даних...");
    setIsSubmitting(true);
    
    const formData = {
      timestamp: new Date().toISOString(),
      productName: productName,
      productCode: isNewItem ? "" : productCode,
      station: station,
      action: action,
      team: action === "Видано" ? team : "",
      quantity: String(quantity), // Явно конвертуємо в рядок
      isNewItem: isNewItem ? "Так" : "Ні"
    };
    
    submitFormData(formData, "hidden-iframe");
    
    // Set timeout for status update
    setTimeout(() => {
      // Оновлюємо дані про запаси після відправки
      if (!isNewItem && productCode !== "XXXXXX") {
        refreshStockInfo();
      }
      
      setStatus("Дані відправлено");
      setIsSubmitting(false);
    }, 3000);
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
    if (isSubmitting || isRefreshing || quantity === "" || quantity < 1 || !productName) {
      return true;
    }
    
    // Для нових товарів не перевіряємо обмеження кількості
    if (!isNewItem) {
      // Перевірка обмежень для існуючих товарів
      if (stockInfo) {
        // Склад
        if (station === "Склад") {
          if ((action === "В Ремонт" || action === "Видано") && stockInfo.available < quantity) {
            return true;
          }
          // Для "Прийнято Замовлення" ми дозволяємо перевищувати кількість, тому тут не перевіряємо
        }
        // Ремонт
        else if (station === "Ремонт") {
          if ((action === "Склад" || action === "Брак") && stockInfo.inRepair < quantity) {
            return true;
          }
        }
        // Виробництво
        else if (station === "Виробництво") {
          if ((action === "В Ремонт" || action === "Залишки") && stockInfo.inProduction < quantity) {
            return true;
          }
        }
      }
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
      />
      
      {scanning ? (
        <ScannerView 
          scannerRef={scannerRef}
          skipScanner={skipScanner}
        />
      ) : (
        <ProductForm 
          productName={productName}
          setProductName={setProductName}
          productCode={productCode}
          setProductCode={setProductCode}
          isNewItem={isNewItem}
          setIsNewItem={(e) => handleNewItemChange(e)}
          stockInfo={stockInfo}
          station={station}
          action={action}
          setAction={setAction}
          quantity={quantity}
          team={team}
          setTeam={setTeam}
          status={status}
          error={error}
          handleStationChange={handleStationChange}
          handleQuantityChange={handleQuantityChange}
          actionOptions={actionOptions}
          isSubmitting={isSubmitting}
          isRefreshing={isRefreshing}
          refreshStockInfo={refreshStockInfo}
          sendToGoogleSheets={sendToGoogleSheets}
          scanAgain={scanAgain}
          isSubmitDisabled={isSubmitDisabled}
        />
      )}
    </div>
  );
}
