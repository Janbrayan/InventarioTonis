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
  /** Valor numérico real, usado en el cálculo final. */
  cantidad: number;
  /** Texto que el usuario teclea, para no bloquear. */
  cantidadStr: string;

  /** Valor numérico real, usado en el cálculo final. */
  precioUnitario: number;
  /** Texto que el usuario teclea, para no bloquear. */
  precioUnitStr: string;

  tipoContenedor: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;

  productoId: number;
  lote?: string;
  fechaCaducidad?: string;
  precioVenta?: number; // opcional
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

/** =============== Submodal para añadir un renglón de detalle =============== */
interface DetalleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (detalle: DetalleCompra) => void;
  products: Product[];
  preselectedProductId?: number | null;
}
function DetalleModal({
  open,
  onClose,
  onSave,
  products,
  preselectedProductId,
}: DetalleModalProps) {
  // Producto seleccionado
  const [productoId, setProductoId] = useState<number>(0);

  // Strings para que el usuario teclee lo que quiera sin bloquear
  const [cantidadStr, setCantidadStr] = useState('1');
  const [precioUnitStr, setPrecioUnitStr] = useState('0');

  // Tipo (unidad, caja, paquete) + unid x contenedor
  const [tipoCont, setTipoCont] = useState<'unidad' | 'caja' | 'paquete'>('unidad');
  const [upcStr, setUpcStr] = useState('1');

  const [lote, setLote] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [precioVentaStr, setPrecioVentaStr] = useState('0');

  // Cada vez que abra el modal, resetea
  React.useEffect(() => {
    if (open) {
      setProductoId(preselectedProductId || 0);
      setCantidadStr('1');
      setPrecioUnitStr('0');
      setTipoCont('unidad');
      setUpcStr('1');
      setLote('');
      setFechaCaducidad('');
      setPrecioVentaStr('0');
    }
  }, [open, preselectedProductId]);

  function handleConfirm() {
    if (!productoId || productoId <= 0) {
      alert('Selecciona un producto válido.');
      return;
    }

    // Convierte strings a número reales
    const cant = parseFloat(cantidadStr) || 0;
    const pu = parseFloat(precioUnitStr) || 0;
    const upc = parseFloat(upcStr) || 1;
    const pVenta = parseFloat(precioVentaStr) || 0;

    if (cant <= 0 || pu <= 0) {
      alert('Cantidad y precio deben ser mayores a 0');
      return;
    }

    const det: DetalleCompra = {
      productoId,
      cantidad: cant,
      cantidadStr,
      precioUnitario: pu,
      precioUnitStr,
      tipoContenedor: tipoCont,
      unidadesPorContenedor: tipoCont === 'unidad' ? 1 : upc,
      lote: lote || undefined,
      fechaCaducidad: fechaCaducidad || undefined,
      precioVenta: pVenta || undefined,
    };
    onSave(det);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>Agregar Producto</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="select-product-label">Producto</InputLabel>
          <Select
            labelId="select-product-label"
            value={productoId || 0}
            label="Producto"
            onChange={(e) => setProductoId(Number(e.target.value))}
          >
            <MenuItem value={0} disabled>-- Seleccionar --</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Cantidad"
          type="text"
          value={cantidadStr}
          onChange={(e) => {
            // Permite dígitos y punto
            const val = e.target.value.replace(/[^\d.]/g, '');
            setCantidadStr(val);
          }}
        />
        <TextField
          label="Precio Unitario"
          type="text"
          value={precioUnitStr}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d.]/g, '');
            setPrecioUnitStr(val);
          }}
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
            type="text"
            value={upcStr}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d.]/g, '');
              setUpcStr(val);
            }}
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
          value={fechaCaducidad}
          onChange={(e) => setFechaCaducidad(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Precio de Venta"
          type="text"
          value={precioVentaStr}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d.]/g, '');
            setPrecioVentaStr(val);
          }}
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

  // Submodal de Detalle
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
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
      handleOpenCreate();
      if (st.openDetalle === true && typeof st.productId === 'number') {
        // abrimos submodal con productId
        setTimeout(() => {
          setPreselectedProductId(st.productId);
          setOpenDetalleModal(true);
        }, 200);
      }
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

  function handleOpenDetalleModal() {
    if (!openModal) {
      handleOpenCreate();
    }
    setPreselectedProductId(null);
    setOpenDetalleModal(true);
  }
  function handleCloseDetalleModal() {
    setOpenDetalleModal(false);
  }

  function handleAddDetalle(detalle: DetalleCompra) {
    setDetalles((prev) => [...prev, detalle]);
  }

  function removeRenglonDetalle(idx: number) {
    setDetalles((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  }

  function calcularTotal(): number {
    return detalles.reduce((acc, d) => {
      const c = d.cantidad;
      const pu = d.precioUnitario;
      const upc = d.unidadesPorContenedor ?? 1;

      let sub = 0;
      if (d.tipoContenedor === 'paquete') {
        sub = c * upc * pu;
      } else if (d.tipoContenedor === 'caja') {
        sub = c * pu;
      } else {
        // unidad
        sub = c * pu;
      }
      return acc + sub;
    }, 0);
  }

  async function handleSaveCompra() {
    // Validaciones mínimas
    if (proveedorId <= 0) {
      alert('Selecciona un proveedor válido antes de guardar.');
      return;
    }
    if (detalles.length === 0) {
      alert('Debes agregar al menos un producto antes de guardar.');
      return;
    }

    const total = calcularTotal();
    const action = async () => {
      try {
        const purchaseData: Purchase = {
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

  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

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

      {/* ============ Modal Crear/Editar Compra ============ */}
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
              value={proveedorId || 0}
              label="Proveedor"
              onChange={(e) => setProveedorId(Number(e.target.value))}
            >
              <MenuItem value={0} disabled>
                -- Seleccionar --
              </MenuItem>
              {providers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
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
          <Button variant="outlined" color="info" onClick={() => setOpenDetalleModal(true)}>
            <AddIcon /> Agregar Producto
          </Button>

          {/* Tabla de Detalles */}
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cant</TableCell>
                  <TableCell>P.Unit</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Unid/Cont</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Caducidad</TableCell>
                  <TableCell>Precio Venta</TableCell>
                  <TableCell>Quitar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((d, idx) => {
                  const prodName = products.find((pp) => pp.id === d.productoId)?.nombre || `ID=${d.productoId}`;

                  const cant = d.cantidad;
                  const pu = d.precioUnitario;
                  const upc = d.unidadesPorContenedor ?? 1;

                  let sub = 0;
                  if (d.tipoContenedor === 'paquete') {
                    sub = cant * upc * pu;
                  } else if (d.tipoContenedor === 'caja') {
                    sub = cant * pu;
                  } else {
                    // unidad
                    sub = cant * pu;
                  }

                  return (
                    <TableRow key={idx}>
                      <TableCell>{prodName}</TableCell>
                      <TableCell>
                        {d.cantidadStr} {/* lo que ve el usuario */}
                      </TableCell>
                      <TableCell>
                        {d.precioUnitStr}
                      </TableCell>
                      <TableCell>${sub.toFixed(2)}</TableCell>
                      <TableCell>{d.tipoContenedor}</TableCell>
                      <TableCell>
                        {(d.tipoContenedor === 'unidad')
                          ? '—'
                          : (d.unidadesPorContenedor ?? '1')}
                      </TableCell>
                      <TableCell>{d.lote || '—'}</TableCell>
                      <TableCell>
                        {d.fechaCaducidad
                          ? new Date(d.fechaCaducidad).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {d.precioVenta != null ? `$${d.precioVenta}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => {
                            removeRenglonDetalle(idx);
                          }}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {detalles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      (Sin renglones)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
            Total de la compra: $
            {detalles.reduce((acc, d) => {
              const c = d.cantidad;
              const pu = d.precioUnitario;
              const upc = d.unidadesPorContenedor ?? 1;

              let sub = 0;
              if (d.tipoContenedor === 'paquete') {
                sub = c * upc * pu;
              } else if (d.tipoContenedor === 'caja') {
                sub = c * pu;
              } else {
                // unidad
                sub = c * pu;
              }
              return acc + sub;
            }, 0).toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCompra}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submodal de detalle */}
      <DetalleModal
        open={openDetalleModal}
        onClose={() => setOpenDetalleModal(false)}
        onSave={(det) => {
          setDetalles((prev) => [...prev, det]);
        }}
        products={products}
        preselectedProductId={preselectedProductId}
      />

      {/* Modal Ver Detalles de una Compra existente */}
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
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Unid x Cont</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Caducidad</TableCell>
                  <TableCell>Actualizado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detallesCompra.map((d) => {
                  const pName = products.find((pp) => pp.id === d.productoId)?.nombre || `ID=${d.productoId}`;
                  const c = d.cantidad;
                  const pu = d.precioUnitario;
                  const upc = d.unidadesPorContenedor ?? 1;
                  let sub = 0;

                  if (d.tipoContenedor === 'paquete') {
                    sub = c * upc * pu;
                  } else if (d.tipoContenedor === 'caja') {
                    sub = c * pu;
                  } else {
                    sub = c * pu;
                  }

                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{pName}</TableCell>
                      <TableCell>{c}</TableCell>
                      <TableCell>${pu}</TableCell>
                      <TableCell>${sub.toFixed(2)}</TableCell>
                      <TableCell>{d.tipoContenedor || 'unidad'}</TableCell>
                      <TableCell>
                        {(d.tipoContenedor === 'unidad')
                          ? '—'
                          : (d.unidadesPorContenedor ?? 1)
                        }
                      </TableCell>
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
                    <TableCell colSpan={10} align="center">
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
