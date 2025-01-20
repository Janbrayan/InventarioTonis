// electron/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Define un tipo para la respuesta del login
export interface LoginUserResponse {
  success: boolean;
  role?: string;
  error?: string;
  user?: {
    name: string;
  };
}

// Define un tipo mínimo para User a nivel frontend
export interface FrontUser {
  id?: number;
  username: string;
  role: string;
  activo?: boolean;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // === LOGIN ===
  loginUser: async (username: string, password: string): Promise<LoginUserResponse> => {
    return ipcRenderer.invoke('login-user', { username, password });
  },

  // === CRUD USUARIOS ===
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (user: FrontUser) => ipcRenderer.invoke('create-user', user),
  updateUser: (user: FrontUser & { id: number }) => ipcRenderer.invoke('update-user', user),
  deleteUser: (id: number) => ipcRenderer.invoke('delete-user', id),
});
