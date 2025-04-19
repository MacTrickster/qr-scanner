// Оновлені стилі для компонентів, з меншими розмірами і відступами
export const appStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    width: 100%;
    background-color: #f0f2f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 0;
  }

  #__next {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0;
  }

  .container {
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
    padding: 16px;
    background-color: white;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  h1 {
    color: #1a73e8;
    margin-bottom: 16px;
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 12px;
    border-bottom: 2px solid #f1f3f4;
  }

  #reader {
    width: 100%;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    min-height: 300px;
    position: relative;
    background-color: #f8f9fa;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 2px solid #e8eaed;
    transition: all 0.3s ease;
  }

  #reader:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    border-color: #dadce0;
  }

  #reader video {
    border-radius: 12px;
  }

  .instruction {
    color: #5f6368;
    margin: 16px 0;
    font-size: 14px;
    text-align: center;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #4285f4;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    animation: slideIn 0.3s ease;
  }

  .result-container {
    background-color: white;
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e8eaed;
    animation: fadeIn 0.3s ease;
  }

  .options-container {
    background-color: #f8f9fa;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  }

  .option-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
  }

  .option-group:hover {
    background-color: rgba(66, 133, 244, 0.02);
    border-radius: 8px;
    padding: 8px;
    margin: -8px -8px 4px -8px;
  }

  .option-group:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .name-group {
    align-items: flex-start;
  }

  label {
    font-weight: 500;
    color: #202124;
    margin-right: 12px;
    white-space: nowrap;
    font-size: 14px;
    transition: color 0.2s ease;
  }

  .input-field {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid #dadce0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    background-color: white;
    outline: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }

  .input-field:hover {
    border-color: #bdc1c6;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .input-field:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
  }

  .name-field {
    height: auto;
    min-height: 42px;
    word-wrap: break-word;
    text-align: left;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
  }

  .code-field {
    background-color: #f8f9fa;
    color: #5f6368;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    letter-spacing: 0.5px;
  }

  .quantity-field {
    max-width: 120px;
    width: 120px;
    text-align: center;
    font-weight: 500;
    font-size: 16px;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }

  .checkbox-field {
    width: 20px;
    height: 20px;
    margin-left: auto;
    accent-color: #4285f4;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .checkbox-field:hover {
    transform: scale(1.05);
  }

  select.input-field {
    background-color: white;
    appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%235F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
  }

  select.input-field:disabled {
    background-color: #f1f3f4;
    color: #8a8a8a;
    cursor: not-allowed;
    border-color: #e8eaed;
  }

  .status {
    color: #4285f4;
    padding: 12px;
    background-color: #e8f0fe;
    border-radius: 8px;
    margin: 16px 0;
    font-weight: 500;
    text-align: center;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(66, 133, 244, 0.15);
    border-left: 4px solid #4285f4;
    animation: slideIn 0.3s ease;
  }

  .error {
    color: #d93025;
    padding: 12px;
    background-color: #fce8e6;
    border-radius: 8px;
    margin: 16px 0;
    font-weight: 500;
    text-align: center;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(217, 48, 37, 0.15);
    border-left: 4px solid #d93025;
    animation: slideIn 0.3s ease;
  }

  .warning {
    color: #e65100;
    padding: 12px;
    background-color: #fff3e0;
    border-radius: 8px;
    margin: 16px 0;
    font-weight: 500;
    text-align: center;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(230, 81, 0, 0.15);
    border-left: 4px solid #fb8c00;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .warning-actions {
    display: flex;
    gap: 8px;
    margin-left: 16px;
  }

  .warning-button {
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .warning-button.confirm {
    background-color: #fb8c00;
    color: white;
  }

  .warning-button.cancel {
    background-color: transparent;
    color: #e65100;
    border: 1px solid #fb8c00;
  }

  .warning-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .stock-info {
    margin: 0 0 16px 0;
    padding: 16px;
    border-radius: 12px;
    background-color: #f8f9fa;
    text-align: left;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    animation: fadeIn 0.3s ease;
  }

  .stock-badge, .repair-info, .ordered-info, .production-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 0;
    transition: all 0.2s ease;
  }

  .stock-badge:hover, .repair-info:hover, .ordered-info:hover, .production-info:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .stock-badge {
    background-color: #e6f4ea;
    color: #137333;
    border: 1px solid #ceead6;
  }

  .repair-info {
    background-color: #fff8e1;
    color: #e65100;
    border: 1px solid #ffecc7;
  }

  .ordered-info {
    background-color: #e3f2fd;
    color: #0d47a1;
    border: 1px solid #bbdefb;
  }

  .low-stock {
    background-color: #fce8e6;
    color: #c62828;
    border: 1px solid #fadbd8;
  }

  .stock-count {
    margin-left: 8px;
    font-size: 16px;
    font-weight: 700;
    padding: 4px 10px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .stock-alert {
    color: #d32f2f;
    font-weight: bold;
    padding-left: 8px;
    font-size: 13px;
  }

  .stock-warning {
    color: #f57c00;
    font-weight: bold;
    padding-left: 8px;
    font-size: 13px;
  }

  .last-events-container {
    margin-top: 20px;
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e8eaed;
  }

  .last-events-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e8eaed;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .last-events-header:hover {
    background-color: #f1f3f4;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1a73e8;
    font-weight: 500;
  }

  .history-icon {
    color: #1a73e8;
  }

  .expand-button {
    color: #5f6368;
  }

  .events-list {
    padding: 16px;
  }

  .event-item {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #e8eaed;
  }

  .event-item:last-child {
    margin-bottom: 0;
  }

  .event-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 14px;
  }

  .event-row:last-child {
    margin-bottom: 0;
  }

  .event-label {
    color: #5f6368;
    font-weight: 500;
  }

  .event-value {
    color: #202124;
  }

  .code-value {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    letter-spacing: 0.5px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Стилі для імітації мобільного додатку */
  @media (min-width: 769px) {
    body:before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #4285f4, #34a853);
      z-index: -1;
      animation: gradientAnimation 15s ease infinite;
    }
    
    @keyframes gradientAnimation {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    
    .container {
      margin-top: 20px;
      max-width: 400px;
      border-radius: 24px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
      animation: containerAppear 0.5s ease;
    }
    
    @keyframes containerAppear {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Імітація "шапки" мобільного додатку */
    .container:before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40%;
      height: 4px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 0 0 4px 4px;
      margin-top: 8px;
    }
  }

  @media (max-width: 768px) {
    body, html {
      padding: 0;
      background-color: #ffffff;
    }
    
    .container {
      max-width: 100%;
      border-radius: 0;
      padding: 16px;
      min-height: 100vh;
      margin: 0;
      box-shadow: none;
    }
  }
`;
