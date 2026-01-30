import { createContext, useContext, useEffect, useState } from 'react';
import { API, setApiToken } from '../lib/ApiService';
import type { AuthUser } from '../lib/types';

type Ctx = {
  user: AuthUser | null;
  token: string | null;
  login: (e: string, p: string) => Promise<void>;
  logout: () => void;
  register: (e: string, p: string, n?: string) => Promise<void>;
};
const AuthCtx = createContext<Ctx>({} as Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Get user from local storage
    const lu = localStorage.getItem('user');
    // Convert to AuthUser type
    if (lu) return JSON.parse(lu) as AuthUser;
    return null;
  });
  const [token, setTok] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  useEffect(() => {
    setApiToken(token);
  }, [token]);
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else localStorage.removeItem('token');
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }, [token, user]);

  async function login(email: string, password: string) {
    const { token, user } = await API.login(email, password);
    setTok(token);
    setUser(user);
  }
  function logout() {
    setTok(null);
    setUser(null);
  }
  async function register(email: string, password: string, name?: string) {
    await API.register(email, password, name);
    await login(email, password);
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthCtx.Provider>
  );
}
export const useAuth = () => useContext(AuthCtx);
