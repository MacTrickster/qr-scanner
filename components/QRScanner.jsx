// В розділі структури render додайте setProductCode
<ProductForm 
  productName={productName}
  setProductName={setProductName}
  productCode={productCode}
  setProductCode={setProductCode} // Додано передачу setProductCode
  isNewItem={isNewItem}
  setIsNewItem={handleNewItemChange}
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
