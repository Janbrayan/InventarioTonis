/** global.d.ts */
// Se requiere este export vacío para que TypeScript reconozca
// que esto es un módulo y podamos usar "declare global".
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
      /** NUEVO: Buscar producto por código de barras */
      getProductByBarcode: (barcode: string) => Promise<any>;

      // === CRUD LOTES (INVENTARIO) ===
      getLotes: () => Promise<any>;
      createLote: (loteData: any) => Promise<{ success: boolean }>;
      updateLote: (loteData: any) => Promise<{ success: boolean }>;
      deleteLote: (id: number) => Promise<{ success: boolean }>;

      /** NUEVO: Obtener inventario agrupado (productos + lotes + totales) */
      getInventoryGrouped: () => Promise<any>;

      // === COMPRAS ===
      getPurchases: () => Promise<any>;
      createPurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      updatePurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      deletePurchase: (id: number) => Promise<{ success: boolean }>;
      getDetallesByCompra: (compraId: number) => Promise<any>;

      // === VENTAS ===
      getSales: () => Promise<any>;
      getSalesToday: () => Promise<any>;
      /**
       * Se actualiza para incluir `message?: string`,
       * de modo que TypeScript reconozca dicha propiedad en la respuesta.
       */
      createSale: (
        saleData: any
      ) => Promise<{ success: boolean; message?: string }>;

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

      // ========== HISTORIAL VENTAS ==========
      historialGetAllVentas?: () => Promise<any>;
      historialGetDetallesByVentaId?: (ventaId: number) => Promise<any>;
      historialGetVentasByRange?: (
        range: 'day' | 'week' | 'month' | 'all'
      ) => Promise<any>;

      // (NUEVO) Obtener productos SIN ventas en [fechaInicio, fechaFin]
      historialGetProductosNoVendidos: (
        fechaInicio: string,
        fechaFin: string
      ) => Promise<any>;

      // ========== DASHBOARD ==========
      /** Obtiene métricas principales (totalProductos, totalProveedores, etc.) */
      dashboardGetMetrics: () => Promise<{
        totalProductos: number;
        totalProveedores: number;
        totalVentas: number;
        totalVentasDinero: number;
        ultimaVenta?: string;
      }>;

      /** Resumen de compras (totalCompras, etc.) */
      dashboardGetResumenCompras: () => Promise<{
        totalCompras: number;
        totalComprasDinero: number;
        ultimaCompra?: string;
      }>;

      /** Top productos por precio (limit opcional) */
      dashboardGetTopProductosPorPrecio: (
        limit?: number
      ) => Promise<
        Array<{
          id: number;
          nombre: string;
          precioVenta: number;
        }>
      >;

      /** Margen de Ganancia (básico) */
      dashboardGetMargenBasico?: () => Promise<number>;

      /** Últimas Ventas */
      dashboardGetUltimasVentas?: (
        limit?: number
      ) => Promise<
        Array<{
          id: number;
          fecha: string;
          total: number;
          createdAt: string;
          updatedAt: string;
        }>
      >;

      /** Últimas Compras */
      dashboardGetUltimasCompras?: (
        limit?: number
      ) => Promise<
        Array<{
          id: number;
          proveedorId: number;
          fecha: string;
          total: number;
          createdAt: string;
          updatedAt: string;
        }>
      >;

      /** Productos con Bajo Stock */
      dashboardGetProductosBajoStock?: (
        threshold?: number,
        limit?: number
      ) => Promise<
        Array<{
          id: number;
          nombre: string;
          stock: number;
        }>
      >;

      /** Lotes Próximos a Vencer */
      dashboardGetLotesProxVencimiento?: (
        days?: number,
        limit?: number
      ) => Promise<
        Array<{
          id: number;
          productoId: number;
          lote: string;
          fechaCaducidad: string;
          cantidadActual: number;
          activo: number;
          createdAt: string;
          updatedAt: string;
        }>
      >;

      // ========== VENTAS ESTADÍSTICAS (NUEVO) ==========
      ventasStatsGetTotalVentas: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<number>;
      ventasStatsGetNumVentas: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<number>;
      ventasStatsGetProductosMasVendidos: (
        fechaInicio?: string,
        fechaFin?: string,
        limit?: number
      ) => Promise<
        Array<{
          productoId: number;
          productName: string;
          cantidadVendida: number;
        }>
      >;
      ventasStatsGetProductosMenosVendidos: (
        fechaInicio?: string,
        fechaFin?: string,
        limit?: number
      ) => Promise<
        Array<{
          productoId: number;
          productName: string;
          cantidadVendida: number;
        }>
      >;
      ventasStatsGetVentasPorCategoria: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<
        Array<{
          categoriaId: number;
          categoriaNombre: string;
          totalCategoria: number;
        }>
      >;
      ventasStatsGetVentasPorDia: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<
        Array<{
          dia: string;
          totalDia: number;
        }>
      >;
      ventasStatsGetTicketPromedio: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<number>;
      ventasStatsGetGananciaBruta: (
        fechaInicio?: string,
        fechaFin?: string
      ) => Promise<number>;

      // (NUEVO) Para obtener la caducidad más próxima de un producto
      getEarliestLotExpiration: (productId: number) => Promise<string | null>;

      // (NUEVO) Saber el tipoContenedor de la última compra
      getLastPurchaseContainer: (
        productId: number
      ) => Promise<'unidad' | 'caja' | 'paquete' | 'kilos' | null>;

      // ========== (NUEVO) CORTES (crear, obtener, generar PDF) ==========
      createCorte: (
        fechaInicio: string,
        fechaFin: string,
        usuarioId?: number,
        montoEgresos?: number,
        observaciones?: string
      ) => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;

      getCorteById: (corteId: number) => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;

      generateCortePDF: (
        corteData: any,
        outputPath: string
      ) => Promise<{ success: boolean; file?: string; error?: string }>;
    };
  }
}
