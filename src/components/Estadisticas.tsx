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
  TableBody,
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
interface DetalleInventarioRow {
  productoId: number;
  nombreProducto: string;
  stockTotal: number;
  precioCompra: number;
  valor: number; // stockTotal * precioCompra
}

/** Nuevo: interfaz para productos próximos a caducar */
interface ProductoCaducar {
  productoId: number;
  nombreProducto: string;
  loteId: number;
  fechaCaducidad: string;
}

export default function Estadisticas() {
  const [loading, setLoading] = useState(true);

  // ========== DATOS GENERALES SIN FILTRO ==========
  const [categoriasData, setCategoriasData] = useState<DistribucionCategoria[]>([]);
  const [detalleInventario, setDetalleInventario] = useState<DetalleInventarioRow[]>([]);
  const [totalProductosActivos, setTotalProductosActivos] = useState(0);
  const [valorTotalInventario, setValorTotalInventario] = useState(0);
  const [totalPiezasInventario, setTotalPiezasInventario] = useState(0);

  // ========== FILTROS: COMPRAS POR PROVEEDOR ==========
  const [fechaInicioProv, setFechaInicioProv] = useState('');
  const [fechaFinProv, setFechaFinProv] = useState('');
  const [comprasProveedoresData, setComprasProveedoresData] = useState<ComprasProveedor[]>([]);

  // ========== FILTROS: INVERSIÓN POR PRODUCTO ==========
  const [fechaInicioInv, setFechaInicioInv] = useState('');
  const [fechaFinInv, setFechaFinInv] = useState('');
  const [inversionData, setInversionData] = useState<InversionProducto[]>([]);

  // ========== (NUEVO) FILTRO: PRODUCTOS PRÓXIMOS A CADUCAR ==========
  // Lo manejamos como string para poder dejarlo vacío
  const [diasCaducar, setDiasCaducar] = useState<string>(''); 
  const [productosCaducar, setProductosCaducar] = useState<ProductoCaducar[]>([]);

  // Carga inicial de datos
  useEffect(() => {
    (async () => {
      await cargarDatosGenerales();
      await cargarComprasProveedores();
      await cargarInversionProductos();
      await cargarProductosACaducar();
    })();
  }, []);

  /**
   * Carga estadísticas que NO dependen de rangos (inventario, etc.)
   */
  async function cargarDatosGenerales() {
    try {
      setLoading(true);

      // 1) Distribución de productos por categoría
      const cats = await window.electronAPI.statsGetDistribucionProductosPorCategoria();
      setCategoriasData(cats || []);

      // 2) Stats inventario
      const totalProd = await window.electronAPI.statsGetTotalProductosActivos();
      setTotalProductosActivos(totalProd.totalProductos);

      const valorInv = await window.electronAPI.statsGetValorTotalInventario();
      setValorTotalInventario(valorInv.valorInventario);

      const { totalPiezas } = await window.electronAPI.statsGetTotalPiezasInventario();
      setTotalPiezasInventario(totalPiezas);

      // 3) Detalle de Inventario
      const stockData = await window.electronAPI.statsGetStockActualPorProducto();
      const allProducts = await window.electronAPI.getProducts();

      // Unimos el stock con el precioCompra para calcular "valor"
      const merged: DetalleInventarioRow[] = stockData.map((s: any) => {
        const prod = allProducts.find((p: any) => p.id === s.productoId) || {};
        const precioCompra = prod.precioCompra || 0;
        return {
          productoId: s.productoId,
          nombreProducto: s.nombreProducto,
          stockTotal: s.stockTotal,
          precioCompra,
          valor: s.stockTotal * precioCompra,
        };
      });
      setDetalleInventario(merged);
    } catch (error) {
      console.error('Error cargarDatosGenerales:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Carga COMPRAS POR PROVEEDOR con fechaInicioProv y fechaFinProv
   */
  async function cargarComprasProveedores() {
    try {
      setLoading(true);
      const provData = await window.electronAPI.statsGetComprasPorProveedor(
        fechaInicioProv,
        fechaFinProv
      );
      setComprasProveedoresData(provData || []);
    } catch (error) {
      console.error('Error cargarComprasProveedores:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Carga INVERSIÓN POR PRODUCTO con fechaInicioInv y fechaFinInv
   */
  async function cargarInversionProductos() {
    try {
      setLoading(true);
      const invData = await window.electronAPI.statsGetInversionCompraPorProducto(
        fechaInicioInv,
        fechaFinInv
      );
      setInversionData(invData || []);
    } catch (error) {
      console.error('Error cargarInversionProductos:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * (NUEVO) Carga productos próximos a caducar
   * Usamos parseInt(diasCaducar) => default 30 si está vacío o no es número
   */
  async function cargarProductosACaducar() {
    try {
      setLoading(true);

      const parsed = parseInt(diasCaducar, 10);
      // Si el valor es NaN (el usuario dejó en blanco) o < 1, definimos 30 por default
      const finalDias = isNaN(parsed) || parsed < 1 ? 30 : parsed;

      const data = await window.electronAPI.statsGetProductosProximosACaducar(finalDias);
      setProductosCaducar(data || []);
    } catch (error) {
      console.error('Error cargarProductosACaducar:', error);
    } finally {
      setLoading(false);
    }
  }

  // Render principal
  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  // Paleta de colores para PieChart
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#845EC2', '#FF5E78'];

  // Cálculos totales de la tabla de inventario
  const totalPiezasInventarioDetalle = detalleInventario.reduce((acc, d) => acc + d.stockTotal, 0);
  const totalValorDetalle = detalleInventario.reduce((acc, d) => acc + d.valor, 0);

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#212529' }}>
        Estadísticas
      </Typography>

      {/* (1) Detalle de Productos Activos */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Detalle de Productos Activos"
          subheader={`Total: ${totalProductosActivos} | Valor Inv: $${valorTotalInventario.toFixed(
            2
          )} | Piezas Totales: ${totalPiezasInventario}`}
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

      {/* (2) Distribución de productos por categoría */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Distribución de Productos por Categoría"
          subheader="PieChart + Lista (sin filtro de fecha)"
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
                          fill={pieColors[index % pieColors.length]}
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

      {/* (3) COMPRAS POR PROVEEDOR (filtro de fecha) */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Compras por Proveedor"
          subheader="Gráfica + Lista (Filtrar por fecha)"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                type="date"
                label="Fecha Inicio"
                fullWidth
                value={fechaInicioProv}
                onChange={(e) => setFechaInicioProv(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                type="date"
                label="Fecha Fin"
                fullWidth
                value={fechaFinProv}
                onChange={(e) => setFechaFinProv(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="button"              // <---- Importante para evitar reload
                variant="contained"
                color="primary"
                fullWidth
                onClick={cargarComprasProveedores}
              >
                Filtrar
              </Button>
            </Grid>
          </Grid>

          {/* Gráfica + Tabla */}
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

      {/* (4) Inversión de compra por producto (filtro de fecha) */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
        <CardHeader
          title="Inversión de Compra por Producto"
          subheader="Barras + Lista (Filtrar por fecha)"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                type="date"
                label="Fecha Inicio"
                fullWidth
                value={fechaInicioInv}
                onChange={(e) => setFechaInicioInv(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                type="date"
                label="Fecha Fin"
                fullWidth
                value={fechaFinInv}
                onChange={(e) => setFechaFinInv(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="button"              // <---- Importante
                variant="contained"
                color="primary"
                fullWidth
                onClick={cargarInversionProductos}
              >
                Filtrar
              </Button>
            </Grid>
          </Grid>

          {/* Gráfica + Tabla */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box sx={{ height: 300, border: '1px solid #444' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inversionData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
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

      {/* (NUEVO) (5) Productos próximos a CADUCAR (filtro de días) */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardHeader
          title="Productos próximos a Caducar"
          subheader="Tabla (Filtrar por días restantes)"
          sx={{ backgroundColor: '#343a40', pb: 1, color: '#fff' }}
        />
        <CardContent sx={{ backgroundColor: '#1c2430' }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={10}>
              <TextField
                label="Días para Caducar"
                type="number"
                fullWidth
                value={diasCaducar}
                onChange={(e) => setDiasCaducar(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="button"              // <---- Importante
                variant="contained"
                color="secondary"
                fullWidth
                onClick={cargarProductosACaducar}
              >
                Filtrar
              </Button>
            </Grid>
          </Grid>

          {/* Tabla de Productos Próximos a Caducar */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                <TableCell sx={{ color: '#fff' }}>Lote ID</TableCell>
                <TableCell sx={{ color: '#fff' }}>Fecha Caducidad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productosCaducar.map((item) => (
                <TableRow key={item.loteId}>
                  <TableCell sx={{ color: '#fff' }}>{item.nombreProducto}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{item.loteId}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(item.fechaCaducidad).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {productosCaducar.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: '#fff' }}>
                    Sin datos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
