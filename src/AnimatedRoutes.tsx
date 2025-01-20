import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SwitchTransition, CSSTransition } from 'react-transition-group';

import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';

// tus placeholders...
// GestionProductos, Categorias, etc.

export default function AppRoutes() {
  const location = useLocation();

  // ¿Venimos de logout?
  const fromLogout = location.state?.fromLogout;

  // Si la ruta ES "/" o "/app" → Transición
  // Si la ruta es otra (ej. "/app/productos/gestion") → sin transición
  const isRootLogin = location.pathname === '/';
  const isRootApp   = location.pathname === '/app';
  
  let transitionClass = '';
  let transitionTimeout = 0;

  if (fromLogout && isRootLogin) {
    // fade-logout
    transitionClass = 'fade-logout';
    transitionTimeout = 1000;
  } else if (isRootLogin || isRootApp) {
    // fade-login
    transitionClass = 'fade-login';
    transitionTimeout = 1000;
  }

  // Para no desmontar Layout en cada sub-ruta:
  // Podemos usar la key = isRootLogin || isRootApp, en vez de location.key
  // Así sólo se “remonta” cuando vamos a "/" o "/app"
  const transitionKey = (isRootLogin || isRootApp) ? location.key : 'no-transition';

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={transitionKey}
        timeout={transitionTimeout}
        classNames={transitionClass}
        unmountOnExit
        appear
      >
        <Routes location={location}>
          {/* Login */}
          <Route path="/" element={<Login />} />

          {/* Layout con sidebar */}
          <Route path="/app" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="usuarios" element={<Usuarios />} />

            {/* Productos */}
            <Route path="productos">
              <Route path="gestion" /* ... */ />
              <Route path="categorias" /* ... */ />
              <Route path="inventario" /* ... */ />
              <Route path="estadisticas" /* ... */ />
            </Route>

            {/* Ventas */}
            <Route path="ventas">
              {/* ... */}
              <Route path='registro'/>
              <Route path='historial'/>
              <Route path='estadisticas'/>
            </Route>

            {/* Reportes */}
            {/* ... */}
          </Route>

          {/* Catch-all */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </CSSTransition>
    </SwitchTransition>
  );
}
