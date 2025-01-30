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
  IconButton,
  Chip
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

/** Interfaz de Producto con stock */
interface Product {
  id: number;
  nombre: string;
  precioVenta?: number;
  stock?: number;
}

/** Estructura básica de una Venta */
interface Sale {
  id?: number;
  total?: number;
  updatedAt?: string;
}

/** 
 * DetalleVenta:
 * - cantidad / precioUnitario: valor numérico
 * - cantidadStr / precioStr: cadenas que guardan exactamente lo que el usuario teclea
 */
interface DetalleVenta {
  productoId: number;
  cantidad: number;
  cantidadStr: string;
  precioUnitario: number;
  precioStr: string;
  subtotal: number;
}

/** Props del Diálogo de Confirmación */
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

/** Props del Diálogo de Alerta (un solo botón “Cerrar”) */
interface AlertDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

function AlertDialog({ open, message, onClose }: AlertDialogProps) {
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
      <DialogTitle sx={{ fontWeight: 'bold' }}>Alerta</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Para colorear el Chip según la cantidad de stock */
function getStockColor(stock: number): 'error' | 'warning' | 'success' {
  if (stock <= 0) return 'error';    // rojo
  if (stock < 5) return 'warning';   // amarillo
  return 'success';                  // verde
}

/** Convierte un número a letras en español (versión resumida) */
function numberToSpanish(num: number): string {
  if (num === 0) return 'cero';
  // ... resto de tu lógica ...
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

  // Detalles de la venta en curso (arreglo de DetalleVenta)
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Alert Dialog
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Modal ver detalles
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState<any[]>([]);
  const [viewVentaId, setViewVentaId] = useState<number | null>(null);

  // Selección manual de producto
  const [selProductoId, setSelProductoId] = useState<number>(0);

  // Pago/cambio
  const [pagoStr, setPagoStr] = useState('');
  const [cambio, setCambio] = useState(0);

  // Alert helpers
  function openAlert(message: string) {
    setAlertMessage(message);
    setAlertOpen(true);
  }
  function closeAlert() {
    setAlertOpen(false);
    setAlertMessage('');
  }

  // ===================== Cargar data (ventas, productos) =====================
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
      openAlert('Error al cargar datos de ventas/productos.');
    } finally {
      setLoading(false);
    }
  }

  // ===================== Efecto A: pendingProductId => openModal: 'createSale' =====================
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

  // ===================== Efecto B: openModal: 'createSale' => Abrir modal y agregar producto
  useEffect(() => {
    if (!loading) {
      const st: any = location.state;
      if (st?.openModal === 'createSale') {
        if (!openModal) {
          handleOpenCreate();
        }
        if (typeof st.productId === 'number') {
          addProductById(st.productId);
        }
        navigate(location.pathname, { replace: true });
      }
    }
  }, [loading, location.state, navigate, openModal]);

  // ===================== Abrir/cerrar modal Crear Venta =====================
  function handleOpenCreate() {
    // Resetear la venta si gustas:
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

    // Si el stock es 0 => mostramos alerta y no añadimos
    if (newProdId) {
      const foundProd = products.find((p) => p.id === newProdId);
      if (foundProd && (foundProd.stock ?? 0) <= 0) {
        openAlert('Debes agregar stock a este producto antes de venderlo.');
        return; 
      }
    }
    setSelProductoId(newProdId);
    if (!newProdId) return;

    addProductById(newProdId);
    setSelProductoId(0);
  }

  // ===================== Agregar producto al carrito =====================
  function addProductById(productId: number) {
    const index = detalles.findIndex((r) => r.productoId === productId);
    if (index >= 0) {
      // Ya existe => incrementar la cantidad
      const copy = [...detalles];
      const row = copy[index];

      row.cantidad += 1;
      row.cantidadStr = String(row.cantidad);
      row.subtotal = row.cantidad * row.precioUnitario;
      setDetalles(copy);

    } else {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return;

      const precio = prod.precioVenta ?? 0;
      const nuevo: DetalleVenta = {
        productoId: productId,
        cantidad: 1,
        cantidadStr: '1',
        precioUnitario: precio,
        precioStr: String(precio),
        subtotal: precio
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

  // ===================== Cambiar cantidad/precio (usamos strings) =====================
  function handleChangeCantidad(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    idx: number
  ) {
    const inputValue = e.target.value;
    const copy = [...detalles];
    const row = copy[idx];

    row.cantidadStr = inputValue; // guardo la cadena tecleada
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      row.cantidad = parsed;
      row.subtotal = row.cantidad * row.precioUnitario;
    }
    setDetalles(copy);
  }

  function handleChangePrecio(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    idx: number
  ) {
    const inputValue = e.target.value;
    const copy = [...detalles];
    const row = copy[idx];

    row.precioStr = inputValue;
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      row.precioUnitario = parsed;
      row.subtotal = row.cantidad * row.precioUnitario;
    }
    setDetalles(copy);
  }

  // ===================== Calcular total =====================
  function calcularTotal(): number {
    return detalles.reduce((acc, d) => acc + d.subtotal, 0);
  }

  // ===================== Pago/cambio =====================
  function handlePagoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pagoNum = parseFloat(e.target.value) || 0;
    setPagoStr(e.target.value);
    const total = calcularTotal();
    const c = pagoNum - total;
    setCambio(c > 0 ? c : 0);
  }

  // ===================== Guardar Venta =====================
  async function handleSaveVenta() {
    const action = async () => {
      try {
        const total = calcularTotal();
        // Mandamos la versión numérica (cantidad, precioUnitario) al backend
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
          if (resp?.message) {
            openAlert(resp.message);
          } else {
            openAlert('No se pudo crear la venta. (stock insuficiente o error interno)');
          }
        } else {
          await fetchAll();
        }
      } catch (err) {
        console.error('Error createSale:', err);
        openAlert('Ocurrió un error al crear la venta.');
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

  // ===================== Ver Detalles de Venta existente =====================
  async function handleVerDetalles(ventaId: number) {
    try {
      setViewVentaId(ventaId);
      const resp = await window.electronAPI.getDetallesByVenta(ventaId);
      setDetallesVenta(resp || []);
      setOpenDetalles(true);
    } catch (err) {
      console.error('Error getDetallesByVenta:', err);
      openAlert('Error al obtener detalles de la venta.');
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
            openAlert('No se pudo eliminar la venta.');
          } else {
            await fetchAll();
          }
        } catch (err) {
          console.error('Error deleteSale:', err);
          openAlert('Ocurrió un error al eliminar la venta.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ===================== Render =====================
  if (loading) return <p>Cargando ventas...</p>;

  // Calcular total y cambio
  const total = calcularTotal();
  const pagoNum = parseFloat(pagoStr) || 0;
  const cambioNum = pagoNum > total ? (pagoNum - total) : 0;
  const cambioInt = Math.round(cambioNum);
  const cambioEnLetra = cambioInt > 0
    ? numberToSpanish(cambioInt) + (cambioInt === 1 ? ' peso' : ' pesos')
    : '';

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
              {products.map((p) => {
                const stockVal = p.stock ?? 0;
                return (
                  <MenuItem
                    key={p.id}
                    value={p.id}
                    disabled={stockVal <= 0}
                  >
                    <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                      <Typography>{p.nombre}</Typography>
                      <Chip
                        label={`Stock: ${stockVal}`}
                        color={getStockColor(stockVal)}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
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
                          // type="text" para permitir cualquier input
                          type="text"
                          value={d.cantidadStr}
                          onChange={(e) => handleChangeCantidad(e, idx)}
                          sx={{ width: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="text"
                          value={d.precioStr}
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
              Total: ${total.toFixed(2)}
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

      {/* Modal Ver Detalles de Venta */}
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

      {/* Alert Dialog */}
      <AlertDialog
        open={alertOpen}
        message={alertMessage}
        onClose={closeAlert}
      />
    </Box>
  );
}
