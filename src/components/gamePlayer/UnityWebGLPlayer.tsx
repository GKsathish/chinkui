import Cookies from "js-cookie";
import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  detectDeviceType,
  detectPlatform,
  detectTelegramBrowser,
  enterFullScreen,
  isFullScreen,
  isMobileDevice,
  lockOrientation,
} from "../utils/fullscreenUtils";
import { SpriteAnimation } from "../utils/SpriteAnimation";
import { useWebSocket } from "../utils/WebSocket";
import GamePopups from "../utils/GamePopups";
import isOnline from "is-online";
import { useLocation } from "react-router-dom";
import { Table } from "../../store/tablesModel";
import bougeeLogo from "../../assets/icons/bougeelogo.png";

declare global {
  interface Window {
    redirectToHome: () => void;
    setMusicVolume: (val: number) => void;
    setSoundVolume: (val: number) => void;
    SendMessageToJS: (message: string) => void;
    openLowBalancePopup: () => void;
    openInActivePopup: () => void;
    ReactNativeWebView?: any;
    isInWebView?: boolean;
  }
}

const UnityWebGLPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const unityInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [popupName, setPopupName] = useState<string>(""); // Store game status
  const deviceType = localStorage.getItem("deviceType");
  const username = sessionStorage.getItem("username");
  const [showOverlay, setShowOverlay] = useState(false);
  const lastTapRef = useRef(0);

  const [videoUrl, setVideoUrl] = useState("");
  const [webViewState, setWebViewState] = useState({
    isWebView: false,
    isReady: false,
  });
  const [table, setTable] = useState<Table | undefined>(undefined);

  // Add initialization guards to prevent multiple simultaneous attempts
  const isInitializingRef = useRef(false);
  const initializationAttemptRef = useRef(0);
  const maxInitializationAttempts = 3;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const tableString = queryParams.get("table");
  const userType = queryParams.get("userType");
  const webview = queryParams.get("isWebView");
  const navigate = useNavigate();
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("token", token);
    }
    if (webview) {
      setWebViewState({
        isWebView: webview === "true",
        isReady: true,
      });
    }
    if (tableString) {
      try {
        const parsedTable = JSON.parse(decodeURIComponent(tableString));
        setTable(parsedTable);
        console.log("✅ Table parsed successfully:", parsedTable);
      } catch (error) {
        console.error("❌ Failed to parse tableString:", error);
        setTable(undefined);
      }
    } else {
      console.warn("⚠ No tableString found in URL.");
    }
  }, [tableString, token, webview]);

  console.log(table, tableString, webview);
  const handleVideoLoad = () => {
         // Send message to game.tsx when video loading is disabled
                window.parent.postMessage({ type: "GAME_LOADED" }, "*");
    setIsVideoLoading(false);
  };
  const handleVideoError = (error: any) => {
    console.error("Video loading error:", error);
    setIsVideoLoading(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Force video to play without controls
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("muted", "true");
      video.muted = true;

      // Attempt to start playing as soon as possible
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.error("Video autoplay failed:", err);
        }
      };

      playVideo();

      // Handle video events
      const handleCanPlay = () => {
        setIsVideoLoading(false);
        playVideo();
      };

      video.addEventListener("canplay", handleCanPlay);

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.pause();
        video.src = "";
      };
    }
  }, []);

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      width: table?.orientation === "portrait-primary" ? "420px" : "100%",
      height:
        detectDeviceType() === "mobile" &&
        (detectPlatform() === "ios" || userType)
          ? "100%"
          : table?.orientation === "portrait-primary"
          ? "100%"
          : `min(640px, ${deviceType === "desktop" ? "80%" : "100%"})`,
      minHeight: deviceType === "desktop" ? "370px" : 0,
      position: "relative" as const,
      margin: "auto",
      left:
        table?.orientation === "portrait-primary" && deviceType !== "desktop"
          ? "50%"
          : "auto",
      transform:
        table?.orientation === "portrait-primary" && deviceType !== "desktop"
          ? "translateX(-50%)"
          : "none",
    },
    canvas: {
      flexGrow: 1,
      display: "block",
      width: "100%",
      height: "100%",
      backgroundColor: "transparent",
      WebkitTouchCallout: "none" as const,
      WebkitUserSelect: "none" as const,
      userSelect: "none" as const,
    },
    loader: {
      position: "absolute" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "#fff",
      fontSize: "1.5em",
      fontFamily: "Arial, sans-serif",
      // backgroundColor:"green",
    },
    overlayStyles: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 9999,
      display: showOverlay ? ("flex" as const) : ("none" as const),
      touchAction: "manipulation" as const,
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto" as const,
    },
    instructionText: {
      color: "#fff",
      fontSize: "24px",
      textAlign: "center" as const,
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
      padding: "20px",
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: "10px",
    },
  };
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  const shouldRotateVideo =
    detectDeviceType() === "mobile" &&
    (isIOS || userType) &&
    !webViewState.isWebView &&
    table?.slug !== "china-street";
  const rotatedVideoStyles = shouldRotateVideo
    ? {
        position: "absolute" as const,
        left: "50%",
        top: "50%",
        transformOrigin: "center center",
        transform: "translate(-50%, -50%) rotate(90deg)",
        objectFit: "cover" as const,
        width: "100vh",
        height: "100vw",
        minWidth: "100vh",
        minHeight: "100vw",
      }
    : {};
  const baseVideoStyles = {
    width: "100%",
    height: "100%",
    position: "absolute" as const,
    top: 0,
    left: 0,
    objectFit: "cover" as const,
    zIndex: 10,
    opacity: isVideoLoading ? 0 : 1,
    pointerEvents: "none" as const,
    touchAction: "none" as const,
    playsInline: true,
    WebkitPlaysinline: true,
  };
  const videoStyles = { ...baseVideoStyles };
  const apiUrl = process.env.REACT_APP_API_URL;
  useEffect(() => {
    const redirectToHome = async () => {
      if (
        window.screen.orientation &&
        (window.screen.orientation as any).unlock
      ) {
        try {
          await (window.screen.orientation as any).unlock();
        } catch (error) {
          console.error("Failed to unlock orientation:", error);
        }
      }
      console.log(sessionStorage.getItem("token"));
      await quitUnityInstance();
      console.log("lobby new");
      window.parent.postMessage({ type: "NAVIGATE_LOBBY" }, "*");
    };

    const openInActivePopup = async () => {
      setPopupName("Inactive");
      setIsPopupOpen(true);
    };

    const openLowBalancePopup = async () => {
      setPopupName("LowBalance");
      setIsPopupOpen(true);
    };

    const setMusicVolume = (val: number) => {
      Cookies.set(`${username}_music`, val.toFixed(2), { expires: 365 });
    };

    const setSoundVolume = (val: number) => {
      Cookies.set(`${username}_sound`, val.toFixed(2), { expires: 365 });
    };

    const SendMessageToJS = (message: string) => {
      if (message === "HelloFromUnity") {
        return;
      }
      if (message === "GAME_READY") {
        setLoading(false);
        if (unityInstanceRef.current) {
          unityInstanceRef.current.SendMessage(
            "WebSocket",
            "OnServerUrlReceived",
            apiUrl
          );
          unityInstanceRef.current.SendMessage(
            "WebSocket",
            "OnJSSessionVarReceived",
            sessionStorage.getItem("token")
          );
          unityInstanceRef.current.SendMessage(
            "WebSocket",
            "OnCrfTokenReceived",
            sessionStorage.getItem("csrfToken")
          );
          // unityInstanceRef.current.SendMessage(
          //   "WebSocket",
          //   "GetHomeState",
          // //  userType !== "BOT"?true:false
          // false
          // );
          unityInstanceRef.current.SendMessage(
            "WebSocket",
            "getBetInfo",
            sessionStorage.getItem("ws_info")
          );
          console.log(sessionStorage.getItem("ws_info"), "betinfo");
          unityInstanceRef.current.SendMessage(
            "SoundManager",
            "MusicSettingsFromWeb",
            parseFloat(Cookies.get(`${username}_music`) || "0.50")
          );
          unityInstanceRef.current.SendMessage(
            "SoundManager",
            "SoundSettingsFromWeb",
            parseFloat(Cookies.get(`${username}_sound`) || "0.50")
          );
        }
      }
      console.log("__check Sending message to server in player: ", message);
      sendMessage(message);
    };

    window.redirectToHome = redirectToHome;
    window.setMusicVolume = setMusicVolume;
    window.setSoundVolume = setSoundVolume;
    window.SendMessageToJS = SendMessageToJS;
    window.openInActivePopup = openInActivePopup;
    window.openLowBalancePopup = openLowBalancePopup;
  }, [navigate, username]);
  console.log("abc");
  const initializeUnityInstance = useCallback(async () => {
    // Guard against missing table or multiple initialization attempts
    if (!table || isInitializingRef.current) {
      console.log(
        "🚫 Skipping Unity initialization - table missing or already initializing"
      );
      return;
    }

    // Check WebAssembly support
    if (typeof WebAssembly === "undefined") {
      console.error("❌ WebAssembly not supported in this browser");
      setPopupName("InitializationError");
      setIsPopupOpen(true);
      return;
    }

    // Check if we've exceeded max attempts
    if (initializationAttemptRef.current >= maxInitializationAttempts) {
      console.error("❌ Max Unity initialization attempts exceeded");
      setPopupName("InitializationError");
      setIsPopupOpen(true);
      return;
    }

    try {
      console.log(
        `🔄 Starting Unity initialization attempt ${
          initializationAttemptRef.current + 1
        }/${maxInitializationAttempts}`
      );
      isInitializingRef.current = true;
      initializationAttemptRef.current += 1;

      // Clean up any existing instance
      await quitUnityInstance();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ensure canvas is available
      if (!canvasRef.current) {
        throw new Error("Canvas reference not available");
      }

      const buildUrl = (table?.phase === "4" || table?.phase === "3") ? `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/new-phase/${table?.slug}/maingame.unity3d` : `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/Unity/${table?.slug}/maingame.unity3d`;
        const loaderUrl = (table?.phase === "4" || table?.phase === "3") ?`https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/new-phase/${table?.slug}/loader/Build.loader.js`: `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/loader/Build.loader.js`;

      const config = {
        dataUrl:(table?.phase === "4" || table?.phase === "3") ? `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/new-phase/${table?.slug}/loader/Build.data.unityweb`:`https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/loader/Build.data.unityweb`,
        frameworkUrl:(table?.phase === "4" || table?.phase === "3")? `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/new-phase/${table?.slug}/loader/Build.framework.js.unityweb`: `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/loader/Build.framework.js.unityweb`,
        codeUrl:(table?.phase === "4" || table?.phase === "3") ? `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/new-phase/${table?.slug}/loader/Build.wasm.unityweb`: `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/loader/Build.wasm.unityweb`,
        streamingAssetsUrl: (table?.phase === "4" || table?.phase === "3") ? `https://d1mr0h2b9az9mp.cloudfront.net/tempBuilds/new-phase/${table?.slug}/StreamingAssets`:``,
        companyName: "slot-games",
        productName: table?.tableName,
        productVersion: "1.0",
        runInBackground: true, // Keep the game running even when it loses focus
        // Add memory management settings
        memorySize: 268435456, // 256MB
        autoSyncPersistentDataPath: false,
      };
      return new Promise((resolve, reject) => {
        // Set timeout for the entire initialization process
        const initTimeout = setTimeout(() => {
          reject(new Error("Unity initialization timeout"));
        }, 30000); // 30 second timeout

        const script = document.createElement("script");
        script.src = loaderUrl;
        script.async = true;
        script.type = "text/javascript";

        script.onload = () => {
          if (typeof createUnityInstance !== "undefined" && canvasRef.current) {
            createUnityInstance(canvasRef.current, config, (progress) => {
              // Optional: Update loading progress
              console.log(
                `Unity loading progress: ${(progress * 100).toFixed(1)}%`
              );
            })
              .then(async (unityInstance) => {
                clearTimeout(initTimeout);
                unityInstanceRef.current = unityInstance;

                if (sessionStorage.getItem("token")) {
                  unityInstance.SendMessage(
                    "WebSocket",
                    "GameDetails",
                    `${table?.slug},${buildUrl}`
                  );
                  console.log(`Game details sent: ${table?.slug},${buildUrl}`);
                }

                setIsVideoLoading(false);
                console.log("✅ Unity instance initialized successfully");

           
                // Reset attempt counter on success
                initializationAttemptRef.current = 0;
                resolve(unityInstance);
              })
              .catch((err) => {
                clearTimeout(initTimeout);
                console.error("❌ Unity instance initialization error:", err);
                reject(err);
              });
          } else {
            clearTimeout(initTimeout);
            const error = new Error(
              "createUnityInstance is not defined or canvas not available"
            );
            console.error(error);
            reject(error);
          }
        };

        script.onerror = (error) => {
          clearTimeout(initTimeout);
          console.error("❌ Error loading Unity script:", error);
          reject(error);
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("❌ Unity initialization failed:", error);

      // Retry logic for certain types of errors
      if (initializationAttemptRef.current < maxInitializationAttempts) {
        console.log(`🔄 Retrying Unity initialization in 2 seconds...`);
        setTimeout(() => {
          isInitializingRef.current = false;
          initializeUnityInstance();
        }, 2000);
      } else {
        setPopupName("InitializationError");
        setIsPopupOpen(true);
      }

      throw error;
    } finally {
      isInitializingRef.current = false;
    }
  }, [table]);

  const adjustForDevice = useCallback(() => {
    const container = containerRef.current;
    if (
      detectDeviceType() === "mobile" &&
      detectPlatform() === "android" &&
      !webViewState.isWebView &&
      container
    ) {
      console.log("Enabling fullscreen for mobile.");
      enterFullScreen(container);
      if (table?.orientation) {
        lockOrientation(table.orientation);
      }
    } else {
      console.log("Desktop detected. No fullscreen triggered.");
    }
  }, []);

  const quitUnityInstance = async () => {
    if (unityInstanceRef.current) {
      try {
        console.log("🔄 Starting Unity instance cleanup...");

        // Set flag to prevent new initializations during cleanup
        isInitializingRef.current = true;

        // Attempt to quit the Unity instance
        if (typeof unityInstanceRef.current.Quit === "function") {
          await Promise.race([
            unityInstanceRef.current.Quit(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Unity Quit timeout")), 5000)
            ),
          ]);
        }

        // Clear the reference immediately
        unityInstanceRef.current = null;

        // Remove all Unity-related scripts from DOM
        const scripts = document.querySelectorAll(
          "script[src*='Build.loader.js'], script[src*='unity'], script[src*='wasm']"
        );
        scripts.forEach((script) => {
          try {
            script.parentNode?.removeChild(script);
          } catch (e) {
            console.warn("Failed to remove script:", e);
          }
        });

        // Clear Unity global functions
        (window as any).createUnityInstance = undefined;
        (window as any).unityFramework = undefined;

        // Force garbage collection if available
        if ((window as any).gc) {
          (window as any).gc();
        }

        // Wait for cleanup to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("✅ Unity instance fully disposed and cleaned up");
      } catch (error) {
        console.error("❌ Error during Unity disposal:", error);
        // Force cleanup even if Quit() fails
        unityInstanceRef.current = null;
      } finally {
        // Reset initialization flag
        isInitializingRef.current = false;
      }
    }
  };
  useEffect(() => {
    // Only initialize when all conditions are met and we're not already initializing
    if (
      table &&
      webViewState.isReady &&
      isVideoLoading === false &&
      !isInitializingRef.current &&
      !unityInstanceRef.current
    ) {
      console.log("🚀 Starting Unity initialization...");
      initializeUnityInstance();
      adjustForDevice();
    }

    return () => {
      if (unityInstanceRef.current) {
        quitUnityInstance();
      }
    };
  }, [table?.slug, webViewState.isReady, isVideoLoading]); // Simplified dependencies

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("🧹 UnityWebGLPlayer component unmounting - cleaning up...");
      isInitializingRef.current = false;
      initializationAttemptRef.current = 0;
      if (unityInstanceRef.current) {
        quitUnityInstance();
      }
    };
  }, []);

  const { sendMessage, addMessageListener, removeMessageListener } =
    useWebSocket({
      onOpen: () => console.log("UnityPlayer WebSocket connection opened"),
      onClose: () => console.log("UnityPlayer WebSocket connection closed"),
      onError: (error) => console.error("UnityPlayer WebSocket error:", error),
    });

  const handleMessage = (data: any) => {
    if (unityInstanceRef.current) {
      unityInstanceRef.current.SendMessage(
        "WebSocketBridge",
        "ReceiveMessageFromJS",
        JSON.stringify(data)
      );
    }
  };

  useEffect(() => {
    addMessageListener(handleMessage);
    return () => removeMessageListener(handleMessage);
  }, [addMessageListener, removeMessageListener]);

  useEffect(() => {
    const checkConnectivity = async () => {
      let stat = "No Internet";
      try {
        const online = await isOnline();
        stat = online ? "Wi-Fi" : "No Internet";
      } catch (error) {
        console.error("Error checking connectivity:", error);
        stat = "No Internet";
      }
      setStatus(stat);
    };

    checkConnectivity();

    const intervalId = setInterval(checkConnectivity, 5000);

    const handleOnline = () => checkConnectivity();
    const handleOffline = () => checkConnectivity();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (status === "No Internet") {
      setPopupName("NoInternet");
      setIsPopupOpen(true);
    } else {
      setPopupName("");
      setIsPopupOpen(false);
    }
  }, [status]);
  const handlePopupClose = () => {
    setIsPopupOpen(false);
  };
  const checkFullscreenStatus = () => {
    if (isMobileDevice() && !isIOS) {
      setShowOverlay(!isFullScreen());
    }
  };

  useEffect(() => {
    if (isMobileDevice()) {
      checkFullscreenStatus();
    }
  }, []);

  useEffect(() => {
    const handler = () => checkFullscreenStatus();
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  const handleDoubleTap = (e: React.TouchEvent) => {
    e.preventDefault();
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;

    if (tapLength < 300 && tapLength > 0) {
      requestAnimationFrame(async () => {
        try {
          // Enter full-screen first
          await enterFullScreen(containerRef.current);

          // Delay locking orientation slightly to ensure full-screen is active
          setTimeout(() => {
            if (table?.orientation) {
              lockOrientation(table.orientation);
            }
          }, 200);
        } catch (err) {
          console.error("Error entering full-screen:", err);
        }
      });
    }
    lastTapRef.current = currentTime;
  };
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(
          `https://s3.eu-west-2.amazonaws.com/static.inferixai.link/LoadingScreens/${table?.slug}.mp4`,
          {
            method: "GET",
            headers: {
              // Remove Range header by explicitly not setting it
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch video");
        }

        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        setVideoUrl(objectURL);
      } catch (error) {
        console.error("Error loading video:", error);
      }
    };
    if (table) {
      fetchVideo();
    }
  }, [table?.slug]);

  return (
    <div id="unity-container" style={styles.container} ref={containerRef}>
      <canvas
        id="unity-canvas"
        style={styles.canvas}
        ref={canvasRef}
        key={`canvas-${table?.slug}`}
      ></canvas>

      {isVideoLoading && (
        <div style={styles.loader}>
          {/* {userType !== "BOT" ? ( */}
            <img src={bougeeLogo} width={150} height={150} alt="Loading" />
          {/* ) : (
            <SpriteAnimation
              spriteSheetImage={"sprites/fiesta_loader.png"}
              frameWidth={150}
              frameHeight={150}
              totalFrames={49}
              rows={7}
              cols={7}
              fps={21}
            />
          )} */}
        </div>
      )}

      {loading && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          webkit-playsinline="true"
          controls={false}
          style={videoStyles}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        />
      )}

      {detectDeviceType() === "mobile" &&
        detectPlatform() === "android" &&
        !userType &&
        !webViewState.isWebView && (
          <div
            style={styles.overlayStyles}
            onTouchEnd={handleDoubleTap}
            onClick={() => handleDoubleTap({} as React.TouchEvent)}
          >
            <div style={styles.instructionText}>
              Double tap anywhere to enter fullscreen
            </div>
          </div>
        )}

      {isPopupOpen && (
        <GamePopups
          isOpen={isPopupOpen}
          onClose={handlePopupClose}
          popupName={popupName}
          // shouldRotate={shouldRotateVideo || false}
        />
      )}
    </div>
  );
};
export default UnityWebGLPlayer;
