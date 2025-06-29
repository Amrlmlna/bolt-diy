import { supabase } from '~/lib/supabaseClient';
import { logger } from '~/utils/logger';

export interface SessionValidationResult {
  isValid: boolean;
  hasSession: boolean;
  hasOnboarding: boolean;
  isOAuthRedirect: boolean;
  error?: string;
}

export class SessionManager {
  private static instance: SessionManager;
  private validationInProgress = false;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Validate current session and onboarding status
   */
  async validateSession(): Promise<SessionValidationResult> {
    if (this.validationInProgress) {
      logger.debug('Session validation already in progress, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.validateSession();
    }

    this.validationInProgress = true;

    try {
      logger.debug('Starting session validation');

      // Check for OAuth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthRedirect = !!(urlParams.get('access_token') || urlParams.get('refresh_token'));

      if (isOAuthRedirect) {
        logger.debug('OAuth redirect detected, processing...');
        await this.handleOAuthRedirect();
      }

      // Get current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        logger.error('Error getting session:', error);
        return {
          isValid: false,
          hasSession: false,
          hasOnboarding: false,
          isOAuthRedirect,
          error: error.message,
        };
      }

      const hasSession = !!session;
      const hasOnboarding = !!localStorage.getItem('onboarding_complete');

      logger.debug('Session validation result', {
        hasSession,
        hasOnboarding,
        isOAuthRedirect,
      });

      return {
        isValid: hasSession && hasOnboarding,
        hasSession,
        hasOnboarding,
        isOAuthRedirect,
      };
    } catch (error) {
      logger.error('Session validation failed:', error);
      return {
        isValid: false,
        hasSession: false,
        hasOnboarding: false,
        isOAuthRedirect: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.validationInProgress = false;
    }
  }

  /**
   * Handle OAuth redirect completion
   */
  private async handleOAuthRedirect(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      logger.warn('OAuth redirect detected but missing tokens');
      return;
    }

    try {
      // Set the session manually
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        logger.error('Error setting OAuth session:', error);
        throw error;
      }

      // Wait for session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify session is now available
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session not established after OAuth redirect');
      }

      logger.debug('OAuth session established successfully');

      // Clear URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } catch (error) {
      logger.error('Failed to handle OAuth redirect:', error);
      throw error;
    }
  }

  /**
   * Clear all authentication-related localStorage items
   */
  clearAuthState(): void {
    localStorage.removeItem('bitstudio_landing_prompt');
    localStorage.removeItem('pending_prompt');
    localStorage.removeItem('onboarding_complete');
    localStorage.removeItem('user_name');
    logger.debug('Auth state cleared');
  }

  /**
   * Get the appropriate redirect URL based on session state
   */
  getRedirectUrl(validation: SessionValidationResult): string {
    if (!validation.hasSession) {
      return '/auth/signin';
    }

    if (!validation.hasOnboarding) {
      return '/onboarding';
    }

    return '/chat';
  }

  /**
   * Check if user should be redirected to landing page
   */
  shouldRedirectToLanding(): boolean {
    // Only redirect to landing if no session and no pending auth flow
    const hasPendingPrompt = !!localStorage.getItem('bitstudio_landing_prompt');
    const hasPendingAuth = !!localStorage.getItem('pending_prompt');

    return !hasPendingPrompt && !hasPendingAuth;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
