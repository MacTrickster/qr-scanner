// Base action options
const baseActionOptions = {
  "Склад": ["Прийнято", "В Ремонт", "Видано", "Замовлено", "Прийнято Замовлення"],
  "Ремонт": ["Брак", "Склад"],
  "Виробництво": ["В Ремонт", "Залишки"]
};

// Function to get available actions based on stock info
export const getAvailableActions = (station) => {
  return baseActionOptions[station] || [];
};

// Визначення доступних дій для кожної станції
export const actionOptions = baseActionOptions;

// Функція для перевірки обмежень кількості
export const validateQuantityConstraints = (station, action, quantity, stockInfo, setError) => {
  if (!stockInfo) return true;
  
  // Перевірка для Складу
  if (station === "Склад") {
    if ((action === "В Ремонт" || action === "Видано") && stockInfo.available < quantity) {
      setError(`Недостатньо товару на складі! Наявно: ${stockInfo.available}, запитано: ${quantity}`);
      return false;
    } else if (action === "Прийнято Замовлення") {
      // Для "Прийнято Замовлення" ми не показуємо помилку,
      // навіть якщо кількість більша за замовлену
      setError(null);
      return true;
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
  
  // Якщо всі перевірки пройдені, скидаємо помилку
  setError(null);
  return true;
};
