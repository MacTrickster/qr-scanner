import React from 'react';
import QRScanner from './components/QRScanner';
import { appStyles } from './styles/styles.js';

function App() {
  return (
    <>
      <QRScanner />
      {/* Використовуємо стилі як глобальні */}
      <style jsx global>{appStyles}</style>
    </>
  );
}

export default App;
