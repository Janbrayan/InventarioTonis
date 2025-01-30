// electron/main/services/HistorialVentasService.ts

import db from '../db';

interface DBHistorialVenta {
  id: number;
  total: number;
  observaciones: string | null;
  createdAt: string;  // Se usa para filtrar
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
  productName?: string;   // para mostrar el nombre de producto
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Estructura básica para un producto sin ventas en un rango. */
export interface ProductoSinVentas {
  productoId: number;
  nombre: string;
  codigoBarras?: string;
  precioVenta?: number;
}

/**
 * Servicio de Historial de Ventas, con métodos para:
 * - listar ventas
 * - filtrar por rango
 * - obtener detalles (solo productos vendidos) de una venta
 * - obtener productos sin ventas (rango de fechas)
 */
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
          // Últimos 30 días
          whereClauses.push(`DATE(createdAt) >= DATE('now', '-30 days')`);
          break;
        case 'all':
          // Sin filtro
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
   * usando la tabla detail_ventas + JOIN products.
   * => MUESTRA SOLO LOS PRODUCTOS VENDIDOS en esa venta.
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
        productName: r.productName,
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

  /**
   * Retorna la lista de productos que NO registraron ventas
   * en el rango [desde, hasta] (filtrando por detail_ventas.createdAt).
   * => LEFT JOIN + GROUP BY => los que suman 0 => no se vendieron.
   */
  static async getProductosNoVendidos(
    desde: string,
    hasta: string
  ): Promise<ProductoSinVentas[]> {
    try {
      const rows = db.prepare(`
        SELECT
          p.id AS productoId,
          p.nombre AS nombre,
          p.codigoBarras AS codigoBarras,
          p.precioVenta AS precioVenta,
          SUM(IFNULL(dv.cantidad, 0)) AS totalVendida
        FROM products p
        LEFT JOIN detail_ventas dv
          ON dv.productoId = p.id
          AND dv.createdAt >= ?
          AND dv.createdAt <= ?
        GROUP BY p.id
        HAVING totalVendida = 0
      `).all(desde, hasta);

      return rows.map((r: any) => ({
        productoId: r.productoId,
        nombre: r.nombre,
        codigoBarras: r.codigoBarras || undefined,
        precioVenta: r.precioVenta != null ? Number(r.precioVenta) : undefined
      }));
    } catch (error) {
      console.error('Error getProductosNoVendidos:', error);
      return [];
    }
  }
}
