import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './dashboard.css';

// Íconos de MUI
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';

export default function Layout() {
  const navigate = useNavigate();

  // Sección del acordeón que está actualmente abierta (o null si ninguna)
  const [openSection, setOpenSection] = useState<string | null>(null);

  /**
   * Esta función "togglea" la sección:
   * - Si la sección clickeada ya está abierta, se cierra (se pone null).
   * - Si es otra sección, se cierra la anterior y se abre la nueva.
   */
  function toggleSection(sectionName: string) {
    setOpenSection(prev => (prev === sectionName ? null : sectionName));
  }

  /** Agrega la clase 'arrow-open' si la sección está abierta, para rotar la flecha en CSS. */
  function getArrowClass(sectionName: string) {
    return openSection === sectionName ? 'arrow-icon arrow-open' : 'arrow-icon';
  }

  /** Maneja el logout y navega a "/" con un estado fromLogout */
  function handleLogout() {
    navigate('/', { state: { fromLogout: true } });
  }

  return (
    <div className="dashboard-container">
      {/* Barra lateral */}
      <aside className="sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>

        <nav>
          <ul className="menu-list">
            {/* Dashboard */}
            <li>
              <Link to="/app/dashboard" className="menu-link">
                <DashboardIcon className="menu-icon" />
                Dashboard
              </Link>
            </li>

            {/* Sección Usuarios */}
            <li>
              <button
                className="accordion-btn"
                onClick={() => toggleSection('usuarios')}
              >
                <div className="accordion-label">
                  <PeopleAltIcon className="menu-icon" />
                  Usuarios
                </div>
                <ArrowRightIcon className={getArrowClass('usuarios')} />
              </button>
              {openSection === 'usuarios' && (
                <ul className="submenu">
                  <li>
                    <Link to="/app/usuarios" className="submenu-link">
                      Administrar Usuarios
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Sección Productos */}
            <li>
              <button
                className="accordion-btn"
                onClick={() => toggleSection('productos')}
              >
                <div className="accordion-label">
                  <CategoryIcon className="menu-icon" />
                  Productos
                </div>
                <ArrowRightIcon className={getArrowClass('productos')} />
              </button>
              {openSection === 'productos' && (
                <ul className="submenu">
                  <li>
                    <Link to="/app/productos/gestion" className="submenu-link">
                      <InventoryRoundedIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Gestión de Productos
                    </Link>
                  </li>
                  <li>
                    <Link to="/app/productos/categorias" className="submenu-link">
                      <CategoryIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Categorías
                    </Link>
                  </li>
                  <li>
                    <Link to="/app/productos/inventario" className="submenu-link">
                      <InventoryIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Inventario
                    </Link>
                  </li>
                  <li>
                    <Link to="/app/productos/estadisticas" className="submenu-link">
                      <BarChartIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Estadísticas
                    </Link>
                  </li>
                  {/* NUEVO: “Proveedores” */}
                  <li>
                    <Link to="/app/productos/proveedores" className="submenu-link">
                      <CategoryIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Proveedores
                    </Link>
                  </li>
                  {/* NUEVO: “Compras” */}
                  <li>
                    <Link to="/app/productos/compras" className="submenu-link">
                      <ShoppingCartIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Compras
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Sección Ventas */}
            <li>
              <button
                className="accordion-btn"
                onClick={() => toggleSection('ventas')}
              >
                <div className="accordion-label">
                  <ShoppingCartIcon className="menu-icon" />
                  Ventas
                </div>
                <ArrowRightIcon className={getArrowClass('ventas')} />
              </button>
              {openSection === 'ventas' && (
                <ul className="submenu">
                  <li>
                    <Link to="/app/ventas/registro" className="submenu-link">
                      <LocalMallIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Registro de Ventas
                    </Link>
                  </li>
                  <li>
                    <Link to="/app/ventas/historial" className="submenu-link">
                      <ReceiptLongIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Historial de Ventas
                    </Link>
                  </li>
                  <li>
                    <Link to="/app/ventas/estadisticas" className="submenu-link">
                      <BarChartIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Estadísticas
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Sección Reportes */}
            <li>
              <Link to="/app/reportes" className="menu-link">
                <AssessmentIcon className="menu-icon" />
                Reportes
              </Link>
            </li>

            {/* Botón de Logout */}
            <li>
              <Button
                variant="contained"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                className="logout-button"
                sx={{ marginTop: 2 }}
              >
                Cerrar Sesión
              </Button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
