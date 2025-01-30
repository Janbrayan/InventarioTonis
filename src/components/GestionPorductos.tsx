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
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

/** ================== Tipos locales ================== */
interface Category {
  id: number;
  nombre: string;
  activo?: boolean;
}

interface Product {
  id?: number;
  nombre: string;
  categoriaId?: number | null;
  precioCompra?: number;   // precio de compra real
  precioVenta?: number;    // precio de venta real
  codigoBarras?: string;
  activo?: boolean;
  updatedAt?: string;
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
        <Typography whiteSpace="pre-line">{message}</Typography>
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

/** ================== Componente principal ================== */
export default function GestionProductos() {
  const location = useLocation(); // Para leer location.state
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear/Editar
  const [openModal, setOpenModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields (manejar como strings para no bloquear)
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);

  // Almacena los valores del precio en strings
  const [precioCompraStr, setPrecioCompraStr] = useState('0');
  const [precioVentaStr, setPrecioVentaStr] = useState('0');

  const [codigoBarras, setCodigoBarras] = useState('');
  const [activo, setActivo] = useState(true); // Switch para marcar producto activo/inactivo

  // Diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Estado de error general (para reemplazar alerts)
  const [error, setError] = useState('');

  // ================== Cargar datos al montar ==================
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Llamadas a tu backend / electronAPI
      const [prodList, catList] = await Promise.all([
        window.electronAPI.getProducts(),
        window.electronAPI.getCategories()
      ]);
      setProducts(prodList || []);
      setCategories(catList || []);
    } catch (error) {
      console.error('Error fetching products/categories:', error);
      setError('No se pudieron cargar los productos/categorías.');
    } finally {
      setLoading(false);
    }
  }

  // Revisa si vienes de un escaneo => abrir modal de crear/editar
  useEffect(() => {
    const state: any = location.state;
    if (state?.createBarcode) {
      // QUIERO CREAR con barcode prellenado
      handleOpenCreate(state.createBarcode);
      navigate(location.pathname, { replace: true }); // limpiar state
    } else if (state?.editBarcode) {
      // QUIERO EDITAR un producto ya existente
      const found = products.find(p => p.codigoBarras === state.editBarcode);
      if (found) {
        handleOpenEdit(found);
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, products]);

  // ================== Abrir modal para crear ==================
  function handleOpenCreate(barcode?: string) {
    setEditingProduct(null);
    setNombre('');
    setCategoriaId(null);
    setPrecioCompraStr('0');
    setPrecioVentaStr('0');
    setCodigoBarras(barcode ?? '');
    setActivo(true);
    setOpenModal(true);
  }

  // ================== Abrir modal para editar ==================
  function handleOpenEdit(prod: Product) {
    setEditingProduct(prod);
    setNombre(prod.nombre);
    setCategoriaId(prod.categoriaId ?? null);
    setPrecioCompraStr((prod.precioCompra ?? 0).toString());
    setPrecioVentaStr((prod.precioVenta ?? 0).toString());
    setCodigoBarras(prod.codigoBarras ?? '');
    setActivo(prod.activo ?? true);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setEditingProduct(null);
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

  // ================== Guardar (crear o editar) ==================
  async function handleSaveProduct() {
    // Convertimos los strings a números
    const pc = parseFloat(precioCompraStr) || 0;
    const pv = parseFloat(precioVentaStr) || 0;

    // Validaciones mínimas
    if (!nombre.trim()) {
      setError('El nombre de producto es obligatorio');
      return;
    }

    // Revisamos que no exista otro producto con el mismo nombre
    const nombreLower = nombre.trim().toLowerCase();
    if (!editingProduct) {
      // Creación
      const sameName = products.find(
        (p) => p.nombre.trim().toLowerCase() === nombreLower
      );
      if (sameName) {
        setError(`Ya existe un producto con el mismo nombre: "${nombre}".`);
        return;
      }
      // Revisar duplicado en código de barras (si lo tiene)
      if (codigoBarras.trim()) {
        const sameBarcode = products.find(
          (p) => (p.codigoBarras ?? '').trim() === codigoBarras.trim()
        );
        if (sameBarcode) {
          setError(`Ya existe un producto con el mismo código de barras: "${codigoBarras}".`);
          return;
        }
      }
    } else {
      // Edición
      const sameName = products.find(
        (p) =>
          p.nombre.trim().toLowerCase() === nombreLower &&
          p.id !== editingProduct.id
      );
      if (sameName) {
        setError(`Ya existe otro producto con el mismo nombre: "${nombre}".`);
        return;
      }
      if (codigoBarras.trim()) {
        const sameBarcode = products.find(
          (p) =>
            (p.codigoBarras ?? '').trim() === codigoBarras.trim() &&
            p.id !== editingProduct.id
        );
        if (sameBarcode) {
          setError(`Ya existe otro producto con el mismo código de barras: "${codigoBarras}".`);
          return;
        }
      }
    }

    // Cerrar modal para mostrar luego confirm
    setOpenModal(false);

    const isEdit = !!editingProduct;
    const actionText = isEdit ? 'ACTUALIZAR' : 'CREAR';

    // Preparamos un mensaje detallado con la info del producto
    const catName =
      categoriaId ? categories.find(c => c.id === categoriaId)?.nombre : 'Sin Categoría';
    const infoProducto = `
Datos del Producto:

Nombre: ${nombre}
Categoría: ${catName ?? '—'}
Precio Compra: $${pc.toFixed(2)}
Precio Venta: $${pv.toFixed(2)}
Código de Barras: ${codigoBarras || '—'}
Activo: ${activo ? 'Sí' : 'No'}

¿Deseas ${actionText} este producto?
    `;

    openConfirmDialog(
      `Confirmar ${actionText}`,
      infoProducto,
      async () => {
        try {
          if (!window.electronAPI) return;

          if (!isEdit) {
            // Crear
            const resp = await window.electronAPI.createProduct({
              nombre,
              categoriaId,
              precioCompra: pc,
              precioVenta: pv,
              codigoBarras,
              activo
            });
            if (!resp?.success) {
              setError('No se pudo crear el producto.');
            }
          } else {
            // Editar
            const resp = await window.electronAPI.updateProduct({
              id: editingProduct.id,
              nombre,
              categoriaId,
              precioCompra: pc,
              precioVenta: pv,
              codigoBarras,
              activo
            });
            if (!resp?.success) {
              setError('No se pudo actualizar el producto.');
            }
          }

          await fetchData();
        } catch (err) {
          console.error('Error guardando producto:', err);
          setError('Error de comunicación al guardar.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ================== Eliminar producto ==================
  function handleDeleteProduct(prod: Product) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR el producto "${prod.nombre}"?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.deleteProduct(prod.id!);
          if (!resp?.success) {
            setError('No se pudo eliminar el producto.');
          }
          await fetchData();
        } catch (err) {
          console.error('Error eliminando producto:', err);
          setError('Error de comunicación al eliminar.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // Cierra el diálogo de error
  function handleCloseError() {
    setError('');
  }

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  // ================== Render principal ==================
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
            pb: 1
          }}
          action={
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 'bold', mr: 1 }}
              onClick={() => handleOpenCreate()}
            >
              Crear Producto
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
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
                  const catName =
                    categories.find(c => c.id === prod.categoriaId)?.nombre || '—';

                  return (
                    <TableRow
                      key={prod.id}
                      sx={{
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                      }}
                    >
                      <TableCell sx={{ color: '#fff' }}>{prod.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{prod.nombre}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{catName}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {typeof prod.precioCompra === 'number' ? `$${prod.precioCompra}` : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {typeof prod.precioVenta === 'number' ? `$${prod.precioVenta}` : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#fff' }}>
                        {prod.codigoBarras || '—'}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: prod.activo ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}
                      >
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

      {/* ============ Modal Crear/Editar Producto ============ */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
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

          <TextField
            label="Precio de Compra ($)"
            type="text"
            value={precioCompraStr}
            onChange={(e) => {
              // Filtramos caracteres no deseados
              const val = e.target.value.replace(/[^\d.]/g, '');
              setPrecioCompraStr(val);
            }}
            fullWidth
          />

          <TextField
            label="Precio de Venta ($)"
            type="text"
            value={precioVentaStr}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d.]/g, '');
              setPrecioVentaStr(val);
            }}
            fullWidth
          />

          <TextField
            label="Código de Barras"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            fullWidth
          />

          {/* Switch para "activo" */}
          <FormControlLabel
            control={
              <Switch
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
              />
            }
            label="Activo"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProduct}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ Diálogo de confirmación ============ */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
      />

      {/* ============ Diálogo de error general ============ */}
      <ErrorDialog
        open={!!error}
        errorMessage={error}
        onClose={handleCloseError}
      />
    </Box>
  );
}
