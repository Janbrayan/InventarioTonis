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

      // (Más si tienes Purchases, etc.)
      getPurchases: () => Promise<any>; // o Purchase[]
      createPurchase: (purchaseData: any) => Promise<{ success: boolean }>;
      updatePurchase: (purchaseData: any) => Promise<{ success: boolean }>; // si lo usas
      deletePurchase: (id: number) => Promise<{ success: boolean }>;
      getDetallesByCompra: (compraId: number) => Promise<any>; // o DetalleCompra[]

    };
  }
}
