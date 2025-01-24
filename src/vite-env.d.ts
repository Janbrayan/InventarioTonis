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

      // CRUD USUARIOS
      getUsers: () => Promise<any>;
      createUser: (user: any) => Promise<{ success: boolean }>;
      updateUser: (user: any) => Promise<{ success: boolean }>;
      deleteUser: (id: number) => Promise<{ success: boolean }>;

      // CRUD PROVEEDORES
      getProviders: () => Promise<any>;
      createProvider: (provData: any) => Promise<{ success: boolean }>;
      updateProvider: (provData: any) => Promise<{ success: boolean }>;
      deleteProvider: (id: number) => Promise<{ success: boolean }>;

      // CRUD CATEGORIAS
      getCategories: () => Promise<any>;
      createCategory: (catData: any) => Promise<{ success: boolean }>;
      updateCategory: (catData: any) => Promise<{ success: boolean }>;
      deleteCategory: (id: number) => Promise<{ success: boolean }>;

      // CRUD PRODUCTOS
      getProducts: () => Promise<any>;
      createProduct: (prodData: any) => Promise<{ success: boolean }>;
      updateProduct: (prodData: any) => Promise<{ success: boolean }>;
      deleteProduct: (id: number) => Promise<{ success: boolean }>;

      // CRUD LOTES (INVENTARIO)
      getLotes: () => Promise<any>;
      createLote: (loteData: any) => Promise<{ success: boolean }>;
      updateLote: (loteData: any) => Promise<{ success: boolean }>;
      deleteLote: (id: number) => Promise<{ success: boolean }>;

      // COMPRAS
      getPurchases: () => Promise<any>;
      createPurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      updatePurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      deletePurchase: (id: number) => Promise<{ success: boolean }>;
      getDetallesByCompra: (compraId: number) => Promise<any>;

      // VENTAS
      getSales: () => Promise<any>;
      createSale: (saleData: any) => Promise<{ success: boolean }>;
      deleteSale: (id: number) => Promise<{ success: boolean }>;
      getDetallesByVenta: (ventaId: number) => Promise<any>;

      // === Función para descontar por consumo interno / merma
      descontarPorConsumo: (data: {
        loteId: number;
        cantidad: number;
        motivo?: string;
      }) => Promise<{ success: boolean }>;

      // ========== STATS (Actualizado) ==========
      statsGetTotalComprasPorFecha: (params: {
        fechaInicio?: string;
        fechaFin?: string;
      }) => Promise<{ totalCompras: number }>;

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

      // NUEVO 1) Cantidad total de productos activos
      statsGetTotalProductosActivos: () => Promise<{
        totalProductos: number;
      }>;

      // NUEVO 2) Inversión de compra por producto
      statsGetInversionCompraPorProducto: () => Promise<
        Array<{
          productoId: number;
          nombreProducto: string;
          inversionTotal: number;
        }>
      >;

      // NUEVO 3) Valor total de inventario
      statsGetValorTotalInventario: () => Promise<{
        valorInventario: number;
      }>;

      statsGetStockActualPorProducto: () => Promise<
        Array<{
          productoId: number;
          nombreProducto: string;
          stockTotal: number;
        }>
      >;

      statsGetProductosProximosACaducar: (dias: number) => Promise<
        Array<{
          productoId: number;
          nombreProducto: string;
          loteId: number;
          fechaCaducidad: string;
        }>
      >;

      statsGetConsumosPorMotivo: () => Promise<
        Array<{
          motivo: string;
          totalConsumos: number;
          cantidadTotal: number;
        }>
      >;

      statsGetCantidadTotalConsumos: (params: {
        fechaInicio?: string;
        fechaFin?: string;
      }) => Promise<{ totalConsumos: number }>;

      statsGetDistribucionProductosPorCategoria: () => Promise<
        Array<{
          categoriaId: number;
          nombreCategoria: string;
          totalProductos: number;
        }>
      >;

      statsGetNumCategoriasActivasInactivas: () => Promise<{
        categoriasActivas: number;
        categoriasInactivas: number;
      }>;

      // NUEVO 4) Total de piezas en el inventario
      statsGetTotalPiezasInventario: () => Promise<{
        totalPiezas: number;
      }>;
    }
  }
}
