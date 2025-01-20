// electron/main/ipcHandlers.ts
import { ipcMain } from 'electron';
import { UserService } from './services/UserService';

/**
 * setupIpcHandlers
 * 
 * Registra los canales IPC necesarios para la app.
 * Por ejemplo, 'login-user' para el login,
 * 'get-users', 'create-user', etc. para la gestión de usuarios.
 */
export function setupIpcHandlers() {

  // === LOGIN ===
  ipcMain.handle('login-user', async (_event, { username, password }) => {
    try {
      const result = await UserService.loginUser(username, password);

      if (!result.success) {
        return { success: false, error: 'Credenciales inválidas' };
      }

      return {
        success: true,
        role: result.role,
        user: { 
          name: result.username 
        },
      };
    } catch (error) {
      console.error('Error en login-user IPC:', error);
      return { success: false, error: 'Error interno en login-user' };
    }
  });

  // === LISTAR USUARIOS ===
  ipcMain.handle('get-users', async () => {
    try {
      const users = await UserService.getUsers();
      return users; // retorna un array de usuarios
    } catch (error) {
      console.error('Error en get-users IPC:', error);
      return [];
    }
  });

  // === CREAR USUARIO ===
  ipcMain.handle('create-user', async (_event, newUser) => {
    try {
      const result = await UserService.createUser(newUser);
      return result; // { success: true/false }
    } catch (error) {
      console.error('Error en create-user IPC:', error);
      return { success: false };
    }
  });

  // === ACTUALIZAR USUARIO ===
  ipcMain.handle('update-user', async (_event, user) => {
    try {
      const result = await UserService.updateUser(user);
      return result; // { success: true/false }
    } catch (error) {
      console.error('Error en update-user IPC:', error);
      return { success: false };
    }
  });

  // === ELIMINAR USUARIO ===
  ipcMain.handle('delete-user', async (_event, id) => {
    try {
      const result = await UserService.deleteUser(id);
      return result; // { success: true/false }
    } catch (error) {
      console.error('Error en delete-user IPC:', error);
      return { success: false };
    }
  });
}
