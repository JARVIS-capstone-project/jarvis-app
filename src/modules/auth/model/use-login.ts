import { useCallback, useState } from "react";
import { authService } from "@modules/auth/api/auth-service";
import type {
  LoginCredentials,
  LoginSession,
} from "@modules/auth/api/auth-service";
import { useAuthStore } from "@modules/auth/model/auth-store";

interface UseLoginState {
  isSubmitting: boolean;
  error: string | null;
  session: LoginSession | null;
}

interface UseLoginResult extends UseLoginState {
  /** Attempts a login; resolves to the session on success, or null on failure. */
  submit: (credentials: LoginCredentials) => Promise<LoginSession | null>;
  /** Clears the last error message — call when the user edits a field. */
  clearError: () => void;
}

/**
 * Login state machine. Owns submission + error surface only — the form owns
 * field state so uncontrolled inputs stay uncontrolled. The BE isn't wired
 * yet; success just returns the stub session from `authService`.
 */
export function useLogin(): UseLoginResult {
  const [state, setState] = useState<UseLoginState>({
    isSubmitting: false,
    error: null,
    session: null,
  });

  const submit = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const session = await authService.login(credentials);
      // Explicit: only accessToken goes into memory. refreshToken lives in an
      // HttpOnly cookie set by the same BE response — never touched here.
      useAuthStore.getState().setSession(session.accessToken);
      setState({ isSubmitting: false, error: null, session });
      return session;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";
      setState((prev) => ({ ...prev, isSubmitting: false, error: message }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  return { ...state, submit, clearError };
}
