import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { X, User, Settings, Info, Lock } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, ports, networkUrl, addNotification }) {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('account');
    const [newUsername, setNewUsername] = useState(user?.username || '');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleUpdateCredentials = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await updateUser(newUsername, newPassword);
            setSuccess('Account updated');
            setNewPassword('');
            if (addNotification) {
                addNotification('success', 'Account details updated');
            }
        } catch (err) {
            setError(err.message || 'Could not update account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
            <div className="w-full max-w-2xl bg-black border-2 border-slate-700 p-6 relative rounded-sm shadow-2xl flex flex-col h-[550px]">
                {/* Corner bracket styling */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-500"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-500"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-500"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-500"></div>

                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                    <div className="text-sm font-bold text-emerald-400 tracking-wider flex items-center gap-2">
                        <Settings size={16} /> Settings
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Body Grid */}
                <div className="flex flex-1 min-h-0 gap-4">
                    {/* Left Sidebar Menu */}
                    <div className="w-48 border-r border-slate-800 pr-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold transition-all flex items-center gap-2 rounded-none border ${
                                activeTab === 'account'
                                    ? 'bg-slate-900 border-slate-600 text-emerald-400'
                                    : 'border-transparent text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                            }`}
                        >
                            <User size={14} /> Account
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold transition-all flex items-center gap-2 rounded-none border ${
                                activeTab === 'security'
                                    ? 'bg-slate-900 border-slate-600 text-emerald-400'
                                    : 'border-transparent text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                            }`}
                        >
                            <Lock size={14} /> Security
                        </button>
                        <button
                            onClick={() => setActiveTab('server')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold transition-all flex items-center gap-2 rounded-none border ${
                                activeTab === 'server'
                                    ? 'bg-slate-900 border-slate-600 text-emerald-400'
                                    : 'border-transparent text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                            }`}
                        >
                            <Info size={14} /> Server
                        </button>
                    </div>

                    {/* Content Window */}
                    <div className="flex-1 overflow-y-auto pl-2 pr-1 text-xs text-slate-300">
                        {activeTab === 'account' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-2 uppercase tracking-wide">
                                    Account
                                </h3>

                                <div className="space-y-3 bg-slate-950 p-4 border border-slate-900">
                                    <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[10px]">User ID</span>
                                        <span className="text-slate-300 select-all font-bold">{user?.id || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[10px]">Username</span>
                                        <span className="text-emerald-400 font-bold">{user?.username || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[10px]">Role</span>
                                        <span className="text-slate-300 font-bold">Administrator</span>
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-sm">
                                    <div className="flex items-start gap-3">
                                        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold text-slate-300 block uppercase tracking-wider mb-1">
                                                Your session
                                            </span>
                                            <span className="text-slate-400 leading-relaxed">
                                                Your password is hashed with bcrypt and your session is held in an HttpOnly cookie. Changing your password from the <b>Security</b> tab signs out every active session, including this one.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-2 uppercase tracking-wide">
                                    Change your credentials
                                </h3>

                                {error && (
                                    <div className="bg-red-950/30 border border-red-500/40 text-red-400 p-3 font-bold uppercase tracking-wider">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 p-3 font-bold uppercase tracking-wider">
                                        {success}
                                    </div>
                                )}

                                <form onSubmit={handleUpdateCredentials} className="space-y-4">
                                    <div>
                                        <label className="text-slate-500 uppercase block font-bold text-[10px] mb-1.5">
                                            New username
                                        </label>
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 text-slate-300 px-3 py-2 outline-none"
                                            placeholder="e.g. admin"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-500 uppercase block font-bold text-[10px] mb-1.5">
                                            New password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 text-slate-300 px-3 py-2 outline-none"
                                            placeholder="Min. 6 characters (Optional if only username is changing)"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-400 py-2.5 font-bold uppercase cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'server' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-2 uppercase tracking-wide">
                                    Server
                                </h3>

                                <div className="space-y-3 bg-slate-950 p-4 border border-slate-900 leading-relaxed">
                                    <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[10px]">Address</span>
                                        <span className="text-slate-300 font-bold select-all">{networkUrl || 'http://localhost:3001'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[10px]">Serial ports</span>
                                        <span className="text-slate-300 font-bold">
                                            {ports.length === 0 ? 'None detected' : ports.map(p => p.path).join(', ')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block uppercase font-bold text-[10px]">Engine</span>
                                        <span className="text-slate-300 font-bold">Running (Node.js and Python)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 px-4 py-2 font-bold text-xs transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
