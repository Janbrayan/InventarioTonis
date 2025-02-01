// src/electron/main/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 1. Determina la carpeta donde se guardará el archivo .db
const userDataPath = process.env.PORTABLE_EXECUTABLE_DIR || process.cwd();

// Asegura que la carpeta exista
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// 2. Path final de la base de datos
const dbPath = path.join(userDataPath, 'inventario.db');
console.log('Base de datos en:', dbPath);

// 3. Conexión a SQLite con better-sqlite3
const db = new Database(dbPath);

// ==================================
//   Tabla "users" (ya existente)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL
);
`);

// Usuario admin por defecto
const defaultAdminHash = '$2b$10$nbGNjSKlUNY1Va1JnqJWfewthAYTS7gvX7an5k4RPaFRrbQHoQ3N2';
db.exec(`
INSERT OR IGNORE INTO users (id, username, passwordHash, role)
VALUES (1, 'admin', '${defaultAdminHash}', 'admin');
`);

// ==================================
//   Tabla "categories"
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`);

// ==================================
//   Tabla "providers" (proveedores)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`);

// ==================================
//   Tabla "products"
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoriaId INTEGER,
  precioCompra REAL DEFAULT 0,
  precioVenta REAL DEFAULT 0,
  codigoBarras TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (categoriaId) REFERENCES categories(id)
);
`);

// ==================================
//   Tabla "purchases" (encabezado de compra)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedorId INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  total REAL DEFAULT 0,
  observaciones TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (proveedorId) REFERENCES providers(id)
);
`);

// ==================================
//   Tabla "detail_compras" (detalle de compras)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS detail_compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compraId INTEGER NOT NULL,
  productoId INTEGER NOT NULL,

  cantidad REAL NOT NULL DEFAULT 0,
  precioUnitario REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,

  lote TEXT,            -- opcional: lote
  fechaCaducidad TEXT,  -- opcional

  tipoContenedor TEXT,                  -- 'unidad' | 'caja' | 'paquete'
  unidadesPorContenedor REAL DEFAULT 1, -- cuántas unidades lleva cada caja o paquete
  piezasIngresadas REAL DEFAULT 0,      -- total de piezas que realmente ingresan

  precioPorPieza REAL DEFAULT 0,        -- para un manejo granular de costo

  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (compraId) REFERENCES purchases(id),
  FOREIGN KEY (productoId) REFERENCES products(id)
);
`);

// ==================================
//   Tabla "lotes" (inventario por lote)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS lotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productoId INTEGER NOT NULL,
  detalleCompraId INTEGER, -- opcional (enlazar con detail_compras si se desea)
  lote TEXT,
  fechaCaducidad TEXT,
  cantidadActual REAL NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (productoId) REFERENCES products(id)
);
`);

// ==================================
//   Tabla "sales" (encabezado de venta)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  total REAL DEFAULT 0,
  observaciones TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`);

// ==================================
//   Tabla "detail_ventas" (detalle de ventas)
// ==================================
// Incluye campos para precioLista, descuentoManualFijo, etc.
db.exec(`
CREATE TABLE IF NOT EXISTS detail_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ventaId INTEGER NOT NULL,
  productoId INTEGER NOT NULL,

  cantidad REAL NOT NULL DEFAULT 0,

  precioLista REAL NOT NULL DEFAULT 0,        -- Precio original sin descuento
  descuentoManualFijo REAL NOT NULL DEFAULT 0,-- Descuento en pesos
  precioUnitario REAL NOT NULL DEFAULT 0,     -- Precio final (precioLista - descuentoManualFijo)
  subtotal REAL NOT NULL DEFAULT 0,           -- (precioUnitario * cantidad)

  tipoContenedor TEXT,                  -- 'unidad' | 'caja' | 'paquete'
  unidadesPorContenedor REAL DEFAULT 1, -- cuántas unidades lleva cada caja/paquete
  piezasVendidas REAL DEFAULT 0,        -- total de piezas vendidas

  lote TEXT,            -- opcional: enlazar un Lote específico
  fechaCaducidad TEXT,  -- opcional

  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (ventaId) REFERENCES sales(id),
  FOREIGN KEY (productoId) REFERENCES products(id)
);
`);

// ==================================
//   Tabla "consumos_internos" (merma, salidas extra, etc.)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS consumos_internos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loteId INTEGER NOT NULL,
  cantidad REAL NOT NULL DEFAULT 0,
  motivo TEXT,        -- p.ej. "muestras", "consumo interno", "daño", etc.
  observaciones TEXT, -- si gustas
  fecha TEXT NOT NULL,   -- momento en que se efectúa esta salida
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (loteId) REFERENCES lotes(id)
);
`);

// ==================================
//   Tabla "cortes" (cierre de caja)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS cortes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fechaCorte TEXT NOT NULL,               -- Momento exacto del corte
  fechaInicio TEXT NOT NULL,              -- Rango de inicio (ej: "2025-02-10 00:00:00")
  fechaFin TEXT NOT NULL,                 -- Rango de fin   (ej: "2025-02-10 23:59:59")
  totalVentas REAL NOT NULL DEFAULT 0,    -- Suma de ventas en ese periodo
  totalDescuentos REAL NOT NULL DEFAULT 0,-- Descuentos totales (si aplica)
  netoVentas REAL NOT NULL DEFAULT 0,     -- Ventas netas = totalVentas - totalDescuentos
  totalEgresos REAL NOT NULL DEFAULT 0,   -- Retiros/inversiones en efectivo (si aplica)
  saldoFinal REAL NOT NULL DEFAULT 0,     -- Efectivo que queda tras egresos
  usuarioId INTEGER,                      -- Usuario que realizó el corte (opcional)
  observaciones TEXT,                     -- Notas adicionales
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`);

// Exportamos la instancia de la DB
export default db;
