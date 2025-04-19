import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import QRScanner from './components/QRScanner';

// Створюємо тему з українською локалізацією та кольорами
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285f4', // Google Blue
    },
    secondary: {
      main: '#34a853', // Google Green
    },
    error: {
      main: '#ea4335', // Google Red
    },
    warning: {
      main: '#fbbc05', // Google Yellow
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 16px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ 
        maxWidth: '450px', 
        margin: '0 auto', 
        padding: '20px',
        backgroundColor: '#f5f5f5', 
        minHeight: '100vh'
      }}>
        <QRScanner />
      </div>
    </ThemeProvider>
  );
}

export default App;
