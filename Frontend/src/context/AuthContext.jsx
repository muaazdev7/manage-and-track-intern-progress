import { useCallback, useEffect, useState } from 'react';

import {
  loginRequest,
  logoutRequest,
  getMeRequest,
} from '../api/auth';
import AuthContext from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Ask the server who we are, using only the cookie. */
  const refreshUser = useCallback(async () => {
    try {
      const me = await getMeRequest();
      setUser(me);
      return me;
    } catch {
      // 401 here just means "not logged in" — not an error worth surfacing.
      setUser(null);
      return null;
    }
  }, []);

  // Runs once on mount so a hard refresh doesn't log the user out.
  // The lint rule targets synchronous setState in an effect; this is the
  // legitimate case it excludes — bootstrapping from an external system
  // (the server session) with the state set in an async callback.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const loggedIn = await loginRequest(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Clear local state even if the request failed, so the UI can't get
      // stuck in a logged-in state the server disagrees with.
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
