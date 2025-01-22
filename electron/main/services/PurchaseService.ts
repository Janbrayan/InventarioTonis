import db from '../db';

// Interfaces para la BD
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

// Estructuras compartidas con el front
export interface Purchase {
  id?: number;
  proveedorId: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  detalles?: DetalleCompra[]; // para enviar/recibir
}

export interface DetalleCompra {
  id?: number;
  compraId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  lote?: string;
  fechaCaducidad?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PurchaseService {

  // LISTAR COMPRAS (encabezado)
  static async getPurchases(): Promise<Purchase[]> {
    try {
      const rows = db.prepare(`
        SELECT id, proveedorId, fecha, total, observaciones, createdAt, updatedAt
        FROM purchases
      `).all() as DBPurchase[];

      return rows.map(r => ({
        id: r.id,
        proveedorId: r.proveedorId,
        fecha: r.fecha,
        total: r.total,
        observaciones: r.observaciones || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (err) {
      console.error('Error getPurchases:', err);
      return [];
    }
  }

  // CREAR COMPRA + DETALLES + CREAR LOTES
  static async createPurchase(purchase: Purchase): Promise<{ success: boolean }> {
    const now = new Date().toISOString();

    // Usamos una transacción para que si algo falla, se haga rollback
    const tx = db.transaction(() => {
      // 1) Insertar encabezado en 'purchases'
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

      // 2) Insertar renglones en 'detail_compras'
      if (purchase.detalles && purchase.detalles.length > 0) {
        const stmtDetalle = db.prepare(`
          INSERT INTO detail_compras
            (compraId, productoId, cantidad, precioUnitario, subtotal, lote, fechaCaducidad, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of purchase.detalles) {
          const sub = det.cantidad * det.precioUnitario;
          stmtDetalle.run(
            compraId,
            det.productoId,
            det.cantidad,
            det.precioUnitario,
            sub,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            now,
            now
          );
        }
      }

      // 3) CREAR LOTES en la tabla 'lotes' para reflejar el inventario
      //    Por cada detalle, hacemos un INSERT en 'lotes'.
      if (purchase.detalles && purchase.detalles.length > 0) {
        const stmtLote = db.prepare(`
          INSERT INTO lotes
            (productoId, lote, fechaCaducidad, cantidadActual, activo, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const det of purchase.detalles) {
          stmtLote.run(
            det.productoId,
            det.lote ?? null,
            det.fechaCaducidad ?? null,
            det.cantidad,  // sumamos las unidades que compramos
            1,             // activo
            now,
            now
          );
        }
      }
    });

    try {
      tx(); // ejecuta la transacción
      return { success: true };
    } catch (err) {
      console.error('Error createPurchase:', err);
      return { success: false };
    }
  }

  // OBTENER DETALLE DE UNA COMPRA
  static async getDetallesByCompraId(compraId: number): Promise<DetalleCompra[]> {
    try {
      const rows = db.prepare(`
        SELECT id, compraId, productoId, cantidad, precioUnitario, subtotal,
               lote, fechaCaducidad, createdAt, updatedAt
        FROM detail_compras
        WHERE compraId = ?
      `).all(compraId) as DBDetalleCompra[];

      return rows.map(r => ({
        id: r.id,
        compraId: r.compraId,
        productoId: r.productoId,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        subtotal: r.subtotal,
        lote: r.lote ?? undefined,
        fechaCaducidad: r.fechaCaducidad ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (err) {
      console.error('Error getDetallesByCompraId:', err);
      return [];
    }
  }

  // ACTUALIZAR ENCABEZADO (sin tocar detalles)
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
    } catch (err) {
      console.error('Error updatePurchase:', err);
      return { success: false };
    }
  }

  // ELIMINAR COMPRA (y detalles)
  static async deletePurchase(id: number): Promise<{ success: boolean }> {
    const tx = db.transaction(() => {
      // Primero borrar los detalles
      db.prepare('DELETE FROM detail_compras WHERE compraId = ?').run(id);
      // Luego borrar la compra
      db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
    });
    try {
      tx();
      return { success: true };
    } catch (err) {
      console.error('Error deletePurchase:', err);
      return { success: false };
    }
  }
}
