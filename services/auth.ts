/**
 * Enhanced Authentication Service following industrial standard practices
 * Uses Service Layer pattern with proper error handling, validation, and logging
 */

import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase/client";
import { logger } from "./logger";
import type { ServiceError, ServiceResponse } from "./types";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  password: string;
}

export interface IAuthService {
  signUp(credentials: AuthCredentials): Promise<ServiceResponse<AuthResult>>;
  signIn(credentials: AuthCredentials): Promise<ServiceResponse<AuthResult>>;
  signOut(): Promise<ServiceResponse<void>>;
  getCurrentSession(): Promise<ServiceResponse<Session>>;
  getCurrentUser(): Promise<ServiceResponse<User>>;
  resetPassword(request: ResetPasswordRequest): Promise<ServiceResponse<void>>;
  resendConfirmation(email: string): Promise<ServiceResponse<void>>;
  updatePassword(
    request: UpdatePasswordRequest
  ): Promise<ServiceResponse<void>>;
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void;
}

export class AuthService implements IAuthService {
  private logger = logger;

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    return password.length >= 6; // Minimum password length
  }

  private handleAuthError(
    error: AuthError | unknown,
    operation: string
  ): ServiceError {
    this.logger.error(`Auth operation failed: ${operation}`, error as Error);

    if (error && typeof error === "object" && "message" in error) {
      const authError = error as AuthError;
      return {
        code: authError.message.includes("Invalid login")
          ? "INVALID_CREDENTIALS"
          : "AUTH_ERROR",
        message: this.getUserFriendlyAuthMessage(authError.message),
        details: {
          originalError: authError.message,
          operation,
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: "UNKNOWN_AUTH_ERROR",
      message: "An unexpected authentication error occurred",
      details: { originalError: error, operation },
      timestamp: new Date().toISOString(),
    };
  }

  private getUserFriendlyAuthMessage(message: string): string {
    const errorMessages: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "Email not confirmed": "Please check your email and confirm your account",
      "Password should be at least 6 characters":
        "Password must be at least 6 characters long",
      "User already registered": "An account with this email already exists",
      "Signup requires a valid password": "Please provide a valid password",
      "Unable to validate email address":
        "Please provide a valid email address",
      "Email rate limit exceeded":
        "Too many email attempts. Please try again later",
    };

    return errorMessages[message] || message;
  }

  private createSuccessResponse<T>(
    data: T,
    operation: string
  ): ServiceResponse<T> {
    this.logger.businessEvent(`auth_${operation}_success`, {
      userId:
        data && typeof data === "object" && "id" in data
          ? (data as any).id
          : "unknown",
    });
    return {
      data,
      error: null,
      success: true,
    };
  }

  private createErrorResponse<T>(error: ServiceError): ServiceResponse<T> {
    return {
      data: null,
      error,
      success: false,
    };
  }

  /**
   * Sign up a new user with validation
   */
  async signUp(
    credentials: AuthCredentials
  ): Promise<ServiceResponse<AuthResult>> {
    try {
      this.logger.info("Auth signup attempt", { email: credentials.email });

      // Validation
      if (!this.validateEmail(credentials.email)) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Please provide a valid email address",
          details: { field: "email" },
          timestamp: new Date().toISOString(),
        });
      }

      if (!this.validatePassword(credentials.password)) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters long",
          details: { field: "password" },
          timestamp: new Date().toISOString(),
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return this.createErrorResponse(this.handleAuthError(error, "signup"));
      }

      const result: AuthResult = {
        user: data.user,
        session: data.session,
      };

      return this.createSuccessResponse(result, "signup");
    } catch (error) {
      return this.createErrorResponse(this.handleAuthError(error, "signup"));
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(
    credentials: AuthCredentials
  ): Promise<ServiceResponse<AuthResult>> {
    try {
      this.logger.info("Auth signin attempt", { email: credentials.email });

      // Validation
      if (!this.validateEmail(credentials.email)) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Please provide a valid email address",
          details: { field: "email" },
          timestamp: new Date().toISOString(),
        });
      }

      if (!credentials.password) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Password is required",
          details: { field: "password" },
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.debug("Attempting to sign in with Supabase", {
        emailLength: credentials.email.length,
        passwordLength: credentials.password.length,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return this.createErrorResponse(this.handleAuthError(error, "signin"));
      }

      const result: AuthResult = {
        user: data.user,
        session: data.session,
      };

      return this.createSuccessResponse(result, "signin");
    } catch (error) {
      return this.createErrorResponse(this.handleAuthError(error, "signin"));
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<ServiceResponse<void>> {
    try {
      this.logger.info("Auth signout attempt");

      const { error } = await supabase.auth.signOut();

      if (error) {
        return this.createErrorResponse(this.handleAuthError(error, "signout"));
      }

      return this.createSuccessResponse(undefined, "signout");
    } catch (error) {
      return this.createErrorResponse(this.handleAuthError(error, "signout"));
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession(): Promise<ServiceResponse<Session>> {
    try {
      this.logger.debug("Getting current session");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        return this.createErrorResponse(
          this.handleAuthError(error, "get_session")
        );
      }

      if (!session) {
        return this.createErrorResponse({
          code: "NO_SESSION",
          message: "No active session found",
          details: { operation: "get_session" },
          timestamp: new Date().toISOString(),
        });
      }

      return this.createSuccessResponse(session, "get_session");
    } catch (error) {
      return this.createErrorResponse(
        this.handleAuthError(error, "get_session")
      );
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ServiceResponse<User>> {
    try {
      this.logger.debug("Getting current user");

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        return this.createErrorResponse(
          this.handleAuthError(error, "get_user")
        );
      }

      if (!user) {
        return this.createErrorResponse({
          code: "NO_USER",
          message: "No authenticated user found",
          details: { operation: "get_user" },
          timestamp: new Date().toISOString(),
        });
      }

      return this.createSuccessResponse(user, "get_user");
    } catch (error) {
      return this.createErrorResponse(this.handleAuthError(error, "get_user"));
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ServiceResponse<void>> {
    try {
      this.logger.info("Password reset attempt", { email: request.email });

      if (!this.validateEmail(request.email)) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Please provide a valid email address",
          details: { field: "email" },
          timestamp: new Date().toISOString(),
        });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        request.email
      );

      if (error) {
        return this.createErrorResponse(
          this.handleAuthError(error, "reset_password")
        );
      }

      return this.createSuccessResponse(undefined, "reset_password");
    } catch (error) {
      return this.createErrorResponse(
        this.handleAuthError(error, "reset_password")
      );
    }
  }

  /**
   * Resend email confirmation
   */
  async resendConfirmation(email: string): Promise<ServiceResponse<void>> {
    try {
      this.logger.info("Resend confirmation attempt", { email });

      if (!this.validateEmail(email)) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Please provide a valid email address",
          details: { field: "email" },
          timestamp: new Date().toISOString(),
        });
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        return this.createErrorResponse(
          this.handleAuthError(error, "resend_confirmation")
        );
      }

      return this.createSuccessResponse(undefined, "resend_confirmation");
    } catch (error) {
      return this.createErrorResponse(
        this.handleAuthError(error, "resend_confirmation")
      );
    }
  }

  /**
   * Update user password
   */
  async updatePassword(
    request: UpdatePasswordRequest
  ): Promise<ServiceResponse<void>> {
    try {
      this.logger.info("Password update attempt");

      if (!this.validatePassword(request.password)) {
        return this.createErrorResponse({
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters long",
          details: { field: "password" },
          timestamp: new Date().toISOString(),
        });
      }

      const { error } = await supabase.auth.updateUser({
        password: request.password,
      });

      if (error) {
        return this.createErrorResponse(
          this.handleAuthError(error, "update_password")
        );
      }

      return this.createSuccessResponse(undefined, "update_password");
    } catch (error) {
      return this.createErrorResponse(
        this.handleAuthError(error, "update_password")
      );
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void {
    this.logger.debug("Setting up auth state listener");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      this.logger.info("Auth state changed", {
        event,
        userId: session?.user?.id,
      });
      callback(event, session);
    });

    return () => {
      this.logger.debug("Removing auth state listener");
      subscription.unsubscribe();
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

// Legacy exports for backward compatibility
export { AuthService as AuthServiceClass };
