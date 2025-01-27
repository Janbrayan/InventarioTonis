import React, { useEffect, useState } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

/** Interfaz de Producto (con precioVenta) */
interface Product {
  id: number;
  nombre: string;
  precioVenta?: number;
}

/** Estructura básica de una Venta */
interface Sale {
  id?: number;
  total?: number;
  updatedAt?: string;
}

/** Renglón de la venta */
interface DetalleVenta {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Diálogo de confirmación */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(5px)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirm}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Ejemplo mínimo para convertir números a texto */
function numberToSpanish(num: number): string {
  return String(num);
}

export default function Ventas() {
  const location = useLocation();
  const navigate = useNavigate();

  const [ventas, setVentas] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para crear una venta
  const [openModal, setOpenModal] = useState(false);

  // Detalles de la venta en curso
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Modal ver detalles
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState<any[]>([]);
  const [viewVentaId, setViewVentaId] = useState<number | null>(null);

  // Selección manual de producto
  const [selProductoId, setSelProductoId] = useState<number>(0);

  // Pago/cambio
  const [pagoStr, setPagoStr] = useState('');
  const [cambio, setCambio] = useState(0);

  // ===================== useEffect: Cargar data =====================
  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [ventasList, prodList] = await Promise.all([
        window.electronAPI.getSalesToday(),
        window.electronAPI.getProducts()
      ]);
      setVentas(ventasList || []);
      setProducts(prodList || []);
    } catch (err) {
      console.error('Error fetchAll Ventas:', err);
    } finally {
      setLoading(false);
    }
  }

  // ===================== Efecto A: si venimos con pendingProductId,
  // hacemos un segundo navigate => openModal: 'createSale'
  useEffect(() => {
    if (!loading) {
      const st: any = location.state;
      if (typeof st?.pendingProductId === 'number') {
        navigate(location.pathname, {
          replace: true,
          state: {
            openModal: 'createSale',
            productId: st.pendingProductId,
          },
        });
      }
    }
  }, [loading, location.state, navigate]);

  // ===================== Efecto B: si venimos con openModal: 'createSale',
  // abrimos el modal y agregamos el producto
  useEffect(() => {
    if (!loading) {
      const st: any = location.state;
      if (st?.openModal === 'createSale') {
        // (2) Solo abrimos el modal si aún no está abierto, para NO limpiar detalles
        if (!openModal) {
          handleOpenCreate(); 
        }
        if (typeof st.productId === 'number') {
          addProductById(st.productId);
        }
        // Limpiamos el state de la URL
        navigate(location.pathname, { replace: true });
      }
    }
  }, [loading, location.state, navigate, openModal]);

  // ===================== Abrir/cerrar modal Crear Venta =====================
  function handleOpenCreate() {
    // (1) QUITAMOS setDetalles([]); para no limpiar cada vez que abrimos
    // Solo si deseas que al dar click manualmente en "Crear Venta" se resetee, 
    // podrías dejarlo, pero sabiendo que borrarás la venta anterior.
    // setDetalles([]);

    setPagoStr('');
    setCambio(0);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
  }

  // ===================== Seleccionar producto manualmente =====================
  function handleChangeProducto(e: SelectChangeEvent<number>) {
    const newProdId = Number(e.target.value);
    setSelProductoId(newProdId);
    if (!newProdId) return;

    addProductById(newProdId);
    setSelProductoId(0);
  }

  // ===================== Agregar producto por ID =====================
  // Sumar a la cantidad si ya existe
  function addProductById(productId: number) {
    const index = detalles.findIndex((r) => r.productoId === productId);

    if (index >= 0) {
      // Ya existe => incrementar la cantidad
      const copy = [...detalles];
      copy[index].cantidad += 1;
      copy[index].subtotal = copy[index].cantidad * copy[index].precioUnitario;
      setDetalles(copy);
    } else {
      // No existe => crear renglón
      const prod = products.find((p) => p.id === productId);
      if (!prod) return;

      const precio = prod.precioVenta ?? 0;
      const nuevo: DetalleVenta = {
        productoId: productId,
        cantidad: 1,
        precioUnitario: precio,
        subtotal: precio,
      };
      setDetalles((prev) => [...prev, nuevo]);
    }
  }

  // ===================== Eliminar renglón =====================
  function removeRenglonDetalle(idx: number) {
    const copy = [...detalles];
    copy.splice(idx, 1);
    setDetalles(copy);
  }

  // ===================== Cambiar cantidad/precio =====================
  function handleChangeCantidad(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, idx: number) {
    const val = parseFloat(e.target.value) || 0;
    const copy = [...detalles];
    copy[idx].cantidad = val;
    copy[idx].subtotal = copy[idx].cantidad * copy[idx].precioUnitario;
    setDetalles(copy);
  }

  function handleChangePrecio(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, idx: number) {
    const val = parseFloat(e.target.value) || 0;
    const copy = [...detalles];
    copy[idx].precioUnitario = val;
    copy[idx].subtotal = copy[idx].cantidad * val;
    setDetalles(copy);
  }

  function calcularTotal(): number {
    return detalles.reduce((acc, d) => acc + d.subtotal, 0);
  }

  // ===================== Pago/cambio =====================
  function handlePagoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPagoStr(e.target.value);
    const pagoNum = parseFloat(e.target.value) || 0;
    const total = calcularTotal();
    const c = pagoNum - total;
    setCambio(c > 0 ? c : 0);
  }

  // ===================== Guardar Venta =====================
  async function handleSaveVenta() {
    const action = async () => {
      try {
        const total = calcularTotal();
        const saleData = {
          total,
          detalles: detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
          })),
        };
        const resp = await window.electronAPI.createSale(saleData);
        if (!resp?.success) {
          alert('No se pudo crear la venta.');
        }
        await fetchAll();
      } catch (err) {
        console.error('Error createSale:', err);
      } finally {
        closeConfirmDialog();
      }
    };

    openConfirmDialog(
      'Confirmar venta',
      `¿Crear venta con ${detalles.length} renglones?`,
      action
    );
    setOpenModal(false);
  }

  // ===================== Confirm Dialog =====================
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // ===================== Ver Detalles =====================
  async function handleVerDetalles(ventaId: number) {
    try {
      setViewVentaId(ventaId);
      const resp = await window.electronAPI.getDetallesByVenta(ventaId);
      setDetallesVenta(resp || []);
      setOpenDetalles(true);
    } catch (err) {
      console.error('Error getDetallesByVenta:', err);
    }
  }
  function handleCloseDetalles() {
    setOpenDetalles(false);
    setDetallesVenta([]);
    setViewVentaId(null);
  }

  // ===================== Eliminar venta =====================
  function handleDeleteVenta(v: Sale) {
    openConfirmDialog(
      'Eliminar Venta',
      `¿Deseas ELIMINAR la venta #${v.id}?`,
      async () => {
        try {
          if (!v.id) return;
          const resp = await window.electronAPI.deleteSale(v.id);
          if (!resp?.success) {
            alert('No se pudo eliminar la venta.');
          }
          await fetchAll();
        } catch (err) {
          console.error('Error deleteSale:', err);
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ===================== Render =====================
  if (loading) return <p>Cargando ventas...</p>;

  const total = calcularTotal();
  const pagoNum = parseFloat(pagoStr) || 0;
  const cambioNum = (pagoNum - total) > 0 ? pagoNum - total : 0;
  const cambioEnLetra = cambioNum > 0 ? numberToSpanish(Math.round(cambioNum)) : '';

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#212529' }}>
        Ventas
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardHeader
          title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Lista de Ventas (Hoy)</Typography>}
          sx={{ backgroundColor: '#343a40', borderRadius: '8px 8px 0 0', pb: 1 }}
          action={
            <Button
              type="button"
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 'bold', mr: 1 }}
              onClick={handleOpenCreate}
            >
              Crear Venta
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ borderRadius: '0 0 8px 8px', backgroundColor: '#2b3640' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#25303a', '& th': { color: '#fff' } }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actualizado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.map((v) => (
                  <TableRow
                    key={v.id}
                    sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{v.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>${v.total || 0}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleVerDetalles(v.id!)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteVenta(v)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {ventas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: '#fff' }}>
                      No hay ventas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal Crear Venta */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Crear Venta</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Selecciona el Producto a vender
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="select-product-label">Producto</InputLabel>
            <Select<number>
              labelId="select-product-label"
              value={selProductoId}
              label="Producto"
              onChange={handleChangeProducto}
            >
              <MenuItem value={0}>-- Seleccionar --</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tabla interna de renglones */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>PrecioUnit</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Quitar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((d, idx) => {
                  const prod = products.find((pp) => pp.id === d.productoId);
                  const nombreProd = prod ? prod.nombre : `ID=${d.productoId}`;
                  return (
                    <TableRow key={idx}>
                      <TableCell>{nombreProd}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={d.cantidad}
                          onChange={(e) => handleChangeCantidad(e, idx)}
                          sx={{ width: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={d.precioUnitario}
                          onChange={(e) => handleChangePrecio(e, idx)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>${d.subtotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => removeRenglonDetalle(idx)}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {detalles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      (Sin productos)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pago / cambio */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Total: ${calcularTotal().toFixed(2)}
            </Typography>
            <TextField
              label="Pago del cliente"
              type="number"
              value={pagoStr}
              onChange={handlePagoChange}
              sx={{ width: 120 }}
            />
            {cambioNum > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Cambio: ${cambioNum.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  ({cambioEnLetra})
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveVenta}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog
        open={openDetalles}
        onClose={handleCloseDetalles}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Detalles de la Venta #{viewVentaId}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>PrecioUnit</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Actualizado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detallesVenta.map((d) => {
                  const prodName = products.find((pp) => pp.id === d.productoId)?.nombre || `ID=${d.productoId}`;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{prodName}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>${d.precioUnitario}</TableCell>
                      <TableCell>${d.subtotal}</TableCell>
                      <TableCell>
                        {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {detallesVenta.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Sin detalles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetalles}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
      />
    </Box>
  );
}
