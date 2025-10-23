import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { favTablesLoaded } from "../../store/favTablesSlice";
import { Table } from "../../store/tablesModel";
import { SpriteAnimation } from "./SpriteAnimation";
import { useGameVisibility } from "./useVisibleGames";
import useSessionToken from "../utils/useSessionToken";
import { isPortrait, Mobile } from "./fullscreenUtils";
import csrfTokenService from "./csrfTokenService";

interface GameTabProps {
  table: Table;
  favTables: string[];
  onGameClick: (gameId: string) => void;
}

const GameTab: React.FC<GameTabProps> = ({
  table,
  favTables,
  onGameClick,
}) => {
  const dispatch = useDispatch();
  const isAuth = useSessionToken();
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Track visibility of this game
  const { elementRef: visibilityRef } = useGameVisibility(table.slug);
  
  // State to track actual image dimensions
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
    loaded: false,
    aspectRatio: 0.7, // Default aspect ratio (height/width)
  });
  
  // State for card dimensions that will be responsive
  const [cardSize, setCardSize] = useState({
    width: 220,
    height: 330,
  });

  // Load the actual image to get its dimensions
  useEffect(() => {
    const img = new Image();
    img.src = `game_thumbnail_sprites/${table.slug}.png`;
    
    img.onload = () => {
      // Store the original image dimensions and aspect ratio
      const aspectRatio = img.height / img.width;
      setImageDimensions({
        width: img.width,
        height: img.height,
        loaded: true,
        aspectRatio: aspectRatio
      });
      imageRef.current = img;
    };
    
    img.onerror = (e) => {
      console.error(`Error loading image for ${table.slug}:`, e);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [table.slug]);

  // Calculate optimal size based on screen dimensions
  useEffect(() => {
    const calculateOptimalSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Get TopPanel and BottomBar heights
      const topPanelHeight = document.querySelector('header')?.getBoundingClientRect().height || 100;
      const bottomBarHeight = document.querySelector('footer')?.getBoundingClientRect().height || 80;
      const filterButtonsHeight = 60; // Approximate height for filter buttons
      
      // Calculate available space between TopPanel and BottomBar
      const availableHeight = screenHeight - topPanelHeight - bottomBarHeight - filterButtonsHeight;
      const aspectRatio = imageDimensions.loaded ? imageDimensions.aspectRatio : 1.5; // Default if not loaded
      
      let newWidth = 0;
      let newHeight = 0;
      
      // Mobile viewport - calculate based on screen width for even spacing
      if (screenWidth <= 640) {
        // For mobile, calculate width based on screen width divided by columns (3)
        // Account for minimal gap (4px) between columns
        const availableWidth = screenWidth - 16; // Account for minimal body margin
        newWidth = Math.floor(availableWidth / 3) - 4;
      } 
      // Tablet/medium screens
      else if (screenWidth <= 1024) {
        if (screenHeight < 800) {
          newWidth = 220; 
        } else {
          newWidth = 240;
        }
      } 
      // Desktop/large screens
      else {
        // For tall screens, we may want to limit the size increase to maintain proportion
        if (screenHeight > 1200) {
          // Cap the size for very tall screens to maintain visual consistency
          newWidth = 300;
        } else if (screenHeight < 900) {
          newWidth = 260;
        } else {
          newWidth = 280;
        }
      }
      
      // Calculate height based on the image's aspect ratio
      newHeight = Math.round(newWidth * aspectRatio);
      
      // For large height screens, use a more balanced approach
      // We ensure the height is neither too small nor too large compared to available space
      if (screenHeight > 1000) {
        // Use a percentage of available height for consistency
        const idealHeight = availableHeight * 0.7; // Use 70% of available height as ideal target
        
        // If our calculated height is significantly smaller than ideal (looks too small)
        if (newHeight < idealHeight * 0.75) {
          // Increase the size, but still maintain aspect ratio
          const scaleFactor = idealHeight / newHeight;
          // Limit scale factor to avoid too extreme sizes
          const limitedScaleFactor = Math.min(scaleFactor, 1.4);
          
          newHeight = Math.floor(newHeight * limitedScaleFactor);
          newWidth = Math.floor(newHeight / aspectRatio);
        }
      }
      // For regular screens, ensure it fits within the available space
      else if (newHeight > availableHeight * 0.9) {
        newHeight = Math.floor(availableHeight * 0.9);
        newWidth = Math.floor(newHeight / aspectRatio);
      }
      if(Mobile()&& !isPortrait){
        // alert("in")
        setCardSize({
          width: newWidth*1.2,
          height: newHeight*1.07,
        });
      }else{
        setCardSize({
          width: newWidth,
          height: newHeight,
        });
      }
    
    };

    // Only calculate size once we know the image dimensions
    if (imageDimensions.loaded) {
      calculateOptimalSize();
      window.addEventListener("resize", calculateOptimalSize);
      
      return () => window.removeEventListener("resize", calculateOptimalSize);
    }
  }, [imageDimensions]);


  const handleFavClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await csrfTokenService.post(
        `/api/favorites`,
        {
          tableId: table.tableId,
          isFav: !favTables.includes(table.tableId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
           
          },
        }
      );
      if (response.data && response.data.status === "RS_OK") {
        dispatch(favTablesLoaded(response.data.favTables));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Calculate favorite button size and position based on card size
  const favButtonSize = Math.max(16, Math.floor(cardSize.width * 0.2));
  const favButtonPosition = {
    right: Math.max(4, Math.floor(cardSize.width * 0.08)),
    bottom: Math.max(4, Math.floor(cardSize.height * 0.05)),
  };

  return (
    <div
      ref={visibilityRef}
      className="relative cursor-pointer transition-transform duration-300 hover:scale-105 flex items-center justify-center"
      style={{
        width: `${cardSize.width}px`,
        height: `${cardSize.height}px`,
        display: "block",
        fontSize: 0,
        lineHeight: 0,
        margin: "0 auto", // Center horizontally
      }}
      onClick={() => onGameClick(table.slug)}
      data-game-slug={table.slug} // For visibility tracking
    >
      {/* Game Thumbnail (Sprite Animation) */}
      <div className="relative w-full h-full overflow-hidden rounded-lg" style={{ display: "block", fontSize: 0, lineHeight: 0 }}>
        {imageDimensions.loaded && (
          <SpriteAnimation
            spriteSheetImage={`game_thumbnail_sprites/${table.slug}.png`}
            frameWidth={cardSize.width}
            frameHeight={cardSize.height}
            thumbnail={true}
            enableLazyLoading={true}
          />
        )}

        {/* Favorite Button - Positioned appropriately based on card size */}
        {isAuth && (
          <button
            onClick={handleFavClick}
            className="absolute z-30"
            style={{
              width: `${favButtonSize}px`,
              height: `${favButtonSize}px`,
              right: `${favButtonPosition.right}px`,
              bottom: `${favButtonPosition.bottom}px`,
            }}
          >
            <img
              src={
                favTables.includes(table.tableId)
                  ? "https://d1mr0h2b9az9mp.cloudfront.net/game_thumbnail_sprites/Fav_Icon_Selcted.png"
                  : "https://d1mr0h2b9az9mp.cloudfront.net/game_thumbnail_sprites/Fav_Icon_Non_Selected.png"
              }
              alt="favorite"
              className="w-full h-full object-contain"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default GameTab;