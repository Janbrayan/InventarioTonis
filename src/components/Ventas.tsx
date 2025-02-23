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
import { Add as AddIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

/** ========== Tipos ========== */
interface Product {
  id: number;
  nombre: string;
  precioVenta?: number;
  stock?: number;
}

interface Sale {
  id?: number;
  total?: number;
  updatedAt?: string;
}

type ModoVenta = 'kilos' | 'pesos' | 'pieza';

/** DetalleVenta (con strings para ciertos campos) */
interface DetalleVenta {
  productoId: number;
  modoVenta: ModoVenta;

  cantidad: number;        // Valor numérico usado en el cálculo
  cantidadStr: string;     // String que se muestra en el <TextField>

  descuentoManualFijo: number;
  descuentoStr: string;

  // Campos string en la UI para permitir borrar y dejar en blanco
  montoPesos?: number;     // valor numérico real
  montoPesosStr?: string;  // string para mostrar en <TextField>

  pesoAproxPieza?: number;
  pesoAproxPiezaStr?: string; // string para la UI

  containerType?: 'kilos' | 'unidad' | 'caja' | 'paquete' | null;

  precioLista: number;
  precioUnitario: number;
  subtotal: number;
}

/** Props Confirm Dialog */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancelAction?: () => void;
}
function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  onConfirm,
  onCancelAction
}: ConfirmDialogProps) {
  function handleCancel() {
    if (onCancelAction) onCancelAction();
    onClose();
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      BackdropProps={{ style: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(5px)',
      }}}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography whiteSpace="pre-line">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirm}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Props Alert Dialog */
interface AlertDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}
function AlertDialog({ open, message, onClose }: AlertDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      BackdropProps={{ style: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(5px)',
      }}}
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

/** Helpers */
function getStockColor(stock: number): 'error' | 'warning' | 'success' {
  if (stock <= 0) return 'error';
  if (stock < 5) return 'warning';
  return 'success';
}

function numberToSpanish(num: number): string {
  if (num === 0) return 'cero';
  return String(num);
}

function daysUntilExpiration(expDateStr: string): number {
  const expDate = new Date(expDateStr + 'T23:59:59');
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** ========== Componente Ventas ========== */
export default function Ventas() {
  const location = useLocation();
  const navigate = useNavigate();

  const [ventas, setVentas] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal crear venta
  const [openModal, setOpenModal] = useState(false);
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [cancelAction, setCancelAction] = useState<() => void>();

  // Alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Ver detalles de venta
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState<any[]>([]);
  const [viewVentaId, setViewVentaId] = useState<number | null>(null);

  // Seleccionar producto
  const [selProductoId, setSelProductoId] = useState<number>(0);

  // Pago/cambio
  const [pagoStr, setPagoStr] = useState('');
  const [cambio, setCambio] = useState(0);

  // Para no repetir alerta de caducidad
  const [warnedProducts, setWarnedProducts] = useState<Set<number>>(() => new Set());

  /** Helpers de Alert */
  function openAlert(msg: string) {
    setAlertMessage(msg);
    setAlertOpen(true);
  }
  function closeAlert() {
    setAlertMessage('');
    setAlertOpen(false);
  }

  /** Cargar data inicial */
  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [listVentas, listProd] = await Promise.all([
        window.electronAPI.getSalesToday(),
        window.electronAPI.getProducts()
      ]);
      setVentas(listVentas || []);
      setProducts(listProd || []);
    } catch (error) {
      console.error('Error fetchAll Ventas:', error);
      openAlert('Error al cargar datos de ventas/productos.');
    } finally {
      setLoading(false);
    }
  }

  /** Revisar pendingProductId */
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

  /** Revisar openModal='createSale' */
  useEffect(() => {
    if (!loading) {
      const st: any = location.state;
      if (st?.openModal === 'createSale') {
        if (!openModal) {
          handleOpenCreate();
        }
        if (typeof st.productId === 'number') {
          addProductById(st.productId, 0);
        }
        navigate(location.pathname, { replace: true });
      }
    }
  }, [loading, location.state, navigate, openModal]);

  function handleOpenCreate() {
    setDetalles([]);
    setPagoStr('');
    setCambio(0);
    setOpenModal(true);
    setWarnedProducts(new Set());
  }
  function handleCloseModal() {
    setOpenModal(false);
    setDetalles([]);
    setPagoStr('');
    setCambio(0);
    setWarnedProducts(new Set());
  }

  async function checkCloseToExpiration(productId: number): Promise<boolean> {
    try {
      const expDateStr = await window.electronAPI.getEarliestLotExpiration(productId);
      if (!expDateStr) return false;
      const diffDays = daysUntilExpiration(expDateStr);
      return diffDays <= 7;
    } catch (error) {
      console.error('Error checkCloseToExpiration:', error);
      return false;
    }
  }

  /** Cambio de producto en el select */
  async function handleChangeProducto(e: SelectChangeEvent<number>) {
    const newProdId = Number(e.target.value);
    if (!newProdId) {
      setSelProductoId(0);
      return;
    }

    // containerType => kilos?
    const containerType = await window.electronAPI.getLastPurchaseContainer(newProdId);
    console.log('containerType:', containerType);

    // Revisar stock
    const foundProd = products.find((p) => p.id === newProdId);
    if (foundProd && (foundProd.stock ?? 0) <= 0) {
      openAlert('Debes agregar stock a este producto antes de venderlo.');
      return;
    }

    // Revisar caducidad
    const isNear = await checkCloseToExpiration(newProdId);
    if (isNear) {
      if (!warnedProducts.has(newProdId)) {
        const newSet = new Set(warnedProducts);
        const prodName = foundProd?.nombre || `(ID=${newProdId})`;
        const stockVal = foundProd?.stock || 0;
        const totalWarn = newSet.size + 1;

        const msg = `El producto "${prodName}" (stock: ${stockVal}) está próximo a caducar.\nActualmente tienes ${totalWarn} producto(s) a punto de caducar.\n¿Deseas aplicar un descuento (5)?`;

        openConfirmDialog(
          'Producto próximo a caducar',
          msg,
          () => {
            addProductById(newProdId, 5, containerType);
            newSet.add(newProdId);
            setWarnedProducts(newSet);
            closeConfirmDialog();
          },
          () => {
            addProductById(newProdId, 0, containerType);
            newSet.add(newProdId);
            setWarnedProducts(newSet);
          }
        );
      } else {
        addProductById(newProdId, 5, containerType);
      }
    } else {
      addProductById(newProdId, 0, containerType);
    }

    setSelProductoId(0);
  }

  /** Agregar producto */
  function addProductById(productId: number, descuentoFijo = 0, containerType?: string | null) {
    const index = detalles.findIndex((r) => r.productoId === productId);
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const precioLista = prod.precioVenta ?? 0;
    const precioFinal = precioLista - descuentoFijo;

    let defaultModo: ModoVenta = 'pieza';
    if (containerType === 'kilos') {
      defaultModo = 'kilos';
    }

    if (index >= 0) {
      // Ya existe => incrementar
      const copy = [...detalles];
      const row = copy[index];

      row.cantidad += 1;
      row.cantidadStr = String(row.cantidad);
      row.descuentoManualFijo = descuentoFijo;
      row.descuentoStr = String(descuentoFijo);

      row.precioLista = precioLista;
      row.precioUnitario = precioFinal;
      row.subtotal = row.cantidad * row.precioUnitario;

      row.containerType = (containerType as any) || 'unidad';
      row.modoVenta = defaultModo;
      setDetalles(copy);
    } else {
      // Nuevo
      const nuevo: DetalleVenta = {
        productoId:productId,
        containerType: (containerType as any) || 'unidad',
        modoVenta: defaultModo,

        cantidad: 1,
        cantidadStr: '1',
        descuentoManualFijo: descuentoFijo,
        descuentoStr: String(descuentoFijo),

        montoPesos: 0,
        montoPesosStr: '',     // <-- Lo agregamos si quieres también para pesos
        pesoAproxPieza: 0,
        pesoAproxPiezaStr: '', // <--

        precioLista,
        precioUnitario: precioFinal,
        subtotal: precioFinal
      };
      setDetalles((prev) => [...prev, nuevo]);
    }
  }

  /** Quitar renglón */
  function removeRenglonDetalle(idx: number) {
    const copy = [...detalles];
    copy.splice(idx, 1);
    setDetalles(copy);
  }

  /** Cambiar modoVenta (kilos/pesos/pieza) */
  function handleChangeModoVenta(e: SelectChangeEvent, idx: number) {
    const newModo = e.target.value as ModoVenta;
    const copy = [...detalles];
    copy[idx].modoVenta = newModo;

    if (newModo === 'pesos') {
      copy[idx].montoPesos = 0;
      copy[idx].montoPesosStr = '0';
      copy[idx].cantidad = 0;
      copy[idx].cantidadStr = '0';
    } else if (newModo === 'pieza') {
      copy[idx].pesoAproxPieza = 0.05;
      copy[idx].pesoAproxPiezaStr = '0.05';
      copy[idx].cantidad = 1;
      copy[idx].cantidadStr = '1';
    } else {
      // 'kilos'
      copy[idx].cantidad = 1;
      copy[idx].cantidadStr = '1';
    }

    setDetalles(copy);
    recalcRow(idx);
  }

  /** Manejar cambio MontoPesos (string) */
  function handleChangeMontoPesos(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number
  ) {
    const strVal = e.target.value;     // valor en la UI
    const copy = [...detalles];
    copy[idx].montoPesosStr = strVal;  // guardamos string

    const parsed = parseFloat(strVal);
    copy[idx].montoPesos = isNaN(parsed) ? 0 : parsed;
    setDetalles(copy);
    recalcRow(idx);
  }

  /** Manejar cambio Peso x pieza (string) */
  function handleChangePesoPieza(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number
  ) {
    const strVal = e.target.value;
    const parsed = parseFloat(strVal);

    const copy = [...detalles];
    copy[idx].pesoAproxPiezaStr = strVal;
    copy[idx].pesoAproxPieza = isNaN(parsed) ? 0 : parsed;
    setDetalles(copy);
    recalcRow(idx);
  }

  /** Manejar cambio Cantidad (string) */
  function handleChangeCantidad(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number
  ) {
    const strVal = e.target.value;
    const parsed = parseFloat(strVal);

    const copy = [...detalles];
    copy[idx].cantidadStr = strVal;
    copy[idx].cantidad = isNaN(parsed) ? 0 : parsed;
    setDetalles(copy);
    recalcRow(idx);
  }

  /** Manejar cambio DescuentoManualFijo (string) */
  function handleChangeDescuento(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number
  ) {
    const strVal = e.target.value;
    const parsed = parseFloat(strVal);

    const copy = [...detalles];
    copy[idx].descuentoStr = strVal;
    copy[idx].descuentoManualFijo = isNaN(parsed) ? 0 : parsed;
    setDetalles(copy);
    recalcRow(idx);
  }

  /** Recalcular */
  function recalcRow(idx: number) {
    const copy = [...detalles];
    const row = copy[idx];
    const prod = products.find((p) => p.id === row.productoId);
    const precioLista = prod?.precioVenta ?? 0;

    // 1) precioUnitario
    const desc = row.descuentoManualFijo || 0;
    row.precioLista = precioLista;
    row.precioUnitario = precioLista - desc;

    // 2) Modo
    if (row.modoVenta === 'pesos') {
      const mp = row.montoPesos || 0;
      if (row.precioUnitario > 0) {
        row.cantidad = mp / row.precioUnitario;
      } else {
        row.cantidad = 0;
      }
      row.cantidadStr = row.cantidad.toFixed(2);
      row.subtotal = mp;
    }
    else if (row.modoVenta === 'pieza') {
      if (row.containerType === 'kilos') {
        const totalWeight = row.cantidad * (row.pesoAproxPieza || 0);
        row.subtotal = totalWeight * row.precioUnitario;
      } else {
        row.subtotal = row.cantidad * row.precioUnitario;
      }
    }
    else {
      // kilos
      row.subtotal = row.cantidad * row.precioUnitario;
    }

    setDetalles(copy);
  }

  /** Calcular total */
  function calcularTotal(): number {
    return detalles.reduce((acc, d) => acc + d.subtotal, 0);
  }

  /** Manejar cambio pago (string) */
  function handlePagoChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const strVal = e.target.value;
    setPagoStr(strVal);

    const parsed = parseFloat(strVal);
    const total = calcularTotal();
    const diff = (isNaN(parsed) ? 0 : parsed) - total;
    setCambio(diff > 0 ? diff : 0);
  }

  /** Guardar venta */
  async function handleSaveVenta() {
    if (detalles.length === 0) {
      openAlert('No puedes crear una venta sin productos.');
      return;
    }

    const total = calcularTotal();
    const lineas = detalles.map((d, i) => {
      const pn = products.find((pp) => pp.id === d.productoId)?.nombre || `ID=${d.productoId}`;
      return `${i+1}. ${pn} (${d.modoVenta}, desc=$${d.descuentoManualFijo}) = $${d.subtotal.toFixed(2)}`;
    }).join('\n');

    const pagoNum = parseFloat(pagoStr) || 0;
    const diff = pagoNum - total;
    const cambioNum = diff > 0 ? diff : 0;
    const cambioInt = Math.round(cambioNum);
    const cambioEnLetra = cambioInt > 0 ? numberToSpanish(cambioInt) + (cambioInt === 1 ? ' peso' : ' pesos') : '';

    const infoVenta = `
Información de la Venta:

Productos:
${lineas}

Total: $${total.toFixed(2)}
Pago: $${pagoNum.toFixed(2)}
Cambio: $${cambioNum.toFixed(2)} ${cambioEnLetra ? '('+ cambioEnLetra + ')' : ''}

¿Deseas REALIZAR esta venta?
`;

    const action = async () => {
      try {
        const saleData = {
          total,
          detalles: detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            descuentoManualFijo: d.descuentoManualFijo,
          }))
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

    openConfirmDialog('Confirmar Venta', infoVenta, action);
    setOpenModal(false);
  }

  function openConfirmDialog(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancelAction?: () => void
  ) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setCancelAction(() => onCancelAction);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
    setCancelAction(undefined);
  }

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

  if (loading) return <p>Cargando ventas...</p>;

  const total = calcularTotal();
  const parsedPago = parseFloat(pagoStr);
  const cambioNum = parsedPago > total ? (parsedPago - total) : 0;
  const cambioInt = Math.round(cambioNum);

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
                  <TableRow key={v.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell sx={{ color: '#fff' }}>{v.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>${v.total || 0}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" size="small" onClick={() => handleVerDetalles(v.id!)}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton color="error" size="small" onClick={() => handleDeleteVenta(v)} sx={{ ml: 1 }}>
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

      {/* ========== Modal Crear Venta ========== */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        BackdropProps={{ style: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(5px)',
        }}}
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
                  <MenuItem key={p.id} value={p.id} disabled={stockVal <= 0}>
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

          {/* ========== Tabla de renglones ========== */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Modo</TableCell>
                  <TableCell>Cantidad / Monto</TableCell>
                  <TableCell>Desc</TableCell>
                  <TableCell>Precio Lista</TableCell>
                  <TableCell>Precio Unit</TableCell>
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

                      {/* Si containerType==='kilos', permitimos cambio de modo; sino => 'Unidad' */}
                      <TableCell>
                        {d.containerType === 'kilos' ? (
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <InputLabel>Modo</InputLabel>
                            <Select
                              value={d.modoVenta}
                              onChange={(e) => handleChangeModoVenta(e, idx)}
                            >
                              <MenuItem value="kilos">Kilos</MenuItem>
                              <MenuItem value="pesos">Pesos</MenuItem>
                              <MenuItem value="pieza">Pieza</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography>Unidad</Typography>
                        )}
                      </TableCell>

                      {/* Dependiendo de modo, mostramos diferente input */}
                      <TableCell>
                        {d.containerType === 'kilos' ? (
                          d.modoVenta === 'pesos' ? (
                            <TextField
                              label="Monto Pesos"
                              type="text"
                              size="small"
                              value={d.montoPesosStr ?? ''}
                              onChange={(e) => handleChangeMontoPesos(e, idx)}
                              sx={{ width: 90 }}
                            />
                          ) : d.modoVenta === 'pieza' ? (
                            <Box display="flex" gap={1}>
                              <TextField
                                label="# Piezas"
                                size="small"
                                type="text"
                                value={d.cantidadStr}
                                onChange={(e) => handleChangeCantidad(e, idx)}
                                sx={{ width: 60 }}
                              />
                              <TextField
                                label="Peso x Pieza"
                                size="small"
                                type="text"
                                value={d.pesoAproxPiezaStr ?? ''}
                                onChange={(e) => handleChangePesoPieza(e, idx)}
                                sx={{ width: 70 }}
                              />
                            </Box>
                          ) : (
                            /* 'kilos' */
                            <TextField
                              label="Kilos"
                              size="small"
                              type="text"
                              value={d.cantidadStr}
                              onChange={(e) => handleChangeCantidad(e, idx)}
                              sx={{ width: 60 }}
                            />
                          )
                        ) : (
                          // containerType!=='kilos' => se vende por unidad
                          <TextField
                            label="# Unidades"
                            size="small"
                            type="text"
                            value={d.cantidadStr}
                            onChange={(e) => handleChangeCantidad(e, idx)}
                            sx={{ width: 60 }}
                          />
                        )}
                      </TableCell>

                      {/* Descuento */}
                      <TableCell>
                        <TextField
                          label="Desc"
                          size="small"
                          type="text"
                          value={d.descuentoStr}
                          onChange={(e) => handleChangeDescuento(e, idx)}
                          sx={{ width: 50 }}
                        />
                      </TableCell>

                      {/* Precio Lista */}
                      <TableCell>
                        <TextField
                          type="text"
                          size="small"
                          value={d.precioLista.toFixed(2)}
                          InputProps={{ readOnly: true }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>

                      {/* Precio Unit */}
                      <TableCell>
                        <TextField
                          type="text"
                          size="small"
                          value={d.precioUnitario.toFixed(2)}
                          InputProps={{ readOnly: true }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell>
                        <TextField
                          type="text"
                          size="small"
                          value={d.subtotal.toFixed(2)}
                          InputProps={{ readOnly: true }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>

                      {/* Quitar */}
                      <TableCell>
                        <Button variant="contained" color="error" size="small"
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
                    <TableCell colSpan={8} align="center">
                      (Sin productos)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pago/cambio */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Total: ${calcularTotal().toFixed(2)}
            </Typography>
            <TextField
              label="Pago del cliente"
              type="text"
              value={pagoStr}
              onChange={(e) => handlePagoChange(e)}
              sx={{ width: 120 }}
            />
            {cambio > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Cambio: ${cambio.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  ({cambioInt > 0 ? numberToSpanish(cambioInt) : ''}{' '}
                  {cambioInt === 1 ? 'peso' : 'pesos'})
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveVenta}>
            Realizar Venta
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== Modal Ver Detalles Venta ========== */}
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

      {/* ========== Confirm Dialog ========== */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
        onCancelAction={cancelAction}
      />

      {/* ========== Alert Dialog ========== */}
      <AlertDialog
        open={alertOpen}
        message={alertMessage}
        onClose={closeAlert}
      />
    </Box>
  );
}
