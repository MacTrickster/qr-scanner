// URL вашого Google Apps Script
const scriptUrl = "https://script.google.com/macros/s/AKfycbzjVWYJOJQmf2VYUVYc7OaxjeMkMdPWV4zUXoqSNtYYh7vgao91ZdGrqnPbcaYbKioweA/exec";

// Функція для відправки форми до Google Sheets
export const submitFormData = (formData, targetFrame = "hidden-iframe") => {
  // Create a form element
  const form = document.createElement("form");
  form.method = "POST";
  form.action = scriptUrl;
  form.target = targetFrame;
  
  // Додаємо поля з formData
  Object.entries(formData).forEach(([name, value]) => {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = name;
    
    // Переконуємось, що значення - рядок
    field.value = String(value);
    
    // Для відладки
    console.log(`Поле форми: ${name} = ${field.value} (тип: ${typeof field.value})`);
    
    form.appendChild(field);
  });
  
  // Append form to document
  document.body.appendChild(form);
  
  // Submit the form
  form.submit();
  
  // Remove form from document
  document.body.removeChild(form);
  
  return true;
};
