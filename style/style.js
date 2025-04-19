// Оновлені стилі для компонентів
export const appStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
  }

  .container {
    max-width: 550px;
    margin: 0 auto;
    padding: 24px;
    background-color: white;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    margin-top: 30px;
    margin-bottom: 30px;
  }

  h1 {
    color: #1a73e8;
    margin-bottom: 24px;
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 8px;
    border-bottom: 2px solid #f1f3f4;
  }

  #reader {
    width: 100%;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    min-height: 320px;
    position: relative;
    background-color: #f1f3f4;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 2px solid #e8eaed;
  }

  #reader video {
    border-radius: 10px;
  }

  .instruction {
    color: #5f6368;
    margin-top: 18px;
    font-size: 16px;
    text-align: center;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #4285f4;
  }

  .result-container {
    background-color: white;
    border-radius: 12px;
    padding: 24px;
    margin-top: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e8eaed;
  }

  .result {
    font-weight: 600;
    margin-bottom: 16px;
  }

  .data {
    word-break: break-all;
    font-weight: normal;
    color: #4285f4;
  }

  .options-container {
    background-color: #f8f9fa;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }

  .option-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8eaed;
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
    margin-right: 15px;
    white-space: nowrap;
    font-size: 15px;
  }

  .input-field {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #dadce0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
    background-color: white;
    outline: none;
  }

  .input-field:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }

  .name-field {
    height: auto;
    min-height: 48px;
    word-wrap: break-word;
    text-align: left;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .code-field {
    background-color: #f1f3f4;
    color: #5f6368;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  .quantity-field {
    max-width: 120px;
    width: 120px;
    text-align: center;
    font-weight: 500;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
  }

  .checkbox-field {
    width: 22px;
    height: 22px;
    margin-left: auto;
    accent-color: #4285f4;
    cursor: pointer;
  }

  select.input-field {
    background-color: white;
    appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%235F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 40px;
  }

  select.input-field:disabled {
    background-color: #f1f3f4;
    color: #8a8a8a;
    cursor: not-allowed;
  }

  .status {
    color: #4285f4;
    padding: 14px;
    background-color: #e8f0fe;
    border-radius: 8px;
    margin: 18px 0;
    font-weight: 500;
    text-align: center;
    box-shadow: 0 2px 6px rgba(66, 133, 244, 0.2);
    border-left: 4px solid #4285f4;
  }

  .error {
    color: #d93025;
    padding: 14px;
    background-color: #fce8e6;
    border-radius: 8px;
    margin: 18px 0;
    font-weight: 500;
    text-align: center;
    box-shadow: 0 2px 6px rgba(217, 48, 37, 0.2);
    border-left: 4px solid #d93025;
  }

  .stock-info {
    margin: 18px 0;
    padding: 16px;
    border-radius: 12px;
    background-color: #f8f9fa;
    text-align: left;
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stock-badge, .repair-info, .ordered-info, .production-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 16px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;
  }

  .stock-badge:hover, .repair-info:hover, .ordered-info:hover {
    transform: translateY(-2px);
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

  .production-info {
    background-color: #f0f4c3;
    color: #827717;
    border: 1px solid #e6ee9c;
  }

  .low-stock {
    background-color: #fce8e6;
    color: #c62828;
    border: 1px solid #fadbd8;
  }

  .stock-count {
    margin-left: 5px;
    font-size: 20px;
    font-weight: 700;
    padding: 4px 12px;
    background-color: rgba(255, 255, 255, 0.6);
    border-radius: 6px;
  }

  .stock-alert {
    color: #d32f2f;
    font-weight: bold;
    padding-left: 8px;
  }

  .stock-warning {
    color: #f57c00;
    font-weight: bold;
    padding-left: 8px;
  }

  .buttons-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 20px;
  }

  .submit-btn, .refresh-btn, .scan-btn, .skip-btn {
    padding: 14px 24px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    border: none;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .submit-btn {
    background-color: #4285f4;
    color: white;
  }

  .submit-btn:hover {
    background-color: #3367d6;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(66, 133, 244, 0.3);
  }

  .refresh-btn {
    background-color: #fbbc05;
    color: white;
  }

  .refresh-btn:hover {
    background-color: #f0b400;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(251, 188, 5, 0.3);
  }

  .scan-btn {
    background-color: #34a853;
    color: white;
  }

  .scan-btn:hover {
    background-color: #2d9249;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(52, 168, 83, 0.3);
  }

  .skip-btn {
    background-color: #ea4335;
    color: white;
  }

  .skip-btn:hover {
    background-color: #d33426;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(234, 67, 53, 0.3);
  }

  .submit-btn:disabled, .refresh-btn:disabled, .scan-btn:disabled, .skip-btn:disabled {
    background-color: #dcdcdc;
    color: #8a8a8a;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  @media (max-width: 600px) {
    .container {
      margin-top: 0;
      margin-bottom: 0;
      border-radius: 0;
      padding: 16px;
    }
    
    .buttons-container {
      gap: 10px;
    }
    
    .submit-btn, .refresh-btn, .scan-btn, .skip-btn {
      padding: 12px 16px;
      font-size: 14px;
    }
  }
`;
