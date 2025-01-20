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
  const [errorMsg, setErrorMsg] = useState('');

  // Para mostrar la alerta de "Cerrando sesión..."
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success'|'info'>('success');

  useEffect(() => {
    // Detecta si venimos con fromLogout
    if (location.state?.fromLogout) {
      setSnackbarSeverity('info');
      setSnackbarMessage('Cerrando sesión...');
      setSnackbarOpen(true);
    }
  }, [location.state]);

  function handleCloseSnackbar() {
    setSnackbarOpen(false);
  }

  async function handleLogin(event?: React.FormEvent) {
    if (event) event.preventDefault();
    setErrorMsg('');

    try {
      if (!window.electronAPI) {
        setErrorMsg('No API disponible');
        return;
      }
      // Llamamos a loginUser
      const result = await window.electronAPI.loginUser(username, password);

      if (!result.success) {
        setErrorMsg(result.error || 'Credenciales inválidas');
      } else {
        // Guardar userName
        if (result.user?.name) {
          localStorage.setItem('userName', result.user.name);
        }
        // Navegar a /app/dashboard
        navigate('/app/dashboard', { state: { fromLogin: true } });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error interno');
    }
  }

  return (
    <div className="login-container">
      <div className="background"></div>
      <h1 className="welcome-message">Bienvenido a Tienda Toñis</h1>

      <form className="login-form" onSubmit={handleLogin}>
        <h1 className="login-title">Iniciar Sesión</h1>
        {errorMsg && (
          <p style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
            {errorMsg}
          </p>
        )}

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

      {/* Snackbar para mostrar "Cerrando sesión..." */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            backgroundColor:
              snackbarSeverity === 'info' ? '#64748b' : '#3b82f6',
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
