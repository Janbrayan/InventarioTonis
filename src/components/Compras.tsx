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

interface Provider {
  id: number;
  nombre: string;
}

interface Product {
  id: number;
  nombre: string;
}

/** Estructura del detalle de compra: */
interface DetalleCompra {
  productoId: number;
  cantidad: number;            // # de unidades, cajas o paquetes
  precioUnitario: number;
  lote?: string;
  fechaCaducidad?: string;
  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
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

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** Diálogo de confirmación genérico */
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
      BackdropProps={{
        style: {
          backdropFilter: 'blur(6px)',
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

/** Componente principal de Compras */
export default function Compras() {
  const [compras, setCompras] = useState<Purchase[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para Crear Compra
  const [openModal, setOpenModal] = useState(false);

  // Encabezado de la compra
  const [proveedorId, setProveedorId] = useState<number>(0);
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Modal ver detalles (compra ya existente)
  const [openDetalles, setOpenDetalles] = useState(false);
  const [detallesCompra, setDetallesCompra] = useState<any[]>([]);
  const [viewCompraId, setViewCompraId] = useState<number | null>(null);

  // Campos para añadir renglón al detalle
  const [selProductoId, setSelProductoId] = useState<number>(0);
  const [cantidadStr, setCantidadStr] = useState('1');
  const [precioUnitStr, setPrecioUnitStr] = useState('');
  const [lote, setLote] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');

  const [tipoContenedor, setTipoContenedor] = useState<'unidad' | 'caja' | 'paquete'>('unidad');
  const [unidadesPorContenedorStr, setUnidadesPorContenedorStr] = useState('1');

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

  function handleOpenCreate() {
    setProveedorId(0);
    setFecha(new Date().toISOString().substring(0, 10)); // Fecha por defecto (hoy)
    setObservaciones('');
    setDetalles([]);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
  }

  /**
   * Agrega un renglón (detalle) a la lista "detalles".
   * Interpreta lo que ingrese el usuario:
   * - "cantidadStr" => cuántas unidades/cajas/paquetes
   * - "precioUnitStr" => precio unitario (depende del tipo)
   */
  function addRenglonDetalle() {
    if (!selProductoId) {
      alert('Selecciona un producto.');
      return;
    }
    const c = parseFloat(cantidadStr) || 0;
    const p = parseFloat(precioUnitStr) || 0;
    const upc = parseFloat(unidadesPorContenedorStr) || 1;

    if (c <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    // =========================
    // VALIDACIÓN: no permitir agregar más de una vez el mismo producto
    // =========================
    const alreadyExists = detalles.some((d) => d.productoId === selProductoId);
    if (alreadyExists) {
      alert('Este producto ya fue agregado. Solo puede agregarse una vez.');
      return;
    }

    const nuevo: DetalleCompra = {
      productoId: selProductoId,
      cantidad: c,
      precioUnitario: p,
      lote: lote || undefined,
      fechaCaducidad: fechaCaducidad || undefined,
      tipoContenedor,
      unidadesPorContenedor: upc,
    };
    setDetalles((prev) => [...prev, nuevo]);

    // Reseteamos los campos para otro renglón
    setSelProductoId(0);
    setCantidadStr('1');
    setPrecioUnitStr('');
    setLote('');
    setFechaCaducidad('');
    setTipoContenedor('unidad');
    setUnidadesPorContenedorStr('1');
  }

  function removeRenglonDetalle(idx: number) {
    const copy = [...detalles];
    copy.splice(idx, 1);
    setDetalles(copy);
  }

  /**
   * Calcula el total final sumando cada renglón según la lógica:
   * - unidad: sub = cantidad * precioUnitario
   * - caja:   sub = #cajas * (precioUnitario es total de la caja)
   * - paquete: sub = #paquetes * (#piezasPorPaquete) * (precioUnitario es por pieza)
   */
  function calcularTotal(): number {
    return detalles.reduce((acc, d) => {
      let sub = 0;
      if (d.tipoContenedor === 'paquete') {
        // "precioUnitario" lo interpretamos como PRECIO POR PIEZA
        const upc = d.unidadesPorContenedor ?? 1;
        sub = d.cantidad * upc * d.precioUnitario;
      } else if (d.tipoContenedor === 'caja') {
        // "precioUnitario" lo interpretamos como PRECIO DE LA CAJA COMPLETA
        sub = d.cantidad * d.precioUnitario;
      } else {
        // unidad
        sub = d.cantidad * d.precioUnitario;
      }
      return acc + sub;
    }, 0);
  }

  /**
   * Guardar la compra al backend (createPurchase).
   */
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

  // ================== Confirm Dialog Helpers ==================
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // ================== Ver DETALLES de una Compra existente ==================
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

  // ================== ELIMINAR COMPRA ==================
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

  // ================== RENDER ==================
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

      {/* Modal Crear Compra */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          style: {
            backdropFilter: 'blur(6px)',
          },
        }}
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ width: 180 }}>
              <InputLabel id="prod-select">Producto</InputLabel>
              <Select
                labelId="prod-select"
                value={selProductoId || ''}
                label="Producto"
                onChange={(e) => setSelProductoId(Number(e.target.value))}
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
              type="text"
              sx={{ width: 80 }}
              value={cantidadStr}
              onChange={(e) => setCantidadStr(e.target.value)}
            />

            <TextField
              label="P.Unit"
              type="text"
              sx={{ width: 100 }}
              value={precioUnitStr}
              onChange={(e) => setPrecioUnitStr(e.target.value)}
            />

            <FormControl sx={{ width: 140 }}>
              <InputLabel id="tipoContenedor-label">Tipo</InputLabel>
              <Select
                labelId="tipoContenedor-label"
                value={tipoContenedor}
                label="Tipo"
                onChange={(e) =>
                  setTipoContenedor(e.target.value as 'unidad' | 'caja' | 'paquete')
                }
              >
                <MenuItem value="unidad">Unidad</MenuItem>
                <MenuItem value="caja">Caja</MenuItem>
                <MenuItem value="paquete">Paquete</MenuItem>
              </Select>
            </FormControl>

            {(tipoContenedor === 'caja' || tipoContenedor === 'paquete') && (
              <TextField
                label="Unid x Cont."
                type="text"
                sx={{ width: 120 }}
                value={unidadesPorContenedorStr}
                onChange={(e) => setUnidadesPorContenedorStr(e.target.value)}
              />
            )}

            <TextField
              label="Lote"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              sx={{ width: 150 }}
            />
            <TextField
              label="Caducidad"
              type="date"
              value={fechaCaducidad}
              onChange={(e) => setFechaCaducidad(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 150 }}
            />

            <Button variant="outlined" color="info" onClick={addRenglonDetalle}>
              Agregar
            </Button>
          </Box>

          {/* TABLA DE DETALLES - mostrando subtotales y la columna "Precio x Pieza" */}
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
                  <TableCell>Piezas Totales</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Caducidad</TableCell>
                  <TableCell>Quitar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((d, idx) => {
                  const pName =
                    products.find((pp) => pp.id === d.productoId)?.nombre ||
                    `ID=${d.productoId}`;

                  // 1) Subtotal según la lógica contenedores
                  let sub = 0;
                  let precioPorPieza = 0;
                  const upc = d.unidadesPorContenedor ?? 1;

                  if (d.tipoContenedor === 'paquete') {
                    // precioUnitario es "por pieza"
                    sub = d.cantidad * upc * d.precioUnitario;
                    precioPorPieza = d.precioUnitario; // ya es por pieza
                  } else if (d.tipoContenedor === 'caja') {
                    // precioUnitario es "por caja completa"
                    sub = d.cantidad * d.precioUnitario;
                    // Si deseas mostrar un precio por pieza:
                    precioPorPieza = d.precioUnitario / upc;
                  } else {
                    // "unidad"
                    sub = d.cantidad * d.precioUnitario;
                    // precioPorPieza = precioUnitario
                    precioPorPieza = d.precioUnitario;
                  }

                  // 2) Piezas totales (para visual)
                  const piezasTotales =
                    d.tipoContenedor === 'unidad'
                      ? d.cantidad
                      : d.cantidad * upc;

                  return (
                    <TableRow key={idx}>
                      <TableCell>{pName}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>${d.precioUnitario}</TableCell>
                      <TableCell>${precioPorPieza.toFixed(2)}</TableCell>
                      <TableCell>${sub.toFixed(2)}</TableCell>
                      <TableCell>{d.tipoContenedor}</TableCell>
                      <TableCell>
                        {(d.tipoContenedor === 'caja' || d.tipoContenedor === 'paquete')
                          ? upc
                          : '—'
                        }
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
                    <TableCell colSpan={11} align="center">
                      Sin renglones aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* NUEVO: Mostrar total de la compra en tiempo real */}
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'right', pr: 2 }}>
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

      {/* Modal Ver Detalles de Compra existente */}
      <Dialog
        open={openDetalles}
        onClose={handleCloseDetalles}
        fullWidth
        maxWidth="md"
        BackdropProps={{
          style: {
            backdropFilter: 'blur(6px)',
          },
        }}
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
                  {/* NUEVA COLUMNA PRECIO POR PIEZA */}
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
                  const pName =
                    products.find((pp) => pp.id === d.productoId)?.nombre ||
                    `ID=${d.productoId}`;

                  let sub = 0;
                  const upc = d.unidadesPorContenedor ?? 1;

                  if (d.tipoContenedor === 'paquete') {
                    // "precioUnitario" = precio por pieza
                    sub = d.cantidad * upc * d.precioUnitario;
                  } else if (d.tipoContenedor === 'caja') {
                    // "precioUnitario" = precio por caja
                    sub = d.cantidad * d.precioUnitario;
                  } else {
                    // "unidad"
                    sub = d.cantidad * d.precioUnitario;
                  }

                  const piezas =
                    d.tipoContenedor === 'unidad'
                      ? d.cantidad
                      : d.cantidad * upc;

                  // Obtenemos el precio por pieza si te lo proporciona el backend:
                  const precioPorPieza = d.precioPorPieza
                    ? d.precioPorPieza.toFixed(2)
                    : '—';

                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{pName}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>${d.precioUnitario}</TableCell>
                      {/* Nueva celda mostrando precioPorPieza */}
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
