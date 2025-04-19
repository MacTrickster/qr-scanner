// URL вашого Google Apps Script
const scriptUrl = "https://script.google.com/macros/s/AKfycbzjVWYJOJQmf2VYUVYc7OaxjeMkMdPWV4zUXoqSNtYYh7vgao91ZdGrqnPbcaYbKioweA/exec";

// Функція для безпечного видалення скрипта
const safeRemoveScript = (script, callbackName) => {
  try {
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    if (callbackName && window[callbackName]) {
      delete window[callbackName];
    }
  } catch (e) {
    console.error('Помилка при видаленні скрипта:', e);
  }
};

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
    return new Promise((resolve) => {
      // Створюємо унікальне ім'я для колбеку
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000000);
      const callbackName = `jsonpCallback_${timestamp}_${random}`;
      
      // Створюємо елемент скрипта
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      
      // Створюємо функцію зворотного виклику з валідацією даних
      window[callbackName] = (data) => {
        try {
          safeRemoveScript(script, callbackName);
          
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
        safeRemoveScript(script, callbackName);
        resolve({
          success: false,
          error: "Не вдалося отримати дані про наявність товару"
        });
      };
      
      // Створюємо URL запиту з правильним кодуванням
      const cleanCode = encodeURIComponent(code.trim());
      const url = `${scriptUrl}?action=getInventory&code=${cleanCode}&callback=${callbackName}`;
      console.log("Відправляємо запит:", url);
      
      // Встановлюємо атрибути та додаємо скрипт
      script.src = url;
      
      // Перевіряємо готовність DOM
      if (document.body) {
        document.body.appendChild(script);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(script);
        });
      }
      
      // Встановлюємо таймаут для запиту
      setTimeout(() => {
        if (window[callbackName]) {
          console.error("Таймаут запиту");
          safeRemoveScript(script, callbackName);
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
    return new Promise((resolve) => {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000000);
      const callbackName = `jsonpCallback_${timestamp}_${random}`;
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      
      window[callbackName] = (data) => {
        safeRemoveScript(script, callbackName);
        resolve(data);
      };
      
      script.onerror = () => {
        console.error("Помилка завантаження скрипта для подій");
        safeRemoveScript(script, callbackName);
        resolve({
          success: false,
          error: "Не вдалося отримати останні події"
        });
      };
      
      const url = `${scriptUrl}?action=getLastEvents&callback=${callbackName}`;
      script.src = url;
      
      if (document.body) {
        document.body.appendChild(script);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(script);
        });
      }
      
      setTimeout(() => {
        if (window[callbackName]) {
          console.error("Таймаут запиту подій");
          safeRemoveScript(script, callbackName);
          resolve({
            success: false,
            error: "Час очікування запиту вичерпано"
          });
        }
      }, 10000);
    });
  } catch (error) {
    console.error("Помилка при отриманні останніх подій:", error);
    return {
      success: false,
      error: "Внутрішня помилка при отриманні останніх подій"
    };
  }
};
