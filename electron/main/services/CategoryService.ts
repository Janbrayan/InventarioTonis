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

  static async getCategories(): Promise<Category[]> {
    try {
      const rows = db.prepare(`
        SELECT id, nombre, activo, createdAt, updatedAt
        FROM categories
      `).all() as DBCategory[];

      return rows.map(r => ({
        id: r.id,
        nombre: r.nombre,
        activo: !!r.activo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (err) {
      console.error('Error getCategories:', err);
      return [];
    }
  }

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
    } catch (err) {
      console.error('Error createCategory:', err);
      return { success: false };
    }
  }

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
    } catch (err) {
      console.error('Error updateCategory:', err);
      return { success: false };
    }
  }

  static async deleteCategory(id: number): Promise<{ success: boolean }> {
    try {
      // Borrado total:
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);

      return { success: true };
    } catch (err) {
      console.error('Error deleteCategory:', err);
      return { success: false };
    }
  }
}
