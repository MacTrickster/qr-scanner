// Функція для розбору QR-коду на назву та код товару
export const parseQrData = (qrText) => {
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
