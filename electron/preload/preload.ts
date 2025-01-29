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

  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
  piezasVendidas?: number;
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

  // === Consumir lotes por merma / consumo interno
  descontarPorConsumo: (data: { loteId: number; cantidad: number; motivo?: string }) =>
    ipcRenderer.invoke('descontar-por-consumo', data),

  // === SALES (Ventas) ===
  getSales: () => ipcRenderer.invoke('get-sales'),
  getSalesToday: () => ipcRenderer.invoke('get-sales-today'),
  createSale: (saleData: FrontSale) => ipcRenderer.invoke('create-sale', saleData),
  deleteSale: (id: number) => ipcRenderer.invoke('delete-sale', id),
  getDetallesByVenta: (ventaId: number) => ipcRenderer.invoke('get-detalles-by-venta', ventaId),

  // ========== ESTADÍSTICAS ==========
  // 1) TotalComprasPorFecha
  statsGetTotalComprasPorFecha: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getTotalComprasPorFecha', fechaInicio, fechaFin),

  // 2) ComprasPorProveedor
  statsGetComprasPorProveedor: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getComprasPorProveedor', fechaInicio, fechaFin),

  // 3) TotalProductosActivos
  statsGetTotalProductosActivos: () =>
    ipcRenderer.invoke('stats-getTotalProductosActivos'),

  // 4) InversionCompraPorProducto
  statsGetInversionCompraPorProducto: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getInversionCompraPorProducto', fechaInicio, fechaFin),

  // 5) ValorTotalInventario
  statsGetValorTotalInventario: () =>
    ipcRenderer.invoke('stats-getValorTotalInventario'),

  // 6) StockActualPorProducto
  statsGetStockActualPorProducto: () =>
    ipcRenderer.invoke('stats-getStockActualPorProducto'),

  // 7) ProductosProximosACaducar
  statsGetProductosProximosACaducar: (dias: number) =>
    ipcRenderer.invoke('stats-getProductosProximosACaducar', dias),

  // 8) ConsumosPorMotivo
  statsGetConsumosPorMotivo: () =>
    ipcRenderer.invoke('stats-getConsumosPorMotivo'),

  // 9) CantidadTotalConsumos
  statsGetCantidadTotalConsumos: (fechaInicio?: string, fechaFin?: string) =>
    ipcRenderer.invoke('stats-getCantidadTotalConsumos', fechaInicio, fechaFin),

  // 10) DistribucionProductosPorCategoria
  statsGetDistribucionProductosPorCategoria: () =>
    ipcRenderer.invoke('stats-getDistribucionProductosPorCategoria'),

  // 11) NumCategoriasActivasInactivas
  statsGetNumCategoriasActivasInactivas: () =>
    ipcRenderer.invoke('stats-getNumCategoriasActivasInactivas'),

  // 12) TotalPiezasInventario
  statsGetTotalPiezasInventario: () =>
    ipcRenderer.invoke('stats-getTotalPiezasInventario'),

  // ========== HISTORIAL DE VENTAS ==========
  historialGetAllVentas: () => ipcRenderer.invoke('historial-getAllVentas'),
  historialGetDetallesByVentaId: (ventaId: number) =>
    ipcRenderer.invoke('historial-getDetallesByVentaId', ventaId),

  // (NUEVO) Filtrar ventas por rango (day, week, month, all)
  historialGetVentasByRange: (range: 'day' | 'week' | 'month' | 'all') =>
    ipcRenderer.invoke('historial-getVentasByRange', range),

  // ========== DASHBOARD (NUEVO) ==========
  // 1) Métricas principales
  dashboardGetMetrics: () => ipcRenderer.invoke('dashboard-getMetrics'),
  // 2) Resumen de compras
  dashboardGetResumenCompras: () => ipcRenderer.invoke('dashboard-getResumenCompras'),
  // 3) Top productos por precio
  dashboardGetTopProductosPorPrecio: (limit?: number) =>
    ipcRenderer.invoke('dashboard-getTopProductosPorPrecio', limit),

  // (NUEVO) Agregamos el resto de métodos de DashboardService:
  // 4) Margen de Ganancia (básico)
  dashboardGetMargenBasico: () => ipcRenderer.invoke('dashboard-getMargenBasico'),

  // 5) Últimas Ventas
  dashboardGetUltimasVentas: (limit?: number) =>
    ipcRenderer.invoke('dashboard-getUltimasVentas', limit),

  // 6) Últimas Compras
  dashboardGetUltimasCompras: (limit?: number) =>
    ipcRenderer.invoke('dashboard-getUltimasCompras', limit),

  // 7) Productos con Bajo Stock
  dashboardGetProductosBajoStock: (threshold?: number, limit?: number) =>
    ipcRenderer.invoke('dashboard-getProductosBajoStock', threshold, limit),

  // 8) Lotes Próximos a Vencer
  dashboardGetLotesProxVencimiento: (days?: number, limit?: number) =>
    ipcRenderer.invoke('dashboard-getLotesProxVencimiento', days, limit),
});
