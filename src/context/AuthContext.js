import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  login as firebaseLogin,
  logout as firebaseLogout,
  signup as firebaseSignup,
  loginWithGoogleIdToken,
} from '../firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const getAuthErrorMessage = useCallback((error, fallback) => {
    const code = error?.code || '';
    if (code.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (code.includes('auth/email-already-in-use')) {
      return 'This email is already registered.';
    }
    if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password')) {
      return 'Invalid email or password.';
    }
    if (code.includes('auth/too-many-requests')) {
      return 'Too many attempts. Try again later.';
    }
    if (code.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    return fallback;
  }, []);

  const signup = useCallback(async ({ email, password }) => {
    try {
      await firebaseSignup(email, password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error, 'Signup failed.') };
    }
  }, [getAuthErrorMessage]);

  const login = useCallback(async ({ email, password }) => {
    try {
      await firebaseLogin(email, password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error, 'Login failed.') };
    }
  }, [getAuthErrorMessage]);

  const loginWithGoogle = useCallback(async ({ idToken }) => {
    try {
      await loginWithGoogleIdToken(idToken);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error, 'Google login failed.') };
    }
  }, [getAuthErrorMessage]);

  const logout = useCallback(async () => {
    await firebaseLogout();
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isLoggedIn: !!currentUser,
      authReady,
      login,
      loginWithGoogle,
      logout,
      signup,
    }),
    [authReady, currentUser, login, loginWithGoogle, logout, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
