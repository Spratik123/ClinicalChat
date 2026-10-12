import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, setRefreshHandler, setTokenProvider, setUnauthorizedHandler } from '@/api/client';
import { authApi, meApi } from '@/api/backend/services';
import { toAuthUser } from '@/api/backend/mappers';
import type { LoginResponse } from '@/api/backend/types';
import type { AuthUser, Role } from '@/types/domain';

/**
 * Auth state machine over Cognito (via the backend's /auth routes).
 *
 * An invited user signs in with a temporary password and Cognito answers with a
 * NEW_PASSWORD_REQUIRED challenge instead of tokens, so `awaiting_new_password`
 * is a first-class state rather than a modal on top of login.
 */
export type AuthStage = 'loading' | 'anonymous' | 'awaiting_new_password' | 'authenticated';

interface NewPasswordChallenge {
  email: string;
  /** Opaque Cognito session handle, echoed back when the new password is set. */
  session: string;
}

interface AuthContextValue {
  stage: AuthStage;
  user: AuthUser | null;
  challenge: NewPasswordChallenge | null;
  login: (email: string, password: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  cancelChallenge: () => void;
  logout: () => Promise<void>;
  /** Dev-only affordance for exercising the role guards without three accounts. */
  devSwitchRole: (role: Role) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'cc_audit_token';
const REFRESH_STORAGE_KEY = 'cc_audit_refresh_token';

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

function readStoredRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredRefreshToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(REFRESH_STORAGE_KEY, token);
    else sessionStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch {
    /* Storage unavailable — see writeStoredToken. */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<AuthStage>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [challenge, setChallenge] = useState<NewPasswordChallenge | null>(null);
  const [token, setToken] = useState<string | null>(readStoredToken);

  // Hand the token to the api client without letting components import it.
  useEffect(() => {
    setTokenProvider(() => token);
  }, [token]);

  const refreshTokenRef = useRef<string | null>(readStoredRefreshToken());
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const clearSession = useCallback(() => {
    writeStoredToken(null);
    writeStoredRefreshToken(null);
    refreshTokenRef.current = null;
    setTokenProvider(() => null);
    setToken(null);
    setUser(null);
    setChallenge(null);
    setStage('anonymous');
  }, []);

  // Any 401 on an authenticated call (expired or revoked token) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Renew the access token from the refresh token. Concurrent 401s share one
  // request, since Cognito may rotate the refresh token on use.
  const refreshSession = useCallback((): Promise<string | null> => {
    const refreshToken = refreshTokenRef.current;
    if (!refreshToken) return Promise.resolve(null);
    if (refreshInFlight.current) return refreshInFlight.current;

    const pending = authApi
      .refresh({ refresh_token: refreshToken })
      .then((result) => {
        const accessToken = result.access_token;
        if (!accessToken) return null;
        if (result.refresh_token) {
          refreshTokenRef.current = result.refresh_token;
          writeStoredRefreshToken(result.refresh_token);
        }
        setTokenProvider(() => accessToken);
        writeStoredToken(accessToken);
        setToken(accessToken);
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight.current = null;
      });
    refreshInFlight.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    setRefreshHandler(refreshSession);
    return () => setRefreshHandler(null);
  }, [refreshSession]);

  // Restore an existing session on first load.
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setStage('anonymous');
      return;
    }

    setTokenProvider(() => token);
    meApi
      .get()
      .then((me) => {
        if (cancelled) return;
        setUser(toAuthUser(me));
        setStage('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      });

    return () => {
      cancelled = true;
    };
    // Runs once on mount; later token changes are driven by explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Makes the new token visible to the client, loads the profile, then commits the session. */
  const establishSession = useCallback(async (tokens: LoginResponse) => {
    const accessToken = tokens.access_token;
    if (!accessToken) throw new Error('Sign-in did not return a session. Please try again.');

    // Set synchronously: the /me call below must carry the new token before
    // React has re-rendered and the effect above has run.
    setTokenProvider(() => accessToken);
    try {
      const me = await meApi.get();
      writeStoredToken(accessToken);
      refreshTokenRef.current = tokens.refresh_token ?? null;
      writeStoredRefreshToken(refreshTokenRef.current);
      setToken(accessToken);
      setUser(toAuthUser(me));
      setChallenge(null);
      setStage('authenticated');
    } catch (error) {
      setTokenProvider(() => null);
      throw error;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login({ email, password });

      if (result.challenge_name) {
        if (result.challenge_name !== 'NEW_PASSWORD_REQUIRED' || !result.challenge_session) {
          throw new Error(`Additional sign-in step "${result.challenge_name}" is not supported yet.`);
        }
        setChallenge({ email, session: result.challenge_session });
        setStage('awaiting_new_password');
        return;
      }

      await establishSession(result);
    },
    [establishSession],
  );

  const completeNewPassword = useCallback(
    async (newPassword: string) => {
      if (!challenge) throw new Error('No sign-in in progress. Start again.');
      const result = await authApi.completeNewPassword({
        email: challenge.email,
        new_password: newPassword,
        session: challenge.session,
      });
      await establishSession(result);
    },
    [challenge, establishSession],
  );

  const cancelChallenge = useCallback(() => {
    setChallenge(null);
    setStage('anonymous');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Sign out locally regardless of what the server says.
      if (!(error instanceof ApiError)) console.warn('[auth] logout request failed', error);
    }
    clearSession();
  }, [clearSession]);

  const devSwitchRole = useCallback((role: Role) => {
    setUser((current) => (current ? { ...current, role, permissions: undefined } : current));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ stage, user, challenge, login, completeNewPassword, cancelChallenge, logout, devSwitchRole }),
    [stage, user, challenge, login, completeNewPassword, cancelChallenge, logout, devSwitchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
