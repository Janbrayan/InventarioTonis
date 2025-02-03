import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AnimatedRoutes from './AnimatedRoutes';
import './App.css'; 
import './index.css'; 

// Tema oscuro futurista con azul principal
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' },
    background: {
      default: '#0f2027',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <AnimatedRoutes />
      </HashRouter>
    </ThemeProvider>
  );
}
