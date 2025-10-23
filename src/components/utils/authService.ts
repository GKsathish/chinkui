import { globalWsInstance } from "./WebSocket";

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  userType: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authStateListeners: ((state: AuthState) => void)[] = [];

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Get current auth state
  public getAuthState(): AuthState {
    const token = sessionStorage.getItem("token");
    const username = sessionStorage.getItem("username");
    const userType = sessionStorage.getItem("userType");

    return {
      isAuthenticated: !!token,
      token,
      username,
      userType,
    };
  }

  // Set auth state
  public setAuthState(token: string, username: string, userType?: string): void {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("username", username);
    if (userType) {
      sessionStorage.setItem("userType", userType);
    }

    this.notifyAuthStateChange();
  }

  // Clear auth state and handle logout
  public clearAuthState(reason: string = "Manual logout"): void {
    console.log(`Clearing auth state: ${reason}`);
    
    // Clear session storage
    sessionStorage.clear();
    
    // Close WebSocket connection if exists
    if (globalWsInstance) {
      globalWsInstance.close();
    }

    // Notify listeners
    this.notifyAuthStateChange();
  }

  // Handle token expiration
  public handleTokenExpiration(reason: string = "Token expired"): void {
    console.warn(`Token expiration detected: ${reason}`);
    this.clearAuthState(reason);
    
    // Navigate to login
    this.navigateToLogin();
  }

  // Navigate to login with different methods
  private navigateToLogin(): void {
    // Try postMessage first (for iframe scenarios)
    try {
      window.parent.postMessage({ type: "NAVIGATE_LOGIN" }, "*");
    } catch (error) {
      console.error("PostMessage failed:", error);
    }

    // Try direct navigation as fallback
    try {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Direct navigation failed:", error);
    }
  }

  // Subscribe to auth state changes
  public subscribeToAuthState(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of auth state change
  private notifyAuthStateChange(): void {
    const currentState = this.getAuthState();
    this.authStateListeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error("Error in auth state listener:", error);
      }
    });
  }

  // Check if token exists and is potentially valid
  public hasValidToken(): boolean {
    const token = sessionStorage.getItem("token");
    return !!token && token.length > 0;
  }

  // Validate token with server
  public async validateToken(): Promise<boolean> {
    const token = sessionStorage.getItem("token");
    if (!token) {
      return false;
    }

    try {
      // Import csrfTokenService dynamically to avoid circular dependencies
      const { default: csrfTokenService } = await import("./csrfTokenService");
      
      const response = await csrfTokenService.get(
        `/api/v1/validate-token`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response && response.data.description === "Token valid") {
        return true;
      } else {
        this.handleTokenExpiration("Token validation failed");
        return false;
      }
    } catch (error) {
      console.error("Token validation error:", error);
      this.handleTokenExpiration("Token validation error");
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;
