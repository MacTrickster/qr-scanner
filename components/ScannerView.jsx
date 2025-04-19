import React from "react";
import Button from '@mui/material/Button';
import SkipNextIcon from '@mui/icons-material/SkipNext';

export default function ScannerView({ scannerRef, skipScanner }) {
  return (
    <div>
      <div id="reader" ref={scannerRef}></div>
      <p className="instruction">📱 Наведіть камеру на QR-код для сканування</p>
      
      <Button 
        variant="contained"
        color="primary"
        startIcon={<SkipNextIcon />}
        onClick={skipScanner}
        fullWidth
        sx={{ mt: 2 }}
      >
        Пропустити сканер
      </Button>
    </div>
  );
}
