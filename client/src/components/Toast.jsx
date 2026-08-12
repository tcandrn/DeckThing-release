import React from 'react';
import { X, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function Toast({ notifications, removeNotification }) {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3.5 z-50 max-w-sm w-full font-mono pointer-events-auto">
            {notifications.map((n) => {
                let borderClass = 'border-slate-800';
                let textClass = 'text-slate-300';
                let iconColor = 'text-slate-400';
                let title = 'Notice';
                let Icon = Info;

                if (n.type === 'success') {
                    borderClass = 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                    textClass = 'text-emerald-400';
                    iconColor = 'text-emerald-500';
                    title = 'Success';
                    Icon = CheckCircle;
                } else if (n.type === 'error') {
                    borderClass = 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
                    textClass = 'text-red-400';
                    iconColor = 'text-red-500';
                    title = 'Error';
                    Icon = ShieldAlert;
                } else if (n.type === 'info') {
                    borderClass = 'border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.2)]';
                    textClass = 'text-sky-400';
                    iconColor = 'text-sky-500';
                    title = 'Info';
                    Icon = Info;
                }

                return (
                    <div 
                        key={n.id} 
                        className={`bg-black border-2 ${borderClass} p-4 flex items-start gap-4 transition-all duration-150 animate-in slide-in-from-right-6 pointer-events-auto relative`}
                    >
                        

                        <div className={`bg-slate-950 p-2 border border-slate-900 ${iconColor} shrink-0 z-10`}>
                            <Icon size={16} />
                        </div>
                        
                        <div className="flex-1 min-w-0 z-10">
                            <div className={`font-bold text-[10px] uppercase tracking-wider ${iconColor}`}>
                                {title}
                            </div>
                            <div className={`text-xs mt-1 leading-normal ${textClass} break-words font-bold`}>
                                {n.message}
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => removeNotification(n.id)}
                            className="hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-500 hover:text-emerald-400 p-1 transition-colors cursor-pointer z-10 shrink-0"
                            title="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
