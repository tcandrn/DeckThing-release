import React, { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getBackendUrl } from './utils/backend';
import Header from './components/Header';
import ButtonGrid from './components/ButtonGrid';
import ActionEditor from './components/ActionEditor';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';

export default function Dashboard() {
    const { logout } = useAuth();
    const [socket, setSocket] = useState(null);
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState('');
    const [status, setStatus] = useState('Disconnected');
    const [buttons, setButtons] = useState({});
    const [lastPressed, setLastPressed] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState(null);
    const [recordMode, setRecordMode] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [networkUrl, setNetworkUrl] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const gameKeys = Array.from({ length: 12 }, (_, i) => `F${i + 13}`);
    const prevStatusRef = useRef(null);

    useEffect(() => {
        const newSocket = io(getBackendUrl(), {
            withCredentials: true
        });
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    const addNotification = useCallback((type, message) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setNotifications(prev => [...prev.slice(-9), { id, type, message, time }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        if (!socket) return;

        const fetchPorts = () => {
            fetch(`${getBackendUrl()}/ports`, {
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    setPorts(data);
                    if (data.length > 0 && !selectedPort) setSelectedPort(data[0].path);
                })
                .catch(() => { });
        };

        fetchPorts();
        const interval = setInterval(fetchPorts, 2000);

        socket.on('connect_error', (err) => {
            addNotification('error', `Auth Error: ${err.message}`);
            if (err.message === "Invalid token" || err.message === "Authentication required") {
                logout();
            }
        });

        socket.on('config-load', (cfg) => {
            setButtons(cfg);
        });

        socket.on('serial-data', (data) => {
            setLastPressed(data);
            setTimeout(() => setLastPressed(null), 200);

            setButtons(prev => {
                if (prev[data]) return prev;
                const newBtn = { label: `New Button`, type: 'unassigned' };
                socket.emit('save-button', { id: data, data: newBtn });
                addNotification('success', `Auto-Discovered ${data}`);
                return { ...prev, [data]: newBtn };
            });
        });

        socket.on('status', (msg) => {
            setStatus(msg);
            if (prevStatusRef.current !== null && prevStatusRef.current !== msg) {
                addNotification('info', `Status Changed: ${msg}`);
            }
            prevStatusRef.current = msg;
        });

        socket.on('error-message', (msg) => {
            addNotification('error', msg);
        });

        socket.on('network-info', (url) => {
            const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname);
            if (isIP) {
                setNetworkUrl(`http://${window.location.hostname}:${window.location.port}`);
            } else {
                setNetworkUrl(url);
            }
        });

        return () => {
            socket.off('config-load');
            socket.off('serial-data');
            socket.off('status');
            socket.off('error-message');
            socket.off('network-info');
            socket.off('connect_error');
            clearInterval(interval);
        };
    }, [socket, logout, addNotification]);

    const connect = () => {
        if (!socket) return;
        if (!selectedPort) return alert("No Port Selected!");
        setStatus('Connecting...');
        socket.emit('connect-board', selectedPort);
    };

    const disconnect = () => {
        if (!socket) return;
        setStatus('Disconnecting...');
        socket.emit('disconnect-board');
    };

    const quitApp = () => {
        if (!confirm("Really quit DeckThing? Macros will stop working.")) return;
        socket.emit('quit-app');
    };

    const openEditor = (id) => {
        setEditingId(id);
        setEditData({ ...buttons[id] });
        setRecordMode(false);
    };

    const saveEditor = () => {
        socket.emit('save-button', { id: editingId, data: editData });
        addNotification('success', `Saved ${editingId}`);
        setEditingId(null);
    };

    const deleteButton = () => {
        if (!confirm("Delete this button configuration?")) return;
        socket.emit('delete-button', editingId);
        addNotification('info', `Deleted ${editingId}`);
        setEditingId(null);
    };

    const handleKeyDown = useCallback((e) => {
        if (!recordMode) return;
        e.preventDefault();
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('control');
        if (e.shiftKey) modifiers.push('shift');
        if (e.altKey) modifiers.push('alt');
        if (e.metaKey) modifiers.push('command');
        
        let key = e.key;
        const keyMappings = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'PrintScreen': 'prtscn',
            'Escape': 'esc'
        };
        if (keyMappings[key]) {
            key = keyMappings[key];
        } else {
            key = key.toLowerCase();
        }
        
        setEditData(prev => ({ ...prev, modifiers, key }));
        setRecordMode(false);
    }, [recordMode]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!socket) {
        return (
            <div className="min-h-screen bg-[#06070a] text-emerald-500 font-mono flex flex-col items-center justify-center gap-4 relative overflow-hidden select-none">
                <div className="border border-emerald-800 bg-black p-6 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col items-center gap-3">
                    <span className="text-xs font-bold animate-pulse">Connecting to the server...</span>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08090d] text-slate-300 p-8 font-mono relative pb-32 select-none overflow-x-hidden">

            <Header
                ports={ports}
                selectedPort={selectedPort}
                setSelectedPort={setSelectedPort}
                status={status}
                networkUrl={networkUrl}
                connect={connect}
                disconnect={disconnect}
                quitApp={quitApp}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                ports={ports}
                networkUrl={networkUrl}
                addNotification={addNotification}
            />

            {Object.keys(buttons).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[55vh] text-center animate-in fade-in duration-300">
                    <div className="bg-black border-2 border-slate-800 p-8 max-w-xl relative">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-700"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-700"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-700"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-700"></div>

                        <h2 className="text-base font-bold text-emerald-400 mb-4 tracking-wider uppercase">
                            Welcome to DeckThing
                        </h2>
                        
                        <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider font-bold">
                            No button configurations detected. Follow hardware instructions below:
                        </p>

                        <div className="space-y-5 text-left border-t border-slate-900 pt-5 text-xs text-slate-400">
                            <div className="flex items-start gap-4">
                                <div className="bg-slate-900 border border-slate-700 text-slate-300 font-bold px-2.5 py-0.5 text-xs">
                                    01
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Connect the hardware</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Plug the Arduino microcontroller into a local USB interface.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-slate-900 border border-slate-700 text-slate-300 font-bold px-2.5 py-0.5 text-xs">
                                    02
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Select the port</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Select the matching serial COM port from the rack console drop-down.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-slate-900 border border-slate-700 text-slate-300 font-bold px-2.5 py-0.5 text-xs">
                                    03
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Register your buttons</h3>
                                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">Click Connect, then press any key on your hardware pad to auto-register it.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <ButtonGrid
                    buttons={buttons}
                    openEditor={openEditor}
                    lastPressed={lastPressed}
                />
            )}

            <ActionEditor
                editingId={editingId}
                editData={editData}
                setEditData={setEditData}
                saveEditor={saveEditor}
                deleteButton={deleteButton}
                closeEditor={() => setEditingId(null)}
                recordMode={recordMode}
                setRecordMode={setRecordMode}
                gameKeys={gameKeys}
            />

            <Toast notifications={notifications} removeNotification={removeNotification} />
        </div>
    );
}
