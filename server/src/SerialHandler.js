const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const CONFIG = require('./config');

class SerialHandler {
    constructor(io, onData) {
        this.io = io;
        this.port = null;
        this.isConnected = false;
        this.onData = onData || null;
    }

    async listPorts() {
        try {
            return await SerialPort.list();
        } catch (e) {
            return [];
        }
    }

    connect(path) {
        if (this.port && this.port.isOpen) {
            this.port.close();
        }

        console.log(`Connecting to ${path}...`);
        this.io.emit('status', 'Connecting...');
        this.hasError = false;

        try {
            this.port = new SerialPort({ path, baudRate: CONFIG.BAUD_RATE });
            const parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

            this.port.on('open', () => {
                this.isConnected = true;
                this.io.emit('status', 'Connected');
                console.log('Serial Port Opened');
            });

            parser.on('data', (data) => {
                if (!this.isConnected) return;
                const clean = data.trim();
                this.io.emit('serial-data', clean);
                if (this.onData) this.onData(clean);
            });

            this.port.on('error', (err) => {
                this.isConnected = false;
                this.hasError = true;
                this.io.emit('status', 'Error: ' + err.message);
                console.error('Serial Error:', err.message);
            });

            this.port.on('close', () => {
                this.isConnected = false;
                if (!this.hasError) {
                    this.io.emit('status', 'Disconnected');
                }
                console.log('Serial Port Closed');
            });

        } catch (err) {
            this.isConnected = false;
            this.hasError = true;
            this.io.emit('status', 'Failed: ' + err.message);
            console.error('Connection Failed:', err.message);
        }
    }

    disconnect() {
        if (this.port && this.port.isOpen) {
            this.port.close();
        }
        this.isConnected = false;
        this.io.emit('status', 'Disconnected');
    }
}

module.exports = SerialHandler;
