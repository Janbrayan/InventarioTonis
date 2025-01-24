import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button,
  TextField,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/** Tipos de datos de ejemplo */
interface ComprasProveedor {
  proveedorId: number;
  nombreProveedor: string;
  totalCompras: number;
}
interface InversionProducto {
  productoId: number;
  nombreProducto: string;
  inversionTotal: number;
}
interface DistribucionCategoria {
  categoriaId: number;
  nombreCategoria: string;
  totalProductos: number;
}
/** Filas para Detalle de Inventario */
interface DetalleInventarioRow {
  productoId: number;
  nombreProducto: string;
  stockTotal: number;
  precioCompra: number;
  valor: number; // stockTotal * precioCompra
}

export default function Estadisticas() {
  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(true);

  // Datos principales
  const [categoriasData, setCategoriasData] = useState<DistribucionCategoria[]>([]);
  const [comprasProveedoresData, setComprasProveedoresData] = useState<ComprasProveedor[]>([]);
  const [inversionData, setInversionData] = useState<InversionProducto[]>([]);

  // Mini-stats
  const [totalProductosActivos, setTotalProductosActivos] = useState(0);
  const [valorTotalInventario, setValorTotalInventario] = useState(0);
  const [totalPiezasInventario, setTotalPiezasInventario] = useState(0);

  // Detalle de Inventario
  const [detalleInventario, setDetalleInventario] = useState<DetalleInventarioRow[]>([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function cargarEstadisticas() {
    try {
      setLoading(true);

      // 1) Distribución de productos por categoría
      const cats = await window.electronAPI.statsGetDistribucionProductosPorCategoria();
      setCategoriasData(cats || []);

      // 2) Compras por Proveedor
      const provData = await window.electronAPI.statsGetComprasPorProveedor(fechaInicio, fechaFin);
      setComprasProveedoresData(provData || []);

      // 3) Inversión de compra por producto
      const invData = await window.electronAPI.statsGetInversionCompraPorProducto();
      setInversionData(invData || []);

      // Mini-stats
      const totalProd = await window.electronAPI.statsGetTotalProductosActivos();
      setTotalProductosActivos(totalProd.totalProductos);

      const valorInv = await window.electronAPI.statsGetValorTotalInventario();
      setValorTotalInventario(valorInv.valorInventario);

      const { totalPiezas } = await window.electronAPI.statsGetTotalPiezasInventario();
      setTotalPiezasInventario(totalPiezas);

      // Detalle Inventario: unimos “stock actual” con la lista de productos
      const stockData = await window.electronAPI.statsGetStockActualPorProducto();
      const allProducts = await window.electronAPI.getProducts();

      const merged = stockData.map((s: any) => {
        const prod = allProducts.find((p: any) => p.id === s.productoId) || {};
        const precioCompra = prod.precioCompra || 0;
        return {
          productoId: s.productoId,
          nombreProducto: s.nombreProducto,
          stockTotal: s.stockTotal,
          precioCompra,
          valor: s.stockTotal * precioCompra
        };
      });
      setDetalleInventario(merged);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFiltrar() {
    cargarEstadisticas();
  }

  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  // Paleta de colores para PieChart
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#845EC2', '#FF5E78'];

  // Totales para la tabla final de inventario
  const totalPiezasInventarioDetalle = detalleInventario.reduce((acc, d) => acc + d.stockTotal, 0);
  const totalValorDetalle = detalleInventario.reduce((acc, d) => acc + d.valor, 0);

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#212529' }}>
        Estadísticas
      </Typography>

      {/* FILTROS DE FECHA */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Fecha Inicio"
              type="date"
              fullWidth
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Fecha Fin"
              type="date"
              fullWidth
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" color="primary" onClick={handleFiltrar}>
              Filtrar
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* (1) Detalle de Productos Activos */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Detalle de Productos Activos"
          subheader="Piezas por producto y valor"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                <TableCell sx={{ color: '#fff' }} align="right">
                  Piezas
                </TableCell>
                <TableCell sx={{ color: '#fff' }} align="right">
                  Precio Compra
                </TableCell>
                <TableCell sx={{ color: '#fff' }} align="right">
                  Valor
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalleInventario.map((row) => (
                <TableRow key={row.productoId}>
                  <TableCell sx={{ color: '#fff' }}>{row.nombreProducto}</TableCell>
                  <TableCell sx={{ color: '#fff' }} align="right">
                    {row.stockTotal}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }} align="right">
                    ${row.precioCompra.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }} align="right">
                    ${row.valor.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {detalleInventario.length > 0 && (
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>TOTAL</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="right">
                    {totalPiezasInventarioDetalle}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }} />
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="right">
                    ${totalValorDetalle.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
              {detalleInventario.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: '#fff' }}>
                    Sin productos activos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* (2) Distribución de productos por categoría: PieChart + Tabla */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Distribución de Productos por Categoría"
          subheader="PieChart + Lista"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box sx={{ height: 300, border: '1px solid #444' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriasData}
                      dataKey="totalProductos"
                      nameKey="nombreCategoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {categoriasData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={[
                            '#0088FE',
                            '#00C49F',
                            '#FFBB28',
                            '#FF8042',
                            '#845EC2',
                            '#FF5E78',
                          ][index % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#fff' }}>Categoría</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoriasData.map((cat) => (
                    <TableRow key={cat.categoriaId}>
                      <TableCell sx={{ color: '#fff' }}>{cat.nombreCategoria}</TableCell>
                      <TableCell sx={{ color: '#fff' }} align="right">
                        {cat.totalProductos}
                      </TableCell>
                    </TableRow>
                  ))}
                  {categoriasData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: '#fff' }}>
                        Sin datos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* (3) COMPRAS POR PROVEEDOR: Chart + Tabla */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Compras por Proveedor"
          subheader="Gráfica + Lista"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box sx={{ height: 300, border: '1px solid #444' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={comprasProveedoresData.map((item) => ({
                      name: item.nombreProveedor,
                      valor: item.totalCompras,
                    }))}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#ccc" tick={{ fill: '#ccc' }} />
                    <YAxis stroke="#ccc" tick={{ fill: '#ccc' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#fff' }}>Proveedor</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comprasProveedoresData.map((prov) => (
                    <TableRow key={prov.proveedorId}>
                      <TableCell sx={{ color: '#fff' }}>{prov.nombreProveedor}</TableCell>
                      <TableCell sx={{ color: '#fff' }} align="right">
                        {prov.totalCompras}
                      </TableCell>
                    </TableRow>
                  ))}
                  {comprasProveedoresData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: '#fff' }}>
                        Sin datos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* (4) Inversión de compra por producto: Chart + Tabla */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardHeader
          title="Inversión de Compra por Producto"
          subheader="Barras + Lista"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box sx={{ height: 300, border: '1px solid #444' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inversionData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="nombreProducto" stroke="#ccc" tick={{ fill: '#ccc' }} />
                    <YAxis stroke="#ccc" tick={{ fill: '#ccc' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inversionTotal" fill="#00C49F" name="Inversión ($)" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                    <TableCell sx={{ color: '#fff' }} align="right">
                      Inversión
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inversionData.map((prod) => (
                    <TableRow key={prod.productoId}>
                      <TableCell sx={{ color: '#fff' }}>{prod.nombreProducto}</TableCell>
                      <TableCell sx={{ color: '#fff' }} align="right">
                        {prod.inversionTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {inversionData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: '#fff' }}>
                        Sin datos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
