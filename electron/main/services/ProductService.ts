// electron/main/services/ProductService.ts
import db from '../db';

interface DBProduct {
  id: number;
  nombre: string;
  categoriaId: number | null;
  precioCompra: number;
  precioVenta: number;
  codigoBarras: string | null;
  activo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id?: number;
  nombre: string;
  categoriaId?: number | null;
  precioCompra?: number;
  precioVenta?: number;
  codigoBarras?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class ProductService {
  /**
   * Obtiene la lista completa de productos.
   */
  static async getProducts(): Promise<Product[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, nombre, categoriaId, precioCompra, precioVenta,
          codigoBarras, activo, createdAt, updatedAt
        FROM products
      `).all() as DBProduct[];

      return rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        categoriaId: r.categoriaId,
        precioCompra: r.precioCompra,
        precioVenta: r.precioVenta,
        codigoBarras: r.codigoBarras ?? undefined,
        activo: !!r.activo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      console.error('Error getProducts:', error);
      return [];
    }
  }

  /**
   * Crea un nuevo producto.
   */
  static async createProduct(prod: Product): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO products
          (nombre, categoriaId, precioCompra, precioVenta, codigoBarras,
           activo, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        prod.nombre,
        prod.categoriaId ?? null,
        prod.precioCompra ?? 0,
        prod.precioVenta ?? 0,
        prod.codigoBarras ?? null,
        prod.activo === false ? 0 : 1,
        now,
        now
      );

      return { success: true };
    } catch (error) {
      console.error('Error createProduct:', error);
      return { success: false };
    }
  }

  /**
   * Actualiza un producto existente.
   */
  static async updateProduct(prod: Product & { id: number }): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE products
        SET
          nombre = ?,
          categoriaId = ?,
          precioCompra = ?,
          precioVenta = ?,
          codigoBarras = ?,
          activo = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(
        prod.nombre,
        prod.categoriaId ?? null,
        prod.precioCompra ?? 0,
        prod.precioVenta ?? 0,
        prod.codigoBarras ?? null,
        prod.activo === false ? 0 : 1,
        now,
        prod.id
      );

      return { success: true };
    } catch (error) {
      console.error('Error updateProduct:', error);
      return { success: false };
    }
  }

  /**
   * Elimina un producto por su ID.
   */
  static async deleteProduct(id: number): Promise<{ success: boolean }> {
    try {
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleteProduct:', error);
      return { success: false };
    }
  }
}
