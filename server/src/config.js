const path = require('path');

const CONFIG = {
  PORT: process.env.PORT || 3001,
  BAUD_RATE: 9600,
  CONFIG_PATH: path.join(__dirname, '../deck_config.json'),
  PYTHON_SCRIPT: 'macro.py',
  PYTHON_RESTART_DELAY: 1000,
  // Cap the retry backoff and give up rather than respawning forever.
  PYTHON_RESTART_MAX_DELAY: 30000,
  PYTHON_MAX_RESTARTS: 5,
  // Set DECK_PYTHON to force a specific interpreter (e.g. a venv python.exe).
  PYTHON_COMMAND: process.env.DECK_PYTHON || null
};

module.exports = CONFIG;
