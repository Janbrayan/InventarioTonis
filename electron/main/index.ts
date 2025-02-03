import { app, BrowserWindow, Menu } from 'electron';
// ❌ En ESM, no se permite: import { autoUpdater } from 'electron-updater';
import updater from 'electron-updater'; // <-- import default
const { autoUpdater } = updater;

// ===== IMPORTAMOS electron-log =====
import log from 'electron-log';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupIpcHandlers } from './ipcHandlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== Configuramos al logger del autoUpdater =====
autoUpdater.logger = log;
// Evita el error TS "transports no existe" forzando a any
(log as any).transports.file.level = 'info';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    backgroundColor: '#0d1117',
    show: true,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    Menu.setApplicationMenu(null);
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    // ===== Checamos updates y se logueará en main.log =====
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// Manejo de eventos de autoUpdater
autoUpdater.on('update-available', () => {
  console.log('Nueva versión disponible. Descargando...');
});

autoUpdater.on('update-not-available', () => {
  console.log('No hay actualizaciones disponibles.');
});

autoUpdater.on('update-downloaded', () => {
  console.log('Actualización descargada. Se aplicará al reiniciar la app.');
  // autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});
