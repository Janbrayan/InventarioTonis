import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './dashboard.css';

// Íconos de MUI
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Sección del acordeón que está actualmente abierta (o null si ninguna)
  const [openSection, setOpenSection] = useState<string | null>(null);

  /**
   * Esta función "togglea" la sección:
   * - Si la sección clickeada ya está abierta, se cierra (se pone null).
   * - Si es otra sección, se cierra la anterior y se abre la nueva.
   */
  function toggleSection(sectionName: string) {
    setOpenSection((prev) => (prev === sectionName ? null : sectionName));
  }

  /** Agrega la clase 'arrow-open' si la sección está abierta, para rotar la flecha en CSS. */
  function getArrowClass(sectionName: string) {
    return openSection === sectionName ? 'arrow-icon arrow-open' : 'arrow-icon';
  }

  /** Maneja el logout y navega a "/" con un estado fromLogout */
  function handleLogout() {
    navigate('/', { state: { fromLogout: true } });
  }

  /**
   * useEffect global para capturar el escaneo de la pistola lectora.
   * - Acumula caracteres en 'buffer'
   * - Al presionar 'Enter', busca el producto por barcode
   * - Dependiendo de la ruta actual y si existe o no, realiza distintas acciones.
   */
  useEffect(() => {
    let buffer = '';

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const scanned = buffer.trim();
        buffer = ''; // Limpia para el siguiente escaneo

        if (scanned !== '') {
          try {
            // 1) Buscar producto en la BD
            const product = await window.electronAPI.getProductByBarcode(scanned);
            // 2) Ver en qué ruta estás
            const currentPath = location.pathname;

            // === LÓGICA PRINCIPAL DE ESCANEO (ajusta según tu preferencia) ===

            // A) Dashboard, Usuarios o Proveedores
            if (
              currentPath.startsWith('/app/dashboard') ||
              currentPath.startsWith('/app/usuarios') ||
              currentPath.startsWith('/app/productos/proveedores')
            ) {
              if (product) {
                // Existe => Ir a Ventas con pendingProduct
                navigate('/app/ventas/registro', {
                  state: { pendingProductId: product.id },
                });
              } else {
                // No existe => Ir a Gestión de Productos (Crear)
                navigate('/app/productos/gestion', {
                  state: { createBarcode: scanned },
                });
              }

            // B) Rutas que empiezan con /app/productos
            } else if (currentPath.startsWith('/app/productos')) {
              // Sub-caso: /app/productos/compras
              if (currentPath.startsWith('/app/productos/compras')) {
                if (product) {
                  navigate('/app/productos/compras', {
                    state: {
                      openModal: 'createCompra',
                      openDetalle: true,
                      productId: product.id,
                      barcode: scanned,
                    },
                  });
                } else {
                  // No existe => crear producto
                  navigate('/app/productos/gestion', {
                    state: { createBarcode: scanned },
                  });
                }
              } else {
                // p.ej. /app/productos/gestion, /app/productos/categorias, etc.
                if (product) {
                  // Existe => abrir modal de Editar en Gestión
                  navigate('/app/productos/gestion', {
                    state: { editBarcode: scanned },
                  });
                } else {
                  // No existe => abrir modal de Crear
                  navigate('/app/productos/gestion', {
                    state: { createBarcode: scanned },
                  });
                }
              }

            // C) Ruta /app/ventas
            } else if (currentPath.startsWith('/app/ventas/registro')) {
              if (product) {
                // Existe => Agregar a la venta
                navigate('/app/ventas/registro', {
                  state: { openModal: 'createSale', productId: product.id },
                });
              } else {
                // No existe => crear producto
                navigate('/app/productos/gestion', {
                  state: { createBarcode: scanned },
                });
              }

            } else {
              // Ruta por defecto
              console.log('Código escaneado, pero sin acción definida:', scanned);
            }
          } catch (error) {
            console.error('Error procesando escaneo:', error);
          }
        }
      } else {
        // SOLO acumulamos si es alfanumérico. Ignora teclas como Shift, Alt, F1, flechas, etc.
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          buffer += e.key;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [location, navigate]);

  return (
    <div className="dashboard-container">
      {/* Barra lateral */}
      <aside className="sidebar">
        {/* Versión visible */}
        <h2 className="sidebar-title">Admin Panel v2.3.3</h2>

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
                  {/* NUEVO: Proveedores */}
                  <li>
                    <Link to="/app/productos/proveedores" className="submenu-link">
                      <CategoryIcon style={{ fontSize: 16, marginRight: 8 }} />
                      Proveedores
                    </Link>
                  </li>
                  {/* NUEVO: Compras */}
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
                <AttachMoneyIcon className="menu-icon" />
                Corte
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
