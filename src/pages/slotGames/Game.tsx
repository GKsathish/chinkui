import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams,useParams } from "react-router-dom";
import SideNav from "../../components/utils/Sidenav";
import { persistor, RootState } from "../../store/store";
import { Table } from "../../store/tablesModel";
import { TableDataMap } from "../../components/utils/constants/tablesData";
import { tablesLoaded } from "../../store/tablesSlice";
import { favTablesLoaded } from "../../store/favTablesSlice";
import { globalWsInstance } from "../../components/utils/WebSocket";
import csrfTokenService from "../../components/utils/csrfTokenService";
import OverlaySpinner from "../../components/utils/spinners/OverlaySpinner/OverlaySpinner";
import RotationLockOverlay from "../../components/utils/RotationLockOverlay";
import useOrientationEnforcement from "../../hooks/useOrientationEnforcement";
const SlotGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const tables = useSelector((state: RootState) => state.tables);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const deviceType = localStorage.getItem("deviceType");
  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined);
  const [preferredOrientation, setPreferredOrientation] = useState<"landscape-primary" | "portrait-primary" | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [webView, setWebView] = useState(false);
  const [casinoUrl, setCasinoUrl] = useState("");
  const [isCasinoLoading, setIsCasinoLoading] = useState(false);
  const dispatch = useDispatch();

  // Use the orientation enforcement hook
  const {
    isMobile,
    showRotationLockOverlay
  } = useOrientationEnforcement({
    enableForMobile: true,
    gameOrientation: selectedTable?.orientation
  });



  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "logout") {
        // Clear any session data and redirect to login or home page
        sessionStorage.clear();
        console.log("Logout received from iframe. Session cleared.");
        navigate("/login"); // Adjust the route as needed
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [navigate]);

  useEffect(() => {
    const validateTokenAndInitialize = async () => {
      const tokenParam = searchParams.get("token");
      const userName = searchParams.get("userName");
      const sessionToken = sessionStorage.getItem("token");
      const userType = searchParams.get("userType");
      if (sessionToken && !tokenParam) {
        setIsValidating(false);
        return;
      }
      if (!tokenParam || !userName) {
        setIsValidating(false);
        setError("Token not Found");
        return;
      }
      if (tokenParam && userName) {
        setIsValidating(true);
        try {
          const response = await csrfTokenService.get(
            `/api/v1/validate-token`,null,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenParam}`,

              },
            }
          );

          if (response && response.data.description === "Token valid") {
            setToken(tokenParam);
            sessionStorage.setItem("token", tokenParam);
            sessionStorage.setItem("username", userName);
            if (userType) {
              sessionStorage.setItem("userType", userType);
            }
            getTables();
            const currentPath = window.location.pathname;
            navigate(currentPath, { replace: true });
          } else {
            throw new Error("Invalid token");
          }
        } catch (err) {
          console.error("Token validation failed", err);
          setError("Invalid token");
        } finally {
          setIsValidating(false);
        }
      } else {
        setIsValidating(false);
      }
    };

    validateTokenAndInitialize();
  }, [searchParams, navigate]);

  const getTables = async () => {
    if (!token && !sessionStorage.getItem("token")) {
      return;
    }
    setError("");

    try {
      setIsValidating(true);
      const authToken = sessionStorage.getItem("token") || token;
      const response = await csrfTokenService.get(
        `/api/gettables`,null,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,

          },
        }
      );

      if (response?.data && response?.data?.status === "RS_OK") {

        const fetchedTables: Table[] = response?.data.tables.map(
          (table: any) => ({
            tableId: table.tableId,
            tableName: table.tableName,
            category: table.category,
            slug: table.slug,
            iframe: table.iframe,
            orientation: table.orientation as
              | "landscape-primary"
              | "portrait-primary",
          })
        );

        const filteredTables = fetchedTables?.filter(
          (table) => table.slug in TableDataMap
        );

        console.log("Fetched tables with iframe values:", fetchedTables);
        console.log("Filtered tables:", filteredTables);
        dispatch(tablesLoaded(filteredTables));
        dispatch(favTablesLoaded(response.data.favTables));
      } else if (
        response.data &&
        (response.data.status === "RS_UNAUTHORIZED" ||
          response.data.status === "TOKEN_EXPIRED")
      ) {
        sessionStorage.clear();
        navigate("/login");
      } else {
        dispatch(tablesLoaded([])); // Clear tables
        dispatch(favTablesLoaded([])); // Clear favorite tables
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      setIsValidating(false);
      dispatch(tablesLoaded([])); // Clear tables
      dispatch(favTablesLoaded([])); // Clear favorite tables
      console.error(err);
      setError(err.response?.data?.error || "Failed to load tables");
    } finally {
      setIsValidating(false);
    }
  };

  const getCasinoUrl = async () => {
    if (!selectedTable || selectedTable.iframe !== "others") {
      return;
    }

    setIsCasinoLoading(true);
    setError("");

    try {
      const authToken = sessionStorage.getItem("token") || token;
      const username = sessionStorage.getItem("username");

      if (!authToken || !username) {
        throw new Error("Authentication required");
      }

      const response = await csrfTokenService.post(
        `/api/getcasino`,
        {
          tableId: selectedTable.tableId,
          operatorId: "BOUGEE",
          userId: username,
          username: username,
          partnerId: "INR",
          platformId: "desktop",
          lobby: false,
          lobbyType: "LIVE:VIRTUAL"
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data && response.data.url) {
        // Replace encoded ampersands with regular ampersands
        const decodedUrl = response.data.url.replaceAll(/\\u0026/g, '&');
        console.log("Casino API Response:", response.data);
        console.log("Original URL:", response.data.url);
        console.log("Decoded URL:", decodedUrl);
        setCasinoUrl(decodedUrl);
      } else {
        throw new Error("No URL received from casino API");
      }
    } catch (err: any) {
      console.error("Casino API call failed:", err);
      setError(err.response?.data?.error || "Failed to load casino game");
    } finally {
      setIsCasinoLoading(false);
    }
  };

  const updateSelectedTable = useCallback(() => {
    if (gameId && tables.length > 0) {
      const selectedGame = tables.find((table) => table.slug === gameId);
      if (selectedGame) {
        setSelectedTable(selectedGame);
        setPreferredOrientation(selectedGame.orientation);
        console.log("Selected table updated:", selectedGame);
        console.log("Selected table iframe value:", selectedGame.iframe);
      } else {
        console.log("No matching table found for gameId:", gameId);
      }
    } else {
      console.log(
        "Cannot update selected table. GameId:",
        gameId,
        "Tables:",
        tables
      );
    }
  }, [gameId, tables]);

  useEffect(() => {
    updateSelectedTable();
  }, [updateSelectedTable]);

  // Trigger casino API call when selected table changes to casino category
  useEffect(() => {
    if (selectedTable && selectedTable.iframe === "others") {
      setCasinoUrl(""); // Reset previous URL
      getCasinoUrl();
    }
  }, [selectedTable]);

  // Detect WebView
  useEffect(() => {
    const detectWebView = () => {
      const isReactNativeWebView = !!window.ReactNativeWebView;
      const isWebViewDetected = isReactNativeWebView;
      setWebView(isWebViewDetected);
    };

    detectWebView();
  }, []);

  const handleNavigateLobby = () => {
    const isRegularUser = sessionStorage.getItem("userType") === "REGULAR";
    if (isRegularUser) {
      window.parent.postMessage({ type: "NAVIGATE_LOBBY" }, `${process.env.REACT_APP_URL}`);
    }
    console.log("Received NAVIGATE_LOBBY message in SlotGame");
    navigate("/lobby");
  };

  const handleGameLoaded = () => {
    const isRegularUser = sessionStorage.getItem("userType") === "REGULAR";
    if (isRegularUser) {
      window.parent.postMessage({ type: "GAME_LOADED" }, `${process.env.REACT_APP_URL}`);
    }
  };

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.warn("No session token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      const response = await csrfTokenService.post(
        `/api/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        sessionStorage.clear();
        dispatch(tablesLoaded([]));
        dispatch(favTablesLoaded([]));
        if (globalWsInstance) {
          console.log("Closing WebSocket connection...");
          globalWsInstance.close();
        }
        await persistor.purge();
        navigate("/login");
        location.reload();
        console.log("Logout successful.");
      } else {
        console.error("Logout failed. Code:", response.data.code);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const isValidOrigin = (origin: string): boolean => {
    return origin === `${process.env.REACT_APP_URL}` || origin === `${process.env.REACT_APP_CASINO_URL}`;
  };

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (!isValidOrigin(event.origin)) return;

      if (event.data?.type === "NAVIGATE_LOBBY") {
        handleNavigateLobby();
      } else if (event.data?.type === "GAME_LOADED") {
        handleGameLoaded();
      } else if (event.data?.type === "NAVIGATE_LOGIN") {
        handleLogout();
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [navigate, dispatch]);

  const getPixiIframeUrl = () => {
    const token = sessionStorage.getItem("token") || "";
    const userType = sessionStorage.getItem("userType");
    const userTypeParam = userType ? `&userType=${userType}` : "";
    return `${process.env.REACT_APP_URL}/pixi-player?token=${token}&table=${encodeURIComponent(
      JSON.stringify(selectedTable || {})
    )}${userTypeParam}&isWebView=${webView}&forceOrientation=${isMobile ? "landscape" : ""}`;
  };

  const getPlayerIframeUrl = () => {
    const token = sessionStorage.getItem("token") || "";
    const userType = sessionStorage.getItem("userType");
    const userTypeParam = userType ? `&userType=${userType}` : "";
    return `${process.env.REACT_APP_URL}/player?token=${token}&table=${encodeURIComponent(
      JSON.stringify(selectedTable || {})
    )}${userTypeParam}&isWebView=${webView}&forceOrientation=${isMobile ? "landscape" : ""}`;
  };

  const getIframeClassName = () => {
    return isMobile && preferredOrientation === "landscape-primary" ? "" : "h-full w-full";
  };

  const getIframeStyle = () => {
    if (deviceType === "desktop") {
      return { width: "100%", height: "100%" };
    }

    if (isMobile && preferredOrientation === "landscape-primary") {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      return {
        transform: "rotate(90deg)",
        transformOrigin: "center center",
        width: `${screenHeight}px`,
        height: `${screenWidth}px`,
        position: "absolute",
        top: `${(screenHeight - screenWidth) / 2}px`,
        left: `${(screenWidth - screenHeight) / 2}px`
      };
    }

    return { width: "100%", height: "100%" };
  };

  const renderCasinoContent = () => {
    if (isCasinoLoading) {
      return <div className="w-full text-center p-4"><OverlaySpinner /></div>;
    }
    if (casinoUrl) {
      return (
        <iframe
          src={casinoUrl}
          className={isMobile && preferredOrientation === "portrait-primary" ? "" : "h-full w-full"}
          title="Casino Game"
          allow="picture-in-picture; autoplay; camera; microphone; geolocation; payment; encrypted-media; web-share; display-capture"
          onLoad={() => console.log("Casino iframe loaded successfully")}
          onError={(e) => console.error("Casino iframe error:", e)}
        />
      );
    }
    return <div className="w-full text-center p-4">Failed to load casino game</div>;
  };

  const renderGameIframe = () => {
    if (!selectedTable) return null;

    if (selectedTable.iframe === "pixi") {
      return (
        <iframe
          src={getPixiIframeUrl()}
          className={getIframeClassName()}
          title="Embedded Page"
          style={getIframeStyle() as React.CSSProperties}
          allow="fullscreen; picture-in-picture; autoplay"
          allowFullScreen
        />
      );
    }

    if (selectedTable.iframe === "others") {
      return renderCasinoContent();
    }

    return (
      <iframe
        src={getPlayerIframeUrl()}
        className={getIframeClassName()}
        title="Embedded Page"
        style={getIframeStyle() as React.CSSProperties}
        allow="fullscreen; picture-in-picture; autoplay"
        allowFullScreen
      />
    );
  };

  if (isValidating) {
    return (
      <div className="w-full p-2 text-red-600 text-3xl font-medium text-center">
        {/* Validating token... */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-2 text-red-600 text-3xl font-medium text-center">
        {error}
      </div>
    );
  }

  const shouldShowSideNav = () => {
    return deviceType === "desktop" && !sessionStorage.getItem("userType") && selectedTable?.iframe !== "others";
  };

  const getMainContainerClass = () => {
    const baseClass = "flex w-full h-full p-0";
    return deviceType === "desktop" ? `${baseClass} sm:p-12` : baseClass;
  };

  const getGameContainerClass = () => {
    const baseClass = "flex";
    if (!selectedTable || selectedTable.iframe === "others" || deviceType !== "desktop") {
      return `${baseClass} ${iframeContainerClass}`;
    }

    const userType = sessionStorage.getItem("userType");
    const widthClass = userType ? "sm:w-8/12" : "sm:w-10/12";
    return `${baseClass} ${widthClass} sm:justify-between sm:mx-auto ${iframeContainerClass}`;
  };

  const iframeContainerClass = isMobile && preferredOrientation === "landscape-primary"
    ? "fixed inset-0 flex items-center justify-center overflow-hidden"
    : "h-full w-full";

  return (
    <div
      className="flex h-full w-full bg-cover bg-center relative"
      style={{ backgroundImage: `url('/game_thumbnail_sprites/background.png')` }}
    >
      <RotationLockOverlay show={showRotationLockOverlay} />

      {!isValidating && (
        <>
          {shouldShowSideNav() && (
            <div
              className="hidden sm:flex w-[18%] min-w-[240px] max-w-[340px] bg-black/[0.75]"
              style={{ boxShadow: "2px 0 5px rgba(0, 0, 0, 0.5)" }}
            >
              <SideNav excludeTableId={selectedTable?.tableId} />
            </div>
          )}
          <div className={getMainContainerClass()}>
            <div className={getGameContainerClass()}>
              {gameId && selectedTable ? renderGameIframe() : (
                <div className="w-full text-center p-4">Please Select a game to play</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SlotGame;