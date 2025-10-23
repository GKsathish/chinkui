import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GameTab from "../../components/utils/GameTab";
import TopPanel from "../../components/utils/topPanel/TopPanel";
import { RootState } from "../../store/store";
import { Table } from "../../store/tablesModel";
import { GradientButton } from "../../components/utils/buttons/GradientButton";
import { tablesFilterUpdated } from "../../store/filtersSlice";
import { Filters } from "../../store/filtersModel";
import { tablesFiltered, tablesLoaded } from "../../store/tablesSlice";
import OverlaySpinner from "../../components/utils/spinners/OverlaySpinner/OverlaySpinner";
import BottomBar from "./BottomBar";
import { Mobile } from "../../components/utils/fullscreenUtils";
import { GAME_DATA } from "../../data/gameData";

export default function Lobby() {
  const navigate = useNavigate();
  const filters = useSelector((state: RootState) => state.filters);
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [openLogin, setOpenLogin] = useState<boolean>(false);

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

  // Load game data on component mount
  useEffect(() => {
    dispatch(tablesLoaded(GAME_DATA));
    setIsLoading(false);
  }, [dispatch]);
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
    // Set to false to completely disable background movement
    const ENABLE_BACKGROUND_PARALLAX = true;

    if (!ENABLE_BACKGROUND_PARALLAX) {
      return; // Skip all background movement
    }

    const handleSmoothScroll = () => {
      const scrollContainer = scrollRef.current;
      const backgroundContainer = backgroundRef.current;

      if (!scrollContainer || !backgroundContainer) return;

      if (!isMobile) {
        // For wider screens (desktop and tablets - horizontal scroll)
        const scrollLeft = scrollContainer.scrollLeft;
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const scrollProgress = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;

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
        });
      }
      // For mobile (vertical scroll) - also implement smart boundaries
      else {
        const verticalScrollContainer = document.querySelector('#mobile-grid-container');
        if (verticalScrollContainer) {
          const scrollTop = verticalScrollContainer.scrollTop;
          const maxScrollTop = verticalScrollContainer.scrollHeight - verticalScrollContainer.clientHeight;
          const scrollProgress = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

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

    // Add scroll event listeners based on device type
    if (!isMobile) {
      const scrollContainer = scrollRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", handleSmoothScroll);
      }
    } else {
      const verticalScrollContainer = document.querySelector('#mobile-grid-container');
      if (verticalScrollContainer) {
        verticalScrollContainer.addEventListener("scroll", handleSmoothScroll);
      }
    }

    return () => {
      // Clean up event listeners
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
  }, [isMobile, filteredTables.length]);

  const handleFilterChange = (_tablesFilter: Filters["tables"]) => {
    try {
      if (_tablesFilter !== filters.tables) {
        dispatch(tablesFilterUpdated(_tablesFilter));
        navigate(
          `/login?filters=${encodeURIComponent(
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
             <div className="relative z-30">
               <TopPanel openLogin={openLogin} setOpenLogin={setOpenLogin} />
             </div>
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
              onClick={() =>  handleFilterChange("Fun")}
              isActive={filters.tables === "Fun"}
            /> 
              <GradientButton 
              src="/game_thumbnail_sprites/FavouriteButton.png"
              onClick={() => setOpenLogin(true)}
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
                   className="flex-shrink-0 flex items-center"
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
                      onGameClick={() => {
                       setOpenLogin(true)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Mobile Layout - Grid View */
            <div
              className="w-full flex flex-col items-center"
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
                  WebkitOverflowScrolling: "touch" // Smoother scrolling on iOS
                }}
              >
                {filteredTables.map((_g: Table) => (
                  <div 
                    key={_g.tableId} 
                    className="flex justify-center w-full"
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
                      onGameClick={() => {
                      setOpenLogin(true);
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
        {/* Loading Spinner */}
        {isLoading && <OverlaySpinner />}
      </div>
    </>
  );
}