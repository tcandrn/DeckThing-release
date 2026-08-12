const { spawn } = require('child_process');
const path = require('path');
const CONFIG = require('./config');
const { resolvePythonCommand } = require('../shared/python');

class MacroEngine {
    constructor() {
        this.process = null;
        this.restarts = 0;
        this.disabled = false;
        this.python = resolvePythonCommand(CONFIG.PYTHON_COMMAND);

        if (!this.python) {
            this.disabled = true;
            console.error(
                'No Python 3 interpreter found (tried py -3, python3, python). ' +
                'Macro execution is disabled. Install Python 3.10+ or set DECK_PYTHON to its full path.'
            );
            return;
        }

        this.start();
    }

    start() {
        if (this.process || this.disabled) return;

        const { command, baseArgs } = this.python;
        console.log(`Starting Python Engine (${command})...`);

        const startedAt = Date.now();
        this.process = spawn(command, [...baseArgs, CONFIG.PYTHON_SCRIPT], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.dirname(CONFIG.CONFIG_PATH)
        });

        this.process.on('error', (err) => {
            console.error(`Failed to launch Python Engine: ${err.message}`);
        });

        this.process.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        this.process.on('close', () => {
            this.process = null;

            if (Date.now() - startedAt > CONFIG.PYTHON_RESTART_MAX_DELAY) {
                this.restarts = 0;
            }

            if (this.restarts >= CONFIG.PYTHON_MAX_RESTARTS) {
                this.disabled = true;
                console.error(
                    `Python Engine failed ${this.restarts} times in a row. Giving up; macro execution is disabled. ` +
                    `Check that ${CONFIG.PYTHON_SCRIPT} exists and its dependencies are installed.`
                );
                return;
            }

            const delay = Math.min(
                CONFIG.PYTHON_RESTART_DELAY * Math.pow(2, this.restarts),
                CONFIG.PYTHON_RESTART_MAX_DELAY
            );
            this.restarts += 1;
            console.log(`Python process stopped. Restarting in ${delay}ms (attempt ${this.restarts}/${CONFIG.PYTHON_MAX_RESTARTS})...`);
            setTimeout(() => this.start(), delay);
        });
    }

    send(command, payload) {
        if (this.process && this.process.stdin.writable) {
            const msg = JSON.stringify({ command, payload }) + "\n";
            this.process.stdin.write(msg);
        } else {
            console.warn('Python Engine not ready, skipping command:', command);
        }
    }

    execute(action) {
        if (!action) return;

        console.log(`Executing Action:`, action.type);

        switch (action.type) {
            case 'text':
                this.send('type', action.text);
                break;
            case 'hotkey':
                this.send('hotkey', { key: action.key, modifiers: action.modifiers || [] });
                break;
            case 'game':
                this.send('game', action.key.toLowerCase());
                break;
            case 'script':
                this.send('script', action.script);
                break;
            default:
                console.log('Unknown action type:', action.type);
        }
    }
}

module.exports = new MacroEngine();
module.exports.MacroEngine = MacroEngine;
module.exports.resolvePythonCommand = resolvePythonCommand;
