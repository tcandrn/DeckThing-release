import React from 'react';
import { Power, PowerOff, LogOut, Terminal, Settings } from 'lucide-react';

export default function Header({
    ports,
    selectedPort,
    setSelectedPort,
    status,
    networkUrl,
    connect,
    disconnect,
    quitApp,
    onOpenSettings
}) {
    const isConnected = status === 'Connected';
    const isConnecting = status === 'Connecting...';
    
    return (
        <div className="max-w-6xl mx-auto mb-8 font-mono select-none">
            {/* Retro Rackmount Panel */}
            <div className="bg-black border-2 border-slate-800 p-5 relative rounded-sm flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                {/* Corner bracket styling */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-700"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-700"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-700"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-700"></div>

                {/* Left section: Brand & Status indicators */}
                <div className="flex items-center gap-4">
                    <div className="text-emerald-400 font-bold tracking-widest text-lg">
                        DECKTHING
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <div className="text-xs tracking-wider uppercase text-slate-500">
                            Status: <span className="text-slate-300 font-bold">{status}</span>
                        </div>
                        {networkUrl && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                <Terminal size={12} />
                                <span>Address: <a href={networkUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-500">{networkUrl}</a></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right section: Control deck inputs */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Port</span>
                        <select
                            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 outline-none focus:border-slate-600 transition-colors uppercase font-bold"
                            value={selectedPort}
                            onChange={(e) => setSelectedPort(e.target.value)}
                            disabled={isConnected}
                        >
                            {ports.length === 0 && <option value="">No device found</option>}
                            {ports.map(p => <option key={p.path} value={p.path}>{p.path}</option>)}
                        </select>
                    </div>

                    {isConnected ? (
                        <button
                            onClick={disconnect}
                            className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 hover:border-red-400 text-red-400 px-4 py-2 font-bold text-xs transition-colors flex items-center gap-1.5 rounded-none cursor-pointer"
                        >
                            <PowerOff size={14} /> Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className={`px-4 py-2 font-bold text-xs transition-colors flex items-center gap-1.5 rounded-none ${
                                isConnecting
                                    ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 cursor-pointer'
                            }`}
                        >
                            <Power size={14} className={isConnecting ? 'animate-pulse' : ''} />
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    )}

                    <button 
                        onClick={onOpenSettings} 
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-emerald-400 px-3 py-2 font-bold text-xs transition-colors flex items-center gap-1 rounded-none cursor-pointer"
                        title="Settings"
                    >
                        <Settings size={14} /> Settings
                    </button>

                    <div className="w-[1px] h-6 bg-slate-800 hidden sm:block"></div>

                    <button 
                        onClick={quitApp} 
                        className="bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 text-slate-600 hover:text-red-400 px-3 py-2 font-bold text-xs transition-colors flex items-center gap-1 rounded-none cursor-pointer"
                        title="Quit DeckThing"
                    >
                        <LogOut size={14} /> Quit
                    </button>
                </div>
            </div>
        </div>
    );
}
