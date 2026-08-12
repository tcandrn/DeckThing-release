import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBackendUrl } from './utils/backend';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(null); // null = loading, false = setup needed, true = login needed
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${getBackendUrl()}/api/auth/status`);
            const data = await res.json();
            setIsInitialized(data.initialized);
            if (data.initialized) {
                const meRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: 'include' });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setUser(meData);
                }
            }
        } catch (e) {
            console.error("Auth Status Error", e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const res = await fetch(`${getBackendUrl()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
    };

    const setup = async (username, password) => {
        const res = await fetch(`${getBackendUrl()}/api/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
        setIsInitialized(true);
    };

    const logout = async () => {
        try {
            await fetch(`${getBackendUrl()}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {}
        setUser(null);
    };

    const updateUser = async (username, password) => {
        const res = await fetch(`${getBackendUrl()}/api/auth/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
    };

    return (
        <AuthContext.Provider value={{ user, isInitialized, loading, login, setup, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
