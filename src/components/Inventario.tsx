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
  Collapse
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

/** ==================== Tipos y estructuras ==================== */
interface InventoryGroup {
  product: {
    id: number;
    nombre: string;
  };
  lotes: Lote[];
  totalLotes: number;
  totalPiezas: number;
}

interface Product {
  id: number;
  nombre: string;
}

/** Lote según lo manejes en tu backend */
interface Lote {
  id?: number;
  productoId: number;
  lote?: string;
  fechaCaducidad?: string;
  cantidadActual?: number;
  activo?: boolean;
  updatedAt?: string;
}

/** Props para confirm dialog */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** =============== Diálogo de confirmación genérico =============== */
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

/** =============== Diálogo de error (reemplaza alert) =============== */
interface ErrorDialogProps {
  open: boolean;
  errorMessage: string;
  onClose: () => void;
}

function ErrorDialog({ open, errorMessage, onClose }: ErrorDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>Error</DialogTitle>
      <DialogContent>
        <Typography>{errorMessage}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Determina el estado de stock en función del total de piezas.
 * Ajusta los límites a tu gusto (<5, <15, etc.).
 */
function getStockStatus(totalPiezas: number) {
  if (totalPiezas === 0) {
    return { label: 'Sin stock', color: 'red' };
  } else if (totalPiezas < 5) {
    return { label: 'Poco stock', color: 'red' };
  } else if (totalPiezas < 15) {
    return { label: 'Stock normal', color: 'orange' };
  } else {
    return { label: 'Alto stock', color: 'green' };
  }
}

/** ==================== Componente principal ==================== */
export default function Inventario() {
  // Lista agrupada proveniente del backend
  const [inventory, setInventory] = useState<InventoryGroup[]>([]);
  // Lista completa de productos para el <Select>
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  //  Modal Crear/Editar Lote
  // =========================
  const [openModal, setOpenModal] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);

  const [productoId, setProductoId] = useState<number>(0);
  const [lote, setLote] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  // Cantidad manejada como string
  const [cantidadStr, setCantidadStr] = useState('');

  // =========================
  //   Confirm Dialog
  // =========================
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // =========================
  //   Expand/Collapse
  // =========================
  const [openProductId, setOpenProductId] = useState<number | null>(null);

  // =========================
  //   Descuento/Merma
  // =========================
  const [descuentoOpen, setDescuentoOpen] = useState(false);
  const [descuentoCantidadStr, setDescuentoCantidadStr] = useState('');
  const [descuentoMotivo, setDescuentoMotivo] = useState('');
  const [descuentoLote, setDescuentoLote] = useState<Lote | null>(null);

  // =========================
  //   Diálogo de error general
  // =========================
  const [error, setError] = useState('');

  // =========================
  //    useEffect / Data
  // =========================
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [inv, prodList] = await Promise.all([
        window.electronAPI.getInventoryGrouped(),
        window.electronAPI.getProducts()
      ]);

      setInventory(inv || []);
      setAllProducts(prodList || []);
    } catch (err) {
      console.error('Error fetchData Inventario:', err);
      setError('No se pudo cargar el inventario y/o la lista de productos.');
    } finally {
      setLoading(false);
    }
  }

  // =========================
  //   Crear / Editar Lote
  // =========================
  function handleOpenCreate() {
    setEditingLote(null);
    setProductoId(0);
    setLote('');
    setFechaCaducidad('');
    setCantidadStr('');
    setOpenModal(true);
  }

  function handleOpenEdit(l: Lote) {
    setEditingLote(l);
    setProductoId(l.productoId);
    setLote(l.lote ?? '');
    setFechaCaducidad(l.fechaCaducidad ?? '');
    const cant = l.cantidadActual ?? 0;
    setCantidadStr(String(cant));
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setEditingLote(null);
  }

  async function handleSaveLote() {
    // Validaciones obligatorias
    if (productoId <= 0) {
      setError('Debes seleccionar un producto.');
      return;
    }
    if (!fechaCaducidad.trim()) {
      setError('Debes seleccionar una fecha de caducidad.');
      return;
    }
    const cantParsed = parseFloat(cantidadStr) || 0;
    if (cantParsed <= 0) {
      setError('La cantidad debe ser mayor que 0.');
      return;
    }

    // Primero cerramos el modal
    setOpenModal(false);

    const isEdit = !!editingLote;
    const actionText = isEdit ? 'ACTUALIZAR' : 'CREAR';

    openConfirmDialog(
      `Confirmar ${actionText}`,
      `¿Deseas ${actionText} este lote?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          // Convertimos la cantidad a número
          const cant = cantParsed;

          if (!isEdit) {
            // Crear
            const resp = await window.electronAPI.createLote({
              productoId,
              lote,
              fechaCaducidad: fechaCaducidad || null,
              cantidadActual: cant,
              activo: true
            });
            if (!resp?.success) {
              setError('No se pudo crear el lote en la base de datos.');
            }
          } else {
            // Editar
            const resp = await window.electronAPI.updateLote({
              id: editingLote?.id,
              productoId,
              lote,
              fechaCaducidad: fechaCaducidad || null,
              cantidadActual: cant,
              activo: true
            });
            if (!resp?.success) {
              setError('No se pudo actualizar el lote en la base de datos.');
            }
          }
          await fetchData();
        } catch (err) {
          console.error('Error guardando lote:', err);
          setError('Error de comunicación al guardar el lote.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // =========================
  //   Eliminar (Soft-Delete)
  // =========================
  function handleDeleteLote(l: Lote) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR (desactivar) el lote "${l.lote}" del producto ID=${l.productoId}?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.updateLote({
            id: l.id,
            productoId: l.productoId,
            lote: l.lote,
            fechaCaducidad: l.fechaCaducidad || null,
            cantidadActual: l.cantidadActual || 0,
            activo: false
          });
          if (!resp?.success) {
            setError('No se pudo desactivar el lote en la base de datos.');
          }
          await fetchData();
        } catch (err) {
          console.error('Error soft-deleting lote:', err);
          setError('Error de comunicación al desactivar el lote.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // =========================
  //   Descuento / Merma
  // =========================
  function handleOpenDescuento(l: Lote) {
    setDescuentoLote(l);
    setDescuentoCantidadStr('');
    setDescuentoMotivo('');
    setDescuentoOpen(true);
  }

  function handleCloseDescuento() {
    setDescuentoOpen(false);
    setDescuentoLote(null);
    setDescuentoCantidadStr('');
    setDescuentoMotivo('');
  }

  async function handleConfirmDescuento() {
    if (!descuentoLote) return;
    const cant = parseFloat(descuentoCantidadStr) || 0;

    if (cant <= 0) {
      setError('La cantidad a descontar debe ser mayor a 0.');
      return;
    }

    openConfirmDialog(
      'Confirmar Consumo/Merma',
      `¿Deseas descontar ${cant} unidades del Lote "${descuentoLote.lote}"?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.descontarPorConsumo({
            loteId: descuentoLote.id!,
            cantidad: cant,
            motivo: descuentoMotivo
          });
          if (!resp?.success) {
            setError('No se pudo descontar el lote en la base de datos.');
          }
          await fetchData();
        } catch (err) {
          console.error('Error en descontarPorConsumo:', err);
          setError('Error de comunicación al descontar.');
        } finally {
          closeConfirmDialog();
          handleCloseDescuento();
        }
      }
    );
  }

  // =========================
  //   Confirm Dialog Helpers
  // =========================
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }

  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // =========================
  //   Expandir / Colapsar filas
  // =========================
  function toggleProductRow(prodId: number) {
    setOpenProductId((prev) => (prev === prodId ? null : prodId));
  }

  // =========================
  //   Cerrar diálogo de error
  // =========================
  function handleCloseError() {
    setError('');
  }

  // =========================
  //   Render principal
  // =========================
  if (loading) {
    return <p>Cargando inventario (agrupado)...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#212529' }}
      >
        Inventario (Productos)
      </Typography>

      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#1c2430',
          color: '#fff'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Lotes Agrupados por Producto
            </Typography>
          }
          sx={{
            backgroundColor: '#343a40',
            borderRadius: '8px 8px 0 0',
            pb: 1
          }}
          action={
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 'bold', mr: 1 }}
              onClick={handleOpenCreate}
            >
              Crear Lote
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '0 0 8px 8px',
              backgroundColor: '#2b3640'
            }}
          >
            <Table>
              <TableHead
                sx={{
                  backgroundColor: '#25303a',
                  '& th': { color: '#fff' }
                }}
              >
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Acciones Lote</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {inventory.map(({ product, lotes, totalLotes, totalPiezas }) => {
                  const isOpen = openProductId === product.id;
                  const infoExtra = `(${totalLotes} lotes, ${totalPiezas} piezas)`;

                  const {
                    label: stockLabel,
                    color: stockColor
                  } = getStockStatus(totalPiezas);

                  return (
                    <React.Fragment key={product.id}>
                      {/* Fila principal con el producto */}
                      <TableRow
                        onClick={() => toggleProductRow(product.id)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                        }}
                      >
                        <TableCell sx={{ width: 50 }}>
                          {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {product.nombre}{' '}
                          <Typography
                            component="span"
                            sx={{
                              color: '#fff',
                              fontSize: '0.85rem',
                              ml: 1
                            }}
                          >
                            {infoExtra}
                          </Typography>
                          {/* Estado de stock */}
                          <Typography
                            component="span"
                            sx={{
                              color: stockColor,
                              fontSize: '0.85rem',
                              ml: 2,
                              fontWeight: 'bold'
                            }}
                          >
                            {stockLabel}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {/* Botones adicionales si quieres */}
                        </TableCell>
                      </TableRow>

                      {/* Sub-fila colapsable con la tabla de lotes */}
                      <TableRow>
                        <TableCell style={{ padding: 0 }} colSpan={3}>
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  mb: 1
                                }}
                              >
                                Lotes de {product.nombre}
                              </Typography>
                              <Table size="small">
                                <TableHead sx={{ backgroundColor: '#222' }}>
                                  <TableRow>
                                    <TableCell sx={{ color: '#fff' }}>ID</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Lote</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>
                                      Fecha Caducidad
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Cantidad</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Actualizado</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {lotes.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={6} sx={{ color: '#fff' }} align="center">
                                        Sin lotes para {product.nombre}
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    lotes.map((l) => (
                                      <TableRow
                                        key={l.id}
                                        sx={{
                                          '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.05)'
                                          }
                                        }}
                                      >
                                        <TableCell sx={{ color: '#fff' }}>{l.id}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>
                                          {l.lote || '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff' }}>
                                          {l.fechaCaducidad
                                            ? new Date(l.fechaCaducidad).toLocaleDateString()
                                            : '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff' }}>
                                          {l.cantidadActual}
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff' }}>
                                          {l.updatedAt
                                            ? new Date(l.updatedAt).toLocaleString()
                                            : '—'}
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="contained"
                                            color="warning"
                                            size="small"
                                            sx={{ mr: 1, fontWeight: 'bold' }}
                                            startIcon={<EditIcon />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEdit(l);
                                            }}
                                          >
                                            Editar
                                          </Button>
                                          <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 'bold', mr: 1 }}
                                            startIcon={<DeleteIcon />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteLote(l);
                                            }}
                                          >
                                            Eliminar
                                          </Button>
                                          {/* NUEVO: Botón para Merma/Descuento */}
                                          <Button
                                            variant="outlined"
                                            color="info"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenDescuento(l);
                                            }}
                                          >
                                            Descontar
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}

                {/* Si no hay nada en inventory en absoluto */}
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ color: '#fff' }}>
                      No hay productos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ================== Modal Crear/Editar Lote ================== */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingLote ? 'Editar Lote' : 'Crear Lote'}
        </DialogTitle>
        <DialogContent
          sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <FormControl fullWidth>
            <InputLabel id="prod-select-label">Producto</InputLabel>
            <Select
              labelId="prod-select-label"
              value={productoId || 0}
              label="Producto"
              onChange={(e) => setProductoId(Number(e.target.value))}
            >
              <MenuItem value={0}>-- Seleccionar --</MenuItem>
              {allProducts.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Lote"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            fullWidth
          />
          <TextField
            label="Fecha de Caducidad"
            type="date"
            value={fechaCaducidad}
            onChange={(e) => setFechaCaducidad(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          {/* Campo Cantidad manejado como string */}
          <TextField
            label="Cantidad"
            type="text"
            value={cantidadStr}
            onChange={(e) => {
              // Filtramos: solo dígitos y punto (si se requiere)
              const val = e.target.value.replace(/[^\d.]/g, '');
              setCantidadStr(val);
            }}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveLote}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ Diálogo de confirmación genérico ============ */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
      />

      {/* ============ Diálogo de Descuento / Merma ============ */}
      <Dialog
        open={descuentoOpen}
        onClose={handleCloseDescuento}
        fullWidth
        maxWidth="xs"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Descontar / Merma</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2">
            Ingresa la cantidad a descontar (por consumo interno, merma, etc.)
            y un motivo opcional.
          </Typography>
          <TextField
            label="Cantidad a descontar"
            type="text"
            value={descuentoCantidadStr}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d.]/g, '');
              setDescuentoCantidadStr(val);
            }}
          />
          <TextField
            label="Motivo (opcional)"
            value={descuentoMotivo}
            onChange={(e) => setDescuentoMotivo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDescuento}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmDescuento}>
            Descontar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ Diálogo de Error General ============ */}
      <ErrorDialog
        open={!!error}
        errorMessage={error}
        onClose={handleCloseError}
      />
    </Box>
  );
}
