import Cookies from "js-cookie";
import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  detectDeviceType,
  detectPlatform,
  detectTelegramBrowser,
  enterFullScreen,
  isFullScreen,
  isMobileDevice,
  lockOrientation,
} from "../utils/fullscreenUtils";
import { useWebSocket } from "../utils/WebSocket";
import GamePopups from "../utils/GamePopups";
import isOnline from "is-online";
import { Table } from "../../store/tablesModel";
import bougeeLogo from "../../assets/icons/bougeelogo.png";
import { SpriteAnimation } from "../utils/SpriteAnimation";


declare global {
  interface Window {
    startPixiGame: (container: HTMLDivElement) => void;
    redirectToHome: () => void;
    logoutUser: () => void;
    gameToken?: string;
    SendMessageToJS: (message: string) => void;
    openLowBalancePopup: () => void;
    openInActivePopup: () => void;
    ReactNativeWebView?: any;
    isInWebView?: boolean;
    s3url?:string;
    apiUrl?:string;
    websocketUrl?:string;
    loadingCompleted:()=>void;

  }
}

const PixiPlayer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const gameContainerRef = useRef<HTMLDivElement>(null);
   const outerContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const [status, setStatus] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupName, setPopupName] = useState<string>("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [webViewState, setWebViewState] = useState({
      isWebView: false,
      isReady: false,
    });
  const [table, setTable] = useState<Table | undefined>(undefined);
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token")|| "";;
  const tableString = queryParams.get("table");
  const userType = queryParams.get("userType")||"";
  const webview =queryParams.get("isWebView")
  const deviceType = localStorage.getItem("deviceType");
 useEffect(() => {
    console.log("🔄 PixiPlayer useEffect triggered with:", { tableString, token, webview });

    if (token) {
      sessionStorage.setItem("token", token);
      console.log("✅ Token saved to sessionStorage");
    }

    if(webview){
      setWebViewState({
        isWebView: webview === "true",
        isReady: true,
      });
      console.log("✅ WebView state updated:", webview === "true");
    }

    if (tableString) {
      try {
        const parsedTable = JSON.parse(decodeURIComponent(tableString));
        console.log("🔍 Parsed table data:", parsedTable);
        console.log("🔍 Table slug:", parsedTable?.slug);
        setTable(parsedTable);
        console.log("✅ Table state updated successfully");
      } catch (error) {
        console.error("❌ Failed to parse tableString:", error);
        console.error("❌ Raw tableString:", tableString);
        setTable(undefined);
      }
    } else {
      console.warn("⚠ No tableString found in URL parameters");
      console.log("🔍 Current URL search params:", location.search);
    }
  }, [tableString, token, webview]);



  const styles = {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      width: table?.orientation === "portrait-primary" ? "420px" : "100%",
      height:
        detectDeviceType() === "mobile" &&
        (detectPlatform() === "ios")
          ? "100%"
          : table?.orientation === "portrait-primary"
          ? "100%"
          : `min(640px, ${deviceType === "desktop" ? "80%" : "100%"})`,
      minHeight: deviceType === "desktop" ? "370px" : 0,
      position: "relative" as const,
      margin: "auto",
  left: table?.orientation === "portrait-primary" && deviceType !== "desktop"? "50%" : "auto",
      transform: table?.orientation === "portrait-primary" && deviceType !== "desktop" ? "translateX(-50%)" : "none",
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
      display: showOverlay ? "flex" as const : "none" as const,
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
  // We don't need isIOS anymore since we're using detectPlatform() === "android"
 const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  const checkFullscreenStatus = () => {
    if (isMobileDevice() && !isIOS) {
      setShowOverlay(!isFullScreen());
    }
  };

        window.s3url="https://s3.eu-west-2.amazonaws.com/static.inferixai.link/pixi-game-assets/";
        window.apiUrl=`${process.env.REACT_APP_API_URL}`;
        window.websocketUrl=`${process.env.REACT_APP_SOCKET_URL}`;
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


  const handleDoubleTap = (e: React.TouchEvent | any) => {
    e.preventDefault();
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;

    if (tapLength < 300 && tapLength > 0) {
      requestAnimationFrame(() => {
        try {
         enterFullScreen(gameContainerRef.current);
          setTimeout(() => {
            if (table?.orientation) {
              lockOrientation(table.orientation);
            }
          }, 200);
            loadPixiGame();
          
        } catch (err) {
          console.error("Error entering full-screen:", err);
        }
      });
    }
    lastTapRef.current = currentTime;
  };

  useEffect(() => {
    window. redirectToHome = async () => {
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
        console.log("lobby new")
      
        window.parent.postMessage(
          { type: "NAVIGATE_LOBBY"},
          "*"
        );

      };
  }, [navigate]);

  window.logoutUser = async () => {
    window.parent.postMessage({ type: "NAVIGATE_LOGIN" }, "*");
  };
  window.loadingCompleted = async () => {
    console.log("🎮 Game loading completed, hiding loader");
    setIsVideoLoading(false);
  }
  window. openInActivePopup = async () => {
    setPopupName("Inactive");
    setIsPopupOpen(true);
  };
  window. openLowBalancePopup = async () => {
    setPopupName("LowBalance");
    setIsPopupOpen(true);
  };
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
    console.log(table,"table")
  const loadPixiGame = async () => {
    // Guard against missing table data
    if (!table || !table.slug) {
      console.log("🚫 Skipping Pixi game load - table or table.slug is undefined");
      console.log("Table state:", table);
      return;
    }

    window.gameToken = token;
    const container = gameContainerRef.current;
    if (!container) {
      console.error("❌ Game container not found");
      return;
    }

    console.log("🎮 Loading Pixi game for table:", table.slug);
    container.innerHTML = "";

    // Config and sound manager patch loading removed

    // Now load the main script
    const scriptId = "pixi-game-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = `https://s3.eu-west-2.amazonaws.com/static.inferixai.link/pixi-game-assets/${table.slug}/main.js`;
      script.type = "module";
      script.id = scriptId;


      script.onload = () => {
        if (window.startPixiGame) {
          try {
            // Configuration code removed

            // Small delay before starting the game
            setTimeout(() => {
              try {
                window.startPixiGame(container);
                console.log("Game started successfully");
              } catch (err) {
                console.error("startPixiGame delayed execution failed:", err);
              }
            }, 100);
          } catch (e) {
            console.error("startPixiGame setup failed:", e);
          }
        } else {
          console.error("startPixiGame function not found");
        }
      };

      script.onerror = (error) => {
        console.error("Failed to load Pixi script:", error);
      };

      document.body.appendChild(script);
    } else {
      if (window.startPixiGame) {
        try {
          window.startPixiGame(container);
        } catch (e) {
          console.error("startPixiGame failed:", e);
        }
      }
    }
  };

  useEffect(() => {
    // Only load the game when table is properly set with a slug
    if (table && table.slug) {
      console.log("🚀 Table loaded, starting Pixi game initialization...");
      loadPixiGame();
    } else {
      console.log("⏳ Waiting for table data to load...");
    }

    return () => {
      const container = gameContainerRef.current;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [table?.slug, token]); // Depend on table.slug specifically and token


  const adjustForDevice = useCallback(async () => {
    const container = gameContainerRef.current;
    if (
      detectDeviceType() === "mobile" &&
      detectPlatform() === "android" &&
      !webViewState.isWebView &&
      container
    ) {
      console.log("Preparing for fullscreen on Android mobile - user interaction required");
      // Note: Fullscreen requires user interaction, so we prepare but don't force it
      // The double-tap handler will actually trigger fullscreen
      if (table?.orientation) {
        // We can set orientation without user interaction in some cases
        // setTimeout(() => {
        //   lockOrientation(table.orientation);
        // }, 200);
      }
      // Wait for adjustments to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      console.log("Desktop detected. No fullscreen needed.");
    }
  }, [webViewState.isWebView, table?.orientation]);
  useEffect(() =>{
    const initializeGame = async () => {
      if (table && table?.slug ) {
        // Check if overlay will appear (Android mobile with empty userType)
        const shouldShowOverlay =
          detectDeviceType() === "mobile" &&
          detectPlatform() === "android" &&
          (!userType || userType === "");

        if (shouldShowOverlay) {
          console.log("🔄 Overlay will appear - waiting for user double-tap to start game");
          // Don't start game automatically, wait for double-tap
          await adjustForDevice();
        } else {
          console.log("🎮 No overlay needed - starting game automatically");
          await adjustForDevice();
          loadPixiGame();
        }
      }
    };

    initializeGame();

    return () => {
      const container = gameContainerRef.current;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [table?.slug, webViewState.isReady, token, userType]);
  return (
   <div
      id="pixi-container"
      style={styles.container}
      ref={outerContainerRef}
    >
      {/* --- Loader overlay --- */}
      {isVideoLoading && (
        <div style={styles.loader}>
          {/* {userType !== "BOT" ? ( */}
            <img
              src={bougeeLogo}
              width={150}
              height={150}
              alt="Loading"
              style={{ display: "block", margin: "0 auto" }}
            />
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

      {/* --- This is the only div Pixi touches/overwrites --- */}
      <div
        id="pixi-game"
        style={styles.canvas}
        ref={gameContainerRef}
      ></div>

      {/* --- Overlay for fullscreen instructions on Android --- */}
      {/* {(detectDeviceType() === "mobile" &&
        detectPlatform() === "android" &&
        (!userType || userType === "")) && (
          <div
            style={styles.overlayStyles}
            onTouchEnd={handleDoubleTap}
            onClick={() => handleDoubleTap({} as React.TouchEvent)}
          >
            <div style={styles.instructionText}>
              Double tap anywhere to enter fullscreen
            </div>
          </div>
        )} */}

      {/* --- Popup if needed --- */}
      {isPopupOpen && (
        <GamePopups
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          popupName={popupName}
        />
      )}
    </div>
  );
};

export default PixiPlayer;
