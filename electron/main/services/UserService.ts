// electron/main/services/UserService.ts
import db from '../db';
import bcrypt from 'bcrypt';

/**
 * Interfaz que describe la fila de la tabla `users`.
 * Ajusta según tus columnas reales en la base de datos.
 */
interface DBUser {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  // ejemplo: activo: number;
}

/**
 * Estructura que devolvemos tras el login:
 */
export interface LoginUserResult {
  success: boolean;
  role?: string;
  username?: string;
}

/**
 * Interfaz de usuario que manejamos en el frontend (y para crear/editar).
 */
interface User {
  id?: number;
  username: string;
  password?: string; // si se va a crear/editar password
  role: string;
  // activo?: boolean; 
}

/**
 * Clase de servicio para la lógica de base de datos
 */
export class UserService {

  // === LOGIN ===
  static async loginUser(username: string, password: string): Promise<LoginUserResult> {
    try {
      const row = db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get(username) as DBUser | undefined;

      if (!row) {
        return { success: false };
      }

      const match = await bcrypt.compare(password, row.passwordHash);
      if (!match) {
        return { success: false };
      }

      return {
        success: true,
        role: row.role,
        username: row.username,
      };

    } catch (err) {
      console.error('Error loginUser:', err);
      return { success: false };
    }
  }

  // === LISTAR USUARIOS ===
  static async getUsers(): Promise<User[]> {
    try {
      const rows = db.prepare('SELECT id, username, role FROM users').all() as DBUser[];

      // Mapeamos a la interfaz "User"
      const userList: User[] = rows.map(r => ({
        id: r.id,
        username: r.username,
        role: r.role,
      }));
      return userList;

    } catch (err) {
      console.error('Error getUsers:', err);
      return [];
    }
  }

  // === CREAR USUARIO ===
  static async createUser(newUser: User): Promise<{ success: boolean }> {
    try {
      const rawPassword = newUser.password || '123456'; // Password por defecto
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      db.prepare(`
        INSERT INTO users (username, passwordHash, role)
        VALUES (?, ?, ?)
      `).run(
        newUser.username,
        passwordHash,
        newUser.role
      );

      return { success: true };

    } catch (err) {
      console.error('Error createUser:', err);
      return { success: false };
    }
  }

  // === ACTUALIZAR USUARIO ===
  static async updateUser(user: User & { id: number }): Promise<{ success: boolean }> {
    try {
      let setClause = 'username = ?, role = ?';
      const values: Array<string | number> = [user.username, user.role];

      // Si el usuario quiere actualizar la contraseña
      if (user.password) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        setClause += ', passwordHash = ?';
        values.push(passwordHash);
      }

      // Ejemplo si tu tabla tuviera "activo"
      // setClause += ', activo = ?';
      // values.push(user.activo ? 1 : 0);

      values.push(user.id); // Para el WHERE

      const sql = `
        UPDATE users
        SET ${setClause}
        WHERE id = ?
      `;
      db.prepare(sql).run(...values);

      return { success: true };

    } catch (err) {
      console.error('Error updateUser:', err);
      return { success: false };
    }
  }

  // === ELIMINAR USUARIO (o Soft delete) ===
  static async deleteUser(id: number): Promise<{ success: boolean }> {
    try {
      // Ejemplo soft-delete:
      // db.prepare(`UPDATE users SET activo = 0 WHERE id = ?`).run(id);

      // Ejemplo DELETE definitivo:
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { success: true };

    } catch (err) {
      console.error('Error deleteUser:', err);
      return { success: false };
    }
  }
}
