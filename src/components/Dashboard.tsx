import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Button,
  Snackbar,
  Alert,
  Fade,
} from '@mui/material';
import {
  Store,
  LocalShipping,
  ShoppingCart,
  MonetizationOn,
  Warning,
  Assessment,
  AccountCircle,
} from '@mui/icons-material';

/** Recharts */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/** Interfaces */
interface DashboardMetrics {
  totalProductos: number;
  totalProveedores: number;
  totalVentas: number;
  totalVentasDinero: number;
  ultimaVenta?: string;
}
interface DashboardCompras {
  totalCompras: number;
  totalComprasDinero: number;
  ultimaCompra?: string;
}
interface BajoStockRow {
  productoId: number;
  nombre: string;
  stock: number;
}
interface UltimaVentaItem {
  id: number;
  fecha: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // ========== SNACKBAR ==========
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info'>('success');

  // ========== DATOS ==========
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [compras, setCompras] = useState<DashboardCompras | null>(null);
  const [margenBasico, setMargenBasico] = useState<number>(0);

  const [bajoStock, setBajoStock] = useState<BajoStockRow[]>([]);
  const [ultimasVentas, setUltimasVentas] = useState<UltimaVentaItem[]>([]);

  // Nombre de usuario
  const storedName = localStorage.getItem('userName') || 'Usuario';

  // ========== CARGA DE DATOS (IPC) ==========
  useEffect(() => {
    // Métricas principales
    (async () => {
      try {
        const m = await window.electronAPI.dashboardGetMetrics();
        setMetrics(m);
      } catch {}
    })();

    // Resumen de Compras
    (async () => {
      try {
        const c = await window.electronAPI.dashboardGetResumenCompras();
        setCompras(c);
      } catch {}
    })();

    // Margen
    (async () => {
      try {
        const mg = await window.electronAPI.dashboardGetMargenBasico?.();
        if (mg != null) setMargenBasico(mg);
      } catch {}
    })();

    // Bajo Stock
    (async () => {
      try {
        const data = await window.electronAPI.dashboardGetProductosBajoStock?.(5, 5);
        if (data) {
          setBajoStock(
            data.map((item: any) => ({
              productoId: item.id,
              nombre: item.nombre,
              stock: item.stock,
            }))
          );
        }
      } catch {}
    })();

    // Últimas Ventas => mini‐gráfica en “Ventas Totales”
    (async () => {
      try {
        const data = await window.electronAPI.dashboardGetUltimasVentas?.(5);
        if (data) setUltimasVentas(data);
      } catch {}
    })();
  }, []);

  // ========== SNACKBAR (login/logout) ==========
  useEffect(() => {
    if (location.state?.fromLogin) {
      setSnackbarSeverity('success');
      setSnackbarMessage('¡Inicio de sesión exitoso!');
      setSnackbarOpen(true);
    }
    if (location.state?.fromLogout) {
      setSnackbarSeverity('info');
      setSnackbarMessage('Cerrando sesión...');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    }
  }, [location.state, navigate]);

  function handleCloseSnackbar() {
    setSnackbarOpen(false);
  }

  // ========== Formato de dinero ==========
  const formatMoney = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

  // ========== Data lineal real para “Ventas Totales” ==========
  const chartDataVentas = useMemo(() => {
    if (!ultimasVentas.length) return [];
    const sorted = [...ultimasVentas].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted.map((venta) => {
      const fecha = new Date(venta.createdAt);
      const fechaStr = fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
      });
      return {
        name: fechaStr,
        uv: venta.total,
      };
    });
  }, [ultimasVentas]);

  // Colores para pastel
  const COLORS = ['#14B8A6', '#ddd'];

  // ========== Función “Ver más” ==========
  function handleVerMas(section: string) {
    // Ajusta según tus rutas
    if (section === 'productos') {
      navigate('/productos');
    } else if (section === 'proveedores') {
      navigate('/proveedores');
    } else if (section === 'ventas') {
      navigate('/ventas');
    } else if (section === 'compras') {
      navigate('/compras');
    }
  }

  // ========== Componente Tarjeta KPI ==========
  function KpiCard({
    subLabel,
    title,
    value,
    difference,
    icon,
    chartType,
    chartData,
    onMoreClick,
  }: {
    subLabel?: string;
    title: string;
    value: string | number;
    difference?: string;
    icon: React.ReactNode;
    chartType?: 'line' | 'pie' | 'none';
    chartData?: any[];
    onMoreClick?: () => void;
  }) {
    // Altura de la tarjeta
    const heightCard = 300;

    const renderChart = () => {
      if (!chartType || chartType === 'none') return null;

      if (chartType === 'line' && chartData && chartData.length > 0) {
        return (
          <Box sx={{ width: '100%', height: 100, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="uv" stroke="#14B8A6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        );
      }
      if (chartType === 'pie' && chartData && chartData.length > 0) {
        return (
          <Box sx={{ width: 80, height: 80, mt: 1, mx: 'auto' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" outerRadius={35}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        );
      }
      return null;
    };

    return (
      <Card
        sx={{
          height: heightCard,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          p: 2,
          overflow: 'hidden',
        }}
      >
        {/* Etiqueta (subLabel) en español */}
        {subLabel && (
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: '500' }}>
            {subLabel}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Avatar sx={{ bgcolor: '#14B8A6', width: 36, height: 36, mr: 1.5 }}>{icon}</Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#111827' }}>
              {value}
            </Typography>
          </Box>
        </Box>

        {difference && (
          <Typography
            variant="body2"
            sx={{ color: difference.startsWith('-') ? '#EF4444' : '#10B981', mt: 0.5 }}
          >
            {difference}
          </Typography>
        )}

        {renderChart()}

        {onMoreClick && (
          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Button
              variant="text"
              sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem' }}
              onClick={onMoreClick}
            >
              VER MÁS
            </Button>
          </Box>
        )}
      </Card>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      {/* ========== HERO ========== */}
      <Box
        sx={{
          background: 'linear-gradient(to right, #667eea, #764ba2)',
          color: '#fff',
          p: 4,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          ¡Bienvenido, {storedName}!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Aquí encontrarás toda la información principal de la Tienda Toñis
        </Typography>
        <Button variant="contained" color="secondary">
          <AccountCircle sx={{ mr: 1 }} />
          ACCIÓN HERO
        </Button>
      </Box>

      {/* Fila 1: 4 KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Productos Activos (pie) */}
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            subLabel="Todo el tiempo"
            title="Productos Activos"
            value={metrics?.totalProductos ?? '—'}
            difference="+1.2%"
            icon={<Store />}
            chartType="pie"
            chartData={[
              { name: 'Activos', value: metrics?.totalProductos ?? 0 },
              { name: 'Inactivos', value: 0 }, // sin estadística real
            ]}
            onMoreClick={() => handleVerMas('productos')}
          />
        </Grid>

        {/* Proveedores (pie) */}
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            subLabel="Todo el tiempo"
            title="Proveedores"
            value={metrics?.totalProveedores ?? '—'}
            difference="+0.5%"
            icon={<LocalShipping />}
            chartType="pie"
            chartData={[
              { name: 'Activos', value: metrics?.totalProveedores ?? 0 },
              { name: 'Inactivos', value: 0 }, // sin estadística real
            ]}
            onMoreClick={() => handleVerMas('proveedores')}
          />
        </Grid>

        {/* Ventas Totales (line real) */}
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            subLabel="Mes actual"
            title="Ventas Totales"
            value={metrics?.totalVentas ?? '—'}
            difference="+4.2%"
            icon={<ShoppingCart />}
            chartType="line"
            chartData={chartDataVentas}
            onMoreClick={() => handleVerMas('ventas')}
          />
        </Grid>

        {/* Dinero en Ventas (line vacía) */}
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            subLabel="Mes actual"
            title="Dinero en Ventas"
            value={
              metrics?.totalVentasDinero != null
                ? formatMoney(metrics.totalVentasDinero)
                : '—'
            }
            difference="+3.1%"
            icon={<MonetizationOn />}
            chartType="line"
            chartData={[]} // sin data histórica real => placeholder
            onMoreClick={() => handleVerMas('ventas')}
          />
        </Grid>
      </Grid>

      {/* Fila 2: 3 KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Compras Totales (line vacía) */}
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            subLabel="Mes actual"
            title="Compras Totales"
            value={compras?.totalCompras ?? '—'}
            difference="-0.8%"
            icon={<ShoppingCart />}
            chartType="line"
            chartData={[]} // placeholder, sin data real de compras históricas
            onMoreClick={() => handleVerMas('compras')}
          />
        </Grid>

        {/* Dinero en Compras (line vacía) */}
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            subLabel="Mes actual"
            title="Dinero en Compras"
            value={
              compras?.totalComprasDinero != null
                ? formatMoney(compras.totalComprasDinero)
                : '—'
            }
            difference="+2.6%"
            icon={<MonetizationOn />}
            chartType="line"
            chartData={[]} // placeholder
            onMoreClick={() => handleVerMas('compras')}
          />
        </Grid>

        {/* Margen de Ganancia (line vacía) */}
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            subLabel="Todo el tiempo"
            title="Margen de Ganancia"
            value={formatMoney(margenBasico)}
            difference="+1.8%"
            icon={<Assessment />}
            chartType="line"
            chartData={[]} // placeholder
            onMoreClick={() => handleVerMas('compras')}
          />
        </Grid>
      </Grid>

      {/* Fila 3: Bajo Stock */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              color: '#0f172a',
              overflow: 'hidden',
              height: 300, // Tarjeta más grande
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: '500' }}>
                Mes actual
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Avatar sx={{ bgcolor: '#14B8A6', width: 36, height: 36, mr: 1.5 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 'bold' }}>
                    Bajo Stock
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#111827' }}>
                    {bajoStock?.length} productos
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                mt: 1,
              }}
            >
              <List dense>
                {bajoStock.map((p) => (
                  <React.Fragment key={p.productoId}>
                    <ListItem>
                      <ListItemText
                        primary={p.nombre}
                        secondary={`Stock: ${p.stock}`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
                {bajoStock.length === 0 && (
                  <ListItem>
                    <ListItemText primary="(Ninguno)" />
                  </ListItem>
                )}
              </List>
            </Box>

            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Button
                variant="text"
                sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem' }}
                onClick={() => handleVerMas('productos')}
              >
                VER MÁS
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={null}
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
            backgroundColor: snackbarSeverity === 'success' ? '#14B8A6' : '#64748b',
            color: '#fff',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
