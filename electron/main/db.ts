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
//  Tabla "detail_compras" (detalle de compras)
// ==================================
db.exec(`
CREATE TABLE IF NOT EXISTS detail_compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compraId INTEGER NOT NULL,
  productoId INTEGER NOT NULL,
  cantidad REAL NOT NULL DEFAULT 0,
  precioUnitario REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  lote TEXT, -- opcional: lote
  fechaCaducidad TEXT, -- opcional
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
  detalleCompraId INTEGER, -- opcional (si quieres enlazar con detail_compras)
  lote TEXT,
  fechaCaducidad TEXT,
  cantidadActual REAL NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,

  FOREIGN KEY (productoId) REFERENCES products(id)
  -- Si deseas referencia a detail_compras:
  --FOREIGN KEY (detalleCompraId) REFERENCES detail_compras(id)
);
`);

export default db;
