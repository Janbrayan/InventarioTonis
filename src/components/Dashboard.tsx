// Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Fade } from '@mui/material';
import './dashboard.css';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info'>('success');

  const storedName = localStorage.getItem('userName') || 'Usuario';

  useEffect(() => {
    // Si venimos del Login
    if (location.state?.fromLogin) {
      setSnackbarSeverity('success');
      setSnackbarMessage('¡Inicio de sesión exitoso!');
      setSnackbarOpen(true);
    }

    // Si venimos del Logout
    if (location.state?.fromLogout) {
      setSnackbarSeverity('info');
      setSnackbarMessage('Cerrando sesión...');
      setSnackbarOpen(true);

      // Después de 2s, vamos al Login
      setTimeout(() => {
        // O si quieres borrar userName, hazlo
        // localStorage.removeItem('userName');

        navigate('/', { replace: true });
      }, 2000);
    }
  }, [location.state, navigate]);

  function handleCloseSnackbar() {
    setSnackbarOpen(false);
  }

  return (
    <div>
      <h1>¡Bienvenido, {storedName} al Dashboard!</h1>
      <h2>Resumen de Tienda Toñis</h2>
      <p>Aquí puedes colocar un resumen del sistema.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Usuarios</h3>
          <p>150</p>
        </div>
        <div className="stat-card">
          <h3>Productos</h3>
          <p>340</p>
        </div>
        <div className="stat-card">
          <h3>Ventas (Hoy)</h3>
          <p>25</p>
        </div>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={null /* o 2000 si quieres que se cierre solo */}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            backgroundColor: snackbarSeverity === 'success' ? '#3b82f6' : '#64748b',
            color: '#fff',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
