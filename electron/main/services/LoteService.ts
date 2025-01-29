// electron/main/services/LoteService.ts
import db from '../db';
import { getHoraLocalCDMX } from '../utils/dateUtils';

/** Estructura interna de la tabla lotes en la BD */
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

/** Interfaz pública para manejar Lotes en la app */
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

/** Datos para registrar un consumo interno (merma) */
export interface ConsumoData {
  loteId: number;
  cantidad: number;
  motivo?: string; // opcional
}

/** Estructura para agrupar información de inventario */
export interface InventoryGroup {
  product: {
    id: number;
    nombre: string;
  };
  lotes: Lote[];
  totalLotes: number;
  totalPiezas: number;
}

/**
 * LoteService: Manejo CRUD de 'lotes' + métodos de inventario y consumo interno.
 */
export class LoteService {
  /**
   * Obtiene la lista completa de lotes (sin filtrar).
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
   * Crea un nuevo lote en la base de datos.
   */
  static async createLote(l: Lote): Promise<{ success: boolean }> {
    try {
      const now = getHoraLocalCDMX();
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
   * Actualiza un lote existente (soft-delete si 'activo=false').
   */
  static async updateLote(l: Lote & { id: number }): Promise<{ success: boolean }> {
    try {
      const now = getHoraLocalCDMX();
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
   * Elimina físicamente un lote por su ID (cuidado con esto).
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
   * Registra un consumo interno/merma en "consumos_internos" y descuenta el stock del lote.
   * Si el lote llega a 0, se marca como inactivo.
   */
  static async descontarPorConsumo(data: ConsumoData): Promise<{ success: boolean }> {
    try {
      const now = getHoraLocalCDMX();

      // 1) Insertar un registro en consumos_internos
      db.prepare(`
        INSERT INTO consumos_internos (loteId, cantidad, motivo, fecha, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.loteId,
        data.cantidad,
        data.motivo ?? null,
        now,
        now,
        now
      );

      // 2) Actualizar la cantidadActual en lotes
      db.prepare(`
        UPDATE lotes
        SET cantidadActual = cantidadActual - ?
        WHERE id = ?
      `).run(data.cantidad, data.loteId);

      // 3) Si llega a 0 o menos, lo desactivamos
      const row = db.prepare(`
        SELECT cantidadActual
        FROM lotes
        WHERE id = ?
      `).get(data.loteId) as { cantidadActual: number } | undefined;

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

  /**
   * (NUEVO) Retorna un listado de productos (id, nombre),
   * con sus lotes activos y el total de piezas agrupado,
   * para reutilizar la lógica sin depender del frontend.
   */
  static async getInventoryGrouped(): Promise<InventoryGroup[]> {
    try {
      // 1) Obtenemos la lista de productos
      const products = db.prepare(`
        SELECT id, nombre
        FROM products
      `).all() as Array<{ id: number; nombre: string }>;

      // 2) Obtenemos la lista de lotes (todos o filtra activo=1 si quieres)
      const dbLotes = db.prepare(`
        SELECT
          id, productoId, detalleCompraId, lote,
          fechaCaducidad, cantidadActual, activo,
          createdAt, updatedAt
        FROM lotes
      `).all() as DBLote[];

      // Convertimos each DBLote a Lote
      const lotes: Lote[] = dbLotes.map((r) => ({
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

      // 3) Agrupamos la data
      const result: InventoryGroup[] = products.map((prod) => {
        const lotesDeEsteProd = lotes.filter(
          (l) => l.productoId === prod.id && l.activo !== false
        );
        const totalLotes = lotesDeEsteProd.length;
        const totalPiezas = lotesDeEsteProd.reduce(
          (acc, lote) => acc + (lote.cantidadActual ?? 0),
          0
        );

        return {
          product: {
            id: prod.id,
            nombre: prod.nombre,
          },
          lotes: lotesDeEsteProd,
          totalLotes,
          totalPiezas,
        };
      });

      return result;
    } catch (error) {
      console.error('Error getInventoryGrouped:', error);
      return [];
    }
  }
}
