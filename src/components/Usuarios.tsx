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
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

/** ======== Diálogo de confirmación genérico ======== */
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
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

/** ======== Diálogo de alerta con un botón (reemplaza alert) ======== */
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
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>Alerta</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} autoFocus>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** ======== Interfaz de usuario ======== */
interface User {
  id: number;
  username: string;
  role: string;    // "admin", "trabajador"
  activo: boolean; // true=activo, false=inactivo
}

/** ======== Componente principal ======== */
export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Usuario actual (admin con ID=1, por ejemplo)
  const [currentUser] = useState<{ id: number; role: string }>({
    id: 1,
    role: 'admin'
  });

  // Modal de Crear/Editar
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Campos del form
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('trabajador');
  const [activo, setActivo] = useState(true);

  /** ★ NUEVO: campo de contraseña */
  const [password, setPassword] = useState('');

  // Confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Alert (reemplaza alert() nativo)
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  /** Helpers para mostrar/cerrar alertas */
  function openAlert(msg: string) {
    setAlertMessage(msg);
    setAlertOpen(true);
  }
  function closeAlert() {
    setAlertOpen(false);
    setAlertMessage('');
  }

  // ================== Cargar usuarios al montar ==================
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      if (!window.electronAPI) return;
      const userList = await window.electronAPI.getUsers();
      const mapped = (userList || []).map((u: any) => ({
        ...u,
        activo: true
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Error fetching users:', err);
      openAlert('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }

  // ================== Crear ==================
  function handleOpenCreate() {
    setEditingUser(null);
    setUsername('');
    setRole('trabajador');
    setActivo(true);
    /** ★ LIMPIAMOS EL PASSWORD AL CREAR */
    setPassword('');
    setOpenModal(true);
  }

  // ================== Editar ==================
  function handleOpenEdit(user: User) {
    setEditingUser(user);
    setUsername(user.username);
    setRole(user.role);
    setActivo(user.activo);
    /** ★ LIMPIAMOS EL PASSWORD AL EDITAR (opcional) */
    setPassword('');
    setOpenModal(true);
  }

  // ================== Cerrar modal ==================
  function handleCloseModal() {
    setOpenModal(false);
    setEditingUser(null);
    setUsername('');
    setRole('trabajador');
    setActivo(true);
    setPassword('');
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
  async function handleSaveUser() {
    setOpenModal(false); // cerrar modal de edición

    const actionText = editingUser ? 'ACTUALIZAR' : 'CREAR';
    openConfirmDialog(
      `Confirmar ${actionText}`,
      `¿Deseas ${actionText} este usuario?`,
      async () => {
        try {
          if (!window.electronAPI) return;

          if (!username.trim()) {
            openAlert('El nombre de usuario es obligatorio.');
            return;
          }

          if (!editingUser) {
            // Crear
            const result = await window.electronAPI.createUser({
              username,
              role,
              activo,
              password, // ★ Enviamos el password
            });
            if (!result?.success) {
              openAlert('No se pudo crear el usuario.');
            }
          } else {
            // Editar
            const result = await window.electronAPI.updateUser({
              id: editingUser.id,
              username,
              role,
              activo,
              password, // ★ Enviamos el password si se desea actualizar
            });
            if (!result?.success) {
              openAlert('No se pudo actualizar el usuario.');
            }
          }
          await fetchUsers();
        } catch (error) {
          console.error('Error guardando usuario:', error);
          openAlert('Error de comunicación al guardar el usuario.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ================== Eliminar ==================
  function handleDeleteUser(user: User) {
    // Evitar que un admin se elimine a sí mismo
    if (user.id === currentUser.id && currentUser.role === 'admin') {
      openAlert('No puedes eliminar tu propia cuenta si eres administrador.');
      return;
    }

    openConfirmDialog(
      'Confirmar eliminación',
      `¿Deseas ELIMINAR o DESACTIVAR al usuario "${user.username}"?`,
      async () => {
        try {
          if (!window.electronAPI) return;
          const result = await window.electronAPI.deleteUser(user.id);
          if (!result?.success) {
            openAlert('No se pudo eliminar el usuario.');
          }
          await fetchUsers();
        } catch (error) {
          console.error('Error eliminando usuario:', error);
          openAlert('Error de comunicación al eliminar el usuario.');
        } finally {
          closeConfirmDialog();
        }
      }
    );
  }

  // ================== Render principal ==================
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Título principal en negro */}
      <Typography variant="h4" sx={{ mb: 2, color: '#212529', fontWeight: 'bold' }}>
        Administrar Usuarios
      </Typography>

      {/* Card principal (blanco) */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
              Lista de Usuarios
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
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              color="success"
              sx={{ fontWeight: 'bold', mr: 1 }}
            >
              Crear Usuario
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ borderRadius: '0 0 8px 8px' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#e9ecef' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057' }}>Activo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#495057' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>
                      {/* Muestra un chip de color según el rol */}
                      {u.role === 'admin' ? (
                        <Chip label="Admin" color="primary" />
                      ) : (
                        <Chip label="Trabajador" color="secondary" />
                      )}
                    </TableCell>
                    <TableCell>{u.activo ? 'Sí' : 'No'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        sx={{ mr: 1, fontWeight: 'bold' }}
                        color="warning"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(u)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="contained"
                        sx={{ fontWeight: 'bold' }}
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteUser(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Eliminar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal de Crear/Editar */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        </DialogTitle>
        <DialogContent sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            autoFocus
          />

          {/* ★ CAMPO DE CONTRASEÑA */}
          <TextField
            label="Contraseña (opcional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />

          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as string)}
            fullWidth
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="trabajador">Trabajador</MenuItem>
          </Select>
          <Select
            value={activo ? '1' : '0'}
            onChange={(e) => setActivo(e.target.value === '1')}
            fullWidth
          >
            <MenuItem value="1">Activo</MenuItem>
            <MenuItem value="0">Inactivo</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveUser}>
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

      {/* Diálogo de alerta (reemplaza alert) */}
      <AlertDialog
        open={alertOpen}
        message={alertMessage}
        onClose={closeAlert}
      />
    </Box>
  );
}
