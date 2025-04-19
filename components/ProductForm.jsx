import React from "react";
import StockInfoDisplay from "./StockInfoDisplay";
import FormControls from "./FormControls";
import { actionOptions } from "../utils/stockUtils";

export default function ProductForm({
  productName,
  setProductName,
  productCode,
  isNewItem,
  setIsNewItem,
  stockInfo,
  station,
  setStation,
  action,
  setAction,
  quantity,
  setQuantity,
  team,
  setTeam,
  status,
  error,
  isSubmitting,
  isRefreshing,
  handleStationChange,
  handleQuantityChange,
  refreshStockInfo,
  sendToGoogleSheets,
  scanAgain,
  isSubmitDisabled
}) {
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
            onChange={(e) => setIsNewItem(e.target.checked)}
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
      
      <FormControls
        isSubmitting={isSubmitting}
        isRefreshing={isRefreshing}
        isNewItem={isNewItem}
        productCode={productCode}
        isSubmitDisabled={isSubmitDisabled}
        sendToGoogleSheets={sendToGoogleSheets}
        refreshStockInfo={refreshStockInfo}
        scanAgain={scanAgain}
      />
    </div>
  );
}
