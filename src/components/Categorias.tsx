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
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

/** ====================== Interfaz de Categoría ====================== */
interface Category {
  id?: number;
  nombre: string;
  activo?: boolean;
  updatedAt?: string;
}

/** ====================== ConfirmDialogProps ====================== */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** ====================== Diálogo de confirmación ====================== */
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
        <Button variant="contained" onClick={onConfirm}>Aceptar</Button>
      </DialogActions>
    </Dialog>
  );
}

/** ====================== AlertDialog (un solo botón) ====================== */
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
      BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>Alerta</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" autoFocus>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** ====================== Keyframes para animación "shake" ====================== */
const shakeAnimation = keyframes({
  '0%': { transform: 'translateX(0)' },
  '20%': { transform: 'translateX(-5px)' },
  '40%': { transform: 'translateX(5px)' },
  '60%': { transform: 'translateX(-5px)' },
  '80%': { transform: 'translateX(5px)' },
  '100%': { transform: 'translateX(0)' },
});

/** ====================== Componente principal ====================== */
export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear/Editar
  const [openModal, setOpenModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  // Estado para animar el TextField si está vacío
  const [nameErrorAnim, setNameErrorAnim] = useState(false);

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Alert Dialog
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  /** ====== Helpers para AlertDialog ====== */
  function openAlert(message: string) {
    setAlertMessage(message);
    setAlertOpen(true);
  }
  function closeAlert() {
    setAlertOpen(false);
    setAlertMessage('');
  }

  // ====================== Cargar categorías al montar ======================
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      // Llamamos a nuestra API para obtener categorías
      const resp = await window.electronAPI.getCategories();
      setCategories(resp || []);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      openAlert('No se pudo cargar la lista de categorías.');
    } finally {
      setLoading(false);
    }
  }

  // ====================== MANEJO DEL MODAL CREAR/EDITAR ======================
  function handleOpenCreate() {
    setEditingCat(null);
    setNombre('');
    setActivo(true);
    setNameErrorAnim(false);
    setOpenModal(true);
  }

  function handleOpenEdit(cat: Category) {
    setEditingCat(cat);
    setNombre(cat.nombre);
    setActivo(cat.activo ?? true);
    setNameErrorAnim(false);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setEditingCat(null);
  }

  // ====================== CONFIRM DIALOG UTILS ======================
  function openConfirmDialog(title: string, message: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // ====================== GUARDAR (CREAR O EDITAR) ======================
  async function handleSaveCategory() {
    // Cerramos modal antes de la confirm
    setOpenModal(false);

    const isEdit = !!editingCat;
    const actionText = isEdit ? 'ACTUALIZAR' : 'CREAR';

    openConfirmDialog(
      `Confirmar ${actionText}`,
      `¿Deseas ${actionText} esta categoría?`,
      async () => {
        try {
          if (!window.electronAPI) return;

          if (!nombre.trim()) {
            openAlert('El nombre de la categoría es obligatorio.');
            // Activamos la animación
            setNameErrorAnim(true);
            // La desactivamos luego de 500ms
            setTimeout(() => setNameErrorAnim(false), 500);
            return;
          }

          if (!isEdit) {
            // Crear
            const result = await window.electronAPI.createCategory({
              nombre,
              activo
            });
            if (!result?.success) {
              openAlert('No se pudo crear la categoría.');
            }
          } else {
            // Editar
            const result = await window.electronAPI.updateCategory({
              id: editingCat.id,
              nombre,
              activo
            });
            if (!result?.success) {
              openAlert('No se pudo actualizar la categoría.');
            }
          }

          await fetchCategories();
        } catch (err) {
          console.error('Error guardando categoría:', err);
          openAlert('Error de comunicación al guardar la categoría.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ====================== ELIMINAR ======================
  function handleDeleteCategory(cat: Category) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR la categoría "${cat.nombre}"?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.deleteCategory(cat.id!);
          if (!resp?.success) {
            openAlert('No se pudo eliminar la categoría.');
          }
          await fetchCategories();
        } catch (err) {
          console.error('Error eliminando categoría:', err);
          openAlert('Error de comunicación al eliminar la categoría.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ====================== Render principal ======================
  if (loading) {
    return <p>Cargando categorías...</p>;
  }

  return (
    <Box
      sx={{
        // Ajustamos márgenes y padding para que sea responsivo
        p: { xs: 2, sm: 3 },
        width: '100%'
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#212529' }}
      >
        Gestión de Categorías
      </Typography>

      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#1c2430',
          color: '#fff',
          // Aseguramos márgenes responsivas
          m: { xs: 0, md: 2 }
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Lista de Categorías
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
              Crear Categoría
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '0 0 8px 8px',
              backgroundColor: '#2b3640',
              // Permite scroll horizontal en pantallas pequeñas
              overflowX: 'auto'
            }}
          >
            <Table>
              <TableHead
                sx={{
                  backgroundColor: '#25303a',
                  '& th': { color: '#fff' },
                }}
              >
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell>Actualizado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow
                    key={cat.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.05)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{cat.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{cat.nombre}</TableCell>
                    <TableCell
                      sx={{
                        color: cat.activo ? '#28a745' : '#dc3545',
                        fontWeight: 'bold',
                      }}
                    >
                      {cat.activo ? 'Sí' : 'No'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {cat.updatedAt ? new Date(cat.updatedAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        sx={{ mr: 1, fontWeight: 'bold' }}
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(cat)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: '#fff' }}>
                      No hay categorías registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ============== Modal Crear/Editar Categoría ============== */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingCat ? 'Editar Categoría' : 'Crear Categoría'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            fullWidth
            // Mostramos error y animación si nameErrorAnim está activo
            error={!nombre.trim() && nameErrorAnim}
            helperText={!nombre.trim() && nameErrorAnim ? '¡Ingresa un nombre!' : ''}
            sx={{
              ...(nameErrorAnim && {
                animation: `${shakeAnimation} 0.4s`,
              }),
            }}
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
          <Button variant="contained" onClick={handleSaveCategory}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============== Diálogo de confirmación ============== */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onClose={closeConfirmDialog}
        onConfirm={confirmAction}
      />

      {/* ============== Diálogo de alerta general ============== */}
      <AlertDialog
        open={alertOpen}
        message={alertMessage}
        onClose={closeAlert}
      />
    </Box>
  );
}
