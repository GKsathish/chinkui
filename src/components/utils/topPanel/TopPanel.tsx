import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../utils/WebSocket";
import PopoverMenu from "../PopoverMenu";
import Money from "../../../assets/icons/money.png";
import { SpriteAnimation } from "../SpriteAnimation";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { tablesFilterUpdated } from "../../../store/filtersSlice";
import { Filters } from "../../../store/filtersModel";
import balanceImage from "../../../assets/icons/Balance.png";
import "./TopPanel.css";
import useSessionToken from "../useSessionToken";
import LoginModal from "../modal/LoginModal";
import { Mobile } from "../fullscreenUtils";
import bougeeLogo from "../../../assets/icons/bougeelogo.png";

interface TopPanelProps {
  openLogin: boolean;
  setOpenLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TopPanel({ openLogin, setOpenLogin }: TopPanelProps) {
  const filters = useSelector((state: RootState) => state.filters);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const deviceType = localStorage.getItem("deviceType");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  type Tab = "all" | "favs" | "slots";
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [balance, setBalance] = useState<number>(0);
  const [frameDimensions, setFrameDimensions] = useState({
    width: 52,
    height: 52,
  });
  const [fontSize, setFontSize] = useState({
    title: "text-sm",
    value: "text-xs",
  });
  const userType = sessionStorage.getItem("userType");
  const isAuth = useSessionToken();
  const {
    sendMessage,
    isConnected,
    addMessageListener,
    removeMessageListener,
  } = useWebSocket({
    onOpen: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      sendMessage({ operation: "getbalance" });
      intervalRef.current = setInterval(() => {
        if (isConnected) {
          sendMessage({ operation: "getbalance" });
        }
      }, 10000);
    },
    onClose: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
    onError: (error) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
  });

  const handleMessage = (data: any) => {
    const balanceData = data.data;
    if (balanceData && balanceData.balance !== undefined) {
      setBalance(balanceData.balance);
    }
  };
  const balanceFontSize =
    balance.toString().length > 8 ? "text-sm" : "text-base";
  useEffect(() => {
    addMessageListener(handleMessage);
    return () => removeMessageListener(handleMessage);
  }, [addMessageListener, removeMessageListener]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleClickOutside = (event: MouseEvent): void => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(event.target as Node)
    ) {
      setIsPopoverOpen(false);
    }
  };

  useEffect(() => {
    // Add event listener for clicks outside the popover
    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

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
  const handlePopupClose = () => {
    setOpenLogin(false);
  };
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 640);

  useEffect(() => {
    const updateScreenSize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);
  const [scrollWidth, setScrollWidth] = useState<number>(148);
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      // Adjust width of cards based on screen width
      if (screenWidth < 800) {
        setScrollWidth(90);
      } else {
        setScrollWidth(148); // Default for larger screens
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);
  return (
    <>
      {!isMobile ? (
        <header
          className={`relative w-full ${
            Mobile() ? "h-[50px]" : "xl:h-[90px] sm:h-[70px]"
          } flex items-center justify-between px-4`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-no-repeat bg-center z-0"
            style={{
              backgroundImage: Mobile()
                ? "url(/game_thumbnail_sprites/mobile_header_bg.png)"
                : "url(/game_thumbnail_sprites/header_bg.svg)",
              backgroundSize: "auto 101%", // Slightly increase height for overlap
              backgroundPosition: "center",
              backgroundRepeat: "repeat-x",
            }}
          />
          <div className="relative z-10 flex w-full justify-between items-center">
            {/* Left Section - User Profile */}
            {isAuth && (
              <div className="flex items-center gap-3 w-1/3 justify-center">
                <div className="w-12 h-13 overflow-hidden">
                  <img src="/game_thumbnail_sprites/user.png" alt="User Icon" />
                </div>
                <span className="text-[#fff5ae] font-bold text-sm md:text-base">
                  {sessionStorage.getItem("username") || "raja manohar"}
                </span>
              </div>
            )}
            {/* Center Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2  ml-0.5">
              <div className="relative w-[120px] h-[120px] flex items-center justify-center xl:mt-[85px] sm:mt-[85px]">
                {/* Enlarged Gradient Shadow */}
                {/* <div
                  className="absolute -inset-10 bg-gradient-to-b from-[#FFF5AE] to-transparent opacity-50 blur-md w-[170px] h-[200px] rounded-full"
                  style={{ marginTop: `30px`, marginRight: "100px" }}
                /> */}
                {/* {userType !== "BOT" ? ( */}
                  <img
                    src={bougeeLogo}
                    width={scrollWidth}
                    height={scrollWidth}
                    alt="Loading"
                  />
                {/* ) : (
                  <SpriteAnimation
                    spriteSheetImage={"game_thumbnail_sprites/fiesta_logo.png"}
                    frameWidth={scrollWidth}
                    frameHeight={scrollWidth}
                    totalFrames={50}
                    rows={7}
                    cols={8}
                    fps={20}
                    delay={3000} 
                  />
                {/* )} */}
              </div>
            </div>

            {!isAuth ? (
              <div className="flex w-full justify-end items-center px-4">
                <div className="flex items-right px-1 rounded-xl bg-[#272727] bg-opacity-20 text-[#FFC873] border-2 border-[#FFC873]">
                  <button
                    onClick={() => setOpenLogin(true)}
                    className={Mobile() ? "w-20 h-8" : "w-20 h-10"}
                  >
                    Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-5 w-1/3 justify-center">
                {/* Balance Display */}
                <div className="relative flex items-center">
                  <img
                    src="/game_thumbnail_sprites/balance.png"
                    alt="Balance"
                    className={
                      Mobile() ? "w-[180px] h-50px]" : "w-[200px] h-[60px]"
                    }
                  />
                  <span className="absolute right-5 text-[#fff5ae] font-bold text-sm md:text-base">
                    {balance}
                  </span>
                </div>

                {/* Settings Button */}
                <button
                  className="w-12 h-13 flex items-center justify-center"
                  onClick={() => setIsPopoverOpen(true)}
                >
                  <img
                    src="/game_thumbnail_sprites/Settings.png"
                    alt="Settings"
                  />
                </button>
              </div>
            )}
          </div>
        </header>
      ) : (
        <>
          <header className="relative w-full h-[80px] sm:h-[60px] flex items-center justify-between px-4">
            {/* Background Image */}
            <div
              className="absolute inset-0 w-full h-full bg-no-repeat bg-bottom z-0"
              style={{
                backgroundImage:
                  "url(/game_thumbnail_sprites/header_mobile.png)",
                backgroundSize: "cover", // Ensures the whole image is visible without cutting
                backgroundPosition: "bottom", // Aligns it at the bottom to prevent top gaps
              }}
            />
            <div className="relative z-10 flex w-full justify-between items-center">
              <div className="relative w-[70px] h-[70px] flex items-center justify-center">
                {/* Enlarged Gradient Shadow */}

                {/* {userType !== "BOT" ? ( */}
                  <img src={bougeeLogo} width={88} height={88} alt="Loading" />
                {/* ) : ( */}
                  {/* <SpriteAnimation
                    spriteSheetImage={"game_thumbnail_sprites/fiesta_logo.png"}
                    frameWidth={88}
                    frameHeight={88}
                    totalFrames={49}
                    rows={7}
                    cols={8}
                    fps={20}
                    delay={3000}
                  />
                )} */}
              </div>
              {!isAuth ? (
                <div className="flex w-full justify-end items-center px-4">
                  <div className="flex items-right px-1 rounded-xl bg-[#272727] bg-opacity-20 text-[#FFC873] border-2 border-[#FFC873]">
                    <button
                      onClick={() => setOpenLogin(true)}
                      className="w-20 h-10"
                    >
                      Login
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center  w-[170px]">
                  {/* User Info (Icon & Name Side by Side) */}
                  <div
                    className="flex items-center space-x-1"
                    onClick={() => setIsPopoverOpen(true)}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src="/game_thumbnail_sprites/user.png"
                        alt="User Icon"
                        className="w-8 h-8"
                      />
                    </div>
                    <span className="text-[#fff5ae] font-bold text-base">
                      {" "}
                      {sessionStorage.getItem("username") || "raja manohar"}
                    </span>
                  </div>

                  {/* Balance Section (Below User Info) */}
                  <div className="relative  flex justify-center">
                    <img
                      src="/game_thumbnail_sprites/balance.png"
                      alt="Balance"
                      className="w-[160px] h-[50px]"
                    />
                    <span
                      className={`absolute right-5 bottom-3.5 text-[#fff5ae] font-bold ${balanceFontSize}`}
                    >
                      {balance}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </header>
        </>
      )}
     {!isMobile &&  <PopoverMenu
        ref={popoverRef}
        isOpen={isPopoverOpen}
        toggleMenu={() => setIsPopoverOpen(false)}
      /> }
 
      {openLogin && (
        <LoginModal isOpen={openLogin} onClose={handlePopupClose} />
      )}
    </>
  );
}
