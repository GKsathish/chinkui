import React, { Component, ReactNode } from "react";
import authService from "./authService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);
    
    // Check if this is an authentication-related error
    if (this.isAuthError(error)) {
      console.log("Authentication error detected, clearing auth state");
      authService.handleTokenExpiration("Authentication error caught by boundary");
    }
  }

  private isAuthError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const authErrorKeywords = [
      "unauthorized",
      "token",
      "session",
      "expired",
      "forbidden",
      "401",
      "403"
    ];
    
    return authErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  render() {
    if (this.state.hasError) {
      // Check if it's an auth error
      if (this.state.error && this.isAuthError(this.state.error)) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="text-center text-white">
              <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
              <p className="mb-4">Your session has expired. Redirecting to login...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        );
      }

      // Generic error fallback
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center text-white">
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <p className="mb-4">An unexpected error occurred. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
