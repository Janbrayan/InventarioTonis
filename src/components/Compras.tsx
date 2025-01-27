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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

/** =============== Tipos de datos básicos =============== */
interface Provider {
  id: number;
  nombre: string;
}
interface Product {
  id: number;
  nombre: string;
}
interface DetalleCompra {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  tipoContenedor: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
  lote?: string;
  fechaCaducidad?: string;
  precioVenta?: number;
}
interface Purchase {
  id?: number;
  proveedorId: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  updatedAt?: string;
  detalles?: DetalleCompra[];
}

/** =============== Diálogo de confirmación genérico =============== */
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
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
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

/** =============== Submodal para llenar datos del producto a agregar =============== */
interface DetalleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (detalle: DetalleCompra) => void;
  products: Product[];

  /** (NUEVO) si quieres preseleccionar un producto en el submodal */
  preselectedProductId?: number | null;
}
function DetalleModal({
  open,
  onClose,
  onSave,
  products,
  preselectedProductId,
}: DetalleModalProps) {
  const [productoId, setProductoId] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioUnit, setPrecioUnit] = useState<number>(0);
  const [tipoCont, setTipoCont] = useState<'unidad' | 'caja' | 'paquete'>('unidad');
  const [upc, setUpc] = useState<number>(1);
  const [lote, setLote] = useState('');
  const [caducidad, setCaducidad] = useState('');
  const [precioVenta, setPrecioVenta] = useState<number>(0);

  function handleConfirm() {
    if (!productoId) {
      alert('Selecciona un producto.');
      return;
    }
    if (cantidad <= 0 || precioUnit <= 0) {
      alert('Cantidad y precio deben ser mayores a 0.');
      return;
    }
    const detalle: DetalleCompra = {
      productoId,
      cantidad,
      precioUnitario: precioUnit,
      tipoContenedor: tipoCont,
      unidadesPorContenedor: tipoCont !== 'unidad' ? upc : 1,
      lote: lote || undefined,
      fechaCaducidad: caducidad || undefined,
      precioVenta: precioVenta || undefined,
    };
    onSave(detalle);
    onClose();
  }

  // Resetear campos al abrir el submodal
  useEffect(() => {
    if (open) {
      setCantidad(1);
      setPrecioUnit(0);
      setTipoCont('unidad');
      setUpc(1);
      setLote('');
      setCaducidad('');
      setPrecioVenta(0);

      // (NUEVO) si llega preselectedProductId, lo fijamos:
      if (preselectedProductId) {
        setProductoId(preselectedProductId);
      } else {
        setProductoId(0);
      }
    }
  }, [open, preselectedProductId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" BackdropProps={{
      style: { backdropFilter: 'blur(6px)' }
    }}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Agregar Producto</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="prod-select-label">Producto</InputLabel>
          <Select
            labelId="prod-select-label"
            value={productoId || ''}
            label="Producto"
            onChange={(e) => setProductoId(Number(e.target.value))}
          >
            <MenuItem value="">-- Seleccionar --</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Cantidad"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
        />
        <TextField
          label="Precio Unitario"
          type="number"
          value={precioUnit}
          onChange={(e) => setPrecioUnit(Number(e.target.value))}
        />

        <FormControl>
          <InputLabel id="tipoCont-label">Tipo</InputLabel>
          <Select
            labelId="tipoCont-label"
            value={tipoCont}
            label="Tipo"
            onChange={(e) => setTipoCont(e.target.value as 'unidad' | 'caja' | 'paquete')}
            sx={{ width: 120 }}
          >
            <MenuItem value="unidad">Unidad</MenuItem>
            <MenuItem value="caja">Caja</MenuItem>
            <MenuItem value="paquete">Paquete</MenuItem>
          </Select>
        </FormControl>

        {(tipoCont === 'caja' || tipoCont === 'paquete') && (
          <TextField
            label="Unid x Cont."
            type="number"
            value={upc}
            onChange={(e) => setUpc(Number(e.target.value))}
            sx={{ width: 120 }}
          />
        )}

        <TextField
          label="Lote"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
        />
        <TextField
          label="Caducidad"
          type="date"
          value={caducidad}
          onChange={(e) => setCaducidad(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Precio de Venta"
          type="number"
          value={precioVenta}
          onChange={(e) => setPrecioVenta(Number(e.target.value))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** =============== Componente principal de Compras =============== */
export default function Compras() {
  const location = useLocation();
  const navigate = useNavigate();

  const [compras, setCompras] = useState<Purchase[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para Crear Compra
  const [openModal, setOpenModal] = useState(false);

  // Datos encabezado de la compra
  const [proveedorId, setProveedorId] = useState(0);
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);

  // Submodal de Detalle (para forzar a llenar antes de agregar)
  const [openDetalleModal, setOpenDetalleModal] = useState(false);

  // (NUEVO) si queremos preseleccionar un producto en DetalleModal:
  const [preselectedProductId, setPreselectedProductId] = useState<number | null>(null);

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Modal ver detalles (compra ya existente)
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesCompra, setDetallesCompra] = useState<any[]>([]);
  const [viewCompraId, setViewCompraId] = useState<number | null>(null);

  // =============== Al montar, cargar data ===============
  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [compList, provList, prodList] = await Promise.all([
        window.electronAPI.getPurchases(),
        window.electronAPI.getProviders(),
        window.electronAPI.getProducts(),
      ]);
      setCompras(compList || []);
      setProviders(provList || []);
      setProducts(prodList || []);
    } catch (err) {
      console.error('Error fetchAll Compras:', err);
    } finally {
      setLoading(false);
    }
  }

  // =============== Revisar si vienes de un escaneo => openModal + openDetalle ===============
  useEffect(() => {
    const st: any = location.state;
    if (st?.openModal === 'createCompra') {
      // 1) Abre el modal principal
      handleOpenCreate();

      // 2) si st.openDetalle === true => abre submodal con productId preseleccionado
      if (st.openDetalle === true && typeof st.productId === 'number') {
        // Esperamos un breve delay para asegurar que el modal principal se "monta"
        // y luego abrimos el submodal
        setTimeout(() => {
          setPreselectedProductId(st.productId);
          setOpenDetalleModal(true);
        }, 200);
      }

      // Limpia el state para que no reabra al recargar
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  // =============== Manejadores del modal principal de Compra ===============
  function handleOpenCreate() {
    setProveedorId(0);
    setFecha(new Date().toISOString().substring(0, 10));
    setObservaciones('');
    setDetalles([]);
    setOpenModal(true);
  }
  function handleCloseModal() {
    setOpenModal(false);
  }

  /** Abrir submodal de Detalle manualmente (sin escaneo) */
  function handleOpenDetalleModal() {
    if (!openModal) {
      // Si no está abierto el modal principal, lo abrimos
      handleOpenCreate();
    }
    setPreselectedProductId(null); // sin preselección en este caso
    setOpenDetalleModal(true);
  }
  function handleCloseDetalleModal() {
    setOpenDetalleModal(false);
  }

  /** onSave => se añade a la lista `detalles` */
  function handleAddDetalle(detalle: DetalleCompra) {
    setDetalles((prev) => [...prev, detalle]);
  }

  /** Quitar renglón */
  function removeRenglonDetalle(idx: number) {
    setDetalles((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  }

  /** Calcular total */
  function calcularTotal(): number {
    return detalles.reduce((acc, d) => {
      let sub = 0;
      const upc = d.unidadesPorContenedor ?? 1;
      if (d.tipoContenedor === 'paquete') {
        sub = d.cantidad * upc * d.precioUnitario;
      } else if (d.tipoContenedor === 'caja') {
        sub = d.cantidad * d.precioUnitario;
      } else {
        sub = d.cantidad * d.precioUnitario;
      }
      return acc + sub;
    }, 0);
  }

  /** Guardar la compra al backend */
  async function handleSaveCompra() {
    const total = calcularTotal();
    const action = async () => {
      try {
        const purchaseData = {
          proveedorId,
          fecha,
          total,
          observaciones,
          detalles,
        };
        const resp = await window.electronAPI.createPurchase(purchaseData);
        if (!resp?.success) {
          alert('No se pudo crear la compra.');
        }
        await fetchAll();
      } catch (err) {
        console.error('Error createPurchase:', err);
      } finally {
        closeConfirmDialog();
      }
    };
    openConfirmDialog(
      'Confirmar creación',
      `¿Deseas CREAR esta compra con ${detalles.length} renglones?`,
      action
    );
    setOpenModal(false);
  }

  /** Confirm dialog helpers */
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  /** Ver detalles de una compra existente */
  async function handleVerDetalles(compraId: number) {
    try {
      setViewCompraId(compraId);
      const resp = await window.electronAPI.getDetallesByCompra(compraId);
      setDetallesCompra(resp || []);
      setOpenDetalles(true);
    } catch (err) {
      console.error('Error getDetallesByCompra:', err);
    }
  }
  function handleCloseDetalles() {
    setOpenDetalles(false);
    setDetallesCompra([]);
    setViewCompraId(null);
  }

  /** Eliminar compra */
  function handleDeleteCompra(compra: Purchase) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR la compra #${compra.id}?`,
      async () => {
        try {
          if (!compra.id) return;
          const resp = await window.electronAPI.deletePurchase(compra.id);
          if (!resp?.success) {
            alert('No se pudo eliminar la compra.');
          }
          await fetchAll();
        } catch (err) {
          console.error('Error deletePurchase:', err);
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // =============== RENDER ===============
  if (loading) {
    return <p>Cargando compras...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#212529' }}>
        Compras
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Lista de Compras
            </Typography>
          }
          sx={{
            backgroundColor: '#343a40',
            borderRadius: '8px 8px 0 0',
            pb: 1,
          }}
          action={
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 'bold', mr: 1 }}
              onClick={handleOpenCreate}
            >
              Crear Compra
            </Button>
          }
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
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell>Actualizado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {compras.map((c) => {
                  const provName =
                    providers.find((p) => p.id === c.proveedorId)?.nombre ||
                    `ProvID=${c.proveedorId}`;
                  return (
                    <TableRow
                      key={c.id}
                      sx={{
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <TableCell sx={{ color: '#fff' }}>{c.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{provName}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {c.fecha ? new Date(c.fecha).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>${c.total || 0}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{c.observaciones || '—'}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleVerDetalles(c.id!)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteCompra(c)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {compras.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: '#fff' }}>
                      No hay compras registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ============ Modal Crear Compra ============ */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Crear Compra</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="prov-label">Proveedor</InputLabel>
            <Select
              labelId="prov-label"
              value={proveedorId || ''}
              label="Proveedor"
              onChange={(e) => setProveedorId(Number(e.target.value))}
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              {providers.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            fullWidth
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Detalles
          </Typography>

          {/* Botón para abrir submodal: DetalleModal */}
          <Button variant="outlined" color="info" onClick={handleOpenDetalleModal}>
            <AddIcon /> Agregar Producto
          </Button>

          {/* Tabla de Detalles (renglones confirmados) */}
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cant</TableCell>
                  <TableCell>P.Unit</TableCell>
                  <TableCell>Precio x Pieza</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Unid x Cont.</TableCell>
                  <TableCell>Piezas</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Caducidad</TableCell>
                  <TableCell>Precio Venta</TableCell>
                  <TableCell>Quitar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((d, idx) => {
                  const prodName = products.find(pp => pp.id === d.productoId)?.nombre || `ID=${d.productoId}`;
                  let sub = 0;
                  let precioPorPieza = 0;
                  const upc = d.unidadesPorContenedor ?? 1;

                  if (d.tipoContenedor === 'paquete') {
                    sub = d.cantidad * upc * d.precioUnitario;
                    precioPorPieza = d.precioUnitario;
                  } else if (d.tipoContenedor === 'caja') {
                    sub = d.cantidad * d.precioUnitario;
                    precioPorPieza = d.precioUnitario / upc;
                  } else {
                    sub = d.cantidad * d.precioUnitario;
                    precioPorPieza = d.precioUnitario;
                  }

                  const piezasTotales = (d.tipoContenedor === 'unidad')
                    ? d.cantidad
                    : (d.cantidad * upc);

                  return (
                    <TableRow key={idx}>
                      <TableCell>{prodName}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>${d.precioUnitario}</TableCell>
                      <TableCell>${precioPorPieza.toFixed(2)}</TableCell>
                      <TableCell>${sub.toFixed(2)}</TableCell>
                      <TableCell>{d.tipoContenedor}</TableCell>
                      <TableCell>
                        {(d.tipoContenedor === 'caja' || d.tipoContenedor === 'paquete')
                          ? upc
                          : '—'}
                      </TableCell>
                      <TableCell>{piezasTotales}</TableCell>
                      <TableCell>{d.lote || '—'}</TableCell>
                      <TableCell>
                        {d.fechaCaducidad
                          ? new Date(d.fechaCaducidad).toLocaleDateString()
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        {d.precioVenta != null ? `$${d.precioVenta}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => removeRenglonDetalle(idx)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {detalles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      Sin renglones aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
            Total de la compra: ${calcularTotal().toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCompra}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ Submodal de detalle, para forzar llenado de datos ============ */}
      <DetalleModal
        open={openDetalleModal}
        onClose={handleCloseDetalleModal}
        onSave={handleAddDetalle}
        products={products}
        preselectedProductId={preselectedProductId}  // NUEVO: preselección
      />

      {/* ============ Modal Ver Detalles de una Compra existente ============ */}
      <Dialog
        open={openDetalles}
        onClose={handleCloseDetalles}
        fullWidth
        maxWidth="md"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Detalles de la Compra #{viewCompraId}
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
                  <TableCell>Precio x Pieza</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Unid x Cont.</TableCell>
                  <TableCell>Piezas</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Caducidad</TableCell>
                  <TableCell>Actualizado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detallesCompra.map((d) => {
                  const product = products.find(pp => pp.id === d.productoId);
                  const pName = product?.nombre || `ID=${d.productoId}`;

                  let sub = 0;
                  const upc = d.unidadesPorContenedor ?? 1;
                  if (d.tipoContenedor === 'paquete') {
                    sub = d.cantidad * upc * d.precioUnitario;
                  } else if (d.tipoContenedor === 'caja') {
                    sub = d.cantidad * d.precioUnitario;
                  } else {
                    sub = d.cantidad * d.precioUnitario;
                  }

                  const piezas =
                    d.tipoContenedor === 'unidad'
                      ? d.cantidad
                      : d.cantidad * upc;

                  // precioPorPieza si tu backend lo guarda
                  const precioPorPieza = d.precioPorPieza
                    ? d.precioPorPieza.toFixed(2)
                    : '—';

                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{pName}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>${d.precioUnitario}</TableCell>
                      <TableCell>
                        {precioPorPieza !== '—' ? `$${precioPorPieza}` : '—'}
                      </TableCell>
                      <TableCell>${sub.toFixed(2)}</TableCell>
                      <TableCell>{d.tipoContenedor || 'unidad'}</TableCell>
                      <TableCell>
                        {(d.tipoContenedor === 'caja' || d.tipoContenedor === 'paquete')
                          ? upc
                          : '—'
                        }
                      </TableCell>
                      <TableCell>{piezas}</TableCell>
                      <TableCell>{d.lote || '—'}</TableCell>
                      <TableCell>
                        {d.fechaCaducidad
                          ? new Date(d.fechaCaducidad).toLocaleDateString()
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        {d.updatedAt
                          ? new Date(d.updatedAt).toLocaleString()
                          : '—'
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
                {detallesCompra.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
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

      {/* Diálogo de confirmación */}
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
