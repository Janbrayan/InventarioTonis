// global.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      // LOGIN
      loginUser: (username: string, password: string) => Promise<{
        success: boolean;
        role?: string;
        error?: string;
        user?: {
          name?: string;
        };
      }>;

      // CRUD USUARIOS
      getUsers: () => Promise<any>;        // Ajusta: Promise<User[]>
      createUser: (user: any) => Promise<{ success: boolean }>;
      updateUser: (user: any) => Promise<{ success: boolean }>;
      deleteUser: (id: number) => Promise<{ success: boolean }>;
    };
  }
}
