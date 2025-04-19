import React, { useState } from 'react';
import { Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';

export default function LastEvents({ events }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="last-events-container">
      <div 
        className="last-events-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="header-content">
          <HistoryIcon className="history-icon" />
          <span>Останні 3 події</span>
        </div>
        <IconButton 
          size="small"
          className="expand-button"
        >
          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </div>

      <Collapse in={isOpen}>
        <div className="events-list">
          {events.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-row">
                <span className="event-label">Назва:</span>
                <span className="event-value">{event.productName}</span>
              </div>
              <div className="event-row">
                <span className="event-label">Код:</span>
                <span className="event-value code-value">{event.productCode || 'XXXXXX'}</span>
              </div>
              <div className="event-row">
                <span className="event-label">Станція:</span>
                <span className="event-value">{event.station}</span>
              </div>
              <div className="event-row">
                <span className="event-label">Дія:</span>
                <span className="event-value">{event.action}</span>
              </div>
              {event.team && (
                <div className="event-row">
                  <span className="event-label">Команда:</span>
                  <span className="event-value">{event.team}</span>
                </div>
              )}
              <div className="event-row">
                <span className="event-label">Кількість:</span>
                <span className="event-value">{event.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </Collapse>
    </div>
  );
}