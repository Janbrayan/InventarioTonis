// global.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      // LOGIN
      loginUser: (
        username: string,
        password: string
      ) => Promise<{
        success: boolean;
        role?: string;
        error?: string;
        user?: { name?: string };
      }>;

      // === CRUD USUARIOS ===
      getUsers: () => Promise<any>;
      createUser: (user: any) => Promise<{ success: boolean }>;
      updateUser: (user: any) => Promise<{ success: boolean }>;
      deleteUser: (id: number) => Promise<{ success: boolean }>;

      // === CRUD PROVEEDORES ===
      getProviders: () => Promise<any>;
      createProvider: (provData: any) => Promise<{ success: boolean }>;
      updateProvider: (provData: any) => Promise<{ success: boolean }>;
      deleteProvider: (id: number) => Promise<{ success: boolean }>;

      // === CRUD CATEGORIAS ===
      getCategories: () => Promise<any>;
      createCategory: (catData: any) => Promise<{ success: boolean }>;
      updateCategory: (catData: any) => Promise<{ success: boolean }>;
      deleteCategory: (id: number) => Promise<{ success: boolean }>;

      // === CRUD PRODUCTOS ===
      getProducts: () => Promise<any>;
      createProduct: (prodData: any) => Promise<{ success: boolean }>;
      updateProduct: (prodData: any) => Promise<{ success: boolean }>;
      deleteProduct: (id: number) => Promise<{ success: boolean }>;

      // === CRUD LOTES (INVENTARIO) ===
      getLotes: () => Promise<any>;
      createLote: (loteData: any) => Promise<{ success: boolean }>;
      updateLote: (loteData: any) => Promise<{ success: boolean }>;
      deleteLote: (id: number) => Promise<{ success: boolean }>;

      // === COMPRAS ===
      getPurchases: () => Promise<any>;
      createPurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      updatePurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      deletePurchase: (id: number) => Promise<{ success: boolean }>;
      getDetallesByCompra: (compraId: number) => Promise<any>;

      // === VENTAS ===
      getSales: () => Promise<any>;
      /** NUEVO: definición para obtener solo ventas del día */
      getSalesToday: () => Promise<any>;
      createSale: (saleData: any) => Promise<{ success: boolean }>;
      deleteSale: (id: number) => Promise<{ success: boolean }>;
      getDetallesByVenta: (ventaId: number) => Promise<any>;

      // === Consumir lotes por merma / consumo interno
      descontarPorConsumo: (data: {
        loteId: number;
        cantidad: number;
        motivo?: string;
      }) => Promise<{ success: boolean }>;

      // ========== ESTADÍSTICAS ==========
      // 1) Total de compras
      statsGetTotalComprasPorFecha: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<{ totalCompras: number }>;

      // 2) Compras por proveedor
      statsGetComprasPorProveedor: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<
        Array<{
          proveedorId: number;
          nombreProveedor: string;
          totalCompras: number;
        }>
      >;

      // 3) Total de productos activos
      statsGetTotalProductosActivos: () => Promise<{
        totalProductos: number;
      }>;

      // 4) Inversión por producto
      statsGetInversionCompraPorProducto: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<
        Array<{
          productoId: number;
          nombreProducto: string;
          inversionTotal: number;
        }>
      >;

      // 5) Valor total de inventario
      statsGetValorTotalInventario: () => Promise<{
        valorInventario: number;
      }>;

      // 6) Stock actual por producto
      statsGetStockActualPorProducto: () => Promise<
        Array<{
          productoId: number;
          nombreProducto: string;
          stockTotal: number;
        }>
      >;

      // 7) Productos próximos a caducar
      statsGetProductosProximosACaducar: (
        dias: number
      ) => Promise<
        Array<{
          productoId: number;
          nombreProducto: string;
          loteId: number;
          fechaCaducidad: string;
        }>
      >;

      // 8) Consumos agrupados por motivo
      statsGetConsumosPorMotivo: () => Promise<
        Array<{
          motivo: string;
          totalConsumos: number;
          cantidadTotal: number;
        }>
      >;

      // 9) Cantidad total de consumos en un rango
      statsGetCantidadTotalConsumos: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<{ totalConsumos: number }>;

      // 10) Distribución de productos por categoría
      statsGetDistribucionProductosPorCategoria: () => Promise<
        Array<{
          categoriaId: number;
          nombreCategoria: string;
          totalProductos: number;
        }>
      >;

      // 11) N° de categorías activas / inactivas
      statsGetNumCategoriasActivasInactivas: () => Promise<{
        categoriasActivas: number;
        categoriasInactivas: number;
      }>;

      // 12) Total de piezas en inventario
      statsGetTotalPiezasInventario: () => Promise<{
        totalPiezas: number;
      }>;

      // ========== HISTORIAL VENTAS (opcional) ==========
      /** Trae todas las ventas */
      historialGetAllVentas?: () => Promise<any>;

      /** Trae los detalles de una venta específica */
      historialGetDetallesByVentaId?: (ventaId: number) => Promise<any>;

      /** Filtra ventas por rango (day, week, month, all) */
      historialGetVentasByRange?: (
        range: 'day' | 'week' | 'month' | 'all'
      ) => Promise<any>;
    };
  }
}
