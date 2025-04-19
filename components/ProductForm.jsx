import React, { useEffect, useState } from "react";
import StockInfoDisplay from "./StockInfoDisplay";
import FormControls from "./FormControls";

const OrderWarning = ({ quantity, ordered, onConfirm, onCancel }) => (
  <div className="warning">
    <div>
      Ви точно отримали більше, ніж замовили?
      <br />
      Замовлено: {ordered}
      <br />
      Вказано прийнято: {quantity}
    </div>
    <div className="warning-actions">
      <button className="warning-button cancel" onClick={onCancel}>
        Скасувати
      </button>
      <button className="warning-button confirm" onClick={onConfirm}>
        Підтвердити
      </button>
    </div>
  </div>
);

export default function ProductForm({
  productName,
  setProductName,
  productCode,
  setProductCode,
  isNewItem,
  setIsNewItem,
  stockInfo,
  station,
  action,
  setAction,
  quantity,
  team,
  setTeam,
  status,
  error,
  handleStationChange,
  handleQuantityChange,
  actionOptions,
  isSubmitting,
  isRefreshing,
  refreshStockInfo,
  sendToGoogleSheets,
  scanAgain,
  isSubmitDisabled
}) {
  const [showOrderWarning, setShowOrderWarning] = useState(false);
  const [warningConfirmed, setWarningConfirmed] = useState(false);

  // Додаємо ефект для зміни коду при зміні статусу нового товару
  useEffect(() => {
    if (isNewItem) {
      setProductCode("XXXXXX");
    }
  }, [isNewItem, setProductCode]);

  // Ефект для відслідковування зміни кількості
  useEffect(() => {
    if (!isNewItem && station === "Склад" && 
        action === "Прийнято Замовлення" && 
        stockInfo && stockInfo.ordered > 0 && 
        quantity > stockInfo.ordered) {
      setShowOrderWarning(true);
      setWarningConfirmed(false);
    } else {
      setShowOrderWarning(false);
    }
  }, [quantity, stockInfo, isNewItem, station, action]);

  const handleOrderConfirm = () => {
    setWarningConfirmed(true);
    setShowOrderWarning(false);
  };

  const handleOrderCancel = () => {
    handleQuantityChange({ target: { value: stockInfo.ordered } });
    setShowOrderWarning(false);
  };

  // Розширена перевірка для відключення кнопки
  const isButtonDisabled = () => {
    return isSubmitDisabled() || (showOrderWarning && !warningConfirmed);
  };

  const handleSubmit = () => {
    if (warningConfirmed) {
      // Відправляємо дані з корекцією
      sendToGoogleSheets(true);
      setWarningConfirmed(false);
    } else {
      // Звичайна відправка
      sendToGoogleSheets(false);
    }
  };

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
        
        {/* Галочка "Новий товар" */}
        <div className="option-group checkbox-group">
          <label htmlFor="isNewItem">Новий товар:</label>
          <input
            id="isNewItem"
            type="checkbox"
            checked={isNewItem}
            onChange={setIsNewItem}
            className="checkbox-field"
          />
        </div>
        
        {/* Відображення інформації про запаси */}
        {stockInfo && !isNewItem && (
          <StockInfoDisplay stockInfo={stockInfo} />
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
          >
            {actionOptions(station)?.map((option, index) => (
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
      
      {/* Відображення попередження для прийняття замовлення */}
      {showOrderWarning ? (
        <OrderWarning
          quantity={quantity}
          ordered={stockInfo.ordered}
          onConfirm={handleOrderConfirm}
          onCancel={handleOrderCancel}
        />
      ) : error ? (
        <p className="error">{error}</p>
      ) : null}
      
      <FormControls
        isSubmitting={isSubmitting}
        isRefreshing={isRefreshing}
        isNewItem={isNewItem}
        productCode={productCode}
        isSubmitDisabled={isButtonDisabled}
        sendToGoogleSheets={handleSubmit}
        refreshStockInfo={refreshStockInfo}
        scanAgain={scanAgain}
      />
    </div>
  );
}
