// electron/main/services/SalesService.ts
import db from '../db';

/** Interfaz del encabezado de la Venta */
export interface Sale {
  id?: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  detalles?: DetalleVenta[];
}

/** Interfaz del detalle de la Venta */
export interface DetalleVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  cantidad: number;           // Nº de cajas/paquetes/unidades vendidas
  precioUnitario: number;
  subtotal?: number;
  lote?: string;              // si quieres enlazar a un Lote en particular
  fechaCaducidad?: string;

  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
  piezasVendidas?: number;    // total de piezas que realmente se venden
}

/** Interfaz para la fila del Lote 
 * (solo las propiedades que uses en el descuento) */
interface DBLoteRow {
  id: number;
  cantidadActual: number; 
  // si gustas, agrega activo, lote, fechaCaducidad, etc.
}

export class SalesService {

  /** Listar Ventas (encabezado) */
  static async getSales(): Promise<Sale[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, fecha, total, observaciones,
          createdAt, updatedAt
        FROM sales
      `).all();

      return rows.map((r: any) => ({
        id: r.id,
        fecha: r.fecha,
        total: r.total,
        observaciones: r.observaciones || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (error) {
      console.error('Error getSales:', error);
      return [];
    }
  }

  /** Crear Venta (encabezado + detalles) + descontar lotes */
  static async createSale(sale: Sale): Promise<{ success: boolean }> {
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      // 1) Insertar encabezado en "sales"
      const result = db.prepare(`
        INSERT INTO sales (fecha, total, observaciones, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        sale.fecha ?? now,
        sale.total ?? 0,
        sale.observaciones ?? null,
        now,
        now
      );
      const ventaId = result.lastInsertRowid as number;

      // 2) Insertar detalles en "detail_ventas"
      if (sale.detalles && sale.detalles.length > 0) {
        const stmtDetalle = db.prepare(`
          INSERT INTO detail_ventas
            (ventaId, productoId, cantidad, precioUnitario, subtotal,
             tipoContenedor, unidadesPorContenedor, piezasVendidas,
             lote, fechaCaducidad,
             createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of sale.detalles) {
          // Calculamos subtotal
          let sub = det.cantidad * det.precioUnitario;
          if (det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            sub = det.cantidad * upc * det.precioUnitario;
          }
          // Si "caja" también multiplica por upc, agrégalo:
          // else if (det.tipoContenedor === 'caja') { ... }

          // piezasVendidas
          let piezas = det.cantidad;
          if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            piezas = det.cantidad * upc;
          }

          stmtDetalle.run(
            ventaId,
            det.productoId,
            det.cantidad,
            det.precioUnitario,
            sub,
            det.tipoContenedor ?? null,
            det.unidadesPorContenedor ?? 1,
            piezas,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            now,
            now
          );
        }
      }

      // 3) Descontar inventario en "lotes"
      if (sale.detalles && sale.detalles.length > 0) {
        for (const det of sale.detalles) {
          let piezas = det.cantidad;
          if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            piezas = det.cantidad * upc;
          }

          // Ejemplo simple: descuenta del PRIMER LOTE con stock (orden ASC)
          let toDiscount = piezas;
          while (toDiscount > 0) {

            const loteRow = db.prepare(`
              SELECT *
              FROM lotes
              WHERE productoId = ?
                AND activo = 1
                AND cantidadActual > 0
              ORDER BY id ASC
              LIMIT 1
            `).get(det.productoId) as DBLoteRow | undefined;
            // ^ AQUI indicamos que el resultado coincide con DBLoteRow

            if (!loteRow) {
              // No hay más lotes con stock
              break;
            }

            const canUse = loteRow.cantidadActual;
            let used = 0;
            if (canUse >= toDiscount) {
              used = toDiscount;
            } else {
              used = canUse;
            }

            const newQty = canUse - used;
            db.prepare(`
              UPDATE lotes
              SET cantidadActual = ?
              WHERE id = ?
            `).run(newQty, loteRow.id);

            toDiscount -= used;
          }
        }
      }
    });

    try {
      tx();
      return { success: true };
    } catch (error) {
      console.error('Error createSale:', error);
      return { success: false };
    }
  }

  /** Obtener detalles de una venta */
  static async getDetallesByVentaId(ventaId: number): Promise<DetalleVenta[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, ventaId, productoId, cantidad, precioUnitario, subtotal,
          tipoContenedor, unidadesPorContenedor, piezasVendidas,
          lote, fechaCaducidad,
          createdAt, updatedAt
        FROM detail_ventas
        WHERE ventaId = ?
      `).all(ventaId);

      return rows.map((r: any) => ({
        id: r.id,
        ventaId: r.ventaId,
        productoId: r.productoId,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        subtotal: r.subtotal,
        tipoContenedor: r.tipoContenedor ?? undefined,
        unidadesPorContenedor: r.unidadesPorContenedor ?? undefined,
        piezasVendidas: r.piezasVendidas ?? undefined,
        lote: r.lote ?? undefined,
        fechaCaducidad: r.fechaCaducidad ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (error) {
      console.error('Error getDetallesByVentaId:', error);
      return [];
    }
  }
}
