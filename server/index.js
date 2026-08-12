const path = require('path');
const fs = require('fs');
const CONFIG = require('./src/config');
const Store = require('./src/Store');
const MacroEngine = require('./src/MacroEngine');
const SerialHandler = require('./src/SerialHandler');
const AuthStore = require('./src/AuthStore');
const { createDeckServer } = require('./shared/createDeckServer');

const uiDir = path.join(__dirname, '..', 'client', 'dist');
const store = new Store(CONFIG.CONFIG_PATH);
const serialHandler = new SerialHandler(null);

const deckServer = createDeckServer({
  port: CONFIG.PORT,
  authStore: AuthStore,
  store,
  serialHandler,
  executeAction: (action) => MacroEngine.execute(action),
  uiDir: fs.existsSync(uiDir) ? uiDir : null,
});

deckServer.listen();
