// electron/main/services/LoteService.ts
import db from '../db';

interface DBLote {
  id: number;
  productoId: number;
  detalleCompraId?: number;
  lote: string | null;
  fechaCaducidad: string | null;
  cantidadActual: number;
  activo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lote {
  id?: number;
  productoId: number;
  detalleCompraId?: number;
  lote?: string;
  fechaCaducidad?: string;
  cantidadActual?: number;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class LoteService {
  /**
   * Obtiene la lista completa de lotes.
   */
  static async getLotes(): Promise<Lote[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, productoId, detalleCompraId, lote,
          fechaCaducidad, cantidadActual, activo,
          createdAt, updatedAt
        FROM lotes
      `).all() as DBLote[];

      return rows.map((r) => ({
        id: r.id,
        productoId: r.productoId,
        detalleCompraId: r.detalleCompraId || undefined,
        lote: r.lote || undefined,
        fechaCaducidad: r.fechaCaducidad || undefined,
        cantidadActual: r.cantidadActual,
        activo: !!r.activo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      console.error('Error getLotes:', error);
      return [];
    }
  }

  /**
   * Crea un nuevo lote.
   */
  static async createLote(l: Lote): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO lotes
          (productoId, detalleCompraId, lote, fechaCaducidad,
           cantidadActual, activo, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        l.productoId,
        l.detalleCompraId ?? null,
        l.lote ?? null,
        l.fechaCaducidad ?? null,
        l.cantidadActual ?? 0,
        l.activo === false ? 0 : 1,
        now,
        now
      );
      return { success: true };
    } catch (error) {
      console.error('Error createLote:', error);
      return { success: false };
    }
  }

  /**
   * Actualiza un lote existente.
   */
  static async updateLote(l: Lote & { id: number }): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE lotes
        SET
          detalleCompraId = ?,
          lote = ?,
          fechaCaducidad = ?,
          cantidadActual = ?,
          activo = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(
        l.detalleCompraId ?? null,
        l.lote ?? null,
        l.fechaCaducidad ?? null,
        l.cantidadActual ?? 0,
        l.activo === false ? 0 : 1,
        now,
        l.id
      );
      return { success: true };
    } catch (error) {
      console.error('Error updateLote:', error);
      return { success: false };
    }
  }

  /**
   * Elimina un lote por su ID.
   */
  static async deleteLote(id: number): Promise<{ success: boolean }> {
    try {
      db.prepare('DELETE FROM lotes WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleteLote:', error);
      return { success: false };
    }
  }
}
