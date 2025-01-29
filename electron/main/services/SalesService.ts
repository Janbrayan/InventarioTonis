// electron/main/services/SalesService.ts
import db from '../db';
import { getHoraLocalCDMX } from '../utils/dateUtils'; // <-- Importamos la función

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

/**
 * Interfaz para la fila del Lote (solo las propiedades que uses).
 * Para FEFO, necesitamos al menos `fechaCaducidad` y `cantidadActual`.
 */
interface DBLoteRow {
  id: number;
  cantidadActual: number;
  fechaCaducidad: string | null;
  // ... si gustas, agrega más campos como "activo", "lote", etc.
}

export class SalesService {
  /** Listar todas las ventas (encabezado). */
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

  /**
   * (NUEVO) Listar solo las ventas **del día** (hora local).
   * Filtra usando `substr(fecha,1,10) = date('now','localtime')`
   * asumiendo `fecha` es tipo "YYYY-MM-DD HH:mm:ss".
   */
  static async getSalesToday(): Promise<Sale[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, fecha, total, observaciones,
          createdAt, updatedAt
        FROM sales
        WHERE substr(fecha,1,10) = date('now','localtime')
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
      console.error('Error getSalesToday:', error);
      return [];
    }
  }

  /**
   * Crear Venta (encabezado + detalles) + descontar lotes (FEFO),
   * con verificación previa de stock para impedir venta si no hay existencias suficientes.
   */
  static async createSale(sale: Sale): Promise<{ success: boolean; message?: string }> {
    // Hora local de México
    const now = getHoraLocalCDMX();

    // =================== (NUEVO) Verificación previa de stock ===================
    if (sale.detalles && sale.detalles.length > 0) {
      for (const det of sale.detalles) {
        // Calculamos cuántas “piezas” reales requiere este renglón
        let piezasRequeridas = det.cantidad;
        if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
          const upc = det.unidadesPorContenedor ?? 1;
          piezasRequeridas = det.cantidad * upc;
        }

        // Consultamos el stock total disponible en lotes activos para este producto
        const stockRow = db.prepare(`
          SELECT IFNULL(SUM(cantidadActual), 0) AS totalStock
          FROM lotes
          WHERE productoId = ?
            AND activo = 1
            AND cantidadActual > 0
        `).get(det.productoId) as { totalStock: number } | undefined;

        const stockDisponible = stockRow?.totalStock ?? 0;

        // Si NO alcanza el stock, lanzamos un error para interrumpir la transacción
        if (piezasRequeridas > stockDisponible) {
          throw new Error(
            `No hay stock suficiente para producto #${det.productoId}. ` +
            `Requerido: ${piezasRequeridas}, disponible: ${stockDisponible}`
          );
        }
      }
    }
    // =========================================================================

    const tx = db.transaction(() => {
      // 1) Insertar encabezado en 'sales'
      const fechaVenta = sale.fecha ?? now;
      const result = db.prepare(`
        INSERT INTO sales (fecha, total, observaciones, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        fechaVenta,
        sale.total ?? 0,
        sale.observaciones ?? null,
        now,
        now
      );
      const ventaId = result.lastInsertRowid as number;

      // 2) Insertar detalles en 'detail_ventas'
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
          // Subtotal según contenedores (ejemplo con 'paquete')
          let sub = det.cantidad * det.precioUnitario;
          if (det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            sub = det.cantidad * upc * det.precioUnitario;
          }
          // Si manejas 'caja', haz algo similar

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
            now,  // createdAt
            now   // updatedAt
          );
        }
      }

      // 3) Descontar inventario en 'lotes' según FEFO (fecha más próxima).
      if (sale.detalles && sale.detalles.length > 0) {
        for (const det of sale.detalles) {
          let piezas = det.cantidad;
          if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            piezas = det.cantidad * upc;
          }

          let toDiscount = piezas;

          // FEFO: ordenamos por fechaCaducidad ASC, luego id
          while (toDiscount > 0) {
            const loteRow = db.prepare(`
              SELECT
                id,
                cantidadActual,
                fechaCaducidad
              FROM lotes
              WHERE productoId = ?
                AND activo = 1
                AND cantidadActual > 0
              ORDER BY
                CASE WHEN fechaCaducidad IS NULL THEN 999999999 END,
                fechaCaducidad ASC,
                id ASC
              LIMIT 1
            `).get(det.productoId) as DBLoteRow | undefined;

            if (!loteRow) {
              // No hay más lotes con stock => salimos
              break;
            }

            const canUse = loteRow.cantidadActual;
            const used = Math.min(canUse, toDiscount);
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
      tx(); // Ejecutamos la transacción
      return { success: true };
    } catch (error: any) {
      console.error('Error createSale:', error);
      // Retornamos un mensaje de error para poder mostrarlo en el front si se desea
      return { success: false, message: error.message };
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
