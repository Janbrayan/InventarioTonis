// electron/main/services/UserService.ts
import db from '../db';
import bcrypt from 'bcrypt';

interface DBUser {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  // ejemplo: activo: number;
}

export interface LoginUserResult {
  success: boolean;
  role?: string;
  username?: string;
}

interface User {
  id?: number;
  username: string;
  password?: string; // para creaciones/ediciones
  role: string;
  // activo?: boolean; // si lo necesitas
}

export class UserService {
  /**
   * Inicia sesión: verifica usuario/contraseña y retorna datos básicos.
   */
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
    } catch (error) {
      console.error('Error loginUser:', error);
      return { success: false };
    }
  }

  /**
   * Obtiene una lista de todos los usuarios (oculta el passwordHash).
   */
  static async getUsers(): Promise<User[]> {
    try {
      const rows = db.prepare(`
        SELECT id, username, role
        FROM users
      `).all() as DBUser[];

      return rows.map((r) => ({
        id: r.id,
        username: r.username,
        role: r.role,
      }));
    } catch (error) {
      console.error('Error getUsers:', error);
      return [];
    }
  }

  /**
   * Crea un nuevo usuario con un password por defecto si no se provee.
   */
  static async createUser(newUser: User): Promise<{ success: boolean }> {
    try {
      const rawPassword = newUser.password || '123456';
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
    } catch (error) {
      console.error('Error createUser:', error);
      return { success: false };
    }
  }

  /**
   * Actualiza los datos de un usuario (username, role y opcionalmente el password).
   */
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

      values.push(user.id); // ID para el WHERE
      const sql = `
        UPDATE users
        SET ${setClause}
        WHERE id = ?
      `;
      db.prepare(sql).run(...values);

      return { success: true };
    } catch (error) {
      console.error('Error updateUser:', error);
      return { success: false };
    }
  }

  /**
   * Elimina un usuario por su ID.
   * Puedes cambiar a "soft delete" si prefieres no borrarlo físicamente.
   */
  static async deleteUser(id: number): Promise<{ success: boolean }> {
    try {
      // Ejemplo soft-delete:
      // db.prepare(`UPDATE users SET activo = 0 WHERE id = ?`).run(id);

      // DELETE definitivo:
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleteUser:', error);
      return { success: false };
    }
  }
}
