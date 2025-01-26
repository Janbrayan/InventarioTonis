import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

// Tipos básicos
interface HistorialVenta {
  id?: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DetalleHistorialVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  createdAt?: string;
  updatedAt?: string;
}

type RangoFiltro = 'day' | 'week' | 'month' | 'all';

/** Componente para mostrar detalles en tabla */
function TablaDetallesVenta({ detalles }: { detalles: DetalleHistorialVenta[] }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>ProductoID</TableCell>
            <TableCell>Cantidad</TableCell>
            <TableCell>PrecioUnit</TableCell>
            <TableCell>Subtotal</TableCell>
            <TableCell>Actualizado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {detalles.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.id}</TableCell>
              <TableCell>{d.productoId}</TableCell>
              <TableCell>{d.cantidad}</TableCell>
              <TableCell>{`$${d.precioUnitario.toFixed(2)}`}</TableCell>
              <TableCell>
                {d.subtotal != null ? `$${d.subtotal.toFixed(2)}` : '—'}
              </TableCell>
              <TableCell>
                {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}
              </TableCell>
            </TableRow>
          ))}
          {detalles.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Sin detalles
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function HistorialVentas() {
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<HistorialVenta[]>([]);
  const [filtro, setFiltro] = useState<RangoFiltro>('all');

  // Manejo de modal de detalles
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState<DetalleHistorialVenta[]>([]);
  const [ventaIdSeleccionada, setVentaIdSeleccionada] = useState<number | null>(null);

  /** Carga el historial filtrado por 'day' | 'week' | 'month' | 'all' */
  const cargarHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.historialGetVentasByRange?.(filtro);
      if (data) {
        setVentas(data);
      }
    } catch (error) {
      console.error('Error cargarHistorial:', error);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  /** Mostrar detalles de venta (abre el modal) */
  async function handleVerDetalles(ventaId: number) {
    try {
      setVentaIdSeleccionada(ventaId);
      const detalles = await window.electronAPI.historialGetDetallesByVentaId?.(ventaId);
      setDetallesVenta(detalles || []);
      setOpenDetalles(true);
    } catch (error) {
      console.error('Error handleVerDetalles:', error);
    }
  }

  /** Cerrar modal */
  function handleCloseDetalles() {
    setOpenDetalles(false);
    setDetallesVenta([]);
    setVentaIdSeleccionada(null);
  }

  /** Cambio de filtro en el Select */
  function handleChangeFiltro(event: SelectChangeEvent<RangoFiltro>) {
    setFiltro(event.target.value as RangoFiltro);
  }

  /** Suma total de las ventas */
  const totalVentas = ventas.reduce((acc, venta) => acc + (venta.total || 0), 0);

  if (loading) {
    return <p>Cargando historial de ventas...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#212529' }}>
        Historial de Ventas
      </Typography>

      {/* Barra para seleccionar el rango */}
      <Box sx={{ display: 'flex', mb: 2, gap: 2, alignItems: 'center' }}>
        <FormControl
          sx={{
            minWidth: 160,
            backgroundColor: '#2b3640',
            borderRadius: 1,
            p: 1
          }}
        >
          <InputLabel
            id="filtro-rango-label"
            sx={{ color: '#fff' }} // Label en blanco
          >
            Filtro
          </InputLabel>
          <Select
            labelId="filtro-rango-label"
            label="Filtro"
            value={filtro}
            onChange={handleChangeFiltro}
            // Estilos personalizados para el tema oscuro
            sx={{
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff',
              },
              '.MuiSvgIcon-root': {
                color: '#fff',
              },
            }}
            MenuProps={{
              sx: {
                '&& .MuiPaper-root': {
                  backgroundColor: '#2b3640', // fondo del menú
                  border: '1px solid #444',   // borde opcional
                },
                '&& .MuiMenuItem-root': {
                  color: '#fff',
                },
                '&& .MuiMenuItem-root.Mui-selected': {
                  backgroundColor: '#3e4a55',
                },
              },
            }}
          >
            <MenuItem value="day">Día</MenuItem>
            <MenuItem value="week">Semana</MenuItem>
            <MenuItem value="month">Mes</MenuItem>
            <MenuItem value="all">Todo el tiempo</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tarjeta para listar las ventas */}
      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Listado Completo
            </Typography>
          }
          sx={{
            backgroundColor: '#343a40',
            borderRadius: '8px 8px 0 0',
            pb: 1
          }}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            sx={{ borderRadius: '0 0 8px 8px', backgroundColor: '#2b3640' }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#25303a', '& th': { color: '#fff' } }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow
                    key={venta.id}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{venta.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {venta.createdAt ? new Date(venta.createdAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {venta.total != null ? `$${venta.total.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {venta.observaciones || '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => venta.id && handleVerDetalles(venta.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Si no hay ventas, mensaje */}
                {ventas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: '#fff' }}>
                      No hay ventas registradas en el historial
                    </TableCell>
                  </TableRow>
                )}

                {/* Fila con la suma total de las ventas */}
                {ventas.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      align="right"
                      sx={{ color: '#fff', fontWeight: 'bold' }}
                    >
                      SUMA TOTAL:
                    </TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {`$${totalVentas.toFixed(2)}`}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal ver detalles */}
      <Dialog
        open={openDetalles}
        onClose={handleCloseDetalles}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          style: {
            backdropFilter: 'blur(6px)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Detalles de la Venta #{ventaIdSeleccionada}
        </DialogTitle>
        <DialogContent>
          <TablaDetallesVenta detalles={detallesVenta} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetalles}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
