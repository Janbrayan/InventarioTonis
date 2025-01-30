// electron/main/services/HistorialVentasService.ts
import db from '../db';

interface DBHistorialVenta {
  id: number;
  total: number;
  observaciones: string | null;
  createdAt: string;  // Usaremos estos para filtrar
  updatedAt: string;
}

export interface HistorialVenta {
  id?: number;
  total?: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetalleHistorialVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class HistorialVentasService {
  /**
   * Retorna todas las ventas (usando createdAt como fecha de referencia).
   */
  static async getAllVentas(): Promise<HistorialVenta[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id,
          total,
          observaciones,
          createdAt,
          updatedAt
        FROM sales
        ORDER BY id DESC
      `).all() as DBHistorialVenta[];

      return rows.map((r) => ({
        id: r.id,
        total: r.total,
        observaciones: r.observaciones || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (error) {
      console.error('Error getAllVentas:', error);
      return [];
    }
  }

  /**
   * Retorna las ventas según un rango: 'day', 'week', 'month', 'all',
   * filtrando por la columna `createdAt`.
   */
  static async getVentasByRange(
    range: 'day' | 'week' | 'month' | 'all'
  ): Promise<HistorialVenta[]> {
    try {
      let baseSql = `
        SELECT
          id,
          total,
          observaciones,
          createdAt,
          updatedAt
        FROM sales
      `;
      const whereClauses: string[] = [];

      // Filtramos la columna "createdAt".
      switch (range) {
        case 'day':
          // Ventas creadas HOY
          whereClauses.push(`DATE(createdAt) = DATE('now')`);
          break;
        case 'week':
          // Últimos 7 días
          whereClauses.push(`DATE(createdAt) >= DATE('now', '-7 days')`);
          break;
        case 'month':
          // Últimos 30 días (o podrías usar 'start of month')
          whereClauses.push(`DATE(createdAt) >= DATE('now', '-30 days')`);
          break;
        case 'all':
          // Sin filtro, regresamos todo
          break;
      }

      if (whereClauses.length > 0) {
        baseSql += ' WHERE ' + whereClauses.join(' AND ');
      }

      baseSql += ' ORDER BY id DESC';

      const rows = db.prepare(baseSql).all() as DBHistorialVenta[];

      return rows.map((r) => ({
        id: r.id,
        total: r.total,
        observaciones: r.observaciones || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (error) {
      console.error('Error getVentasByRange:', error);
      return [];
    }
  }

  /**
   * Retorna los detalles de una venta específica (por ventaId),
   * usando la tabla detail_ventas.
   */
  static async getDetallesByVentaId(ventaId: number): Promise<DetalleHistorialVenta[]> {
    try {
      const rows = db.prepare(`
        SELECT
          dv.id,
          dv.ventaId,
          dv.productoId,
          p.nombre AS productName,
          dv.cantidad,
          dv.precioUnitario,
          dv.subtotal,
          dv.createdAt,
          dv.updatedAt
        FROM detail_ventas dv
        JOIN products p ON p.id = dv.productoId
        WHERE dv.ventaId = ?
      `).all(ventaId);
  
      return rows.map((r: any) => ({
        id: r.id,
        ventaId: r.ventaId,
        productoId: r.productoId,
        productName: r.productName,  // <-- Aquí
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        subtotal: r.subtotal,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (error) {
      console.error('Error getDetallesByVentaId:', error);
      return [];
    }
  }
  
}
