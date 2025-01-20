import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 1. Determina la carpeta donde se guardará el archivo .db
//    Por simplicidad, lo ponemos en la carpeta actual (o en userData).
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

// 4. Crea la tabla "users" si no existe
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL -- "admin", "worker", etc.
);
`);

// 5. Inserta un usuario "admin" por defecto con contraseña hasheada (bcrypt).
//    Reemplaza el hash con tu propio hash real.
const defaultAdminHash = '$2b$10$nbGNjSKlUNY1Va1JnqJWfewthAYTS7gvX7an5k4RPaFRrbQHoQ3N2';
db.exec(`
INSERT OR IGNORE INTO users (id, username, passwordHash, role)
VALUES (1, 'admin', '${defaultAdminHash}', 'admin');
`);

/*
  Nota: Si deseas cambiar la pass:
    - Genera tu propio hash con "npx bcrypt-cli" (o en Node REPL con bcrypt).
    - Pega ese hash en defaultAdminHash y listo.
*/

// 6. Exportamos la conexión para usarla en otro archivo
export default db;
