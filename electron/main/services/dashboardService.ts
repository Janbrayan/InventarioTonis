/* ==========================================================================
   DashboardService.ts
   Servicio para obtener métricas y resúmenes de inventario/ventas/compras.
   Incluye cálculo de margen básico, últimas operaciones, productos con bajo 
   stock, lotes próximos a vencer y top de productos por precio.
   ========================================================================= */

   import db from '../db';
   import { Database } from 'better-sqlite3';
   
   /** Estructura de métricas generales (productos, ventas, etc.) */
   export interface DashboardMetrics {
     totalProductos: number;
     totalProveedores: number;
     totalVentas: number;
     totalVentasDinero: number;
     ultimaVenta?: string;
   }
   
   /** Estructura de resumen de compras */
   export interface DashboardCompras {
     totalCompras: number;
     totalComprasDinero: number;
     ultimaCompra?: string;
   }
   
   /** Estructura para ventas recientes */
   export interface VentaRow {
     id: number;
     fecha: string;
     total: number;
     createdAt: string;
     updatedAt: string;
   }
   
   /** Estructura para compras recientes */
   export interface CompraRow {
     id: number;
     proveedorId: number;
     fecha: string;
     total: number;
     createdAt: string;
     updatedAt: string;
   }
   
   /** Estructura para productos con bajo stock */
   export interface BajoStockRow {
     id: number;
     nombre: string;
     stock: number;
   }
   
   /** Estructura para lotes próximos a vencer */
   export interface LoteProxVencerRow {
     id: number;
     productoId: number;
     lote: string;
     fechaCaducidad: string;
     cantidadActual: number;
     activo: number;
     createdAt: string;
     updatedAt: string;
   }
   
   /** Estructura para top de productos por precio de venta */
   export interface TopProducto {
     id: number;
     nombre: string;
     precioVenta: number;
   }
   
   class DashboardService {
     private database: Database;
   
     constructor(database: Database) {
       this.database = database;
     }
   
     /**
      * Retorna métricas generales:
      * - totalProductos (activos)
      * - totalProveedores (activos)
      * - totalVentas (cuántas ventas)
      * - totalVentasDinero (suma de sales.total)
      * - ultimaVenta (fecha de la última venta)
      */
     public getMetrics(): DashboardMetrics {
       const rowProd = this.database
         .prepare('SELECT COUNT(*) AS count FROM products WHERE activo = 1')
         .get() as { count: number };
       const totalProductos = rowProd.count;
   
       const rowProv = this.database
         .prepare('SELECT COUNT(*) AS count FROM providers WHERE activo = 1')
         .get() as { count: number };
       const totalProveedores = rowProv.count;
   
       const rowVentas = this.database
         .prepare('SELECT COUNT(*) AS count FROM sales')
         .get() as { count: number };
       const totalVentas = rowVentas.count;
   
       const rowSumaVentas = this.database
         .prepare('SELECT IFNULL(SUM(total), 0) AS suma FROM sales')
         .get() as { suma: number };
       const totalVentasDinero = rowSumaVentas.suma;
   
       const rowUltimaVenta = this.database
         .prepare(`
           SELECT createdAt
           FROM sales
           ORDER BY createdAt DESC
           LIMIT 1
         `)
         .get() as { createdAt: string } | undefined;
       const ultimaVenta = rowUltimaVenta?.createdAt;
   
       return {
         totalProductos,
         totalProveedores,
         totalVentas,
         totalVentasDinero,
         ultimaVenta,
       };
     }
   
     /**
      * Retorna resumen de compras:
      * - totalCompras (cuántas compras)
      * - totalComprasDinero (suma de purchases.total)
      * - ultimaCompra (fecha de la última compra)
      */
     public getResumenCompras(): DashboardCompras {
       const rowCompras = this.database
         .prepare('SELECT COUNT(*) AS c FROM purchases')
         .get() as { c: number };
       const totalCompras = rowCompras.c;
   
       const rowSumaCompras = this.database
         .prepare('SELECT IFNULL(SUM(total), 0) AS suma FROM purchases')
         .get() as { suma: number };
       const totalComprasDinero = rowSumaCompras.suma;
   
       const rowUltimaCompra = this.database
         .prepare(`
           SELECT createdAt
           FROM purchases
           ORDER BY createdAt DESC
           LIMIT 1
         `)
         .get() as { createdAt: string } | undefined;
       const ultimaCompra = rowUltimaCompra?.createdAt;
   
       return {
         totalCompras,
         totalComprasDinero,
         ultimaCompra,
       };
     }
   
     /**
      * Margen básico = totalVentasDinero - totalComprasDinero
      * (no es el Costo de Mercancía Vendida real, sino comparación global).
      */
     public getMargenBasico(): number {
       const metrics = this.getMetrics();
       const compras = this.getResumenCompras();
       return metrics.totalVentasDinero - compras.totalComprasDinero;
     }
   
     /**
      * Retorna las últimas N ventas (por fecha de creación descendente).
      */
     public getUltimasVentas(limit = 5): VentaRow[] {
       const rows = this.database
         .prepare(`
           SELECT id, fecha, total, createdAt, updatedAt
           FROM sales
           ORDER BY createdAt DESC
           LIMIT ?
         `)
         .all(limit) as VentaRow[];
       return rows;
     }
   
     /**
      * Retorna las últimas N compras (por fecha de creación descendente).
      */
     public getUltimasCompras(limit = 5): CompraRow[] {
       const rows = this.database
         .prepare(`
           SELECT id, proveedorId, fecha, total, createdAt, updatedAt
           FROM purchases
           ORDER BY createdAt DESC
           LIMIT ?
         `)
         .all(limit) as CompraRow[];
       return rows;
     }
   
     /**
      * Retorna productos cuyo stock total (sumado de la tabla lotes) sea menor al
      * "threshold" indicado, ordenados de menor a mayor.
      */
     public getProductosBajoStock(threshold = 5, limit = 10): BajoStockRow[] {
       const rows = this.database
         .prepare(`
           SELECT 
             p.id,
             p.nombre,
             IFNULL(SUM(l.cantidadActual), 0) AS stock
           FROM products p
           LEFT JOIN lotes l 
             ON l.productoId = p.id 
            AND l.activo = 1
           WHERE p.activo = 1
           GROUP BY p.id
           HAVING stock < ?
           ORDER BY stock ASC
           LIMIT ?
         `)
         .all(threshold, limit) as BajoStockRow[];
       return rows;
     }
   
     /**
      * Retorna lotes activos cuya fechaCaducidad esté dentro de los próximos "days" días,
      * ordenados por fechaCaducidad ASC.
      * (Ignora los lotes cuya fechaCaducidad ya pasó, usando AND date(fechaCaducidad) >= date('now')).
      */
     public getLotesProxVencimiento(days = 30, limit = 10): LoteProxVencerRow[] {
       const rows = this.database
         .prepare(`
           SELECT 
             id,
             productoId,
             lote,
             fechaCaducidad,
             cantidadActual,
             activo,
             createdAt,
             updatedAt
           FROM lotes
           WHERE 
             activo = 1
             AND fechaCaducidad IS NOT NULL
             AND fechaCaducidad != ''
             AND date(fechaCaducidad) <= date('now', '+' || ? || ' days')
             AND date(fechaCaducidad) >= date('now')
           ORDER BY fechaCaducidad ASC
           LIMIT ?
         `)
         .all(days, limit) as LoteProxVencerRow[];
       return rows;
     }
   
     /**
      * Retorna hasta "limit" productos ordenados por mayor precio de venta.
      */
     public getTopProductosPorPrecio(limit = 5): TopProducto[] {
       const rows = this.database
         .prepare(`
           SELECT 
             id, 
             nombre, 
             precioVenta
           FROM products
           WHERE activo = 1
           ORDER BY precioVenta DESC
           LIMIT ?
         `)
         .all(limit) as TopProducto[];
       return rows;
     }
   }
   
   /** Instancia única exportada del servicio */
   export const dashboardService = new DashboardService(db);
   