// electron/main/services/StatsService.ts
import db from '../db';

export class StatsService {
  /**
   * Retorna el total de ventas en un periodo, o la venta total de un producto, etc.
   * Este es un ejemplo genérico de "estadística" de Ventas.
   */
  static async getTotalVentasPorFecha(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<{ totalVentas: number }> {
    try {
      // Ejemplo: SELECT SUM(total) de la tabla `sales`
      // filtra por fecha (si proporcionas fechaInicio y fechaFin)
      let sql = `SELECT SUM(total) as total FROM sales`;
      const params: any[] = [];

      if (fechaInicio && fechaFin) {
        sql += ` WHERE date(fecha) BETWEEN date(?) AND date(?)`;
        params.push(fechaInicio, fechaFin);
      } else if (fechaInicio) {
        sql += ` WHERE date(fecha) >= date(?)`;
        params.push(fechaInicio);
      } else if (fechaFin) {
        sql += ` WHERE date(fecha) <= date(?)`;
        params.push(fechaFin);
      }

      const row = db.prepare(sql).get(...params) as { total: number } | undefined;
      return { totalVentas: row?.total ?? 0 };
    } catch (error) {
      console.error('Error getTotalVentasPorFecha:', error);
      return { totalVentas: 0 };
    }
  }

  /**
   * Ejemplo: Retorna cuántas unidades de X producto se han vendido en total.
   */
  static async getUnidadesVendidasProducto(productoId: number): Promise<{ totalVendidas: number }> {
    try {
      // Podrías consultar la tabla detail_ventas sumando "piezasVendidas"
      const row = db
        .prepare(
          `
            SELECT SUM(piezasVendidas) as total
            FROM detail_ventas
            WHERE productoId = ?
          `
        )
        .get(productoId) as { total: number } | undefined;

      return { totalVendidas: row?.total ?? 0 };
    } catch (error) {
      console.error('Error getUnidadesVendidasProducto:', error);
      return { totalVendidas: 0 };
    }
  }

  /**
   * Ejemplo: Retorna el costo total invertido (compras) en un rango de fechas.
   */
  static async getTotalComprasPorFecha(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<{ totalCompras: number }> {
    try {
      // Tabla `purchases`, sumamos la columna "total"
      let sql = `SELECT SUM(total) as total FROM purchases`;
      const params: any[] = [];

      if (fechaInicio && fechaFin) {
        sql += ` WHERE date(fecha) BETWEEN date(?) AND date(?)`;
        params.push(fechaInicio, fechaFin);
      } else if (fechaInicio) {
        sql += ` WHERE date(fecha) >= date(?)`;
        params.push(fechaInicio);
      } else if (fechaFin) {
        sql += ` WHERE date(fecha) <= date(?)`;
        params.push(fechaFin);
      }

      const row = db.prepare(sql).get(...params) as { total: number } | undefined;
      return { totalCompras: row?.total ?? 0 };
    } catch (error) {
      console.error('Error getTotalComprasPorFecha:', error);
      return { totalCompras: 0 };
    }
  }

  /**
   * Ejemplo: Los n productos más vendidos (por unidades).
   * - Se basa en detail_ventas => SUM(piezasVendidas) group by productoId
   */
  static async getTopProductosVendidos(limit = 5) {
    try {
      // Un ejemplo de query que agrupa las ventas
      const rows = db
        .prepare(
          `
          SELECT 
            dv.productoId as productoId,
            p.nombre as nombreProducto,
            SUM(dv.piezasVendidas) as totalVendidas
          FROM detail_ventas dv
          JOIN products p ON p.id = dv.productoId
          GROUP BY dv.productoId
          ORDER BY totalVendidas DESC
          LIMIT ?
        `
        )
        .all(limit);

      // Retornamos el array con { productoId, nombreProducto, totalVendidas }
      return rows || [];
    } catch (error) {
      console.error('Error getTopProductosVendidos:', error);
      return [];
    }
  }

  /**
   * Otro ejemplo: Ganancia bruta = Ventas - Costo
   * Podrías estimar el costo si guardaste precioCompra en cada venta/detalle
   * o si asumes "precioCompra" actual. 
   * Este ejemplo es un placeholder (debes ajustarlo).
   */
  static async getGananciaAproximada(): Promise<{ ganancia: number }> {
    try {
      // Escenario 1: Tienes un campo "costoUnitario" en detail_ventas
      // y "precioUnitario" => la ganancia es SUM(precioUnitario - costoUnitario)*cant
      // ...
      // Escenario 2: Tomas el total de la tabla sales y le restas total de purchases (sencillo).
      //  -> Ganancia = sum(ventas) - sum(compras)
      //  -> Ojo: no siempre exacto por el inventario en curso, etc.

      const ventasRow = db
        .prepare(`SELECT SUM(total) as sumVentas FROM sales`)
        .get() as { sumVentas: number } | undefined;
      const comprasRow = db
        .prepare(`SELECT SUM(total) as sumCompras FROM purchases`)
        .get() as { sumCompras: number } | undefined;

      const sumVentas = ventasRow?.sumVentas ?? 0;
      const sumCompras = comprasRow?.sumCompras ?? 0;
      const ganancia = sumVentas - sumCompras;

      return { ganancia };
    } catch (error) {
      console.error('Error getGananciaAproximada:', error);
      return { ganancia: 0 };
    }
  }
}
