// electron/main/services/StatsService.ts
import db from '../db';

export class StatsService {
  /**
   * 1) Total de COMPRAS en un periodo (suma de la columna "total" en purchases).
   *    - Filtra usando substr(fecha,1,10) entre fechaInicio y fechaFin.
   */
  static async getTotalComprasPorFecha(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<{ totalCompras: number }> {
    try {
      let sql = `SELECT SUM(total) as total FROM purchases`;
      const params: any[] = [];

      const startDate = fechaInicio && fechaInicio.trim() !== '' ? fechaInicio.trim() : undefined;
      const endDate = fechaFin && fechaFin.trim() !== '' ? fechaFin.trim() : undefined;

      if (startDate && endDate) {
        sql += ` WHERE substr(fecha,1,10) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      } else if (startDate) {
        sql += ` WHERE substr(fecha,1,10) >= ?`;
        params.push(startDate);
      } else if (endDate) {
        sql += ` WHERE substr(fecha,1,10) <= ?`;
        params.push(endDate);
      }

      const row = db.prepare(sql).get(...params) as { total: number } | undefined;
      return { totalCompras: row?.total ?? 0 };
    } catch (error) {
      console.error('Error getTotalComprasPorFecha:', error);
      return { totalCompras: 0 };
    }
  }

  /**
   * 2) Compras por PROVEEDOR:
   */
  static async getComprasPorProveedor(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<Array<{ proveedorId: number; nombreProveedor: string; totalCompras: number }>> {
    try {
      let sql = `
        SELECT 
          p.id as proveedorId,
          p.nombre as nombreProveedor,
          IFNULL(SUM(pc.total), 0) as totalCompras
        FROM providers p
        LEFT JOIN purchases pc ON pc.proveedorId = p.id
      `;
      const conditions: string[] = [];
      const params: any[] = [];

      const startDate = fechaInicio && fechaInicio.trim() !== '' ? fechaInicio.trim() : undefined;
      const endDate = fechaFin && fechaFin.trim() !== '' ? fechaFin.trim() : undefined;

      if (startDate && endDate) {
        conditions.push(`substr(pc.fecha,1,10) BETWEEN ? AND ?`);
        params.push(startDate, endDate);
      } else if (startDate) {
        conditions.push(`substr(pc.fecha,1,10) >= ?`);
        params.push(startDate);
      } else if (endDate) {
        conditions.push(`substr(pc.fecha,1,10) <= ?`);
        params.push(endDate);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` GROUP BY p.id ORDER BY totalCompras DESC`;

      const rows = db.prepare(sql).all(...params) as Array<{
        proveedorId: number;
        nombreProveedor: string;
        totalCompras: number;
      }>;

      return rows;
    } catch (error) {
      console.error('Error getComprasPorProveedor:', error);
      return [];
    }
  }

  /**
   * 3) Cantidad TOTAL de productos activos.
   */
  static async getTotalProductosActivos(): Promise<{ totalProductos: number }> {
    try {
      const row = db
        .prepare(`SELECT COUNT(*) as count FROM products WHERE activo = 1`)
        .get() as { count: number } | undefined;

      return { totalProductos: row?.count ?? 0 };
    } catch (error) {
      console.error('Error getTotalProductosActivos:', error);
      return { totalProductos: 0 };
    }
  }

  /**
   * 4) Inversión de compra POR producto:
   *    - Suma (cantidad * precioUnitario) en detail_compras.
   */
  static async getInversionCompraPorProducto(): Promise<
    Array<{
      productoId: number;
      nombreProducto: string;
      inversionTotal: number;
    }>
  > {
    try {
      const sql = `
        SELECT
          p.id as productoId,
          p.nombre as nombreProducto,
          IFNULL(SUM(dc.cantidad * dc.precioUnitario), 0) as inversionTotal
        FROM products p
        LEFT JOIN detail_compras dc ON dc.productoId = p.id
        LEFT JOIN purchases pr ON pr.id = dc.compraId
        GROUP BY p.id
        ORDER BY inversionTotal DESC
      `;
      const rows = db.prepare(sql).all() as Array<{
        productoId: number;
        nombreProducto: string;
        inversionTotal: number;
      }>;

      return rows;
    } catch (error) {
      console.error('Error getInversionCompraPorProducto:', error);
      return [];
    }
  }

  /**
   * 5) Valor TOTAL del inventario (precioCompra * cantidadActual).
   */
  static async getValorTotalInventario(): Promise<{ valorInventario: number }> {
    try {
      const sql = `
        SELECT 
          SUM(p.precioCompra * l.cantidadActual) as valor
        FROM lotes l
        JOIN products p ON p.id = l.productoId
        WHERE l.activo = 1
      `;
      const row = db.prepare(sql).get() as { valor: number } | undefined;

      return { valorInventario: row?.valor ?? 0 };
    } catch (error) {
      console.error('Error getValorTotalInventario:', error);
      return { valorInventario: 0 };
    }
  }

  /**
   * 6) STOCK ACTUAL por producto (suma de cantidadActual).
   */
  static async getStockActualPorProducto(): Promise<
    Array<{ productoId: number; nombreProducto: string; stockTotal: number }>
  > {
    try {
      const sql = `
        SELECT 
          l.productoId as productoId,
          p.nombre as nombreProducto,
          SUM(l.cantidadActual) as stockTotal
        FROM lotes l
        JOIN products p ON p.id = l.productoId
        WHERE l.activo = 1
        GROUP BY l.productoId
        ORDER BY stockTotal DESC
      `;
      const rows = db.prepare(sql).all() as Array<{
        productoId: number;
        nombreProducto: string;
        stockTotal: number;
      }>;

      return rows;
    } catch (error) {
      console.error('Error getStockActualPorProducto:', error);
      return [];
    }
  }

  /**
   * 7) Productos próximos a CADUCAR
   */
  static async getProductosProximosACaducar(
    dias = 30
  ): Promise<Array<{ productoId: number; nombreProducto: string; loteId: number; fechaCaducidad: string }>> {
    try {
      const sql = `
        SELECT
          l.id as loteId,
          l.productoId,
          p.nombre as nombreProducto,
          l.fechaCaducidad
        FROM lotes l
        JOIN products p ON p.id = l.productoId
        WHERE 
          l.activo = 1
          AND l.fechaCaducidad IS NOT NULL
          AND date(l.fechaCaducidad) <= date('now', ?)
        ORDER BY l.fechaCaducidad ASC
      `;
      const rows = db.prepare(sql).all(`+${dias} days`) as Array<{
        loteId: number;
        productoId: number;
        nombreProducto: string;
        fechaCaducidad: string;
      }>;

      return rows.map((r) => ({
        productoId: r.productoId,
        nombreProducto: r.nombreProducto,
        loteId: r.loteId,
        fechaCaducidad: r.fechaCaducidad,
      }));
    } catch (error) {
      console.error('Error getProductosProximosACaducar:', error);
      return [];
    }
  }

  /**
   * 8) Mermas/consumos internos agrupados por MOTIVO
   */
  static async getConsumosPorMotivo(): Promise<
    Array<{ motivo: string; totalConsumos: number; cantidadTotal: number }>
  > {
    try {
      const sql = `
        SELECT
          IFNULL(ci.motivo, 'SIN_MOTIVO') as motivo,
          COUNT(ci.id) as totalConsumos,
          SUM(ci.cantidad) as cantidadTotal
        FROM consumos_internos ci
        GROUP BY ci.motivo
        ORDER BY cantidadTotal DESC
      `;
      const rows = db.prepare(sql).all() as Array<{
        motivo: string;
        totalConsumos: number;
        cantidadTotal: number;
      }>;

      return rows;
    } catch (error) {
      console.error('Error getConsumosPorMotivo:', error);
      return [];
    }
  }

  /**
   * 9) Cantidad total de consumos/mermas en un rango de fechas
   */
  static async getCantidadTotalConsumos(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<{ totalConsumos: number }> {
    try {
      let sql = `SELECT SUM(cantidad) as total FROM consumos_internos`;
      const params: any[] = [];

      const startDate = fechaInicio && fechaInicio.trim() !== '' ? fechaInicio.trim() : undefined;
      const endDate = fechaFin && fechaFin.trim() !== '' ? fechaFin.trim() : undefined;

      if (startDate && endDate) {
        sql += ` WHERE substr(fecha,1,10) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      } else if (startDate) {
        sql += ` WHERE substr(fecha,1,10) >= ?`;
        params.push(startDate);
      } else if (endDate) {
        sql += ` WHERE substr(fecha,1,10) <= ?`;
        params.push(endDate);
      }

      const row = db.prepare(sql).get(...params) as { total: number } | undefined;
      return { totalConsumos: row?.total ?? 0 };
    } catch (error) {
      console.error('Error getCantidadTotalConsumos:', error);
      return { totalConsumos: 0 };
    }
  }

  /**
   * 10) Distribución de productos por CATEGORÍA
   */
  static async getDistribucionProductosPorCategoria(): Promise<
    Array<{ categoriaId: number; nombreCategoria: string; totalProductos: number }>
  > {
    try {
      const sql = `
        SELECT
          c.id as categoriaId,
          c.nombre as nombreCategoria,
          COUNT(p.id) as totalProductos
        FROM categories c
        LEFT JOIN products p ON p.categoriaId = c.id
        GROUP BY c.id
        ORDER BY totalProductos DESC
      `;
      const rows = db.prepare(sql).all() as Array<{
        categoriaId: number;
        nombreCategoria: string;
        totalProductos: number;
      }>;

      return rows;
    } catch (error) {
      console.error('Error getDistribucionProductosPorCategoria:', error);
      return [];
    }
  }

  /**
   * 11) Número de categorías activas vs. inactivas
   */
  static async getNumCategoriasActivasInactivas(): Promise<{
    categoriasActivas: number;
    categoriasInactivas: number;
  }> {
    try {
      const rowActivas = db
        .prepare(`SELECT COUNT(*) as count FROM categories WHERE activo = 1`)
        .get() as { count: number };
      const rowInactivas = db
        .prepare(`SELECT COUNT(*) as count FROM categories WHERE activo = 0`)
        .get() as { count: number };

      return {
        categoriasActivas: rowActivas.count,
        categoriasInactivas: rowInactivas.count,
      };
    } catch (error) {
      console.error('Error getNumCategoriasActivasInactivas:', error);
      return { categoriasActivas: 0, categoriasInactivas: 0 };
    }
  }

  /**
   * 12) (NUEVO) Total de piezas en el inventario:
   *     - Suma la columna 'cantidadActual' de lotes (solo lotes activos).
   */
  static async getTotalPiezasInventario(): Promise<{ totalPiezas: number }> {
    try {
      const row = db.prepare(`
        SELECT SUM(l.cantidadActual) as total
        FROM lotes l
        WHERE l.activo = 1
      `).get() as { total: number } | undefined;

      return { totalPiezas: row?.total ?? 0 };
    } catch (error) {
      console.error('Error getTotalPiezasInventario:', error);
      return { totalPiezas: 0 };
    }
  }
}
