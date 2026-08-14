const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function requireServerModule(name) {
  const bundled = path.join(__dirname, 'server', 'src', `${name}.js`);
  if (fs.existsSync(bundled)) return require(bundled);
  return require(path.join(__dirname, '..', 'server', 'src', name));
}

function resolveSharedDir() {
  const bundled = path.join(__dirname, 'server', 'shared');
  if (fs.existsSync(path.join(bundled, 'createDeckServer.js'))) return bundled;
  return path.join(__dirname, '..', 'server', 'shared');
}

const AuthStore = requireServerModule('AuthStore');
const Store = requireServerModule('Store');
const SerialHandler = requireServerModule('SerialHandler');
const { createDeckServer } = require(path.join(resolveSharedDir(), 'createDeckServer'));

const isPackaged = app.isPackaged;
const resourcesPath = isPackaged ? process.resourcesPath : __dirname;
const macroExe = isPackaged
  ? path.join(resourcesPath, 'macro.exe')
  : path.join(__dirname, '..', 'server', 'dist', 'macro.exe');

const uiPath = isPackaged
  ? path.join(__dirname, 'client', 'dist', 'index.html')
  : path.join(__dirname, '..', 'client', 'dist', 'index.html');

const configPath = path.join(app.getPath('userData'), 'deck_config.json');
const iconPath = isPackaged
  ? path.join(__dirname, 'icon.png')
  : path.join(__dirname, '..', 'icon.png');

let pythonProcess = null;
let isQuitting = false;

function startPython() {
  if (pythonProcess) return;

  if (!fs.existsSync(macroExe)) {
    console.log('Python Engine not found at:', macroExe);
    console.log("Make sure to run 'pyinstaller' in the server folder first!");
    return;
  }

  console.log('Starting Python Engine from:', macroExe);
  pythonProcess = spawn(macroExe, [], { stdio: ['pipe', 'ignore', 'pipe'] });
  pythonProcess.stderr.on('data', (d) => console.error(`PyErr: ${d}`));
  pythonProcess.on('close', () => {
    pythonProcess = null;
    setTimeout(startPython, 1000);
  });
}

function sendToPython(command, payload) {
  if (pythonProcess?.stdin?.writable) {
    pythonProcess.stdin.write(JSON.stringify({ command, payload }) + '\n');
  }
}

function executeAction(action) {
  if (!action) return;

  switch (action.type) {
    case 'text':
      sendToPython('type', action.text);
      break;
    case 'hotkey':
      sendToPython('hotkey', { key: action.key, modifiers: action.modifiers || [] });
      break;
    case 'game':
      sendToPython('game', action.key.toLowerCase());
      break;
    case 'script':
      sendToPython('script', action.script);
      break;
    default:
      console.log('Unknown action type:', action.type);
  }
}

const PORT = 3001;
const store = new Store(configPath);
const serialHandler = new SerialHandler(null);

createDeckServer({
  port: PORT,
  authStore: AuthStore,
  store,
  serialHandler,
  executeAction,
  uiDir: fs.existsSync(path.dirname(uiPath)) ? path.dirname(uiPath) : null,
  onQuit: () => {
    isQuitting = true;
    app.quit();
  },
}).listen();

startPython();

let mainWindow;
let tray = null;

function createTray() {
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show DeckThing', click: () => mainWindow.show() },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip('DeckThing');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    title: 'DeckThing',
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: '#020617',
    webPreferences: { nodeIntegration: false },
  });

  if (!isPackaged) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(uiPath);
    });
  } else {
    mainWindow.loadFile(uiPath);
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  isQuitting = true;
  if (pythonProcess) pythonProcess.kill();
});
