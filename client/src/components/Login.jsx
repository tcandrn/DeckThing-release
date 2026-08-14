import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Lock, User, ShieldAlert } from 'lucide-react';

export default function Login() {
    const { isInitialized, login, setup } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isInitialized) {
                await login(username, password);
            } else {
                await setup(username, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-mono text-emerald-500 flex items-center justify-center p-6 select-none relative overflow-hidden">
            
            <div className="w-full max-w-lg bg-black border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] p-8 relative rounded-sm z-0">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>

                <div className="text-center mb-8 border-b border-emerald-800 pb-6">
                    <pre className="text-[8px] sm:text-[10px] md:text-[11px] text-emerald-400 font-bold leading-tight select-none">
{` ___  ____ ____ _  _ ___ _  _ _ _  _ ____
 |  \\ |___ |    |_/   |  |__| | |\\ | | __
 |__/ |___ |___ | \\_  |  |  | | | \\| |__|`}
                    </pre>
                    <div className="text-xs text-emerald-600 mt-4 uppercase tracking-widest font-bold">
                        DIY modular hardware deck interface
                    </div>
                </div>



                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-950/40 border border-red-500/40 text-red-400 text-sm p-4 flex items-start gap-3">
                            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold uppercase block mb-0.5">Error</span>
                                <span className="text-red-300">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="text-xs text-emerald-600 uppercase mb-2 block font-bold tracking-wider">
                                Username
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3.5 text-emerald-600" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-slate-950 border border-emerald-800 focus:border-emerald-400 text-emerald-300 px-10 py-3 outline-none text-sm transition-colors placeholder:text-emerald-950"
                                    placeholder="e.g. admin"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-emerald-600 uppercase mb-2 block font-bold tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3.5 text-emerald-600" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-emerald-800 focus:border-emerald-400 text-emerald-300 px-10 py-3 outline-none text-sm transition-colors placeholder:text-emerald-950"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-emerald-500 text-black hover:bg-emerald-400 active:bg-emerald-600 h-12 transition-all flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-wider border border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 mt-4 cursor-pointer"
                        >
                            {loading ? 'Please wait...' : (isInitialized ? 'Log in' : 'Create account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
