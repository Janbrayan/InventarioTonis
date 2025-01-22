// electron/main/services/ProviderService.ts
import db from '../db';

interface DBProvider {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  activo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class ProviderService {

  static async getProviders(): Promise<Provider[]> {
    try {
      const rows = db.prepare(`
        SELECT id, nombre, contacto, telefono, email, activo, createdAt, updatedAt
        FROM providers
      `).all() as DBProvider[];

      return rows.map(r => ({
        id: r.id,
        nombre: r.nombre,
        contacto: r.contacto || undefined,
        telefono: r.telefono || undefined,
        email: r.email || undefined,
        activo: !!r.activo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }));
    } catch (err) {
      console.error('Error getProviders:', err);
      return [];
    }
  }

  static async createProvider(prov: Provider): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO providers (nombre, contacto, telefono, email, activo, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        prov.nombre,
        prov.contacto ?? null,
        prov.telefono ?? null,
        prov.email ?? null,
        prov.activo === false ? 0 : 1,
        now,
        now
      );
      return { success: true };
    } catch (err) {
      console.error('Error createProvider:', err);
      return { success: false };
    }
  }

  static async updateProvider(prov: Provider & { id: number }): Promise<{ success: boolean }> {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE providers
        SET nombre = ?,
            contacto = ?,
            telefono = ?,
            email = ?,
            activo = ?,
            updatedAt = ?
        WHERE id = ?
      `).run(
        prov.nombre,
        prov.contacto ?? null,
        prov.telefono ?? null,
        prov.email ?? null,
        prov.activo === false ? 0 : 1,
        now,
        prov.id
      );
      return { success: true };
    } catch (err) {
      console.error('Error updateProvider:', err);
      return { success: false };
    }
  }

  static async deleteProvider(id: number): Promise<{ success: boolean }> {
    try {
      db.prepare('DELETE FROM providers WHERE id = ?').run(id);
      return { success: true };
    } catch (err) {
      console.error('Error deleteProvider:', err);
      return { success: false };
    }
  }
}
