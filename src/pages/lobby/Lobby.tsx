import axios from "axios";
import NoSleep from "@uriopass/nosleep.js";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TableDataMap } from "../../components/utils/constants/tablesData";
import GameTab from "../../components/utils/GameTab";
import TopPanel from "../../components/utils/topPanel/TopPanel";
import { favTablesLoaded } from "../../store/favTablesSlice";
import { Filters } from "../../store/filtersModel";
import { filtersUpdated, tablesFilterUpdated } from "../../store/filtersSlice";
import { RootState } from "../../store/store";
import { Table } from "../../store/tablesModel";
import { tablesFiltered, tablesLoaded } from "../../store/tablesSlice";
import OverlaySpinner from "../../components/utils/spinners/OverlaySpinner/OverlaySpinner";
import GamePopups from "../../components/utils/GamePopups";
import isOnline from "is-online";
import { GradientButton } from "../../components/utils/buttons/GradientButton";
import BottomBar from "./BottomBar";
import { Mobile } from "../../components/utils/fullscreenUtils";
import csrfTokenService from "../../components/utils/csrfTokenService";

export default function Lobby() {
  const navigate = useNavigate();
  const filters = useSelector((state: RootState) => state.filters);
  const dispatch = useDispatch();
  const [isPortrait, setIsPortrait] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openLogin, setOpenLogin] = useState<boolean>(false);
  const [status, setStatus] = useState("Wi-Fi");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupName, setPopupName] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 640);
  
  // State to track available space between TopPanel and BottomBar
  const [availableSpace, setAvailableSpace] = useState({
    height: 0,
    top: 0,
  });
  
  // State for game grid/carousel layout parameters
  const [layoutConfig, setLayoutConfig] = useState({
    gridCols: 3,
    gapSize: 8,
    containerPadding: 16,
    itemsPerView: 3,
  });
  
  let noSleepInstance: NoSleep | null = null;
  const favTables = useSelector((state: RootState) => state.favTables);
  const filteredTables = useSelector((state: RootState) =>
    tablesFiltered(state, filters, favTables)
  );
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Effect for detecting mobile devices
  useEffect(() => {
    const updateScreenSize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  // Effect for token validation and initialization
  useEffect(() => {
    const validateTokenAndInitialize = async () => {
      const tokenParam = searchParams.get("token");
      const userName = searchParams.get("userName");
      const enterLobby = searchParams.get("lobby");
      const userType = searchParams.get("userType");
  
      if (tokenParam && userName && enterLobby === "true") {
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
  
            // Clean up URL
            navigate(
              `/lobby?filters=${encodeURIComponent(JSON.stringify(filters))}`,
              {
                replace: true,
              }
            );
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
  }, [searchParams, navigate, filters]);
  

  // Effect for filters in URL
  useEffect(() => {
    const filtersParam = searchParams?.get("filters");
    const lobbyParam = searchParams?.get("lobby");
    const checktoken = sessionStorage.getItem("token");
    if (checktoken && !lobbyParam) {
      if (!filtersParam) {
        try {
          navigate(
            `/lobby?filters=${encodeURIComponent(JSON.stringify(filters))}`
          );
        } catch (e) {
          console.log("filter error", e);
        }
      }
    } else {
      setError("Token not found");
    }
  }, [searchParams, filters, navigate]);

  // Effect for parsing filters from URL
  useEffect(() => {
    const filtersParam = searchParams?.get("filters");
    const lobbyParam = searchParams?.get("lobby");
    const checktoken = sessionStorage.getItem("token");
    if (checktoken && !lobbyParam) {
      if (filtersParam) {
        try {
          const _filters: Filters = JSON.parse(filtersParam);
          dispatch(filtersUpdated(_filters));
        } catch (error) {
          console.error("Failed to parse filters from URL", error);
        }
      }
    } else {
      setError("Token not found");
    }
  }, [searchParams, dispatch]);

  // Effect for loading tables data
  useEffect(() => {
    if (!token && !sessionStorage.getItem("token")) return;

    const getTables = async () => {
      setError("");
      try {
        setIsLoading(true);
        const authToken = sessionStorage.getItem("token") || token;
        const [tablesResponse] = await Promise.all([
          csrfTokenService.get('/api/gettables', null, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }),
        ]);

        if (tablesResponse.data && tablesResponse.data.status === "RS_OK") {
          const fetchedTables: Table[] = tablesResponse?.data.tables.map(
            (table: any) => ({
              tableId: table.tableId,
              tableName: table.tableName,
              category: table.category,
              phase: table.phase,
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

          dispatch(tablesLoaded(filteredTables));
          dispatch(favTablesLoaded(tablesResponse.data.favTables));
        } else if (
          tablesResponse.data &&
          (tablesResponse.data.status === "RS_UNAUTHORIZED" ||
            tablesResponse.data.status === "TOKEN_EXPIRED")
        ) {
          // Import auth service dynamically to avoid circular dependencies
          const { default: authService } = await import("../../components/utils/authService");
          authService.handleTokenExpiration(`API returned: ${tablesResponse.data.status}`);
        } else {
          setIsLoading(false);
          throw new Error(tablesResponse.data.message);
        }
      } catch (err: any) {
        setIsLoading(false);
        console.error(err);
        setError(err.response?.data?.error || "Failed to load tables");
      } finally {
        setIsLoading(false);
      }
    };

    getTables();
  }, [token, dispatch, navigate]);

  // NoSleep utility functions
  const enableNoSleep = () => {
    if (!noSleepInstance) {
      noSleepInstance = new NoSleep();
    }
    try {
      noSleepInstance.enable();
      console.log("NoSleep enabled");
    } catch (err) {
      console.error("Failed to enable NoSleep:", err);
    }
  };

  const disableNoSleep = () => {
    if (noSleepInstance) {
      try {
        noSleepInstance.disable();
        console.log("NoSleep disabled");
      } catch (err) {
        console.error("Failed to disable NoSleep:", err);
      }
    }
  };

  // Effect for disabling NoSleep on unmount
  useEffect(() => {
    disableNoSleep();
    return () => {
      disableNoSleep();
    };
  }, []);

  // Effect for checking device orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  // Effect for checking internet connectivity
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

  // Effect for handling no internet popup
  useEffect(() => {
    if (status === "No Internet") {
      setPopupName("NoInternet");
      setIsPopupOpen(true);
    } else {
      setPopupName("");
      setIsPopupOpen(false);
    }
  }, [status]);

  // Effect for calculating available space between TopPanel and BottomBar
  useEffect(() => {
    const calculateAvailableSpace = () => {
      const topPanelHeight = document.querySelector('header')?.getBoundingClientRect().height || 0;
      const bottomBarHeight = document.querySelector('footer')?.getBoundingClientRect().height || 0;
      const filterButtonsArea = document.querySelector('.filter-buttons')?.getBoundingClientRect().height || 60;
      const windowHeight = window.innerHeight;
      
      // For mobile, subtract an additional safety margin to prevent overlap
      const safetyMargin = isMobile ? 20 : 10;
      const availableHeight = windowHeight - topPanelHeight - bottomBarHeight - filterButtonsArea - safetyMargin;
      
      setAvailableSpace({
        height: availableHeight,
        top: topPanelHeight + filterButtonsArea,
      });
      
      // Adjust layout config based on screen size
      const screenWidth = window.innerWidth;
      
      if (screenWidth <= 640) {
        // Mobile layout
        setLayoutConfig({
          gridCols: 3,
          gapSize: 2, // Reduced gap size to make more room for game tabs
          containerPadding: 0, // No container padding for mobile
          itemsPerView: 3,
        });
      } else if (screenWidth <= 1024) {
        // Tablet layout
        setLayoutConfig({
          gridCols: 3,
          gapSize: 2,
          containerPadding: 0,
          itemsPerView: 3,
        });
      } else {
        // Desktop layout - adjust gap and padding based on height
        const largeScreen = windowHeight > 1000;
        setLayoutConfig({
          gridCols: 4,
          gapSize: largeScreen ? 24 : 14, // Larger gap for tall screens
          containerPadding: largeScreen ? 30 : 20, // More padding for tall screens
          itemsPerView: 4,
        });
      }
    };
    
    calculateAvailableSpace();
    
    // Recalculate on resize and after a short timeout to ensure all elements are properly rendered
    window.addEventListener('resize', calculateAvailableSpace);
    
    // One more calculation after everything has rendered
    const timeoutId = setTimeout(calculateAvailableSpace, 500);
    
    return () => {
      window.removeEventListener('resize', calculateAvailableSpace);
      clearTimeout(timeoutId);
    };
  }, [isMobile]);

  // Effect for smooth background scroll with smart boundaries
  useEffect(() => {
    // Set to true to enable background movement with smart boundaries
    const ENABLE_BACKGROUND_PARALLAX = true;

    if (!ENABLE_BACKGROUND_PARALLAX) {
      return; // Skip all background movement
    }

    // Don't set up parallax until component is fully loaded
    if (isLoading || isValidating) {
      console.log("Lobby still loading, skipping parallax setup", { isLoading, isValidating });
      return;
    }

    console.log("Setting up parallax effect in Lobby", { isMobile, tablesCount: filteredTables.length });

    const handleSmoothScroll = () => {
      const scrollContainer = scrollRef.current;
      const backgroundContainer = backgroundRef.current;

      if (!scrollContainer || !backgroundContainer) {
        console.log("Missing refs:", { scrollContainer: !!scrollContainer, backgroundContainer: !!backgroundContainer });
        return;
      }

      if (!isMobile) {
        // For wider screens (desktop and tablets - horizontal scroll)
        const scrollLeft = scrollContainer.scrollLeft;

        // Dynamic scroll factor based on content length
        const dynamicScrollFactor = Math.min(0.3, 0.2 + (filteredTables.length / 30) * 0.1);

        // Calculate background dimensions and safe boundaries
        const viewportWidth = window.innerWidth;
        const backgroundWidth = viewportWidth * 1.5; // 150% width as set in CSS
        const maxSafeTranslation = backgroundWidth - viewportWidth; // Maximum we can move without showing empty space

        requestAnimationFrame(() => {
          // Calculate desired translation
          const desiredTranslation = scrollLeft * dynamicScrollFactor;

          // Clamp translation to safe boundaries
          const clampedTranslation = Math.max(0, Math.min(desiredTranslation, maxSafeTranslation));

          // Apply transform
          backgroundContainer.style.transform = `translateX(${-clampedTranslation}px)`;

          // Debug log (remove after testing)
          if (scrollLeft > 0) {
            console.log("Parallax:", { scrollLeft, desiredTranslation, clampedTranslation, maxSafeTranslation });
          }
        });
      }
      // For mobile (vertical scroll) - also implement smart boundaries
      else {
        const verticalScrollContainer = document.querySelector('#mobile-grid-container');
        if (verticalScrollContainer) {
          const scrollTop = verticalScrollContainer.scrollTop;

          // Calculate safe vertical movement
          const viewportHeight = window.innerHeight;
          const backgroundHeight = viewportHeight * 1.2; // 120% height as set in CSS
          const maxSafeVerticalTranslation = backgroundHeight - viewportHeight;

          // Calculate desired translation with reduced factor
          const desiredTranslation = scrollTop * 0.1;

          // Clamp to safe boundaries
          const clampedTranslation = Math.max(0, Math.min(desiredTranslation, maxSafeVerticalTranslation));

          backgroundContainer.style.transform = `translateY(${-clampedTranslation}px)`;
        }
      }
    };

    // Add scroll event listeners based on device type with a small delay to ensure refs are ready
    const setupListeners = () => {
      if (!isMobile) {
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
          console.log("Adding scroll listener to horizontal container in Lobby");
          scrollContainer.addEventListener("scroll", handleSmoothScroll);
          return true;
        } else {
          console.log("Scroll container ref not ready in Lobby");
          return false;
        }
      } else {
        const verticalScrollContainer = document.querySelector('#mobile-grid-container');
        if (verticalScrollContainer) {
          console.log("Adding scroll listener to vertical container in Lobby");
          verticalScrollContainer.addEventListener("scroll", handleSmoothScroll);
          return true;
        } else {
          console.log("Vertical scroll container not found in Lobby");
          return false;
        }
      }
    };

    // Try to setup listeners immediately
    if (!setupListeners()) {
      // If refs aren't ready, try again after a short delay
      const timeoutId = setTimeout(() => {
        console.log("Retrying listener setup in Lobby");
        setupListeners();
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    return () => {
      // Clean up event listeners
      console.log("Cleaning up parallax listeners in Lobby");
      if (!isMobile) {
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
          scrollContainer.removeEventListener("scroll", handleSmoothScroll);
        }
      } else {
        const verticalScrollContainer = document.querySelector('#mobile-grid-container');
        if (verticalScrollContainer) {
          verticalScrollContainer.removeEventListener("scroll", handleSmoothScroll);
        }
      }
    };
  }, [isMobile, isLoading, isValidating]); // Added loading states to ensure refs are ready

  const handlePopupClose = () => {
    setIsPopupOpen(false);
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

  const handleFilterChange = (_tablesFilter: Filters["tables"]) => {
    try {
      if (_tablesFilter !== filters.tables) {
        dispatch(tablesFilterUpdated(_tablesFilter));
        navigate(
          `/lobby?filters=${encodeURIComponent(
            JSON.stringify({ tables: _tablesFilter })
          )}`
        );
      }
    } catch (e) {
      console.log("error filtering", e);
    }
  };

  return (
    <>
      {/* Global CSS for hiding scrollbars and preventing page scroll */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        /* Prevent body scrolling */
        body {
          overflow: hidden;
        }
      `}</style>
      
      <div className="relative w-full h-screen flex flex-col overflow-hidden"
           style={{ 
             maxHeight: "100vh",
             height: "100vh",
             position: "fixed",
             top: 0,
             left: 0,
             right: 0,
             bottom: 0
           }}>
        {/* Background Image */}
        <div
          ref={backgroundRef}
          className="absolute top-0 left-0 w-full h-full transition-transform ease-out duration-100"
          style={{
            width: isMobile ? "120%" : "150%", // Extra width for parallax movement
            height: isMobile ? "120%" : "100vh",
            backgroundImage: `url('/game_thumbnail_sprites/background.png')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover", // Cover ensures no gaps
            backgroundPosition: "left top", // Start from left top for predictable movement
            transform: "translate3d(0, 0, 0)", // Initial position
            willChange: "transform", // Optimize for transforms
            overflow: "hidden" // Prevent any background overflow
          }}
        />
         <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        {/* Top Bar */}
        <div className="relative sm:z-30">
          <TopPanel openLogin={openLogin} setOpenLogin={setOpenLogin} />
        </div>

        {/* Filter Buttons */}
        <div className={`flex justify-center items-center ${Mobile()?"mt-1":"mt-4"} md:mt-6 z-20 filter-buttons ${isMobile?"":"gap-2"} `}>
          <GradientButton 
              src="/game_thumbnail_sprites/SlotsButton.png" 
              onClick={() => handleFilterChange("Slots")}
              isActive={filters.tables === "Slots"}
            />
            <GradientButton 
              src="/game_thumbnail_sprites/CasinoButton.png" 
              className={isMobile ? "mx-2" : "mr-[60px]"}
              onClick={() => handleFilterChange("Casino")}
              isActive={filters.tables === "Casino"}
            />
            <GradientButton 
              src="/game_thumbnail_sprites/FunButton.png" 
              className={isMobile ? "mx-2" : "ml-[60px]"}
              onClick={() => handleFilterChange("Fun")}
              isActive={filters.tables === "Fun"}
            /> 
            <GradientButton 
              src="/game_thumbnail_sprites/FavouriteButton.png"
              onClick={() => handleFilterChange("Favourite")}
              isActive={filters.tables === "Favourite"}
            />
        </div>

        {/* Game Content Container */}
        <div 
          ref={contentContainerRef}
          className="relative flex-grow flex items-center justify-center z-10" // Changed from items-start to items-center
          style={{
            height: `${availableSpace.height}px`,
            maxHeight: `${availableSpace.height}px`,
            paddingTop: 0, // Remove top padding to allow true centering
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {!isMobile ? (
            /* Desktop/Tablet Layout - Horizontal Scrolling */
            <div
              className="w-full flex justify-center items-center" // Added items-center for vertical centering
              style={{
                overflowY: "hidden",
                height: "100%" // Use full height of container
              }}
            >
              <div
                ref={scrollRef}
                className="flex overflow-x-auto overflow-y-hidden scrollbar-hide items-center" // Added items-center
                style={{
                  scrollBehavior: "smooth",
                  padding: `0 ${layoutConfig.containerPadding}px`,
                  height: "auto", // Changed from fit-content to auto
                  width: "100%",
                  paddingBottom: "16px" // Add padding for scrollbar space
                }}
              >
                {filteredTables.map((_g: Table) => (
                  <div
                    key={_g.tableId}
                    className="flex-shrink-0 flex items-center" // Added flex and items-center
                    style={{
                      margin: `0 ${layoutConfig.gapSize}px`,
                      lineHeight: 0,
                      fontSize: 0,
                      display: "block"
                    }}
                  >
                    <GameTab
                      key={`${_g.tableId}_tab`}
                      table={_g}
                      favTables={favTables}
                      onGameClick={(gameId: string) => {
                        enableNoSleep();
                        navigate(`/slot-games/${gameId}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Mobile Layout - Grid View */
            <div
              className="w-full flex flex-col items-center" // Added justify-center
              style={{
                height: `${availableSpace.height}px`,
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div 
                id="mobile-grid-container"
                className="grid scrollbar-hide" 
                style={{
                  gridTemplateColumns: `repeat(${layoutConfig.gridCols}, minmax(0, 1fr))`,
                  gap: `${layoutConfig.gapSize}px`,
                  rowGap: `${layoutConfig.gapSize}px`,
                  lineHeight: 0,
                  width: "100%",
                  height: "100%",
                  padding: "0 2px", // Reduced horizontal padding to maximize space
                  paddingBottom: "100px", // Increased padding to prevent overlap with bottom bar
                  overflowY: "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch", // Smoother scrolling on iOS
                  // placeItems: "center"
                }}
              >
                {filteredTables.map((_g: Table) => (
                  <div 
                    key={_g.tableId} 
                    className="flex justify-center  w-full" // Added items-center
                    style={{
                      lineHeight: 0,
                      fontSize: 0,
                      display: "block",
                      marginBottom: 0,
                      paddingBottom: 0
                    }}
                  >
                    <GameTab
                      key={`${_g.tableId}_tab`}
                      table={_g}
                      favTables={favTables}
                      onGameClick={(gameId: string) => {
                        enableNoSleep();
                        navigate(`/slot-games/${gameId}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar - Ensure it's fixed at the bottom */}
        <div className="relative z-20">
          <BottomBar />
        </div>
        
        {/* Popups */}
        {isPopupOpen && (
        <GamePopups
          isOpen={isPopupOpen}
          onClose={handlePopupClose}
          popupName={popupName}
        />
      )}
        
        {/* Loading Spinner */}
        {isLoading && <OverlaySpinner />}
      </div>
    </>
  );
}