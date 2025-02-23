import { contextBridge, ipcRenderer } from 'electron';

// ===== Tipos previos de Login/User
export interface LoginUserResponse {
  success: boolean;
  role?: string;
  error?: string;
  user?: {
    name: string;
  };
}
export interface FrontUser {
  id?: number;
  username: string;
  role: string;
  activo?: boolean;
}

// ===== Tipos básicos para Categoría, Proveedor, Producto, Compras, Lotes, etc.
export interface FrontCategory {
  id?: number;
  nombre: string;
  activo?: boolean;
}
export interface FrontProvider {
  id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}
export interface FrontProduct {
  id?: number;
  nombre: string;
  categoriaId?: number | null;
  precioCompra?: number;
  precioVenta?: number;
  codigoBarras?: string;
  activo?: boolean;
}

/**
 * Interfaz del encabezado de la compra en el front.
 */
export interface FrontPurchase {
  id?: number;
  proveedorId: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  detalles?: FrontDetalleCompra[];
}

/**
 * Interfaz del detalle de la compra,
 * con campos opcionales de contenedores.
 */
export interface FrontDetalleCompra {
  id?: number;
  compraId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  lote?: string;
  fechaCaducidad?: string;

  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
  piezasIngresadas?: number;
}

/**
 * Interfaz para Lotes
 */
export interface FrontLote {
  id?: number;
  productoId: number;
  detalleCompraId?: number;
  lote?: string;
  fechaCaducidad?: string;
  cantidadActual?: number;
  activo?: boolean;
}

// === (Opcional) Interfaces de Venta en el front
export interface FrontSale {
  id?: number;
  fecha?: string;
  total?: number;
  observaciones?: string;
  detalles?: FrontDetalleVenta[];
}
export interface FrontDetalleVenta {
  id?: number;
  ventaId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  lote?: string;
  fechaCaducidad?: string;

  tipoContenedor?: 'unidad' | 'caja' | 'paquete' | 'kilos';
  unidadesPorContenedor?: number;
  piezasVendidas?: number;
}

/**
 * Interfaz para crear y leer cortes (cierre de caja) desde el frontend.
 */
export interface FrontCorte {
  id?: number;
  fechaCorte?: string;
  fechaInicio: string;
  fechaFin: string;
  totalVentas?: number;
  totalDescuentos?: number;
  netoVentas?: number;
  totalEgresos?: number;
  saldoFinal?: number;
  usuarioId?: number | null;
  observaciones?: string;
}

// =========================
//  Exponemos las funciones
//  de IPC en `window.electronAPI`
// =========================
contextBridge.exposeInMainWorld('electronAPI', {
  // === LOGIN ===
  loginUser: async (username: string, password: string): Promise<LoginUserResponse> => {
    return ipcRenderer.invoke('login-user', { username, password });
  },

  // === CRUD USUARIOS ===
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (user: FrontUser) => ipcRenderer.invoke('create-user', user),
  updateUser: (user: FrontUser & { id: number }) => ipcRenderer.invoke('update-user', user),
  deleteUser: (id: number) => ipcRenderer.invoke('delete-user', id),

  // === CATEGORIES ===
  getCategories: () => ipcRenderer.invoke('get-categories'),
  createCategory: (catData: FrontCategory) => ipcRenderer.invoke('create-category', catData),
  updateCategory: (catData: FrontCategory & { id: number }) => ipcRenderer.invoke('update-category', catData),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),

  // === PROVIDERS ===
  getProviders: () => ipcRenderer.invoke('get-providers'),
  createProvider: (provData: FrontProvider) => ipcRenderer.invoke('create-provider', provData),
  updateProvider: (provData: FrontProvider & { id: number }) => ipcRenderer.invoke('update-provider', provData),
  deleteProvider: (id: number) => ipcRenderer.invoke('delete-provider', id),

  // === PRODUCTS ===
  getProducts: () => ipcRenderer.invoke('get-products'),
  createProduct: (prodData: FrontProduct) => ipcRenderer.invoke('create-product', prodData),
  updateProduct: (prodData: FrontProduct & { id: number }) => ipcRenderer.invoke('update-product', prodData),
  deleteProduct: (id: number) => ipcRenderer.invoke('delete-product', id),
  // (NUEVO) Buscar producto por código de barras
  getProductByBarcode: (barcode: string) => ipcRenderer.invoke('get-product-by-barcode', barcode),

  // === PURCHASES ===
  getPurchases: () => ipcRenderer.invoke('get-purchases'),
  createPurchase: (purchaseData: FrontPurchase) => ipcRenderer.invoke('create-purchase', purchaseData),
  updatePurchase: (purchaseData: FrontPurchase & { id: number }) => ipcRenderer.invoke('update-purchase', purchaseData),
  deletePurchase: (id: number) => ipcRenderer.invoke('delete-purchase', id),
  getDetallesByCompra: (compraId: number) => ipcRenderer.invoke('get-detalles-by-compra', compraId),

  // === LOTES (Inventario) ===
  getLotes: () => ipcRenderer.invoke('get-lotes'),
  createLote: (loteData: FrontLote) => ipcRenderer.invoke('create-lote', loteData),
  updateLote: (loteData: FrontLote & { id: number }) => ipcRenderer.invoke('update-lote', loteData),
  deleteLote: (id: number) => ipcRenderer.invoke('delete-lote', id),
  descontarPorConsumo: (data: { loteId: number; cantidad: number; motivo?: string }) =>
    ipcRenderer.invoke('descontar-por-consumo', data),

  // (NUEVO) Obtener inventario agrupado (productos + lotes + total)
  getInventoryGrouped: () => ipcRenderer.invoke('get-inventory-grouped'),

  // === SALES (Ventas) ===
  getSales: () => ipcRenderer.invoke('get-sales'),
  getSalesToday: () => ipcRenderer.invoke('get-sales-today'),
  createSale: (saleData: FrontSale) => ipcRenderer.invoke('create-sale', saleData),
  deleteSale: (id: number) => ipcRenderer.invoke('delete-sale', id),
  getDetallesByVenta: (ventaId: number) => ipcRenderer.invoke('get-detalles-by-venta', ventaId),

  // ========== ESTADÍSTICAS ==========
  statsGetTotalComprasPorFecha: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getTotalComprasPorFecha', fechaInicio, fechaFin),
  statsGetComprasPorProveedor: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getComprasPorProveedor', fechaInicio, fechaFin),
  statsGetTotalProductosActivos: () =>
    ipcRenderer.invoke('stats-getTotalProductosActivos'),
  statsGetInversionCompraPorProducto: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getInversionCompraPorProducto', fechaInicio, fechaFin),
  statsGetValorTotalInventario: () =>
    ipcRenderer.invoke('stats-getValorTotalInventario'),
  statsGetStockActualPorProducto: () =>
    ipcRenderer.invoke('stats-getStockActualPorProducto'),
  statsGetProductosProximosACaducar: (dias: number) =>
    ipcRenderer.invoke('stats-getProductosProximosACaducar', dias),
  statsGetConsumosPorMotivo: () =>
    ipcRenderer.invoke('stats-getConsumosPorMotivo'),
  statsGetCantidadTotalConsumos: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getCantidadTotalConsumos', fechaInicio, fechaFin),
  statsGetDistribucionProductosPorCategoria: () =>
    ipcRenderer.invoke('stats-getDistribucionProductosPorCategoria'),
  statsGetNumCategoriasActivasInactivas: () =>
    ipcRenderer.invoke('stats-getNumCategoriasActivasInactivas'),
  statsGetTotalPiezasInventario: () =>
    ipcRenderer.invoke('stats-getTotalPiezasInventario'),

  // ========== HISTORIAL DE VENTAS ==========
  historialGetAllVentas: () => ipcRenderer.invoke('historial-getAllVentas'),
  historialGetDetallesByVentaId: (ventaId: number) =>
    ipcRenderer.invoke('historial-getDetallesByVentaId', ventaId),
  historialGetVentasByRange: (range: 'day' | 'week' | 'month' | 'all') =>
    ipcRenderer.invoke('historial-getVentasByRange', range),
  // (NUEVO) Obtener productos sin ventas en un rango
  historialGetProductosNoVendidos: (fechaInicio: string, fechaFin: string) =>
    ipcRenderer.invoke('historial-getProductosNoVendidos', fechaInicio, fechaFin),

  // ========== DASHBOARD ==========
  dashboardGetMetrics: () => ipcRenderer.invoke('dashboard-getMetrics'),
  dashboardGetResumenCompras: () => ipcRenderer.invoke('dashboard-getResumenCompras'),
  dashboardGetTopProductosPorPrecio: (limit?: number) =>
    ipcRenderer.invoke('dashboard-getTopProductosPorPrecio', limit),
  dashboardGetMargenBasico: () => ipcRenderer.invoke('dashboard-getMargenBasico'),
  dashboardGetUltimasVentas: (limit?: number) =>
    ipcRenderer.invoke('dashboard-getUltimasVentas', limit),
  dashboardGetUltimasCompras: (limit?: number) =>
    ipcRenderer.invoke('dashboard-getUltimasCompras', limit),
  dashboardGetProductosBajoStock: (threshold?: number, limit?: number) =>
    ipcRenderer.invoke('dashboard-getProductosBajoStock', threshold, limit),
  dashboardGetLotesProxVencimiento: (days?: number, limit?: number) =>
    ipcRenderer.invoke('dashboard-getLotesProxVencimiento', days, limit),

  // ========== VENTAS ESTADÍSTICAS ==========
  ventasStatsGetTotalVentas: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('ventasStats-getTotalVentas', fechaInicio, fechaFin),
  ventasStatsGetNumVentas: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('ventasStats-getNumVentas', fechaInicio, fechaFin),
  ventasStatsGetProductosMasVendidos: (fechaInicio?: string, fechaFin?: string, limit?: number) =>
    ipcRenderer.invoke('ventasStats-getProductosMasVendidos', fechaInicio, fechaFin, limit),
  ventasStatsGetProductosMenosVendidos: (fechaInicio?: string, fechaFin?: string, limit?: number) =>
    ipcRenderer.invoke('ventasStats-getProductosMenosVendidos', fechaInicio, fechaFin, limit),
  ventasStatsGetVentasPorCategoria: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('ventasStats-getVentasPorCategoria', fechaInicio, fechaFin),
  ventasStatsGetVentasPorDia: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('ventasStats-getVentasPorDia', fechaInicio, fechaFin),
  ventasStatsGetTicketPromedio: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('ventasStats-getTicketPromedio', fechaInicio, fechaFin),
  ventasStatsGetGananciaBruta: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('ventasStats-getGananciaBruta', fechaInicio, fechaFin),

  // ========== (NUEVO) Fecha de caducidad más próxima (FEFO) ==========
  getEarliestLotExpiration: (productId: number) =>
    ipcRenderer.invoke('get-earliest-lot-expiration', productId),

  // ========== (NUEVO) Saber el tipoContenedor de la última compra ==========
  getLastPurchaseContainer: (productId: number) =>
    ipcRenderer.invoke('get-last-purchase-container', productId),

  // ========== (NUEVO) CORTES (crear, obtener, generar PDF) ==========
  createCorte: (
    fechaInicio: string,
    fechaFin: string,
    usuarioId?: number,
    montoEgresos?: number,
    observaciones?: string
  ) => ipcRenderer.invoke('create-corte', { fechaInicio, fechaFin, usuarioId, montoEgresos, observaciones }),

  getCorteById: (corteId: number) => ipcRenderer.invoke('get-corte-by-id', corteId),

  generateCortePDF: (corteData: FrontCorte, outputPath: string) =>
    ipcRenderer.invoke('generate-corte-pdf', { corteData, outputPath }),
});
