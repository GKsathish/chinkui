import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "./authService";
interface WebSocketOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: () => void;
}

// Single global WebSocket instance
export let globalWsInstance: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 1000;
const RECONNECT_DELAY = 5000;

// Shared list of message listeners for handling WebSocket messages
const messageListeners: Array<(data: any) => void> = [];

export function useWebSocket({ onError, onClose, onOpen }: Omit<WebSocketOptions, 'onMessage'>) {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const messageQueueRef = useRef<(string | object)[]>([]);
  const navigate = useNavigate();
  
  const connectWebSocket = useCallback(() => {
    if (globalWsInstance?.readyState === WebSocket.OPEN) {
      console.log("Using existing WebSocket connection");
      setIsConnected(true);
      onOpen?.();
      return;
    }

    if (globalWsInstance?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket connection is already in progress");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      console.log("No token found. Skipping WebSocket connection.");
      return;
    }

    const url = `${process.env.REACT_APP_SOCKET_URL}/user/auth?authorization=Bearer ${token}`;
    console.log("Creating new WebSocket connection");

    try {
      const ws = new WebSocket(url);
      globalWsInstance = ws;

      ws.onopen = () => {
        console.log("WebSocket connection opened");
        setIsConnected(true);
        reconnectAttempts = 0;
        onOpen?.();

        // Process any queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message) sendMessage(message);
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.operation === "info") {
            sessionStorage.setItem("ws_info", JSON.stringify(data));
            console.log("Stored info message in sessionStorage:", data);
          }
          if (data?.data?.status === "401 Session Expired") {
            console.log("Session expired detected via WebSocket");
            // Use auth service to handle token expiration
            authService.handleTokenExpiration("WebSocket session expired");
            return;
          }
          // Dispatch the message to all registered listeners
          messageListeners.forEach((listener) => listener(data));
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };

      ws.onerror = (error: Event) => {
        // sessionStorage.clear();
        // globalWsInstance?.close();
        // navigate("/login"); // Redirect to login
        // location.reload();
        console.error("WebSocket error:", error);
        setIsConnected(false);
        onError?.(error);
      };

      ws.onclose = (event: CloseEvent) => {
        console.log("WebSocket connection closed");
        setIsConnected(false);
        globalWsInstance = null;
        onClose?.(event);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && sessionStorage.getItem("token")) {
          reconnectAttempts++;
          console.log(`Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setIsConnected(false);
    }
  }, [onError, onClose, onOpen]);

  const sendMessage = useCallback((message: string | object) => {
    if (!globalWsInstance || globalWsInstance.readyState !== WebSocket.OPEN) {
      console.log("WebSocket is not open. Queueing message.");
      messageQueueRef.current.push(message);
      return;
    }

    try {
      const messageString = typeof message === "string" ? message : JSON.stringify(message);
      globalWsInstance.send(messageString);
    } catch (error) {
      console.error("Error sending message:", error);
      messageQueueRef.current.push(message);
    }
  }, []);

  const addMessageListener = useCallback((listener: (data: any) => void) => {
    if (!messageListeners.includes(listener)) {
      messageListeners.push(listener);
    }
  }, []);

  const removeMessageListener = useCallback((listener: (data: any) => void) => {
    const index = messageListeners.indexOf(listener);
    if (index !== -1) {
      messageListeners.splice(index, 1);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (!globalWsInstance || globalWsInstance.readyState !== WebSocket.OPEN) {
          console.log("Page visible, checking WebSocket connection");
          reconnectAttempts = 0; // Reset reconnect attempts on visibility change
          connectWebSocket();
        }
      }
    };

    const handleOnline = () => {
      console.log("Network connection restored");
      reconnectAttempts = 0; // Reset reconnect attempts when network is restored
      connectWebSocket();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  return { sendMessage, isConnected, addMessageListener, removeMessageListener };
}
