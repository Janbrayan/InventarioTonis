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
 * Interfaz del detalle de la compra:
 * Aquí agregamos los nuevos campos que manejas en tu lógica de contenedores.
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

  // === Campos opcionales de contenedor ===
  tipoContenedor?: 'unidad' | 'caja' | 'paquete';
  unidadesPorContenedor?: number;
  piezasIngresadas?: number; // Si deseas enviarlo también
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

// Exponemos las funciones de IPC en `window.electronAPI`
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
});
