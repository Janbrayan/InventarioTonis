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
  Collapse,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';

/** Tipos básicos */
interface Product {
  id: number;
  nombre: string;
  // ... lo que uses adicional (precioVenta, codigoBarras, etc.)
}

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
        style: { backdropFilter: 'blur(6px)' },
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

/**
 * Función para determinar el estado de stock en función del total de piezas.
 * Ajusta los límites (p.ej. < 5 para "poco", < 15 para "normal", etc.) según tus necesidades.
 */
function getStockStatus(totalPiezas: number) {
  if (totalPiezas < 5) {
    return { label: 'Poco stock', color: 'red' };
  } else if (totalPiezas < 15) {
    return { label: 'Stock normal', color: 'orange' };
  } else {
    return { label: 'Alto stock', color: 'green' };
  }
}

/** Componente principal */
export default function Inventario() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear/Editar Lote
  const [openModal, setOpenModal] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);

  // Campos del form
  const [productoId, setProductoId] = useState<number>(0);
  const [lote, setLote] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [cantidadActual, setCantidadActual] = useState<number>(0);

  // Diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // ID del producto expandido (solo uno a la vez)
  const [openProductId, setOpenProductId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [prodList, lotList] = await Promise.all([
        window.electronAPI.getProducts(),
        window.electronAPI.getLotes(),
      ]);
      setProducts(prodList || []);
      setLotes(lotList || []);
    } catch (err) {
      console.error('Error fetchData Inventario:', err);
    } finally {
      setLoading(false);
    }
  }

  // Agrupamos lotes por producto y calculamos totales
  const grouped = products.map((prod) => {
    const lotesDeEsteProd = lotes.filter((l) => l.productoId === prod.id);
    const totalLotes = lotesDeEsteProd.length;
    const totalPiezas = lotesDeEsteProd.reduce(
      (acc, lote) => acc + (lote.cantidadActual ?? 0),
      0
    );

    return {
      product: prod,
      lotes: lotesDeEsteProd,
      totalLotes,
      totalPiezas,
    };
  });

  // Toggle expand/collapse (solo uno abierto a la vez)
  function toggleProductRow(prodId: number) {
    setOpenProductId((prev) => (prev === prodId ? null : prodId));
  }

  // Abrir modal para Crear Lote
  function handleOpenCreate() {
    setEditingLote(null);
    setProductoId(0);
    setLote('');
    setFechaCaducidad('');
    setCantidadActual(0);
    setOpenModal(true);
  }

  // Abrir modal para Editar Lote
  function handleOpenEdit(l: Lote) {
    setEditingLote(l);
    setProductoId(l.productoId);
    setLote(l.lote ?? '');
    setFechaCaducidad(l.fechaCaducidad ?? '');
    setCantidadActual(l.cantidadActual ?? 0);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setEditingLote(null);
  }

  // Confirm dialog
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // Guardar Lote (crear o editar)
  async function handleSaveLote() {
    setOpenModal(false);
    const isEdit = !!editingLote;
    const actionText = isEdit ? 'ACTUALIZAR' : 'CREAR';

    openConfirmDialog(`Confirmar ${actionText}`, `¿Deseas ${actionText} este lote?`, async () => {
      try {
        if (!window.electronAPI) return;

        if (!isEdit) {
          // Crear
          const resp = await window.electronAPI.createLote({
            productoId,
            lote,
            fechaCaducidad: fechaCaducidad || null,
            cantidadActual,
            activo: true,
          });
          if (!resp?.success) {
            alert('No se pudo crear el lote.');
          }
        } else {
          // Editar
          const resp = await window.electronAPI.updateLote({
            id: editingLote.id,
            productoId,
            lote,
            fechaCaducidad: fechaCaducidad || null,
            cantidadActual,
            activo: true,
          });
          if (!resp?.success) {
            alert('No se pudo actualizar el lote.');
          }
        }
        await fetchData();
      } catch (err) {
        console.error('Error guardando lote:', err);
      } finally {
        closeConfirmDialog();
      }
    });
  }

  // Eliminar Lote
  function handleDeleteLote(l: Lote) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR el lote "${l.lote}" del producto ID=${l.productoId}?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.deleteLote(l.id!);
          if (!resp?.success) {
            alert('No se pudo eliminar el lote.');
          }
          await fetchData();
        } catch (err) {
          console.error('Error eliminando lote:', err);
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  if (loading) {
    return <p>Cargando inventario (Productos)...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#212529' }}>
        Inventario (Productos)
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Lotes Agrupados por Producto
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
              Crear Lote
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            sx={{ borderRadius: '0 0 8px 8px', backgroundColor: '#2b3640' }}
          >
            <Table>
              <TableHead
                sx={{
                  backgroundColor: '#25303a',
                  '& th': { color: '#fff' },
                }}
              >
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Acciones Lote</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {grouped.map(({ product, lotes: lotesDeEsteProd, totalLotes, totalPiezas }) => {
                  const isOpen = openProductId === product.id;

                  // Info sobre lotes y piezas
                  const infoExtra = `(${totalLotes} lotes, ${totalPiezas} piezas)`;

                  // Obtenemos estado de stock
                  const { label: stockLabel, color: stockColor } = getStockStatus(totalPiezas);

                  return (
                    <React.Fragment key={product.id}>
                      {/* Fila principal con el producto */}
                      <TableRow
                        onClick={() => toggleProductRow(product.id)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.05)',
                          },
                        }}
                      >
                        <TableCell sx={{ width: 50 }}>
                          {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {product.nombre}{' '}
                          <Typography component="span" sx={{ color: '#fff', fontSize: '0.85rem', ml: 1 }}>
                            {infoExtra}
                          </Typography>
                          {/* Estado de stock */}
                          <Typography
                            component="span"
                            sx={{ color: stockColor, fontSize: '0.85rem', ml: 2, fontWeight: 'bold' }}
                          >
                            {stockLabel}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {/* Botón u opciones adicionales, si quieres */}
                        </TableCell>
                      </TableRow>

                      {/* Sub-fila colapsable con la tabla de lotes */}
                      <TableRow>
                        <TableCell style={{ padding: 0 }} colSpan={3}>
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}
                              >
                                Lotes de {product.nombre}
                              </Typography>
                              <Table size="small">
                                <TableHead sx={{ backgroundColor: '#222' }}>
                                  <TableRow>
                                    <TableCell sx={{ color: '#fff' }}>ID</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Lote</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Fecha Caducidad</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Cantidad</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Actualizado</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {lotesDeEsteProd.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={6} sx={{ color: '#fff' }} align="center">
                                        Sin lotes para {product.nombre}
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    lotesDeEsteProd.map((l) => (
                                      <TableRow
                                        key={l.id}
                                        sx={{
                                          '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                          },
                                        }}
                                      >
                                        <TableCell sx={{ color: '#fff' }}>{l.id}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>{l.lote || '—'}</TableCell>
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
                                              e.stopPropagation(); // evita colapsar la fila
                                              handleOpenEdit(l);
                                            }}
                                          >
                                            Editar
                                          </Button>
                                          <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                            startIcon={<DeleteIcon />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteLote(l);
                                            }}
                                          >
                                            Eliminar
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

                {grouped.length === 0 && (
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

      {/* Modal Crear/Editar Lote */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{
          style: { backdropFilter: 'blur(6px)' },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingLote ? 'Editar Lote' : 'Crear Lote'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="prod-select-label">Producto</InputLabel>
            <Select
              labelId="prod-select-label"
              value={productoId || ''}
              label="Producto"
              onChange={(e) => setProductoId(Number(e.target.value))}
            >
              <MenuItem value={0}>-- Seleccionar --</MenuItem>
              {products.map((p) => (
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
          <TextField
            label="Cantidad"
            type="number"
            value={cantidadActual === 0 ? '' : cantidadActual}
            onChange={(e) => {
              const val = e.target.value;
              setCantidadActual(val === '' ? 0 : Number(val));
            }}
            inputMode="numeric"
            InputProps={{
              inputProps: {
                pattern: '[0-9]*',
                style: {
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                },
              },
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
