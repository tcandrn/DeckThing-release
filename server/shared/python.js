const { spawnSync } = require('child_process');

function resolvePythonCommand(override) {
    if (override) {
        return { command: override, baseArgs: [] };
    }

    const candidates = process.platform === 'win32'
        ? [['py', ['-3']], ['python3', []], ['python', []]]
        : [['python3', []], ['python', []]];

    for (const [command, baseArgs] of candidates) {
        try {
            const probe = spawnSync(command, [...baseArgs, '--version'], { encoding: 'utf8' });
            if (probe.error || probe.status !== 0) continue;
            if (/Python 3/.test(`${probe.stdout || ''}${probe.stderr || ''}`)) {
                return { command, baseArgs };
            }
        } catch (e) {
            continue;
        }
    }

    return null;
}

module.exports = { resolvePythonCommand };
