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
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/** ================== Interfaz principal de un Proveedor ================== */
interface Provider {
  id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  updatedAt?: string; // para mostrar fecha de actualización
}

/** ================== Diálogo de confirmación genérico ================== */
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

/** ================== Diálogo de error (reemplaza alert) ================== */
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
export default function Proveedores() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modal crear/editar
  const [openModal, setOpenModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Campos de formulario
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  // const [activo, setActivo] = useState(true); // si necesitases un checkbox

  // Diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Diálogo de error general (reemplaza alert)
  const [error, setError] = useState('');

  // ================== Cargar proveedores al montar ==================
  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      const resp = await window.electronAPI.getProviders();
      setProviders(resp || []);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      setError('No se pudo cargar la lista de proveedores.');
    } finally {
      setLoading(false);
    }
  }

  // ========== Modal Crear ==========
  function handleOpenCreate() {
    setEditingProvider(null);
    setNombre('');
    setContacto('');
    setTelefono('');
    setEmail('');
    // setActivo(true);
    setOpenModal(true);
  }

  // ========== Modal Editar ==========
  function handleOpenEdit(prov: Provider) {
    setEditingProvider(prov);
    setNombre(prov.nombre);
    setContacto(prov.contacto ?? '');
    setTelefono(prov.telefono ?? '');
    setEmail(prov.email ?? '');
    // setActivo(prov.activo ?? true);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setEditingProvider(null);
  }

  // ========== Confirm Dialog ==========
  function openConfirmDialog(
    title: string,
    message: string,
    action: () => void
  ) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirmDialog() {
    setConfirmOpen(false);
  }

  // ========== Guardar (Crear/Editar) ==========
  async function handleSaveProvider() {
    // Cerramos el modal antes de abrir confirm
    setOpenModal(false);

    const isEdit = !!editingProvider;
    const actionText = isEdit ? 'ACTUALIZAR' : 'CREAR';

    openConfirmDialog(
      `Confirmar ${actionText}`,
      `¿Deseas ${actionText} este proveedor?`,
      async () => {
        try {
          if (!window.electronAPI) return;

          if (!nombre.trim()) {
            setError('El nombre del proveedor es obligatorio.');
            return;
          }

          if (!isEdit) {
            // Crear
            const result = await window.electronAPI.createProvider({
              nombre,
              contacto,
              telefono,
              email,
              activo: true
            });
            if (!result?.success) {
              setError('No se pudo crear el proveedor en la base de datos.');
            }
          } else {
            // Editar
            const result = await window.electronAPI.updateProvider({
              id: editingProvider.id,
              nombre,
              contacto,
              telefono,
              email,
              activo: true
            });
            if (!result?.success) {
              setError('No se pudo actualizar el proveedor en la base de datos.');
            }
          }

          await fetchProviders();
        } catch (err) {
          console.error('Error guardando proveedor:', err);
          setError('Error de comunicación al guardar el proveedor.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ========== Eliminar ==========
  function handleDeleteProvider(prov: Provider) {
    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR al proveedor "${prov.nombre}"?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const resp = await window.electronAPI.deleteProvider(prov.id!);
          if (!resp?.success) {
            setError('No se pudo eliminar al proveedor en la base de datos.');
          }
          await fetchProviders();
        } catch (err) {
          console.error('Error eliminando proveedor:', err);
          setError('Error de comunicación al eliminar el proveedor.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  function handleCloseError() {
    setError('');
  }

  if (loading) {
    return <p>Cargando proveedores...</p>;
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#212529' }}
      >
        Gestión de Proveedores
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
              Lista de Proveedores
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
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              color="success"
              sx={{ fontWeight: 'bold', mr: 1 }}
            >
              Crear Proveedor
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
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell>Actualizado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {providers.map((prov) => (
                  <TableRow
                    key={prov.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{prov.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{prov.nombre}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {prov.contacto || '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {prov.telefono || '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {prov.email || '—'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: prov.activo ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}
                    >
                      {prov.activo ? 'Sí' : 'No'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {prov.updatedAt
                        ? new Date(prov.updatedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        sx={{ mr: 1, fontWeight: 'bold' }}
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(prov)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteProvider(prov)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {providers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: '#fff' }}>
                      No hay proveedores registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ============ Modal Crear/Editar Proveedor ============ */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ style: { backdropFilter: 'blur(6px)' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingProvider ? 'Editar Proveedor' : 'Crear Proveedor'}
        </DialogTitle>
        <DialogContent
          sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            fullWidth
          />
          <TextField
            label="Contacto"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            fullWidth
          />
          <TextField
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProvider}>
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
        onClose={() => setError('')}
      />
    </Box>
  );
}
