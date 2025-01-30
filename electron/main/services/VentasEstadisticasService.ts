// src/electron/main/services/VentasEstadisticasService.ts
import db from '../db';

/** Estructuras para devolver resultados. */
export interface TopProducto {
  productoId: number;
  productName: string;
  cantidadVendida: number;
}

export interface ProductoMenosVendido {
  productoId: number;
  productName: string;
  cantidadVendida: number;
}

export interface CategoriaVenta {
  categoriaId: number;
  categoriaNombre: string;
  totalCategoria: number;
}

export interface VentaPorDia {
  dia: string;
  totalDia: number;
}

export class VentasEstadisticasService {
  /**
   * Retorna la SUMA de sales.total en el rango [desde, hasta].
   */
  static getTotalVentas(desde: string, hasta: string): number {
    // Definimos la forma de la fila que esperamos
    interface RowSuma { suma: number }

    const row = db.prepare(`
      SELECT IFNULL(SUM(total), 0) AS suma
      FROM sales
      WHERE createdAt >= ? AND createdAt <= ?
    `).get([desde, hasta]) as RowSuma | undefined;

    return row?.suma ?? 0;
  }

  /**
   * Retorna el COUNT de sales en el rango [desde, hasta].
   */
  static getNumVentas(desde: string, hasta: string): number {
    interface RowCount { numVentas: number }

    const row = db.prepare(`
      SELECT COUNT(*) AS numVentas
      FROM sales
      WHERE createdAt >= ? AND createdAt <= ?
    `).get([desde, hasta]) as RowCount | undefined;

    return row?.numVentas ?? 0;
  }

  /**
   * Devuelve un arreglo de los productos más vendidos (por cantidad),
   * en el rango [desde, hasta], con límite `limit`.
   */
  static getProductosMasVendidos(desde: string, hasta: string, limit = 5): TopProducto[] {
    interface RowTop {
      productoId: number;
      productName: string;
      cantidadVendida: number;
    }

    const rows = db.prepare(`
      SELECT
        dv.productoId,
        p.nombre AS productName,
        IFNULL(SUM(dv.cantidad), 0) AS cantidadVendida
      FROM detail_ventas dv
      JOIN sales s ON s.id = dv.ventaId
      JOIN products p ON p.id = dv.productoId
      WHERE s.createdAt >= ? AND s.createdAt <= ?
      GROUP BY dv.productoId
      ORDER BY cantidadVendida DESC
      LIMIT ?
    `).all([desde, hasta, limit]) as RowTop[];  // casteo a RowTop[]

    return rows.map(r => ({
      productoId: r.productoId,
      productName: r.productName,
      cantidadVendida: r.cantidadVendida,
    }));
  }

  /**
   * Devuelve un arreglo de los productos menos vendidos (por cantidad),
   * en el rango [desde, hasta], con límite `limit`.
   */
  static getProductosMenosVendidos(desde: string, hasta: string, limit = 5): ProductoMenosVendido[] {
    interface RowBottom {
      productoId: number;
      productName: string;
      cantidadVendida: number;
    }

    const rows = db.prepare(`
      SELECT
        dv.productoId,
        p.nombre AS productName,
        IFNULL(SUM(dv.cantidad), 0) AS cantidadVendida
      FROM detail_ventas dv
      JOIN sales s ON s.id = dv.ventaId
      JOIN products p ON p.id = dv.productoId
      WHERE s.createdAt >= ? AND s.createdAt <= ?
      GROUP BY dv.productoId
      ORDER BY cantidadVendida ASC
      LIMIT ?
    `).all([desde, hasta, limit]) as RowBottom[];

    return rows.map(r => ({
      productoId: r.productoId,
      productName: r.productName,
      cantidadVendida: r.cantidadVendida,
    }));
  }

  /**
   * Devuelve la suma de ventas por categoría en el rango [desde, hasta].
   */
  static getVentasPorCategoria(desde: string, hasta: string): CategoriaVenta[] {
    interface RowCat {
      categoriaId: number;
      categoriaNombre: string;
      totalCategoria: number;
    }

    const rows = db.prepare(`
      SELECT
        p.categoriaId AS categoriaId,
        c.nombre AS categoriaNombre,
        IFNULL(SUM(dv.subtotal), 0) AS totalCategoria
      FROM detail_ventas dv
      JOIN sales s ON s.id = dv.ventaId
      JOIN products p ON p.id = dv.productoId
      JOIN categories c ON c.id = p.categoriaId
      WHERE s.createdAt >= ? AND s.createdAt <= ?
      GROUP BY p.categoriaId
      ORDER BY totalCategoria DESC
    `).all([desde, hasta]) as RowCat[];

    return rows.map(r => ({
      categoriaId: r.categoriaId,
      categoriaNombre: r.categoriaNombre,
      totalCategoria: r.totalCategoria,
    }));
  }

  /**
   * Devuelve un arreglo con las ventas por día (DATE(s.createdAt)),
   * en el rango [desde, hasta].
   */
  static getVentasPorDia(desde: string, hasta: string): VentaPorDia[] {
    interface RowDia {
      dia: string;
      totalDia: number;
    }

    const rows = db.prepare(`
      SELECT
        DATE(s.createdAt) AS dia,
        IFNULL(SUM(s.total), 0) AS totalDia
      FROM sales s
      WHERE s.createdAt >= ? AND s.createdAt <= ?
      GROUP BY DATE(s.createdAt)
      ORDER BY dia
    `).all([desde, hasta]) as RowDia[];

    return rows.map(r => ({
      dia: r.dia,
      totalDia: r.totalDia,
    }));
  }

  /**
   * Calcula el ticket promedio (AVG(total)) en el rango [desde, hasta].
   */
  static getTicketPromedio(desde: string, hasta: string): number {
    interface RowAvg { ticketPromedio: number }

    const row = db.prepare(`
      SELECT AVG(total) AS ticketPromedio
      FROM sales
      WHERE createdAt >= ? AND createdAt <= ?
    `).get([desde, hasta]) as RowAvg | undefined;

    return row?.ticketPromedio ?? 0;
  }

  /**
   * Calcula la ganancia bruta (ingreso - costo) en el rango [desde, hasta].
   */
  static getGananciaBruta(desde: string, hasta: string): number {
    interface RowGan { ganancia: number }

    const row = db.prepare(`
      SELECT IFNULL(SUM(
        dv.cantidad * dv.precioUnitario 
        - dv.cantidad * p.precioCompra
      ), 0) AS ganancia
      FROM detail_ventas dv
      JOIN sales s ON s.id = dv.ventaId
      JOIN products p ON p.id = dv.productoId
      WHERE s.createdAt >= ? AND s.createdAt <= ?
    `).get([desde, hasta]) as RowGan | undefined;

    return row?.ganancia ?? 0;
  }
}
