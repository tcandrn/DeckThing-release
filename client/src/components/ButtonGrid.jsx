import React from 'react';
import { Gamepad2, Keyboard, Type, FileText, Plus } from 'lucide-react';

export default function ButtonGrid({ buttons, openEditor, lastPressed }) {
    return (
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 p-6 bg-black/40 border border-slate-900/60 rounded-sm">
            {Object.entries(buttons).map(([id, btn]) => {
                const isActive = lastPressed === id;
                const isUnassigned = btn.type === 'unassigned';
                
                // Color coding for retro keycap labels based on type
                let keycapBorderColor = 'border-slate-800 hover:border-slate-600';
                let glowEffect = '';
                
                if (isActive) {
                    keycapBorderColor = 'border-emerald-400 bg-emerald-950/20';
                    glowEffect = 'shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                }

                return (
                    <div
                        key={id}
                        onClick={() => openEditor(id)}
                        className={`aspect-square bg-slate-950 rounded-lg cursor-pointer transition-all duration-100 flex flex-col items-center justify-between p-5 border-2 relative select-none
                            ${keycapBorderColor} ${glowEffect}
                            ${isActive 
                                ? 'translate-y-[6px] shadow-none' 
                                : 'shadow-[0_6px_0_rgba(30,41,59,0.9)] hover:translate-y-[2px] hover:shadow-[0_4px_0_rgba(30,41,59,0.9)] active:translate-y-[6px] active:shadow-none'
                            }
                        `}
                    >
                        {/* Keycap Bevel Outline Effect */}
                        <div className="absolute inset-1 border border-slate-900/60 pointer-events-none rounded-md"></div>

                        {/* Top: Pin ID */}
                        <div className="bg-slate-900 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border border-slate-800 z-10">
                            {id}
                        </div>

                        {/* Middle: Icon / Glyph */}
                        <div className={`p-3 rounded-md transition-all z-10 ${
                            isUnassigned 
                                ? 'text-slate-800' 
                                : isActive 
                                    ? 'text-emerald-400' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                        }`}>
                            {btn.type === 'game' && <Gamepad2 size={28} />}
                            {btn.type === 'hotkey' && <Keyboard size={28} />}
                            {btn.type === 'text' && <Type size={28} />}
                            {btn.type === 'script' && <FileText size={28} />}
                            {isUnassigned && <Plus size={28} className="stroke-[3]" />}
                        </div>

                        {/* Bottom: Button Label */}
                        <div className="text-center w-full z-10 px-1">
                            <div className={`font-bold text-xs sm:text-sm truncate uppercase tracking-wide ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {btn.label || "Unassigned"}
                            </div>
                            <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-1">
                                {isUnassigned ? "No action" : btn.type}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
