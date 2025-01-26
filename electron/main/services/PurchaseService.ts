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
  piezasIngresadas?: number;

  // AGREGADO: Para almacenar también el precio de venta si lo deseas actualizar en products
  precioVenta?: number;
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

      // 2) Insertar detalles en 'detail_compras'
      const detalles = purchase.detalles || [];
      if (detalles.length > 0) {
        const stmtDetalle = db.prepare(`
          INSERT INTO detail_compras
            (compraId, productoId, cantidad, precioUnitario, subtotal,
             lote, fechaCaducidad,
             tipoContenedor, unidadesPorContenedor, piezasIngresadas,
             precioPorPieza,             -- AGREGADO
             createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // AGREGADO: Statement para actualizar el precioCompra **y precioVenta** en la tabla products
        const stmtUpdateProduct = db.prepare(`
          UPDATE products
          SET 
            precioCompra = ?, 
            precioVenta = ?,  -- AGREGADO
            updatedAt = ?
          WHERE id = ?
        `);

        for (const det of detalles) {
          // Calculamos el subtotal.
          // - "paquete": cant * unidPorCont * precio
          // - "caja" o "unidad": cant * precio (depende de tu lógica)
          let sub = det.cantidad * det.precioUnitario;
          if (det.tipoContenedor === 'paquete') {
            const upc = det.unidadesPorContenedor ?? 1;
            sub = det.cantidad * upc * det.precioUnitario;
          }
          // Si deseas que "caja" se comporte igual a "paquete", descomenta:
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

          // AGREGADO: Cálculo de precioPorPieza
          let precioPorPieza = det.precioUnitario;
          if (det.tipoContenedor === 'caja') {
            const upc = det.unidadesPorContenedor ?? 1;
            precioPorPieza = det.precioUnitario / upc;
          } else if (det.tipoContenedor === 'paquete') {
            // Si "precioUnitario" ya es por pieza, no hace falta dividir
            precioPorPieza = det.precioUnitario;
          }

          // 2.1) Insertar el detalle en 'detail_compras'
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
            piezas,
            precioPorPieza, // AGREGADO
            now,
            now
          );

          // 2.2) Actualizar precioCompra y precioVenta en products
          // Si en tu front-end recibes det.precioVenta, la usas aquí. 
          // Si no, puedes usar un valor por defecto (p.ej. 0).
          const nuevoPrecioVenta = det.precioVenta ?? 0;

          stmtUpdateProduct.run(
            precioPorPieza,     // Nuevo precio de compra
            nuevoPrecioVenta,   // Nuevo precio de venta (AGREGADO)
            now,
            det.productoId
          );
        }
      }

      // 3) Insertar en 'lotes'
      //    Calculamos la "cantidadActual" multiplicando si es caja/paquete.
      if (detalles.length > 0) {
        const stmtLote = db.prepare(`
          INSERT INTO lotes
            (productoId, lote, fechaCaducidad, cantidadActual,
             activo, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of detalles) {
          let realCantidad = det.cantidad;
          if (det.tipoContenedor === 'paquete' || det.tipoContenedor === 'caja') {
            const upc = det.unidadesPorContenedor ?? 1;
            realCantidad = det.cantidad * upc;
          }

          stmtLote.run(
            det.productoId,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            realCantidad,
            1,   // activo = true
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
   */
  static async getDetallesByCompraId(compraId: number): Promise<DetalleCompra[]> {
    try {
      const rows = db.prepare(`
        SELECT
          id, compraId, productoId, cantidad, precioUnitario,
          subtotal, lote, fechaCaducidad,
          tipoContenedor, unidadesPorContenedor, piezasIngresadas,
          createdAt, updatedAt,
          precioPorPieza  -- AGREGADO: si ya existe en tu tabla detail_compras
        FROM detail_compras
        WHERE compraId = ?
      `).all(compraId) as any[]; // o define un tipo DBDetalleCompra con las columnas extras

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
        precioPorPieza: r.precioPorPieza ?? undefined,
      }));
    } catch (error) {
      console.error('Error getDetallesByCompraId:', error);
      return [];
    }
  }

  /**
   * Actualiza SOLO el encabezado de la compra (no los detalles).
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
   * Elimina compra + detalles
   * (y podrías eliminar lotes si así lo deseas).
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
