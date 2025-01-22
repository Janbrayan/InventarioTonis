// electron/main/services/PurchaseService.ts
import db from '../db';

interface DBPurchase {
  id: number;
  proveedorId: number;
  fecha: string;
  total: number;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DBDetalleCompra {
  id: number;
  compraId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  lote: string | null;
  fechaCaducidad: string | null;
  // tipoContenedor?: string | null;        (Si lo definiste)
  // unidadesPorContenedor?: number | null;
  // piezasIngresadas?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interfaz que representa el encabezado de la compra
 * junto a los detalles que vienen desde el frontend.
 */
export interface Purchase {
  id?: number;
  proveedorId: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  detalles?: DetalleCompra[];
}

/**
 * Detalle de la compra, con los campos de contenedores.
 */
export interface DetalleCompra {
  id?: number;
  compraId?: number;
  productoId: number;
  cantidad: number;            // Cant. de cajas/paquetes/unidades
  precioUnitario: number;
  subtotal?: number;
  lote?: string;
  fechaCaducidad?: string;
  createdAt?: string;
  updatedAt?: string;

  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
  piezasIngresadas?: number;   // total de piezas resultantes
}

export class PurchaseService {
  /**
   * Obtiene todas las compras (encabezado).
   */
  static async getPurchases(): Promise<Purchase[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, proveedorId, fecha, total, observaciones,
          createdAt, updatedAt
        FROM purchases
      `).all() as DBPurchase[];

      return rows.map((r) => ({
        id: r.id,
        proveedorId: r.proveedorId,
        fecha: r.fecha,
        total: r.total,
        observaciones: r.observaciones || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      console.error('Error getPurchases:', error);
      return [];
    }
  }

  /**
   * Crea una compra (encabezado + detalles + lotes) en una transacción,
   * calculando correctamente la cantidad total de piezas si es "caja" o "paquete".
   */
  static async createPurchase(purchase: Purchase): Promise<{ success: boolean }> {
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      // 1) Insertar el encabezado en 'purchases'
      const result = db.prepare(`
        INSERT INTO purchases (proveedorId, fecha, total, observaciones, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        purchase.proveedorId,
        purchase.fecha ?? now,
        purchase.total ?? 0,
        purchase.observaciones ?? null,
        now,
        now
      );
      const compraId = result.lastInsertRowid as number;

      // 2) Insertar detalles en 'detail_compras' (incluimos tipoContenedor, unidPorCont, piezasIngresadas)
      if (purchase.detalles && purchase.detalles.length > 0) {
        const stmtDetalle = db.prepare(`
          INSERT INTO detail_compras
            (compraId, productoId, cantidad, precioUnitario, subtotal,
             lote, fechaCaducidad,
             tipoContenedor, unidadesPorContenedor, piezasIngresadas,
             createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of purchase.detalles) {
          // Calculamos el subtotal. 
          // - "paquete": cant * unidPorCont * precio
          // - "caja" o "unidad": cant * precio (depende de tu lógica de negocio)
          let sub = det.cantidad * det.precioUnitario;
          if (det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            sub = det.cantidad * upc * det.precioUnitario;
          }
          // Si quieres que "caja" se comporte igual a "paquete", 
          // descomenta:
          // else if (det.tipoContenedor === 'caja') {
          //   const upc = det.unidadesPorContenedor ?? 1;
          //   sub = det.cantidad * upc * det.precioUnitario;
          // }

          // Calculamos piezasIngresadas:
          let piezas = det.cantidad;
          if (det.tipoContenedor === 'paquete' || det.tipoContenedor === 'caja') {
            const upc = det.unidadesPorContenedor ?? 1;
            piezas = det.cantidad * upc;
          }

          stmtDetalle.run(
            compraId,
            det.productoId,
            det.cantidad,
            det.precioUnitario,
            sub,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            det.tipoContenedor ?? null,
            det.unidadesPorContenedor ?? 1,
            piezas,   // piezasIngresadas
            now,
            now
          );
        }
      }

      // 3) Insertar en 'lotes'
      //    Calculamos la "cantidadActual" multiplicando si es caja/paquete.
      if (purchase.detalles && purchase.detalles.length > 0) {
        const stmtLote = db.prepare(`
          INSERT INTO lotes
            (productoId, lote, fechaCaducidad, cantidadActual,
             activo, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of purchase.detalles) {
          // Cantidad real de piezas al inventario
          let realCantidad = det.cantidad;
          if (det.tipoContenedor === 'paquete' || det.tipoContenedor === 'caja') {
            const upc = det.unidadesPorContenedor ?? 1;
            realCantidad = det.cantidad * upc;
          }

          stmtLote.run(
            det.productoId,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            realCantidad,   // cantidad total
            1,              // activo = true
            now,
            now
          );
        }
      }
    });

    try {
      tx();
      return { success: true };
    } catch (error) {
      console.error('Error createPurchase:', error);
      return { success: false };
    }
  }

  /**
   * OBTENER DETALLES de una compra
   * (si tu tabla detail_compras tiene estas columnas, inclúyelas en el SELECT).
   */
  static async getDetallesByCompraId(compraId: number): Promise<DetalleCompra[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, compraId, productoId, cantidad, precioUnitario,
          subtotal, lote, fechaCaducidad,
          tipoContenedor, unidadesPorContenedor, piezasIngresadas,
          createdAt, updatedAt
        FROM detail_compras
        WHERE compraId = ?
      `).all(compraId) as any[]; // Podrías definir un DBDetalleCompra ampliado

      return rows.map((r) => ({
        id: r.id,
        compraId: r.compraId,
        productoId: r.productoId,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        subtotal: r.subtotal,
        lote: r.lote ?? undefined,
        fechaCaducidad: r.fechaCaducidad ?? undefined,
        tipoContenedor: r.tipoContenedor ?? undefined,
        unidadesPorContenedor: r.unidadesPorContenedor ?? undefined,
        piezasIngresadas: r.piezasIngresadas ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      console.error('Error getDetallesByCompraId:', error);
      return [];
    }
  }

  /**
   * Actualiza SOLO el encabezado de la compra.
   * (No actualiza detalles ni lotes.)
   */
  static async updatePurchase(purchase: Purchase & { id: number }): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE purchases
        SET proveedorId = ?, fecha = ?, total = ?, observaciones = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        purchase.proveedorId,
        purchase.fecha ?? now,
        purchase.total ?? 0,
        purchase.observaciones ?? null,
        now,
        purchase.id
      );

      return { success: true };
    } catch (error) {
      console.error('Error updatePurchase:', error);
      return { success: false };
    }
  }

  /**
   * Elimina compra + detalles (y podrías eliminar lotes si aplica).
   */
  static async deletePurchase(id: number): Promise<{ success: boolean }> {
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM detail_compras WHERE compraId = ?').run(id);
      // (Opcional) Borrar lotes creados por esta compra si así lo deseas
      // db.prepare('DELETE FROM lotes WHERE ??? = ?').run(...);

      db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
    });

    try {
      tx();
      return { success: true };
    } catch (error) {
      console.error('Error deletePurchase:', error);
      return { success: false };
    }
  }
}
