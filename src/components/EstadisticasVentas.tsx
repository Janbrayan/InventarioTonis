// EstadisticasVentas.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
/** Recharts */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

export default function EstadisticasVentas() {
  // ====== Campos para el rango de fechas (estadísticas generales) ======
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  // ====== Estados de resultados de estadísticas ======
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [numVentas, setNumVentas] = useState<number>(0);
  const [productosMasVendidos, setProductosMasVendidos] = useState<Array<any>>([]);
  const [productosMenosVendidos, setProductosMenosVendidos] = useState<Array<any>>([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState<Array<any>>([]);
  const [ventasPorDia, setVentasPorDia] = useState<Array<any>>([]);
  const [ticketPromedio, setTicketPromedio] = useState<number>(0);
  const [gananciaBruta, setGananciaBruta] = useState<number>(0);

  // ====== Estado de carga (loading) ======
  const [loading, setLoading] = useState<boolean>(false);

  // ====== Productos sin ventas ======
  const [productosNoVendidos, setProductosNoVendidos] = useState<Array<any>>([]);

  // ====== Manejo de error local ======
  const [errorMsg, setErrorMsg] = useState<string>('');

  /**
   * Carga TODAS las estadísticas (gráficas + productos no vendidos)
   * en un solo "disparo".
   */
  async function handleCargarEstadisticas() {
    try {
      setErrorMsg(''); // limpiar error previo

      // Validamos fechas
      if (!fechaInicio || !fechaFin) {
        throw new Error('Por favor, selecciona ambas fechas (Inicio y Fin).');
      }
      if (fechaFin < fechaInicio) {
        throw new Error('La fecha fin no puede ser menor que la fecha inicio.');
      }

      setLoading(true);

      // 1) Total Ventas
      const tv = await window.electronAPI.ventasStatsGetTotalVentas(fechaInicio, fechaFin);
      setTotalVentas(tv);

      // 2) Número de Ventas
      const nv = await window.electronAPI.ventasStatsGetNumVentas(fechaInicio, fechaFin);
      setNumVentas(nv);

      // 3) Productos más vendidos
      const pmv = await window.electronAPI.ventasStatsGetProductosMasVendidos(
        fechaInicio, fechaFin, 5
      );
      setProductosMasVendidos(pmv);

      // 4) Productos menos vendidos
      const pmnv = await window.electronAPI.ventasStatsGetProductosMenosVendidos(
        fechaInicio, fechaFin, 5
      );
      setProductosMenosVendidos(pmnv);

      // 5) Ventas por categoría
      const vpc = await window.electronAPI.ventasStatsGetVentasPorCategoria(
        fechaInicio, fechaFin
      );
      setVentasPorCategoria(vpc);

      // 6) Ventas por día
      const vpd = await window.electronAPI.ventasStatsGetVentasPorDia(
        fechaInicio, fechaFin
      );
      setVentasPorDia(vpd);

      // 7) Ticket promedio
      const tp = await window.electronAPI.ventasStatsGetTicketPromedio(
        fechaInicio, fechaFin
      );
      setTicketPromedio(tp);

      // 8) Ganancia bruta
      const gb = await window.electronAPI.ventasStatsGetGananciaBruta(
        fechaInicio, fechaFin
      );
      setGananciaBruta(gb);

      // 9) Productos sin ventas en ese rango
      const dataNoVend = await window.electronAPI.historialGetProductosNoVendidos(
        fechaInicio,
        fechaFin
      );
      setProductosNoVendidos(dataNoVend || []);

    } catch (error: any) {
      console.error('Error cargando estadísticas:', error);
      // Manejamos error en un string local
      setErrorMsg(error.message || 'Ocurrió un error al cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }

  // Definimos colores para las gráficas de pastel
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8854d0'];

  // ========== Transformación de datos para Recharts ==========

  // Pastel: Productos Más Vendidos => { name, value }
  const dataPieMasVendidos = productosMasVendidos.map((item: any) => ({
    name: item.productName,
    value: item.cantidadVendida
  }));

  // Pastel: Productos Menos Vendidos => { name, value }
  const dataPieMenosVendidos = productosMenosVendidos.map((item: any) => ({
    name: item.productName,
    value: item.cantidadVendida
  }));

  // Barras: Ventas por Categoría => { name, total }
  const dataBarCategoria = ventasPorCategoria.map((cat: any) => ({
    name: cat.categoriaNombre,
    total: cat.totalCategoria
  }));

  // Línea: Ventas por Día => { name, total }
  const dataLinePorDia = ventasPorDia.map((d: any) => ({
    name: d.dia,
    total: d.totalDia
  }));

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#212529' }}>
        Estadísticas de Ventas
      </Typography>

      {/* ====== Si hay un error, lo mostramos ====== */}
      {errorMsg && (
        <Box sx={{ mb: 2, p: 2, border: '1px solid red', borderRadius: 1, color: 'red' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Error: {errorMsg}
          </Typography>
        </Box>
      )}

      {/* ========== Card para seleccionar fechas (Estadísticas Generales) ========== */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#1c2430',
          color: '#fff'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Rango de Fechas
            </Typography>
          }
          sx={{
            backgroundColor: '#343a40',
            borderRadius: '8px 8px 0 0',
            pb: 1
          }}
        />
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Fecha Inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180, backgroundColor: '#2b3640', borderRadius: 1 }}
            inputProps={{ style: { color: '#fff' } }}
          />
          <TextField
            label="Fecha Fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180, backgroundColor: '#2b3640', borderRadius: 1 }}
            inputProps={{ style: { color: '#fff' } }}
          />

          {/* Botón para cargar las estadísticas y productos no vendidos */}
          <Button
            variant="contained"
            onClick={handleCargarEstadisticas}
            disabled={loading}
            sx={{ fontWeight: 'bold' }}
          >
            {loading ? 'Cargando...' : 'Ver Estadísticas'}
          </Button>
        </CardContent>
      </Card>

      {/* ========== Resultados Generales ========== */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#1c2430',
          color: '#fff'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Resultados Generales
            </Typography>
          }
          sx={{
            backgroundColor: '#343a40',
            borderRadius: '8px 8px 0 0',
            pb: 1
          }}
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography>
            <strong>Total Ventas:</strong> ${totalVentas.toFixed(2)}
          </Typography>
          <Typography>
            <strong>Número de Ventas:</strong> {numVentas}
          </Typography>
          <Typography>
            <strong>Ticket Promedio:</strong> ${ticketPromedio.toFixed(2)}
          </Typography>
          <Typography>
            <strong>Ganancia Bruta (aprox):</strong> ${gananciaBruta.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      {/* ========== Gráficas de pastel (Productos más y menos vendidos) ========== */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        {/* Pastel: Productos Más Vendidos */}
        <Card
          sx={{
            flex: '1 1 300px',
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: '#1c2430'
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                Top 5: Más Vendidos (Gráfica)
              </Typography>
            }
            sx={{ backgroundColor: '#343a40', pb: 1 }}
          />
          <CardContent>
            {dataPieMasVendidos.length === 0 ? (
              <Typography color="#fff" textAlign="center">
                (Sin datos)
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dataPieMasVendidos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {dataPieMasVendidos.map((entry, index) => (
                      <Cell
                        key={`cell-mas-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pastel: Productos Menos Vendidos */}
        <Card
          sx={{
            flex: '1 1 300px',
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: '#1c2430'
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                Top 5: Menos Vendidos (Gráfica)
              </Typography>
            }
            sx={{ backgroundColor: '#343a40', pb: 1 }}
          />
          <CardContent>
            {dataPieMenosVendidos.length === 0 ? (
              <Typography color="#fff" textAlign="center">
                (Sin datos)
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dataPieMenosVendidos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {dataPieMenosVendidos.map((entry, index) => (
                      <Cell
                        key={`cell-menos-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ========== Gráfica de Barras: Ventas por Categoría ========== */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#1c2430'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
              Ventas por Categoría (Gráfica de Barras)
            </Typography>
          }
          sx={{ backgroundColor: '#343a40', pb: 1 }}
        />
        <CardContent>
          {dataBarCategoria.length === 0 ? (
            <Typography color="#fff" textAlign="center">
              (Sin datos)
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataBarCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ========== Gráfica de Línea: Ventas por Día ========== */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#1c2430'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
              Ventas por Día (Gráfica de Línea)
            </Typography>
          }
          sx={{ backgroundColor: '#343a40', pb: 1 }}
        />
        <CardContent>
          {dataLinePorDia.length === 0 ? (
            <Typography color="#fff" textAlign="center">
              (Sin datos)
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dataLinePorDia}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ========== Sección para Productos sin Ventas (usa el mismo [fechaInicio, fechaFin]) ========== */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Productos sin Ventas (en las fechas seleccionadas)
            </Typography>
          }
          sx={{
            backgroundColor: '#343a40',
            borderRadius: '8px 8px 0 0',
            pb: 1
          }}
        />
        <CardContent>
          <TableContainer component={Paper} sx={{ borderRadius: '8px' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#25303a', '& th': { color: '#fff' } }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Otras Columnas..</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productosNoVendidos.map((prod: any, idx: number) => {
                  return (
                    <TableRow
                      key={`prodNoVend-${idx}`}
                      sx={{
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      <TableCell>{prod.id}</TableCell>
                      <TableCell>{prod.nombre}</TableCell>
                      <TableCell>{prod.categoriaNombre || '—'}</TableCell>
                      <TableCell>...</TableCell>
                    </TableRow>
                  );
                })}

                {productosNoVendidos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: '#fff' }}>
                      (Sin datos de productos sin venta)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
