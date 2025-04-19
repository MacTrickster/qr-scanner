import React from "react";
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export default function FormControls({
  isSubmitting,
  isRefreshing,
  isNewItem,
  productCode,
  isSubmitDisabled,
  sendToGoogleSheets,
  refreshStockInfo,
  scanAgain
}) {
  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SendIcon />}
        onClick={sendToGoogleSheets}
        disabled={isSubmitDisabled()}
        fullWidth
      >
        {isSubmitting ? "Відправка..." : "Відправити дані"}
      </Button>
      
      {!isNewItem && (
        <Button
          variant="contained"
          color="warning"
          startIcon={<RefreshIcon />}
          onClick={() => refreshStockInfo()}
          disabled={isSubmitting || isRefreshing || (!productCode && !isNewItem) || productCode === "XXXXXX"}
          fullWidth
        >
          {isRefreshing ? "Оновлення..." : "Оновити дані"}
        </Button>
      )}
      
      <Button
        variant="contained"
        color="success"
        startIcon={<QrCodeScannerIcon />}
        onClick={scanAgain}
        disabled={isSubmitting || isRefreshing}
        fullWidth
      >
        Сканувати інший QR-код
      </Button>
    </Stack>
  );
}
