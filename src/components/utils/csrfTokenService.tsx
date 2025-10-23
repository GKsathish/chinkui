// csrfTokenService.ts
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

interface CsrfResponse {
  csrfToken: string;
  data: any;
  message: string;
  status: string;
}

interface ApiConfig extends Omit<AxiosRequestConfig, 'method' | 'url'> {
  headers?: Record<string, string>;
  skipTokenCheck?: boolean; // Option to skip token check for specific requests
}

// Define the interface for the service with all methods
interface CsrfTokenService {
  fetchCsrfToken: () => Promise<string | null>;
  getToken: () => Promise<string | null>;
  ensureToken: () => Promise<string | null>;
  api: <T = any>(
    method: Method,
    url: string,
    data?: any,
    customConfig?: ApiConfig
  ) => Promise<AxiosResponse<T>>;
  get: <T = any>(url: string, params?: any, config?: ApiConfig) => Promise<AxiosResponse<T>>;
  post: <T = any>(url: string, data?: any, config?: ApiConfig) => Promise<AxiosResponse<T>>;
  put: <T = any>(url: string, data?: any, config?: ApiConfig) => Promise<AxiosResponse<T>>;
  delete: <T = any>(url: string, data?: any, config?: ApiConfig) => Promise<AxiosResponse<T>>;
  patch: <T = any>(url: string, data?: any, config?: ApiConfig) => Promise<AxiosResponse<T>>;
}

// Add a token fetching state indicator to prevent multiple simultaneous fetch attempts
let isTokenFetching = false;
let tokenFetchPromise: Promise<string | null> | null = null;

// Create the service implementation
const csrfTokenService: CsrfTokenService = {
  // Function to fetch CSRF token and store it
  fetchCsrfToken: async (): Promise<string | null> => {
    // If we're already fetching a token, return the existing promise
    if (isTokenFetching && tokenFetchPromise) {
      return tokenFetchPromise;
    }

    // Set fetching state and create a new promise
    isTokenFetching = true;
    tokenFetchPromise = (async () => {
      try {
        console.log("Making first API call to get CSRF token");
          const secondResponse = await axios.get<CsrfResponse>(`${process.env.REACT_APP_API_URL}/api/`, {
            withCredentials: true,
          });

          // Store the CSRF token in session storage after the second call
          if (secondResponse.data.csrfToken) {
            const token = secondResponse.data.csrfToken;
            console.log("CSRF token obtained:", token);
            sessionStorage.setItem('csrfToken', token);
            return token;
          }

        return null;
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        return null;
      } finally {
        isTokenFetching = false;
        tokenFetchPromise = null;
      }
    })();

    return tokenFetchPromise;
  },

  // Function to get the CSRF token from storage
  getToken: async (): Promise<string | null> => {
    return sessionStorage.getItem('csrfToken');
  },

  // Function to ensure a valid token exists, fetching if needed
  ensureToken: async (): Promise<string | null> => {
    const token = await csrfTokenService.getToken();

    // If token exists, return it
    if (token) {
      return token;
    }

    // No token found, fetch a new one
    // This will wait for both API calls to complete before returning
    const newToken = await csrfTokenService.fetchCsrfToken();

    // Double-check that the token was actually stored
    if (!newToken) {
      console.warn("Failed to obtain CSRF token on first attempt, retrying...");
      return await csrfTokenService.fetchCsrfToken();
    }

    return newToken;
  },

  // Enhanced axios instance with CSRF token handling
  api: async <T = any>(
    method: Method,
    url: string,
    data: any = null,
    customConfig: ApiConfig = {}
  ): Promise<AxiosResponse<T>> => {
    // Skip token check if requested (for example for the token fetch itself)
    let token: string | null = null;

    if (!customConfig.skipTokenCheck) {
      // Ensure a token exists before making the request
      // This will wait for both API calls to complete if needed
      token = await csrfTokenService.ensureToken();
      console.log(`Making ${method} request to ${url} with token:`, token);
    } else {
      token = await csrfTokenService.getToken();
    }

    // Create headers with CSRF token if available
    const headers = {
      ...customConfig.headers,
      ...(token ? { 'X-CSRF-Token': token } : {})
    };

    // Create the config for axios
    const config: AxiosRequestConfig = {
      method,
      url: `${process.env.REACT_APP_API_URL}${url}`,
      ...customConfig,
      headers,
      withCredentials: true
    };

    // Remove skipTokenCheck from config as it's not a valid axios option
    if ('skipTokenCheck' in config) {
      delete (config as any).skipTokenCheck;
    }

    // Add data if available
    if (data) {
      if (method.toLowerCase() === 'get') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    try {
      return await axios<T>(config);
    } catch (error: any) {
      // If we get a 403 Forbidden error, it might be because the CSRF token is invalid
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        console.log("Token error detected, refreshing token");
        // Clear existing token
        sessionStorage.removeItem('csrfToken');

        // Fetch a new token
        const newToken = await csrfTokenService.fetchCsrfToken();

        if (newToken) {
          console.log("Retrying request with new token");
          // Update the token in headers and retry
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': newToken
          };

          try {
            return await axios<T>(config);
          } catch (retryError: any) {
            console.error("Request failed even after token refresh:", retryError);

            // If it's a login request that's failing, we might need to check for session issues
            if (url.includes('/login')) {
              console.warn("Login request failed after token refresh. Possible session issue.");

              // Try one more time with a completely fresh token
              sessionStorage.removeItem('csrfToken');
              const finalToken = await csrfTokenService.fetchCsrfToken();

              if (finalToken) {
                config.headers = {
                  ...config.headers,
                  'X-CSRF-Token': finalToken
                };
                return axios<T>(config);
              }
            }

            throw retryError;
          }
        }
      }

      throw error;
    }
  },

  // Convenience methods for different HTTP methods
  get: <T = any>(url: string, params?: any, config: ApiConfig = {}) =>
    csrfTokenService.api<T>('get', url, params, config),

  post: <T = any>(url: string, data?: any, config: ApiConfig = {}) =>
    csrfTokenService.api<T>('post', url, data, config),

  put: <T = any>(url: string, data?: any, config: ApiConfig = {}) =>
    csrfTokenService.api<T>('put', url, data, config),

  delete: <T = any>(url: string, data?: any, config: ApiConfig = {}) =>
    csrfTokenService.api<T>('delete', url, data, config),

  patch: <T = any>(url: string, data?: any, config: ApiConfig = {}) =>
    csrfTokenService.api<T>('patch', url, data, config)
};

export default csrfTokenService;