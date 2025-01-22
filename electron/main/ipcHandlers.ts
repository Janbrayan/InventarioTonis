// electron/main/ipcHandlers.ts
import { ipcMain } from 'electron';
import { UserService } from './services/UserService';

import { CategoryService } from './services/CategoryService';
import { ProviderService } from './services/ProviderService';
import { ProductService } from './services/ProductService';
import { PurchaseService } from './services/PurchaseService';
import { LoteService } from './services/LoteService';

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

  // DETALLES DE UNA COMPRA (para consultarlo en front)
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
}
