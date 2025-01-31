// electron/main/services/SalesService.ts

import db from '../db';
import { getHoraLocalCDMX } from '../utils/dateUtils';

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
  cantidad: number;           // Nº de contenedores (cajas/paquetes/unidades)

  // ============== Campos para manejo de precio y descuento =============
  descuentoManualFijo?: number;  // Lo que el front envía (0 si no hay descuento)
  precioUnitario: number;        // Se recalculará en el service
  subtotal?: number;

  lote?: string;                 // Para enlazar con un Lote específico si gustas
  fechaCaducidad?: string;

  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number; // Cuántas unidades lleva cada caja o paquete
  piezasVendidas?: number;        // total de piezas vendidas (se calcula)
}

/**
 * Interfaz para la fila del Lote (para FEFO).
 * Usada al descontar stock en 'lotes' y para obtener la caducidad.
 */
interface DBLoteRow {
  id: number;
  cantidadActual: number;
  fechaCaducidad: string | null; // puede ser null en la BD
  // ... si gustas, agrega más campos
}

/**
 * Interfaz para la fila que solo devuelve 'fechaCaducidad'
 * en getEarliestLotExpiration (línea del SELECT).
 */
interface LoteExpDateRow {
  fechaCaducidad: string | null;
}

export class SalesService {
  /** =========================================================
   *  1) OBTENER LOT CON CADUCIDAD PRÓXIMA
   *  =========================================================
   *  Retorna la fecha de caducidad más próxima (YYYY-MM-DD) de los lotes
   *  activos, con stock > 0 y fechaCaducidad no nula,
   *  o null si no hay ninguno.
   */
  static async getEarliestLotExpiration(productId: number): Promise<string | null> {
    try {
      // Hacemos un cast a LoteExpDateRow | undefined
      const row = db.prepare(`
        SELECT fechaCaducidad
        FROM lotes
        WHERE productoId = ?
          AND activo = 1
          AND cantidadActual > 0
          AND fechaCaducidad IS NOT NULL
        ORDER BY fechaCaducidad ASC
        LIMIT 1
      `).get(productId) as LoteExpDateRow | undefined;

      // Verificamos si hay fila y si la fechaCaducidad no es nula
      if (!row || !row.fechaCaducidad) {
        return null;
      }
      // row.fechaCaducidad podría venir como "YYYY-MM-DD" o "YYYY-MM-DD HH:mm:ss"
      return row.fechaCaducidad.substring(0, 10); // solo "YYYY-MM-DD"
    } catch (error) {
      console.error('Error getEarliestLotExpiration:', error);
      return null;
    }
  }

  /** =========================================================
   *  2) LISTAR TODAS LAS VENTAS
   *  ========================================================= */
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

  /** =========================================================
   *  3) LISTAR VENTAS DEL DÍA (HORA LOCAL)
   *  ========================================================= */
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

  /** =========================================================
   *  4) CREAR VENTA + DESCONTAR STOCK (FEFO)
   *  =========================================================
   *  - precioLista se toma de `products.precioVenta`
   *  - descuentoManualFijo viene en `sale.detalles[x].descuentoManualFijo` (0 si no hay)
   *  - precioUnitario = precioLista - descuentoManualFijo
   */
  static async createSale(sale: Sale): Promise<{ success: boolean; message?: string }> {
    // Hora local de México
    const now = getHoraLocalCDMX();

    // ========= (A) Verificación previa de stock =========
    if (sale.detalles && sale.detalles.length > 0) {
      for (const det of sale.detalles) {
        // Calculamos cuántas “piezas” reales requiere este renglón
        let piezasRequeridas = det.cantidad;
        if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
          const upc = det.unidadesPorContenedor ?? 1;
          piezasRequeridas = det.cantidad * upc;
        }

        // Consultamos el stock total disponible en lotes activos
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

    // ========== (B) Transacción para insertar venta y descontar lotes ==========
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
            (ventaId, productoId, cantidad,
             precioLista, descuentoManualFijo, precioUnitario, subtotal,
             tipoContenedor, unidadesPorContenedor, piezasVendidas,
             lote, fechaCaducidad,
             createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of sale.detalles) {
          // 2.1) Obtener el precioVenta actual => precioLista
          const productRow = db.prepare(`
            SELECT precioVenta
            FROM products
            WHERE id = ?
          `).get(det.productoId) as { precioVenta: number } | undefined;

          const precioLista = productRow?.precioVenta ?? 0;

          // 2.2) Tomar descuentoManualFijo del "det" (0 si no existe)
          const descMan = det.descuentoManualFijo ?? 0;

          // 2.3) Calcular precioUnit = precioLista - descMan
          const precioUnit = precioLista - descMan;

          // 2.4) Subtotal (considerando cajas/paquetes)
          let sub = det.cantidad * precioUnit;
          if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            sub = det.cantidad * upc * precioUnit;
          }

          // 2.5) PiezasVendidas (reales)
          let piezas = det.cantidad;
          if (det.tipoContenedor === 'caja' || det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            piezas = det.cantidad * upc;
          }

          stmtDetalle.run(
            ventaId,
            det.productoId,
            det.cantidad,
            precioLista,
            descMan,
            precioUnit,
            sub,
            det.tipoContenedor ?? null,
            det.unidadesPorContenedor ?? 1,
            piezas,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            now, // createdAt
            now  // updatedAt
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

          // FEFO: ordenamos por fechaCaducidad ASC, luego id ASC
          while (toDiscount > 0) {
            // Cast a DBLoteRow para que TS entienda fechaCaducidad, cantidadActual, etc.
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
      return { success: false, message: error.message };
    }
  }

  /** =========================================================
   *  5) OBTENER DETALLES DE VENTA (detail_ventas)
   *  ========================================================= */
  static async getDetallesByVentaId(ventaId: number): Promise<DetalleVenta[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, ventaId, productoId, cantidad,
          precioLista, descuentoManualFijo,
          precioUnitario, subtotal,
          tipoContenedor, unidadesPorContenedor, piezasVendidas,
          lote, fechaCaducidad,
          createdAt, updatedAt
        FROM detail_ventas
        WHERE ventaId = ?
      `).all(ventaId);

      // Mapeamos el resultado para encajar con la interfaz DetalleVenta
      return rows.map((r: any) => ({
        id: r.id,
        ventaId: r.ventaId,
        productoId: r.productoId,
        cantidad: r.cantidad,

        // Nuevos campos
        precioLista: r.precioLista,
        descuentoManualFijo: r.descuentoManualFijo,
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
