import React from "react";
import { Card, CardContent, Typography, Box, Chip, Stack, Divider } from "@mui/material";
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function StockInfoDisplay({ stockInfo }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Інформація про запаси
        </Typography>
        
        <Stack spacing={2}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1,
            bgcolor: stockInfo.available < 5 ? 'error.light' : 'success.light',
            borderRadius: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InventoryIcon sx={{ mr: 1 }} />
              <Typography>Наявність на складі:</Typography>
            </Box>
            <Chip 
              label={stockInfo.available} 
              color={stockInfo.available < 5 ? "error" : "success"}
              sx={{ fontWeight: 'bold' }}
            />
            {stockInfo.available === 0 && 
              <Typography color="error" sx={{ ml: 1 }}>Немає на складі!</Typography>
            }
            {stockInfo.available > 0 && stockInfo.available < 5 && 
              <Typography color="warning.dark" sx={{ ml: 1 }}>Мало на складі!</Typography>
            }
          </Box>
          
          <Divider />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1,
            bgcolor: 'warning.light',
            borderRadius: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BuildIcon sx={{ mr: 1 }} />
              <Typography>В ремонті:</Typography>
            </Box>
            <Chip 
              label={stockInfo.inRepair} 
              color="warning"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Divider />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1,
            bgcolor: 'info.light',
            borderRadius: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalShippingIcon sx={{ mr: 1 }} />
              <Typography>Замовлено:</Typography>
            </Box>
            <Chip 
              label={stockInfo.ordered} 
              color="info"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
