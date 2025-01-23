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

/** Interfaz para el método de consumo interno */
export interface ConsumoData {
  loteId: number;
  cantidad: number;
  motivo?: string; // opcional
}

/** LoteService: Manejo CRUD de 'lotes' + método de 'consumo interno' */
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
   * Actualiza un lote existente (soft-delete incluido si 'activo=false').
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
   * Elimina un lote por su ID (borrado físico). Usar con cautela.
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

  /**
   * Registra un consumo interno (merma, muestras, etc.) para el lote,
   * insertando un registro en 'consumos_internos' y descontando stock.
   */
  static async descontarPorConsumo(data: ConsumoData): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();

      // 1) Insertar un registro en "consumos_internos"
      db.prepare(`
        INSERT INTO consumos_internos (loteId, cantidad, motivo, fecha, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.loteId,
        data.cantidad,
        data.motivo ?? null,
        now,      // fecha de consumo
        now,      // createdAt
        now       // updatedAt
      );

      // 2) Actualizar lotes: restar 'cantidadActual'
      db.prepare(`
        UPDATE lotes
        SET cantidadActual = cantidadActual - ?
        WHERE id = ?
      `).run(data.cantidad, data.loteId);

      // Opcionalmente, si llega a 0 => activo=0
      const row = db.prepare('SELECT cantidadActual FROM lotes WHERE id=?').get(data.loteId) as { cantidadActual: number } | undefined;
      if (row && row.cantidadActual <= 0) {
        db.prepare(`
          UPDATE lotes
          SET activo = 0
          WHERE id = ?
        `).run(data.loteId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error descontarPorConsumo:', error);
      return { success: false };
    }
  }
}
