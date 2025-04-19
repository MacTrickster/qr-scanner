// URL вашого Google Apps Script
const scriptUrl = "https://script.google.com/macros/s/AKfycbznzh5d2dszUzCfvs6JzmT3ujEHuLE3AauPsW6EuMp8hOCG9mYRR96gwlFfDy26gN2f8Q/exec";

// Функція для отримання інформації про запаси
export const fetchStockInfo = async (code) => {
  // Перевірка валідності коду товару
  if (!code || typeof code !== 'string') {
    console.error("Невалідний код товару:", code);
    return {
      success: false,
      error: "Невалідний код товару"
    };
  }

  try {
    // JSONP запит для обходу CORS
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
      
      // Створюємо функцію зворотного виклику з валідацією даних
      window[callbackName] = (data) => {
        try {
          document.body.removeChild(script);
          delete window[callbackName];
          
          console.log("Отримано відповідь від сервера:", data);
          
          // Перевіряємо наявність помилки у відповіді
          if (data && data.error) {
            console.error("Помилка від сервера:", data.error);
            resolve({
              success: false,
              error: data.error
            });
            return;
          }
          
          // Перевіряємо структуру отриманих даних
          if (!data || typeof data !== 'object') {
            console.error("Отримано невалідні дані:", data);
            resolve({
              success: false,
              error: "Отримано невалідні дані"
            });
            return;
          }

          // Нормалізуємо дані
          const response = {
            success: true,
            code: code,
            stock: parseInt(data.stock) || 0,
            inRepair: parseInt(data.inRepair) || 0,
            ordered: parseInt(data.ordered) || 0,
            inProduction: parseInt(data.inProduction) || 0,
            found: !!data.found
          };

          console.log("Нормалізовані дані:", response);
          resolve(response);
        } catch (error) {
          console.error("Помилка при обробці відповіді:", error);
          resolve({
            success: false,
            error: "Помилка при обробці відповіді"
          });
        }
      };
      
      // Обробка помилок
      script.onerror = (error) => {
        console.error("Помилка завантаження скрипта:", error);
        document.body.removeChild(script);
        delete window[callbackName];
        resolve({
          success: false,
          error: "Не вдалося отримати дані про наявність товару"
        });
      };
      
      // Створюємо URL запиту з правильним кодуванням
      const cleanCode = encodeURIComponent(code.trim());
      const url = `${scriptUrl}?action=getInventory&code=${cleanCode}&callback=${callbackName}`;
      console.log("Відправляємо запит:", url);
      script.src = url;
      
      // Додаємо скрипт до документа
      document.body.appendChild(script);
      
      // Встановлюємо таймаут для запиту
      setTimeout(() => {
        if (window[callbackName]) {
          console.error("Таймаут запиту");
          document.body.removeChild(script);
          delete window[callbackName];
          resolve({
            success: false,
            error: "Час очікування запиту вичерпано"
          });
        }
      }, 10000);
    });
  } catch (error) {
    console.error("Помилка при отриманні даних про запаси:", error);
    return {
      success: false,
      error: "Внутрішня помилка при отриманні даних"
    };
  }
};

// Функція для отримання останніх подій
export const fetchLastEvents = async () => {
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
        reject(new Error("Не вдалося отримати останні події"));
      };
      
      const url = `${scriptUrl}?action=getLastEvents&callback=${callbackName}`;
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
    console.error("Помилка при отриманні останніх подій:", error);
    throw error;
  }
};
