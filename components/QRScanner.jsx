import React, { useEffect, useState, useRef } from "react";
import ScannerView from "./ScannerView";
import ProductForm from "./ProductForm";
import LastEvents from "./LastEvents";
import { fetchStockInfo, fetchLastEvents } from "../utils/api";
import { parseQrData } from "../utils/qrParser";
import { actionOptions, validateQuantityConstraints, getAvailableActions } from "../utils/stockUtils";
import { submitFormData } from "../utils/formUtils";

export default function QRScanner() {
  // Add new state for camera permission
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  
  // Existing states...
  const [qrData, setQrData] = useState("Скануй QR-код...");
  const [productName, setProductName] = useState("");
  const [originalProductName, setOriginalProductName] = useState("");
  const [originalProductCode, setOriginalProductCode] = useState("");
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
  const [lastEvents, setLastEvents] = useState([]);
  
  // Refs
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    // Initialize scanner when scanning is true
    if (scanning) {
      initializeScanner();
    }
    
    // Update available actions based on station change
    if (station) {
      const availableActions = getAvailableActions(station);
      if (!availableActions.includes(action) && availableActions.length > 0) {
        setAction(availableActions[0]);
      }
    }
    
    // Cleanup on unmount or when scanning becomes false
    return () => {
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().then(() => {
            html5QrcodeRef.current.clear();
            html5QrcodeRef.current = null;
          }).catch(error => {
            console.error("Failed to stop camera:", error);
          });
        } catch (e) {
          console.log("Scanner cleanup error:", e);
        }
      }
    };
  }, [scanning, station, action]);

  // При зміні статусу "Новий товар", відновлюємо оригінальні дані
  useEffect(() => {
    if (!isNewItem) {
      setProductName(originalProductName);
      setProductCode(originalProductCode);
    }
  }, [isNewItem, originalProductName, originalProductCode]);

  // Перевіряємо обмеження кількості при зміні кількості, станції або дії
  useEffect(() => {
    if (stockInfo && !isNewItem) {
      validateQuantityConstraints(station, action, quantity, stockInfo, setError);
    }
  }, [quantity, station, action, stockInfo]);

  // Додаємо ефект для початкового завантаження подій
  useEffect(() => {
    refreshLastEvents();
  }, []);

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
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      }

      const { Html5Qrcode } = await import("html5-qrcode");
      
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
      }
    } catch (err) {
      console.error("Помилка ініціалізації сканера:", err);
    }
  };

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
    setOriginalProductCode(parsedData.productCode); // Зберігаємо оригінальний код
    
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
      
      if (stockData.success) {
        setStockInfo({
          available: stockData.stock,
          inRepair: stockData.inRepair,
          ordered: stockData.ordered,
          inProduction: stockData.inProduction,
          code: stockData.code,
          found: stockData.found
        });
        setStatus("");
        setError(null);
        
        // Перевіряємо обмеження кількості з новими даними
        setTimeout(() => validateQuantityConstraints(station, action, quantity, stockInfo, setError), 100);
      } else {
        setStockInfo(null);
        setStatus("");
        setError(stockData.error || "Не вдалося отримати дані про наявність товару");
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

  // Функція для оновлення останніх подій
  const refreshLastEvents = async () => {
    try {
      const data = await fetchLastEvents();
      if (data && data.success && data.events) {
        setLastEvents(data.events);
      }
    } catch (error) {
      console.error("Помилка при отриманні останніх подій:", error);
    }
  };

  // Функція для перевірки прийняття замовлення
  const checkOrderReceived = (onConfirm, onCancel) => {
    // Перевірка чи це прийняття замовлення і чи перевищує кількість замовлену
    if (station === "Склад" && action === "Прийнято Замовлення" && 
        stockInfo && stockInfo.ordered > 0 && quantity > stockInfo.ordered) {
      
      // Показуємо діалогове вікно з попередженням
      setError(null);
      setIsSubmitting(true);
      setStatus("Відправка даних прийняття замовлення...");
      
      // 1. Спочатку відправляємо прийняття замовлення на кількість, яка була замовлена
      const orderFormData = {
        timestamp: new Date().toISOString(),
        productName: productName,
        productCode: isNewItem ? "" : productCode,
        station: "Склад",
        action: "Прийнято Замовлення",
        team: "",
        quantity: String(stockInfo.ordered),
        isNewItem: "Ні"
      };
      
      submitFormData(orderFormData, "hidden-iframe");
      
      // 2. Через невелику затримку відправляємо корекцію на різницю
      setTimeout(() => {
        setStatus("Відправка даних корекції...");
        
        const correctionFormData = {
          timestamp: new Date().toISOString(),
          productName: productName,
          productCode: isNewItem ? "" : productCode,
          station: "Склад",
          action: "Корекція",
          team: "",
          quantity: String(quantity - stockInfo.ordered),
          isNewItem: "Ні"
        };
        
        submitFormData(correctionFormData, "hidden-iframe");
        
        // 3. Після всіх відправок оновлюємо дані
        setTimeout(() => {
          refreshStockInfo();
          refreshLastEvents();
          setStatus("Всі дані відправлено");
          setIsSubmitting(false);
        }, 3000);
      }, 3000);
      
      return true;
    }
    
    return null;
  };

  // Функція для обробки натискання кнопки "Скасувати"
  const handleCancel = () => {
    setQuantity(stockInfo.ordered);
    setError(null);
  };

  // Основна функція відправки даних
  const sendToGoogleSheets = (withCorrection = false) => {
    setError(null);
    setStatus("Відправка даних...");
    setIsSubmitting(true);

    if (withCorrection && stockInfo && stockInfo.ordered > 0 && quantity > stockInfo.ordered) {
      // 1. Спочатку відправляємо прийняття замовлення на кількість, яка була замовлена
      const orderFormData = {
        timestamp: new Date().toISOString(),
        productName: productName,
        productCode: isNewItem ? "" : productCode,
        station: "Склад",
        action: "Прийнято Замовлення",
        team: "",
        quantity: String(stockInfo.ordered),
        isNewItem: "Ні"
      };
      
      submitFormData(orderFormData, "hidden-iframe");
      
      // 2. Через невелику затримку відправляємо корекцію на різницю
      setTimeout(() => {
        setStatus("Відправка даних корекції...");
        
        const correctionFormData = {
          timestamp: new Date().toISOString(),
          productName: productName,
          productCode: isNewItem ? "" : productCode,
          station: "Склад",
          action: "Корекція",
          team: "",
          quantity: String(quantity - stockInfo.ordered),
          isNewItem: "Ні"
        };
        
        submitFormData(correctionFormData, "hidden-iframe");
        
        // 3. Після всіх відправок оновлюємо дані
        setTimeout(() => {
          refreshStockInfo();
          refreshLastEvents();
          setStatus("Всі дані відправлено");
          setIsSubmitting(false);
        }, 3000);
      }, 3000);
    } else {
      // Звичайна відправка даних
      const formData = {
        timestamp: new Date().toISOString(),
        productName: productName,
        productCode: isNewItem ? "" : productCode,
        station: station,
        action: action,
        team: action === "Видано" ? team : "",
        quantity: String(quantity),
        isNewItem: isNewItem ? "Так" : "Ні"
      };
      
      submitFormData(formData, "hidden-iframe");
      
      setTimeout(() => {
        if (!isNewItem && productCode !== "XXXXXX") {
          refreshStockInfo();
        }
        refreshLastEvents();
        setStatus("Дані відправлено");
        setIsSubmitting(false);
      }, 3000);
    }
  };
  
  const scanAgain = () => {
    // Reset states
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
    
    // Set scanning to true last to trigger the useEffect
    setScanning(true);
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
    const actions = getAvailableActions(newStation);
    if (actions.length > 0) {
      setAction(actions[0]);
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
        <>
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
            actionOptions={(station) => getAvailableActions(station, stockInfo)}
            isSubmitting={isSubmitting}
            isRefreshing={isRefreshing}
            refreshStockInfo={refreshStockInfo}
            sendToGoogleSheets={sendToGoogleSheets}
            scanAgain={scanAgain}
            isSubmitDisabled={isSubmitDisabled}
          />
          <LastEvents events={lastEvents} />
        </>
      )}
    </div>
  );
}
