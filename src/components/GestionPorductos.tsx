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
  InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

// ====== Tipos locales ======
interface Category {
  id: number;
  nombre: string;
  activo?: boolean;
}

interface Product {
  id?: number;
  nombre: string;
  categoriaId?: number | null;
  precioCompra?: number;   // precio de compra
  precioVenta?: number;    // precio de venta
  codigoBarras?: string;
  activo?: boolean;
  updatedAt?: string;
}

// Diálogo de confirmación genérico
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
          backdropFilter: 'blur(6px)'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirm}>Aceptar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ===============================
//   Componente principal
// ===============================
export default function GestionProductos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear/Editar
  const [openModal, setOpenModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [precioCompra, setPrecioCompra] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [activo, setActivo] = useState(true);

  // Diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Cargar datos al montar
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [prodList, catList] = await Promise.all([
        window.electronAPI.getProducts(),
        window.electronAPI.getCategories()
      ]);
      setProducts(prodList || []);
      setCategories(catList || []);
    } catch (error) {
      console.error('Error fetching products/categories:', error);
    } finally {
      setLoading(false);
    }
  }

  // Abrir modal para crear
  function handleOpenCreate() {
    setEditingProduct(null);
    setNombre('');
    setCategoriaId(null);
    setPrecioCompra(0);
    setPrecioVenta(0);
    setCodigoBarras('');
    setActivo(true);
    setOpenModal(true);
  }

  // Abrir modal para editar
  function handleOpenEdit(prod: Product) {
    setEditingProduct(prod);
    setNombre(prod.nombre);
    setCategoriaId(prod.categoriaId ?? null);
    setPrecioCompra(prod.precioCompra ?? 0);
    setPrecioVenta(prod.precioVenta ?? 0);
    setCodigoBarras(prod.codigoBarras ?? '');
    setActivo(prod.activo ?? true);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setEditingProduct(null);
  }

  // confirm dialog
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // Guardar (crear o editar)
  async function handleSaveProduct() {
    setOpenModal(false);
    const isEdit = !!editingProduct;
    const actionText = isEdit ? 'ACTUALIZAR' : 'CREAR';

    openConfirmDialog(
      `Confirmar ${actionText}`,
      `¿Deseas ${actionText} este producto?`,
      async () => {
        try {
          if (!window.electronAPI) return;

          if (!isEdit) {
            // Crear
            const resp = await window.electronAPI.createProduct({
              nombre,
              categoriaId,
              precioCompra,
              precioVenta,
              codigoBarras,
              activo
            });
            if (!resp?.success) {
              alert('No se pudo crear el producto.');
            }
          } else {
            // Editar
            const resp = await window.electronAPI.updateProduct({
              id: editingProduct.id,
              nombre,
              categoriaId,
              precioCompra,
              precioVenta,
              codigoBarras,
              activo
            });
            if (!resp?.success) {
              alert('No se pudo actualizar el producto.');
            }
          }

          await fetchData();
        } catch (err) {
          console.error('Error guardando producto:', err);
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // Eliminar
  function handleDeleteProduct(prod: Product) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR el producto "${prod.nombre}"?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.deleteProduct(prod.id!);
          if (!resp?.success) {
            alert('No se pudo eliminar el producto.');
          }
          await fetchData();
        } catch (err) {
          console.error('Error eliminando producto:', err);
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#212529' }}>
        Gestión de Productos
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#1c2430', color: '#fff' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Lista de Productos
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
              Crear Producto
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ borderRadius: '0 0 8px 8px', backgroundColor: '#2b3640' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#25303a', '& th': { color: '#fff' } }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
                  {/* Con signo $ en la tabla */}
                  <TableCell>Compra ($)</TableCell>
                  <TableCell>Venta ($)</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell>Actualizado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((prod) => {
                  // Obtener el nombre de la categoría, si existe
                  const catName = categories.find(c => c.id === prod.categoriaId)?.nombre || '—';

                  return (
                    <TableRow
                      key={prod.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }
                      }}
                    >
                      <TableCell sx={{ color: '#fff' }}>{prod.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{prod.nombre}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{catName}</TableCell>
                      {/* Muestra el signo de $ en la tabla */}
                      <TableCell sx={{ color: '#fff' }}>
                        {prod.precioCompra !== undefined ? `$${prod.precioCompra}` : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {prod.precioVenta !== undefined ? `$${prod.precioVenta}` : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>{prod.codigoBarras || '—'}</TableCell>
                      <TableCell sx={{ color: prod.activo ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                        {prod.activo ? 'Sí' : 'No'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {prod.updatedAt ? new Date(prod.updatedAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          sx={{ mr: 1, fontWeight: 'bold' }}
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEdit(prod)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteProduct(prod)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ color: '#fff' }}>
                      No hay productos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal Crear/Editar Producto */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{
          style: {
            backdropFilter: 'blur(6px)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingProduct ? 'Editar Producto' : 'Crear Producto'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            fullWidth
          />
          {/* SELECT Categoría */}
          <FormControl fullWidth>
            <InputLabel id="cat-select-label">Categoría</InputLabel>
            <Select
              labelId="cat-select-label"
              value={categoriaId ?? ''}
              label="Categoría"
              onChange={(e) => {
                const val = e.target.value;
                setCategoriaId(val === '' ? null : Number(val));
              }}
            >
              <MenuItem value="">Sin Categoría</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Precio de Compra con $ en la etiqueta */}
          <TextField
            label="Precio de Compra ($)"
            type="number"
            value={precioCompra === 0 ? '' : precioCompra}
            onChange={(e) => {
              const val = e.target.value;
              setPrecioCompra(val === '' ? 0 : Number(val));
            }}
            inputMode="numeric"
            InputProps={{
              inputProps: {
                pattern: '[0-9]*',
                style: {
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }
              }
            }}
            fullWidth
          />

          {/* Precio de Venta con $ en la etiqueta */}
          <TextField
            label="Precio de Venta ($)"
            type="number"
            value={precioVenta === 0 ? '' : precioVenta}
            onChange={(e) => {
              const val = e.target.value;
              setPrecioVenta(val === '' ? 0 : Number(val));
            }}
            inputMode="numeric"
            InputProps={{
              inputProps: {
                pattern: '[0-9]*',
                style: {
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }
              }
            }}
            fullWidth
          />

          <TextField
            label="Código de Barras"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProduct}>
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
