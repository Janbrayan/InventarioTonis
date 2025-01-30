// ipcHandlers.ts
import { ipcMain } from 'electron';
import { UserService } from './services/UserService';
import { CategoryService } from './services/CategoryService';
import { ProviderService } from './services/ProviderService';
import { ProductService } from './services/ProductService';
import { PurchaseService } from './services/PurchaseService';
import { LoteService } from './services/LoteService';
import { SalesService } from './services/SalesService';
import { StatsService } from './services/StatsService';
import { HistorialVentasService } from './services/HistorialVentasService';
// Dashboard
import { dashboardService } from './services/dashboardService';
// (NUEVO) VentasEstadisticasService:
import { VentasEstadisticasService } from './services/VentasEstadisticasService';

export function setupIpcHandlers() {
  // ========== LOGIN ==========
  ipcMain.handle('login-user', async (_event, { username, password }) => {
    try {
      const result = await UserService.loginUser(username, password);
      if (!result.success) {
        return { success: false, error: 'Credenciales inválidas' };
      }
      return {
        success: true,
        role: result.role,
        user: { name: result.username },
      };
    } catch (error) {
      console.error('Error en login-user IPC:', error);
      return { success: false, error: 'Error interno en login-user' };
    }
  });

  // ========== USUARIOS ==========
  ipcMain.handle('get-users', async () => {
    try {
      return await UserService.getUsers();
    } catch (error) {
      console.error('Error en get-users IPC:', error);
      return [];
    }
  });

  ipcMain.handle('create-user', async (_event, newUser) => {
    try {
      return await UserService.createUser(newUser);
    } catch (error) {
      console.error('Error en create-user IPC:', error);
      return { success: false };
    }
  });

  ipcMain.handle('update-user', async (_event, user) => {
    try {
      return await UserService.updateUser(user);
    } catch (error) {
      console.error('Error en update-user IPC:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-user', async (_event, id) => {
    try {
      return await UserService.deleteUser(id);
    } catch (error) {
      console.error('Error en delete-user IPC:', error);
      return { success: false };
    }
  });

  // ========== CATEGORIES ==========
  ipcMain.handle('get-categories', async () => {
    try {
      return await CategoryService.getCategories();
    } catch (error) {
      console.error('Error get-categories:', error);
      return [];
    }
  });

  ipcMain.handle('create-category', async (_event, catData) => {
    try {
      return await CategoryService.createCategory(catData);
    } catch (error) {
      console.error('Error create-category:', error);
      return { success: false };
    }
  });

  ipcMain.handle('update-category', async (_event, catData) => {
    try {
      return await CategoryService.updateCategory(catData);
    } catch (error) {
      console.error('Error update-category:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-category', async (_event, id) => {
    try {
      return await CategoryService.deleteCategory(id);
    } catch (error) {
      console.error('Error delete-category:', error);
      return { success: false };
    }
  });

  // ========== PROVIDERS ==========
  ipcMain.handle('get-providers', async () => {
    try {
      return await ProviderService.getProviders();
    } catch (error) {
      console.error('Error get-providers:', error);
      return [];
    }
  });

  ipcMain.handle('create-provider', async (_event, data) => {
    try {
      return await ProviderService.createProvider(data);
    } catch (error) {
      console.error('Error create-provider:', error);
      return { success: false };
    }
  });

  ipcMain.handle('update-provider', async (_event, data) => {
    try {
      return await ProviderService.updateProvider(data);
    } catch (error) {
      console.error('Error update-provider:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-provider', async (_event, id) => {
    try {
      return await ProviderService.deleteProvider(id);
    } catch (error) {
      console.error('Error delete-provider:', error);
      return { success: false };
    }
  });

  // ========== PRODUCTS ==========
  ipcMain.handle('get-products', async () => {
    try {
      return await ProductService.getProducts();
    } catch (error) {
      console.error('Error get-products:', error);
      return [];
    }
  });

  ipcMain.handle('create-product', async (_event, data) => {
    try {
      return await ProductService.createProduct(data);
    } catch (error) {
      console.error('Error create-product:', error);
      return { success: false };
    }
  });

  ipcMain.handle('update-product', async (_event, data) => {
    try {
      return await ProductService.updateProduct(data);
    } catch (error) {
      console.error('Error update-product:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-product', async (_event, id) => {
    try {
      return await ProductService.deleteProduct(id);
    } catch (error) {
      console.error('Error delete-product:', error);
      return { success: false };
    }
  });

  // Busqueda de producto por código de barras
  ipcMain.handle('get-product-by-barcode', async (_event, barcode: string) => {
    try {
      return await ProductService.getProductByBarcode(barcode);
    } catch (error) {
      console.error('Error get-product-by-barcode:', error);
      return null;
    }
  });

  // ========== PURCHASES (encabezado) ==========
  ipcMain.handle('get-purchases', async () => {
    try {
      return await PurchaseService.getPurchases();
    } catch (error) {
      console.error('Error get-purchases:', error);
      return [];
    }
  });

  ipcMain.handle('create-purchase', async (_event, purchaseData) => {
    try {
      return await PurchaseService.createPurchase(purchaseData);
    } catch (error) {
      console.error('Error create-purchase:', error);
      return { success: false };
    }
  });

  ipcMain.handle('update-purchase', async (_event, data) => {
    try {
      return await PurchaseService.updatePurchase(data);
    } catch (error) {
      console.error('Error update-purchase:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-purchase', async (_event, id) => {
    try {
      return await PurchaseService.deletePurchase(id);
    } catch (error) {
      console.error('Error delete-purchase:', error);
      return { success: false };
    }
  });

  // DETALLES DE UNA COMPRA
  ipcMain.handle('get-detalles-by-compra', async (_event, compraId) => {
    try {
      return await PurchaseService.getDetallesByCompraId(compraId);
    } catch (error) {
      console.error('Error get-detalles-by-compra:', error);
      return [];
    }
  });

  // ========== LOTES (Inventario) ==========
  ipcMain.handle('get-lotes', async () => {
    try {
      return await LoteService.getLotes();
    } catch (error) {
      console.error('Error get-lotes:', error);
      return [];
    }
  });

  ipcMain.handle('create-lote', async (_event, data) => {
    try {
      return await LoteService.createLote(data);
    } catch (error) {
      console.error('Error create-lote:', error);
      return { success: false };
    }
  });

  ipcMain.handle('update-lote', async (_event, data) => {
    try {
      return await LoteService.updateLote(data);
    } catch (error) {
      console.error('Error update-lote:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-lote', async (_event, id) => {
    try {
      return await LoteService.deleteLote(id);
    } catch (error) {
      console.error('Error delete-lote:', error);
      return { success: false };
    }
  });

  // Descuento de lotes (consumo interno / merma)
  ipcMain.handle('descontar-por-consumo', async (_event, data) => {
    try {
      return await LoteService.descontarPorConsumo(data);
    } catch (error) {
      console.error('Error descontar-por-consumo IPC:', error);
      return { success: false };
    }
  });

  // (NUEVO) Obtener inventario agrupado
  ipcMain.handle('get-inventory-grouped', async () => {
    try {
      return await LoteService.getInventoryGrouped();
    } catch (error) {
      console.error('Error get-inventory-grouped:', error);
      return [];
    }
  });

  // ========== SALES (encabezado) ==========
  ipcMain.handle('get-sales', async () => {
    try {
      return await SalesService.getSales();
    } catch (error) {
      console.error('Error get-sales:', error);
      return [];
    }
  });

  ipcMain.handle('get-sales-today', async () => {
    try {
      return await SalesService.getSalesToday();
    } catch (error) {
      console.error('Error get-sales-today:', error);
      return [];
    }
  });

  ipcMain.handle('create-sale', async (_event, saleData) => {
    try {
      return await SalesService.createSale(saleData);
    } catch (error) {
      console.error('Error create-sale:', error);
      return { success: false };
    }
  });

  ipcMain.handle('delete-sale', async (_event, id) => {
    // Ejemplo: si no implementas la eliminación
    return { success: false, error: 'delete-sale not implemented' };
  });

  ipcMain.handle('get-detalles-by-venta', async (_event, ventaId) => {
    try {
      return await SalesService.getDetallesByVentaId(ventaId);
    } catch (error) {
      console.error('Error get-detalles-by-venta:', error);
      return [];
    }
  });

  // ========== STATS ==========
  ipcMain.handle(
    'stats-getTotalComprasPorFecha',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return await StatsService.getTotalComprasPorFecha(fechaInicio, fechaFin);
      } catch (error) {
        console.error('Error stats-getTotalComprasPorFecha:', error);
        return { totalCompras: 0 };
      }
    }
  );

  ipcMain.handle(
    'stats-getComprasPorProveedor',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return await StatsService.getComprasPorProveedor(fechaInicio, fechaFin);
      } catch (error) {
        console.error('Error stats-getComprasPorProveedor:', error);
        return [];
      }
    }
  );

  ipcMain.handle('stats-getTotalProductosActivos', async () => {
    try {
      return await StatsService.getTotalProductosActivos();
    } catch (error) {
      console.error('Error stats-getTotalProductosActivos:', error);
      return { totalProductos: 0 };
    }
  });

  ipcMain.handle(
    'stats-getInversionCompraPorProducto',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return await StatsService.getInversionCompraPorProducto(fechaInicio, fechaFin);
      } catch (error) {
        console.error('Error stats-getInversionCompraPorProducto:', error);
        return [];
      }
    }
  );

  ipcMain.handle('stats-getValorTotalInventario', async () => {
    try {
      return await StatsService.getValorTotalInventario();
    } catch (error) {
      console.error('Error stats-getValorTotalInventario:', error);
      return { valorInventario: 0 };
    }
  });

  ipcMain.handle('stats-getStockActualPorProducto', async () => {
    try {
      return await StatsService.getStockActualPorProducto();
    } catch (error) {
      console.error('Error stats-getStockActualPorProducto:', error);
      return [];
    }
  });

  ipcMain.handle('stats-getProductosProximosACaducar', async (_event, dias) => {
    try {
      return await StatsService.getProductosProximosACaducar(dias);
    } catch (error) {
      console.error('Error stats-getProductosProximosACaducar:', error);
      return [];
    }
  });

  ipcMain.handle('stats-getConsumosPorMotivo', async () => {
    try {
      return await StatsService.getConsumosPorMotivo();
    } catch (error) {
      console.error('Error stats-getConsumosPorMotivo:', error);
      return [];
    }
  });

  ipcMain.handle(
    'stats-getCantidadTotalConsumos',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return await StatsService.getCantidadTotalConsumos(fechaInicio, fechaFin);
      } catch (error) {
        console.error('Error stats-getCantidadTotalConsumos:', error);
        return { totalConsumos: 0 };
      }
    }
  );

  ipcMain.handle('stats-getDistribucionProductosPorCategoria', async () => {
    try {
      return await StatsService.getDistribucionProductosPorCategoria();
    } catch (error) {
      console.error('Error stats-getDistribucionProductosPorCategoria:', error);
      return [];
    }
  });

  ipcMain.handle('stats-getNumCategoriasActivasInactivas', async () => {
    try {
      return await StatsService.getNumCategoriasActivasInactivas();
    } catch (error) {
      console.error('Error stats-getNumCategoriasActivasInactivas:', error);
      return { categoriasActivas: 0, categoriasInactivas: 0 };
    }
  });

  ipcMain.handle('stats-getTotalPiezasInventario', async () => {
    try {
      return await StatsService.getTotalPiezasInventario();
    } catch (error) {
      console.error('Error stats-getTotalPiezasInventario:', error);
      return { totalPiezas: 0 };
    }
  });

  // ========== HISTORIAL DE VENTAS ==========
  ipcMain.handle('historial-getAllVentas', async () => {
    try {
      return await HistorialVentasService.getAllVentas();
    } catch (error) {
      console.error('Error historial-getAllVentas:', error);
      return [];
    }
  });

  ipcMain.handle('historial-getDetallesByVentaId', async (_event, ventaId: number) => {
    try {
      return await HistorialVentasService.getDetallesByVentaId(ventaId);
    } catch (error) {
      console.error('Error historial-getDetallesByVentaId:', error);
      return [];
    }
  });

  ipcMain.handle(
    'historial-getVentasByRange',
    async (_event, range: 'day' | 'week' | 'month' | 'all') => {
      try {
        return await HistorialVentasService.getVentasByRange(range);
      } catch (error) {
        console.error('Error historial-getVentasByRange:', error);
        return [];
      }
    }
  );

  // ========== DASHBOARD (NUEVO) ==========
  ipcMain.handle('dashboard-getMetrics', async () => {
    try {
      return dashboardService.getMetrics();
    } catch (error) {
      console.error('Error dashboard-getMetrics:', error);
      return null;
    }
  });

  ipcMain.handle('dashboard-getResumenCompras', async () => {
    try {
      return dashboardService.getResumenCompras();
    } catch (error) {
      console.error('Error dashboard-getResumenCompras:', error);
      return null;
    }
  });

  ipcMain.handle('dashboard-getTopProductosPorPrecio', async (_event, limit?: number) => {
    try {
      return dashboardService.getTopProductosPorPrecio(limit || 5);
    } catch (error) {
      console.error('Error dashboard-getTopProductosPorPrecio:', error);
      return [];
    }
  });

  ipcMain.handle('dashboard-getMargenBasico', async () => {
    try {
      return dashboardService.getMargenBasico();
    } catch (error) {
      console.error('Error dashboard-getMargenBasico:', error);
      return 0;
    }
  });

  ipcMain.handle('dashboard-getUltimasVentas', async (_event, limit?: number) => {
    try {
      return dashboardService.getUltimasVentas(limit || 5);
    } catch (error) {
      console.error('Error dashboard-getUltimasVentas:', error);
      return [];
    }
  });

  ipcMain.handle('dashboard-getUltimasCompras', async (_event, limit?: number) => {
    try {
      return dashboardService.getUltimasCompras(limit || 5);
    } catch (error) {
      console.error('Error dashboard-getUltimasCompras:', error);
      return [];
    }
  });

  ipcMain.handle(
    'dashboard-getProductosBajoStock',
    async (_event, threshold?: number, limit?: number) => {
      try {
        return dashboardService.getProductosBajoStock(threshold || 5, limit || 10);
      } catch (error) {
        console.error('Error dashboard-getProductosBajoStock:', error);
        return [];
      }
    }
  );

  ipcMain.handle(
    'dashboard-getLotesProxVencimiento',
    async (_event, days?: number, limit?: number) => {
      try {
        return dashboardService.getLotesProxVencimiento(days || 30, limit || 10);
      } catch (error) {
        console.error('Error dashboard-getLotesProxVencimiento:', error);
        return [];
      }
    }
  );

  // ========== VENTAS ESTADÍSTICAS (NUEVO) ==========
  ipcMain.handle(
    'ventasStats-getTotalVentas',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return VentasEstadisticasService.getTotalVentas(fechaInicio || '', fechaFin || '');
      } catch (error) {
        console.error('Error ventasStats-getTotalVentas:', error);
        return 0;
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getNumVentas',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return VentasEstadisticasService.getNumVentas(fechaInicio || '', fechaFin || '');
      } catch (error) {
        console.error('Error ventasStats-getNumVentas:', error);
        return 0;
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getProductosMasVendidos',
    async (_event, fechaInicio?: string, fechaFin?: string, limit?: number) => {
      try {
        return VentasEstadisticasService.getProductosMasVendidos(
          fechaInicio || '',
          fechaFin || '',
          limit || 5
        );
      } catch (error) {
        console.error('Error ventasStats-getProductosMasVendidos:', error);
        return [];
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getProductosMenosVendidos',
    async (_event, fechaInicio?: string, fechaFin?: string, limit?: number) => {
      try {
        return VentasEstadisticasService.getProductosMenosVendidos(
          fechaInicio || '',
          fechaFin || '',
          limit || 5
        );
      } catch (error) {
        console.error('Error ventasStats-getProductosMenosVendidos:', error);
        return [];
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getVentasPorCategoria',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return VentasEstadisticasService.getVentasPorCategoria(
          fechaInicio || '',
          fechaFin || ''
        );
      } catch (error) {
        console.error('Error ventasStats-getVentasPorCategoria:', error);
        return [];
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getVentasPorDia',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return VentasEstadisticasService.getVentasPorDia(
          fechaInicio || '',
          fechaFin || ''
        );
      } catch (error) {
        console.error('Error ventasStats-getVentasPorDia:', error);
        return [];
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getTicketPromedio',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return VentasEstadisticasService.getTicketPromedio(
          fechaInicio || '',
          fechaFin || ''
        );
      } catch (error) {
        console.error('Error ventasStats-getTicketPromedio:', error);
        return 0;
      }
    }
  );

  ipcMain.handle(
    'ventasStats-getGananciaBruta',
    async (_event, fechaInicio?: string, fechaFin?: string) => {
      try {
        return VentasEstadisticasService.getGananciaBruta(
          fechaInicio || '',
          fechaFin || ''
        );
      } catch (error) {
        console.error('Error ventasStats-getGananciaBruta:', error);
        return 0;
      }
    }
  );
}
