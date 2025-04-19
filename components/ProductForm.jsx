import React from "react";
import { 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Divider
} from '@mui/material';
import StockInfoDisplay from "./StockInfoDisplay";
import FormControls from "./FormControls";

export default function ProductForm({
  productName,
  setProductName,
  productCode,
  isNewItem,
  setIsNewItem,
  stockInfo,
  station,
  action,
  setAction,
  quantity,
  team,
  setTeam,
  status,
  error,
  handleStationChange,
  handleQuantityChange,
  actionOptions,
  isSubmitting,
  isRefreshing,
  refreshStockInfo,
  sendToGoogleSheets,
  scanAgain,
  isSubmitDisabled
}) {
  return (
    <Card elevation={3} sx={{ borderRadius: 2, mt: 3 }}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ mb: 2 }}>
            Інформація про товар
          </Typography>
          
          <TextField
            label="Назва товару"
            variant="outlined"
            fullWidth
            margin="normal"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            InputProps={{ readOnly: !isNewItem }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={isNewItem}
                onChange={setIsNewItem}
                color="primary"
              />
            }
            label="Новий товар"
          />
          
          <TextField
            label="Код товару"
            variant="outlined"
            fullWidth
            margin="normal"
            value={productCode}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
        </Box>
        
        {stockInfo && !isNewItem && (
          <StockInfoDisplay stockInfo={stockInfo} />
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" component="div" sx={{ mb: 2 }}>
          Параметри операції
        </Typography>
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="station-label">Станція</InputLabel>
          <Select
            labelId="station-label"
            value={station}
            label="Станція"
            onChange={handleStationChange}
          >
            <MenuItem value="Склад">Склад</MenuItem>
            <MenuItem value="Ремонт">Ремонт</MenuItem>
            <MenuItem value="Виробництво">Виробництво</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="action-label">Дія</InputLabel>
          <Select
            labelId="action-label"
            value={action}
            label="Дія"
            onChange={(e) => setAction(e.target.value)}
            disabled={!station || !actionOptions[station] || actionOptions[station].length === 0}
          >
            {station && actionOptions[station]?.map((option, index) => (
              <MenuItem key={index} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {action === "Видано" && (
          <FormControl fullWidth margin="normal">
            <InputLabel id="team-label">Команда</InputLabel>
            <Select
              labelId="team-label"
              value={team}
              label="Команда"
              onChange={(e) => setTeam(e.target.value)}
            >
              <MenuItem value="Команді A">Команді A</MenuItem>
              <MenuItem value="Команді B">Команді B</MenuItem>
              <MenuItem value="Команді C">Команді C</MenuItem>
              <MenuItem value="Команді D">Команді D</MenuItem>
            </Select>
          </FormControl>
        )}
        
        <TextField
          label="Кількість"
          type="number"
          variant="outlined"
          margin="normal"
          value={quantity}
          onChange={handleQuantityChange}
          InputProps={{ inputProps: { min: 1 } }}
          sx={{ width: '50%' }}
        />
        
        {status && (
          <Box sx={{ 
            p: 2, 
            mt: 2, 
            bgcolor: 'info.light', 
            color: 'info.contrastText',
            borderRadius: 1
          }}>
            <Typography>{status}</Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ 
            p: 2, 
            mt: 2, 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            borderRadius: 1
          }}>
            <Typography>{error}</Typography>
          </Box>
        )}
        
        <FormControls
          isSubmitting={isSubmitting}
          isRefreshing={isRefreshing}
          isNewItem={isNewItem}
          productCode={productCode}
          isSubmitDisabled={isSubmitDisabled}
          sendToGoogleSheets={sendToGoogleSheets}
          refreshStockInfo={refreshStockInfo}
          scanAgain={scanAgain}
        />
      </CardContent>
    </Card>
  );
}
