import React from 'react';
import { Settings, X, Keyboard, Type, Gamepad2, FileText, Trash2, Save } from 'lucide-react';

export default function ActionEditor({
    editingId,
    editData,
    setEditData,
    saveEditor,
    deleteButton,
    closeEditor,
    recordMode,
    setRecordMode,
    gameKeys
}) {
    if (!editingId || !editData) return null;

    const actionTypes = [
        { id: 'hotkey', icon: Keyboard, label: 'Hotkey' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'game', icon: Gamepad2, label: 'Game' },
        { id: 'script', icon: FileText, label: 'Script' }
    ];

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 font-mono select-none">
            <div className="bg-black border-2 border-slate-700 w-full max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative rounded-sm overflow-hidden z-20">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-500"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-500"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-500"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-500"></div>

                {/* BIOS-style Header Bar */}
                <div className="bg-slate-800 border-b border-slate-700 px-4 py-2.5 flex justify-between items-center text-slate-200">
                    <div className="text-sm font-bold flex items-center gap-2 tracking-wider">
                        <Settings size={16} className="text-slate-400" /> 
                        <span>Editing {editingId}</span>
                    </div>
                    <button onClick={closeEditor} className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Close">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Parameter: Label */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            Label
                        </label>
                        <input
                            value={editData.label || ''}
                            onChange={e => setEditData({ ...editData, label: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 text-emerald-400 rounded-none px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-800 uppercase font-bold"
                            placeholder="untitled"
                            maxLength={80}
                            autoComplete="off"
                        />
                    </div>

                    {/* Parameter: Type selection tabs */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            Action type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {actionTypes.map(t => {
                                const isSelected = editData.type === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setEditData({ ...editData, type: t.id })}
                                        className={`px-1 py-3 border transition-all text-xs font-bold tracking-wider rounded-none flex flex-col items-center gap-2 cursor-pointer
                                            ${isSelected 
                                                ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                                            }
                                        `}
                                    >
                                        <t.icon size={16} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Context Editor box */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            Settings
                        </label>
                        
                        <div className="bg-slate-950 border border-slate-850 p-4 min-h-[170px] flex flex-col justify-center relative">
                            {editData.type === 'hotkey' && (
                                <div className="text-center w-full">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-3.5 font-bold">
                                        Current shortcut
                                    </div>
                                    
                                    <div className="flex justify-center flex-wrap gap-2 text-base font-bold text-emerald-400 mb-5">
                                        {editData.modifiers?.map(m => (
                                            <span key={m} className="bg-slate-900 px-2.5 py-1 border border-slate-800 uppercase text-xs text-slate-400">
                                                {m}
                                            </span>
                                        ))}
                                        <span className="bg-slate-900 px-3 py-1 border-2 border-emerald-800 uppercase text-xs text-emerald-400 shadow-md">
                                            {editData.key ? editData.key.toUpperCase() : "Not set"}
                                        </span>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={() => setRecordMode(!recordMode)} 
                                        className={`w-full py-2.5 font-bold text-xs sm:text-sm transition-colors rounded-none cursor-pointer border ${
                                            recordMode 
                                                ? 'bg-red-950/40 text-red-400 border-red-500/50 animate-pulse' 
                                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                                        }`}
                                    >
                                        {recordMode ? "Press any key..." : "Record a shortcut"}
                                    </button>
                                </div>
                            )}

                            {editData.type === 'text' && (
                                <textarea
                                    value={editData.text || ''}
                                    onChange={e => setEditData({ ...editData, text: e.target.value })}
                                    className="w-full bg-transparent border-none text-emerald-300 h-28 resize-none focus:ring-0 outline-none text-sm placeholder:text-slate-800 leading-relaxed font-bold"
                                    placeholder="enter_string_to_paste..."
                                    maxLength={5000}
                                />
                            )}

                            {editData.type === 'script' && (
                                <textarea
                                    value={editData.script || ''}
                                    onChange={e => setEditData({ ...editData, script: e.target.value })}
                                    className="w-full h-28 bg-transparent border-none text-emerald-300 font-mono text-xs resize-none focus:ring-0 outline-none placeholder:text-slate-800 leading-relaxed font-bold"
                                    placeholder={`TYPE Hello World\nWAIT 500\nPRESS enter\nREM script_comment_here`}
                                    maxLength={10000}
                                />
                            )}

                            {editData.type === 'game' && (
                                <div className="text-center w-full px-4">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">
                                        select_virtual_f_key
                                    </div>
                                    <select
                                        value={editData.key || 'F13'}
                                        onChange={e => setEditData({ ...editData, key: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 text-emerald-400 text-sm px-3.5 py-2.5 outline-none focus:border-slate-700 uppercase font-bold"
                                    >
                                        {gameKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            )}

                            {editData.type === 'unassigned' && (
                                <div className="text-center text-slate-600 text-xs uppercase font-bold tracking-wider">
                                    This button has no action yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Foot buttons bar */}
                <div className="px-6 py-4 border-t border-slate-900 bg-slate-950 flex gap-3">
                    <button 
                        onClick={deleteButton} 
                        className="flex-1 bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 text-slate-600 hover:text-red-400 py-2.5 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1 rounded-none cursor-pointer"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                    <button 
                        onClick={saveEditor} 
                        className="flex-[2] bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500 hover:border-emerald-400 text-emerald-400 py-2.5 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1 rounded-none cursor-pointer"
                    >
                        <Save size={14} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
}
