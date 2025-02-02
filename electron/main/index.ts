import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupIpcHandlers } from './ipcHandlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  console.log('[createWindow] Iniciando la creación de la ventana principal...');

  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    backgroundColor: '#0d1117', // Color oscuro futurista
    show: false,  // Oculta la ventana al principio (usualmente se pone false)
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[createWindow] Modo desarrollo: ocultando menú y cargando localhost');
    Menu.setApplicationMenu(null);
    mainWindow.loadURL('http://localhost:5173');

    // Abrimos las DevTools automáticamente en desarrollo
    mainWindow.webContents.openDevTools();
  } else {
    console.log('[createWindow] Modo producción: cargando dist/index.html');
    mainWindow.loadFile(join(__dirname, '../../../dist/index.html'));
  }

  // Espera a que el contenido esté listo para mostrar (reduce el 'flash')
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[createWindow] did-finish-load => mostrando la ventana');
    mainWindow.show();
  });

  // O usar:
  // mainWindow.once('ready-to-show', () => {
  //   console.log('[createWindow] ready-to-show => mostrando la ventana');
  //   mainWindow.show();
  // });
}

app.whenReady().then(() => {
  console.log('[app.whenReady] Aplicación lista. Creando ventana...');
  createWindow();
  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  console.log('[app] Todas las ventanas cerradas => saliendo de la app.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[app] Evento activate => (macOS) Re-abriendo ventana si no hay');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
