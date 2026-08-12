const path = require('path');
const { spawn } = require('child_process');
const { resolvePythonCommand } = require('../server/shared/python');

const args = process.argv.slice(2);
let cwd = process.cwd();

if (args[0] === '--cwd') {
    cwd = path.resolve(__dirname, '..', args[1]);
    args.splice(0, 2);
}

const python = resolvePythonCommand(process.env.DECK_PYTHON);

if (!python) {
    console.error(
        'No Python 3 interpreter found (tried py -3, python3, python).\n' +
        'Install Python 3.10 or newer, or set DECK_PYTHON to the full path of your interpreter.'
    );
    process.exit(1);
}

const child = spawn(python.command, [...python.baseArgs, ...args], { cwd, stdio: 'inherit' });
child.on('error', (err) => {
    console.error(`Failed to run Python: ${err.message}`);
    process.exit(1);
});
child.on('close', (code) => process.exit(code ?? 1));
