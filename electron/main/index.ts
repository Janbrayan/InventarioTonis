import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupIpcHandlers } from './ipcHandlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    backgroundColor: '#0d1117', // Color oscuro futurista
    show: true,                // <-- Oculta la ventana inicialmente
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    // Opcionalmente ocultar menú:
    Menu.setApplicationMenu(null);
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../../../dist/index.html'));
  }

  // Espera a que el contenido esté listo para mostrar (reduce el flash):
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show(); // <-- aquí mostramos la ventana cuando React termina de cargar
  });

  // O también podemos hacer:
  // mainWindow.once('ready-to-show', () => {
  //   mainWindow.show();
  // });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});
