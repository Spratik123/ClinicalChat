import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setTokenProvider } from '@/api/client';
import type { AuthUser, Role } from '@/types/domain';

/**
 * Auth state machine. MFA is mandatory for every staff account (BRD 11), so
 * `awaiting_mfa` is a first-class state rather than a modal on top of login.
 */
export type AuthStage = 'loading' | 'anonymous' | 'awaiting_mfa' | 'authenticated';

interface LoginResult {
  /** Opaque handle for the pending MFA challenge. */
  challengeId: string;
  /** Echoed back so the MFA screen can say who is signing in. */
  name: string;
  role: Role;
}

interface AuthContextValue {
  stage: AuthStage;
  user: AuthUser | null;
  pending: LoginResult | null;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  cancelMfa: () => void;
  logout: () => Promise<void>;
  /** Dev-only affordance for exercising the role guards without three accounts. */
  devSwitchRole: (role: Role) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'cc_audit_token';

/** sessionStorage, not localStorage: a closed tab should end the session. */
function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* Storage unavailable — session simply will not survive a reload. */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<AuthStage>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pending, setPending] = useState<LoginResult | null>(null);
  const [token, setToken] = useState<string | null>(readStoredToken);

  // Hand the token to the api client without letting components import it.
  useEffect(() => {
    setTokenProvider(() => token);
  }, [token]);

  // Restore an existing session on first load.
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setStage('anonymous');
      return;
    }

    setTokenProvider(() => token);
    api
      .get<AuthUser>('/auth/session')
      .then((session) => {
        if (cancelled) return;
        setUser(session);
        setStage('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        writeStoredToken(null);
        setToken(null);
        setUser(null);
        setStage('anonymous');
      });

    return () => {
      cancelled = true;
    };
    // Runs once on mount; later token changes are driven by explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResult>('/auth/login', { email, password });
    setPending(result);
    setStage('awaiting_mfa');
  }, []);

  const verifyMfa = useCallback(
    async (code: string) => {
      if (!pending) throw new Error('No MFA challenge in progress.');
      const result = await api.post<{ token: string; user: AuthUser }>('/auth/mfa', {
        challengeId: pending.challengeId,
        code,
      });
      writeStoredToken(result.token);
      setToken(result.token);
      setUser(result.user);
      setPending(null);
      setStage('authenticated');
    },
    [pending],
  );

  const cancelMfa = useCallback(() => {
    setPending(null);
    setStage('anonymous');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* Sign out locally regardless of what the server says. */
    }
    writeStoredToken(null);
    setToken(null);
    setUser(null);
    setPending(null);
    setStage('anonymous');
  }, []);

  const devSwitchRole = useCallback((role: Role) => {
    setUser((current) => (current ? { ...current, role } : current));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ stage, user, pending, login, verifyMfa, cancelMfa, logout, devSwitchRole }),
    [stage, user, pending, login, verifyMfa, cancelMfa, logout, devSwitchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
