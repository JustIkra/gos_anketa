import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getToken, setToken, clearToken } from '../api/client';
import { login as apiLogin } from '../api/endpoints';

interface AuthState {
  token: string | null;
  role: 'admin' | 'editor' | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function decodeRole(token: string): 'admin' | 'editor' | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!));
    const role = payload.role as string | undefined;
    if (role === 'admin' || role === 'editor') return role;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    const stored = getToken();
    if (stored && decodeRole(stored)) return stored;
    return null;
  });
  const [role, setRole] = useState<'admin' | 'editor' | null>(() => {
    const stored = getToken();
    return stored ? decodeRole(stored) : null;
  });
  const [loading] = useState(false);

  const login = useCallback(async (password: string) => {
    const response = await apiLogin(password);
    setToken(response.token);
    setTokenState(response.token);
    const decoded = decodeRole(response.token);
    setRole(decoded);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      role,
      login,
      logout,
      isAdmin: role === 'admin',
      loading,
    }),
    [token, role, login, logout, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
