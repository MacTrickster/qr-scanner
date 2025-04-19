// URL вашого Google Apps Script
const scriptUrl = "https://script.google.com/macros/s/AKfycbxPvG_dVuA5CO3R8qKj2TwQWPyyq2cKvWZQaZ865pn3Aoym5Nmuv4iG_3yeT3_hlueJGQ/exec";

// Функція для отримання інформації про запаси
export const fetchStockInfo = async (code) => {
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
