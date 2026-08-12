const fs = require('fs');
const path = require('path');
const { isValidButtonId, isValidAction } = require('../shared/validation');

class Store {
    constructor(configPath) {
        this.configPath = configPath;
        this.config = {};
        this.load();
    }

    load() {
        if (fs.existsSync(this.configPath)) {
            try {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } catch (e) {
                console.error('Config Load Error:', e);
                this.config = {};
            }
        }
    }

    save() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (e) {
            console.error('Config Save Error:', e);
        }
    }

    get(id) {
        return this.config[id];
    }

    getAll() {
        return this.config;
    }

    set(id, data) {
        if (!isValidButtonId(id)) {
            console.error('Invalid ID format');
            return false;
        }
        if (!isValidAction(data)) {
            console.error('Invalid data format');
            return false;
        }
        this.config[id] = data;
        this.save();
        return true;
    }

    delete(id) {
        if (!isValidButtonId(id)) {
            console.error('Invalid ID format');
            return false;
        }
        delete this.config[id];
        this.save();
        return true;
    }
}

module.exports = Store;
