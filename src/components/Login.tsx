// Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountCircle, Lock } from '@mui/icons-material';
import { Snackbar, Alert, Fade } from '@mui/material';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Manejo de Snackbar (Alert) unificado
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  /**
   * Podemos manejar varios tipos de severidad:
   * - 'error' para credenciales inválidas
   * - 'info' para "Cerrando sesión..."
   * - 'success' si lo requieres en otro caso
   */
  const [snackbarSeverity, setSnackbarSeverity] = useState<'info'|'error'|'success'>('info');

  useEffect(() => {
    // Detecta si venimos de un logout
    if (location.state?.fromLogout) {
      setSnackbarSeverity('info');
      setSnackbarMessage('Cerrando sesión...');
      setSnackbarOpen(true);
    }
  }, [location.state]);

  function handleCloseSnackbar() {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  }

  async function handleLogin(event?: React.FormEvent) {
    if (event) event.preventDefault();

    try {
      if (!window.electronAPI) {
        // Mostramos error con snackbar
        setSnackbarSeverity('error');
        setSnackbarMessage('No API disponible');
        setSnackbarOpen(true);
        return;
      }
      // Llamamos a loginUser
      const result = await window.electronAPI.loginUser(username, password);

      if (!result.success) {
        // Credenciales inválidas, etc.
        setSnackbarSeverity('error');
        setSnackbarMessage(result.error || 'Credenciales inválidas');
        setSnackbarOpen(true);
      } else {
        // Guardar userName
        if (result.user?.name) {
          localStorage.setItem('userName', result.user.name);
        }
        // Navegar a /app/dashboard
        navigate('/app/dashboard', { state: { fromLogin: true } });
      }
    } catch (err) {
      console.error('Error interno en login:', err);
      setSnackbarSeverity('error');
      setSnackbarMessage('Error interno');
      setSnackbarOpen(true);
    }
  }

  return (
    <div className="login-container">
      <div className="background"></div>
      <h1 className="welcome-message">Bienvenido a Tienda Toñis</h1>

      <form className="login-form" onSubmit={handleLogin}>
        <h1 className="login-title">Iniciar Sesión</h1>

        <div className="login-input-wrapper">
          <AccountCircle />
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="login-input-wrapper">
          <Lock />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="login-button" type="submit">
          Entrar
        </button>
      </form>

      {/* Snackbar para mostrar mensajes (info, error, etc.) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{
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
