import { app, BrowserWindow, Menu } from 'electron';
import updater from 'electron-updater';
import log from 'electron-log';

const { autoUpdater } = updater;

// Asignamos el logger de electron-log al autoUpdater
autoUpdater.logger = log;

// Configuramos el nivel de logs en archivo
log.transports.file.level = 'info';

// Ejemplo de crear la ventana principal
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    backgroundColor: '#0d1117',
    show: true,
    webPreferences: {
      contextIsolation: true
    },
  });

  if (process.env.NODE_ENV === 'development') {
    Menu.setApplicationMenu(null);
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile('dist/index.html');
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    log.info('Invocando autoUpdater.checkForUpdatesAndNotify...');
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// Escuchamos los eventos del autoUpdater con logs para depuración
autoUpdater.on('checking-for-update', () => {
  log.info('AutoUpdater: checking-for-update');
});

autoUpdater.on('update-available', (info) => {
  log.info('AutoUpdater: update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  log.info('AutoUpdater: update-not-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  log.info(
    `AutoUpdater: download-progress -> Velocidad: ${progressObj.bytesPerSecond} bps, ` +
    `Progreso: ${progressObj.percent.toFixed(2)}% ` +
    `(${progressObj.transferred}/${progressObj.total} bytes)`
  );
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('AutoUpdater: update-downloaded', info);
  log.info('La actualización se instalará al reiniciar o forzar con quitAndInstall().');
  // autoUpdater.quitAndInstall(); // Si quieres forzar la instalación inmediata
});

autoUpdater.on('error', (err) => {
  log.error('AutoUpdater Error:', err);
});

// Arrancamos la aplicación
app.whenReady().then(() => {
  createWindow();
});
