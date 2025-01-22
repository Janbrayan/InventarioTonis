// electron/main/services/CategoryService.ts
import db from '../db';

interface DBCategory {
  id: number;
  nombre: string;
  activo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: number;
  nombre: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class CategoryService {
  /**
   * Obtiene la lista de categorías.
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const rows = db.prepare(`
        SELECT id, nombre, activo, createdAt, updatedAt
        FROM categories
      `).all() as DBCategory[];

      return rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        activo: !!r.activo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      console.error('Error getCategories:', error);
      return [];
    }
  }

  /**
   * Crea una nueva categoría.
   */
  static async createCategory(cat: Category): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO categories (nombre, activo, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run(
        cat.nombre,
        cat.activo === false ? 0 : 1,
        now,
        now
      );
      return { success: true };
    } catch (error) {
      console.error('Error createCategory:', error);
      return { success: false };
    }
  }

  /**
   * Actualiza los datos de una categoría existente.
   */
  static async updateCategory(cat: Category & { id: number }): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE categories
        SET nombre = ?, activo = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        cat.nombre,
        cat.activo === false ? 0 : 1,
        now,
        cat.id
      );
      return { success: true };
    } catch (error) {
      console.error('Error updateCategory:', error);
      return { success: false };
    }
  }

  /**
   * Elimina una categoría por su ID.
   */
  static async deleteCategory(id: number): Promise<{ success: boolean }> {
    try {
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleteCategory:', error);
      return { success: false };
    }
  }
}
