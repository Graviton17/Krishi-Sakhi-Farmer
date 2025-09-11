import type { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useIsClient } from "../hooks/useIsClient";
import { authService } from "../services/auth";
import type { ServiceError, ServiceResponse } from "../services/types";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: ServiceError | null;
}

interface AuthActions {
  signUp: (data: {
    email: string;
    password: string;
    userData?: any;
  }) => Promise<
    ServiceResponse<{ user: User | null; session: Session | null }>
  >;
  signIn: (data: {
    email: string;
    password: string;
  }) => Promise<
    ServiceResponse<{ user: User | null; session: Session | null }>
  >;
  signOut: () => Promise<ServiceResponse<void>>;
  resetPassword: (email: string) => Promise<ServiceResponse<void>>;
  getCurrentUser: () => Promise<ServiceResponse<User>>;
  clearError: () => void;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ServiceError | null>(null);
  const isClient = useIsClient();

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Skip initialization during SSR
      if (!isClient) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get current session from Supabase
        const sessionResult = await authService.getCurrentSession();

        if (!mounted) return;

        if (sessionResult.success && sessionResult.data) {
          // We have a valid session
          setSession(sessionResult.data);

          // Get the user data
          const userResult = await authService.getCurrentUser();
          if (userResult.success && userResult.data) {
            setUser(userResult.data);
          }
        } else {
          // No session found, user needs to sign in
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          const serviceError: ServiceError = {
            code: "AUTH_INIT_ERROR",
            message: "Failed to initialize authentication",
            details: { originalError: err },
            timestamp: new Date().toISOString(),
          };
          setError(serviceError);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [isClient]);

  // Set up auth state listener
  useEffect(() => {
    // Skip listener setup during SSR
    if (!isClient) {
      return;
    }

    const subscription = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setError(null); // Clear errors on auth state change

        if (event === "SIGNED_OUT") {
          // Clear any cached data when user signs out
          setUser(null);
          setSession(null);
        }
      }
    );

    return subscription;
  }, [isClient]);

  const signUp = async (data: {
    email: string;
    password: string;
    userData?: any;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signUp(data);

      if (result.success && result.data) {
        setSession(result.data.session);
        setUser(result.data.user);
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const serviceError: ServiceError = {
        code: "SIGNUP_ERROR",
        message: "An unexpected error occurred during sign up",
        details: { originalError: err },
        timestamp: new Date().toISOString(),
      };

      setError(serviceError);
      return { data: null, error: serviceError, success: false };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      console.log("AuthContext: Attempting sign in");
      const result = await authService.signIn(data);

      if (result.success && result.data) {
        console.log("AuthContext: Sign in successful, fetching user");
        setSession(result.data.session);

        // Fetch fresh user data after successful sign in
        const userResult = await authService.getCurrentUser();
        if (userResult.success && userResult.data) {
          console.log(
            "AuthContext: User data fetched successfully:",
            userResult.data.id
          );
          setUser(userResult.data);
        } else {
          console.error(
            "AuthContext: Failed to fetch user data:",
            userResult.error
          );
          setError(userResult.error);
          return { data: null, error: userResult.error, success: false };
        }
      } else if (result.error) {
        console.error("AuthContext: Sign in failed:", result.error);
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error("AuthContext: Unexpected error during sign in:", err);
      const serviceError: ServiceError = {
        code: "SIGNIN_ERROR",
        message: "An unexpected error occurred during sign in",
        details: { originalError: err },
        timestamp: new Date().toISOString(),
      };

      setError(serviceError);
      return { data: null, error: serviceError, success: false };
    } finally {
      setLoading(false);
    }
  };
  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signOut();

      if (result.success) {
        setSession(null);
        setUser(null);
      } else if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const serviceError: ServiceError = {
        code: "SIGNOUT_ERROR",
        message: "An unexpected error occurred during sign out",
        details: { originalError: err },
        timestamp: new Date().toISOString(),
      };

      setError(serviceError);
      return { data: null, error: serviceError, success: false };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);

    try {
      const result = await authService.resetPassword({ email });

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const serviceError: ServiceError = {
        code: "PASSWORD_RESET_ERROR",
        message: "An unexpected error occurred during password reset",
        details: { originalError: err },
        timestamp: new Date().toISOString(),
      };

      setError(serviceError);
      return { data: null, error: serviceError, success: false };
    }
  };

  const getCurrentUser = async () => {
    try {
      const result = await authService.getCurrentUser();

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const serviceError: ServiceError = {
        code: "GET_USER_ERROR",
        message: "An unexpected error occurred while fetching user",
        details: { originalError: err },
        timestamp: new Date().toISOString(),
      };

      setError(serviceError);
      return { data: null, error: serviceError, success: false };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    // State
    user,
    session,
    loading,
    error,

    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    getCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
