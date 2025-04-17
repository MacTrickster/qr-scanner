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
  const [itemStatus, setItemStatus] = useState("Отримано");
  const [quantity, setQuantity] = useState(1);
  const [team, setTeam] = useState("Команді A");
  const [isNewItem, setIsNewItem] = useState(false);
  
  // Додаємо стан для локальної перевірки рівня запасів
  const [inventoryLevels, setInventoryLevels] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const iframeRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  
  // Google Apps Script web app URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbxa-PWsGflydroobArUMHfWPnPiYF687nk_31adV52fbCJvhMq2Y5iy7NYfQYv2a4E7Jw/exec";

  // При завантаженні компонента - отримати дані запасів
  useEffect(() => {
    fetchInventoryLevels();
  }, []);
  
  // При зміні статусу - також перевіряємо запаси
  useEffect(() => {
    if ((itemStatus === "Видано зі складу" || itemStatus === "Брак") && productCode) {
      checkInventoryLevel(productCode, quantity);
    } else {
      // Скидаємо помилку, якщо змінився статус на "Отримано"
      setError(null);
    }
  }, [itemStatus, productCode]);
  
  // При зміні кількості - перевіряємо запаси
  useEffect(() => {
    if ((itemStatus === "Видано зі складу" || itemStatus === "Брак") && productCode) {
      checkInventoryLevel(productCode, quantity);
    }
  }, [quantity]);

  // Функція для отримання даних запасів з Google Sheets
  const fetchInventoryLevels = async () => {
    setIsLoading(true);
    try {
      // Створюємо URL для запиту, додаємо параметр action=getInventory
      const fetchUrl = `${scriptUrl}?action=getInventory&_=${new Date().getTime()}`;
      
      // Використовуємо технiку JSONP для обходу CORS
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
        
        window[callbackName] = (data) => {
          setInventoryLevels(data.inventory || {});
          setIsLoading(false);
          document.body.removeChild(script);
          delete window[callbackName];
          resolve(data);
        };
        
        script.onerror = () => {
          setIsLoading(false);
          setError("Не вдалося отримати дані про запаси");
          document.body.removeChild(script);
          delete window[callbackName];
          reject();
        };
        
        script.src = `${fetchUrl}&callback=${callbackName}`;
        document.body.appendChild(script);
        
        // Встановлюємо таймаут
        setTimeout(() => {
          if (window[callbackName]) {
            setIsLoading(false);
            setError("Час очікування вичерпано при отриманні даних запасів");
            document.body.removeChild(script);
            delete window[callbackName];
            reject();
          }
        }, 10000);
      });
    } catch (err) {
      console.error("Помилка отримання запасів:", err);
      setError("Помилка отримання даних про запаси");
      setIsLoading(false);
    }
  };
  
  // Функція для перевірки наявності достатньої кількості товару
  const checkInventoryLevel = (code, qty) => {
    if (!code || !inventoryLevels) return;
    
    const stock = inventoryLevels[code];
    if (stock !== undefined) {
      if (stock < qty) {
        setError(`Недостатньо товару на складі! Наявно: ${stock}, запитано: ${qty}`);
      } else {
        setError(null);
      }
    } else {
      // Товар не знайдено в базі
      if (!isNewItem && (itemStatus === "Видано зі складу" || itemStatus === "Брак")) {
        setError("Товар не знайдено в базі. Відмітьте як 'Новий товар' або перевірте код");
      } else {
        setError(null);
      }
    }
  };

  useEffect(() => {
    // Ініціалізуємо сканер при першому завантаженні компонента
    if (scanning && !html5QrcodeRef.current) {
      initializeScanner();
    } else if (scanning && html5QrcodeRef.current) {
      // Якщо сканер вже був ініціалізований, просто запускаємо його знову
      startScanner();
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
  }, [scanning]);

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
      // Використовуємо оновлену функцію для обробки даних
      processQrData(decodedText);
      
      setScanning(false);
      
      // Зупиняємо сканер, але не видаляємо його екземпляр
      html5QrcodeRef.current.stop().catch(error => {
        console.error("Failed to stop camera:", error);
      });
    };
    
    const qrCodeErrorCallback = (error) => {
      // Ігноруємо помилки сканування, вони нормальні коли QR-код не видно
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

  // Відправка форми через традиційний метод
  const sendToGoogleSheets = () => {
    // Перевіряємо наявність достатньої кількості товару перед відправкою
    if ((itemStatus === "Видано зі складу" || itemStatus === "Брак") && productCode) {
      const stock = inventoryLevels[productCode];
      if (stock !== undefined && stock < quantity) {
        setError(`Недостатньо товару на складі! Наявно: ${stock}, запитано: ${quantity}`);
        return; // Не продовжуємо відправку, якщо недостатньо товару
      }
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
    
    // Додаємо код товару
    const codeField = document.createElement("input");
    codeField.type = "hidden";
    codeField.name = "productCode";
    codeField.value = productCode;
    form.appendChild(codeField);
    
    // Додаємо статус товару
    const statusField = document.createElement("input");
    statusField.type = "hidden";
    statusField.name = "itemStatus";
    statusField.value = itemStatus;
    form.appendChild(statusField);
    
    // Додаємо кількість
    const quantityField = document.createElement("input");
    quantityField.type = "hidden";
    quantityField.name = "quantity";
    quantityField.value = quantity;
    form.appendChild(quantityField);
    
    // Додаємо команду
    const teamField = document.createElement("input");
    teamField.type = "hidden";
    teamField.name = "team";
    teamField.value = itemStatus === "Видано зі складу" ? team : "";
    form.appendChild(teamField);
    
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
      // Оновлюємо запаси після відправки форми
      if (itemStatus === "Отримано") {
        // Оновлюємо локальний кеш запасів - збільшуємо
        if (productCode) {
          setInventoryLevels(prev => {
            const currentStock = prev[productCode] || 0;
            return {
              ...prev,
              [productCode]: currentStock + parseInt(quantity)
            };
          });
        }
      } else if (itemStatus === "Видано зі складу" || itemStatus === "Брак") {
        // Оновлюємо локальний кеш запасів - зменшуємо
        if (productCode) {
          setInventoryLevels(prev => {
            const currentStock = prev[productCode] || 0;
            return {
              ...prev,
              [productCode]: Math.max(0, currentStock - parseInt(quantity))
            };
          });
        }
      }
      
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
    setItemStatus("Отримано"); // Reset to default
    setQuantity(1); // Reset to default
    setTeam("Команді A"); // Reset to default team
    setIsNewItem(false); // Reset to default
  };

  // Handle quantity change with validation
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    } else if (e.target.value === "") {
      setQuantity("");
