import React, { useEffect, useRef,useState } from "react";
import { Mobile } from "../../components/utils/fullscreenUtils";
import PopoverMenu from "../../components/utils/PopoverMenu";

const BottomBar = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 640);
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScreenSize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);
  const classNAmes=Mobile()?"w-11 h-8":"w-13 h-11"
  return (
    <footer className={`fixed bottom-0 w-full ${Mobile() ? "h-[50px]" : "h-[80px] md:h-[70px] sm:h-[60px]"} flex items-center justify-between`}>
    <div
      className="absolute inset-0 bg-no-repeat bg-center z-0"
      style={{
        backgroundImage: Mobile() 
          ? "url(/game_thumbnail_sprites/mobile_Bottom_bar.svg)" 
          : "url(/game_thumbnail_sprites/Bottom_bar.png)",
        backgroundSize: "auto 101%",
        backgroundPosition: "center",
        backgroundRepeat: "repeat-x",
      }}
    />
      {!isMobile ? (
        <div className="relative z-10 w-full flex items-center px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Left Section - Telegram & Live Chat */}
          <div className="flex items-center justify-around  w-1/3 space-x-3 sm:space-x-6 md:space-x-8">
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/telegramLogo.png"
                alt="Telegram"
                className={classNAmes}
              />
            </div>
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/liveChat.png"
                alt="Live Chat"
                className={classNAmes}
              />
            </div>
          </div>
          {/* Center Curve Image */}
          <div className="flex  w-1/3 flex justify-center mx-2 sm:mx-4">
            <img
              src="/game_thumbnail_sprites/Bottom_Bar_Center.png"
              alt="Center Curve"
              className="h-[110px] w-[510px] object-contain"
            />
          </div>

          {/* Right Section - Web & Gift Code */}
          <div className="flex  w-1/3 items-center justify-around space-x-3 sm:space-x-6 md:space-x-8">
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/webLogo.png"
                alt="Web"
                className={Mobile()?"w-7 h-9":"w-13 h-12"}
              />
            </div>
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/GiftCode.png"
                alt="Gift Code"
                className={classNAmes}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-row justify-around relative z-10 w-full flex items-center px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Left Section - Telegram & Live Chat */}
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/telegramLogo.png"
                alt="Telegram"
                className="w-11 h-8"
              />{" "}
            </div>
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/liveChat.png"
                alt="Live Chat"
                className="w-11 h-8"
              />
            </div>

          {/* Right Section - Web & Gift Code */}
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/game_thumbnail_sprites/webLogo.png"
                alt="Web"
                className="w-7 h-9"
              />
            </div>
  <div className="flex flex-col items-center cursor-pointer">
  <img
    src="/game_thumbnail_sprites/Settings.png"
    alt="Settings"
    className="w-9 h-9 object-contain -mb-1 -mt-1.5"
    onClick={() => setIsPopoverOpen(true)}
  />
  <span className="text-[8px] text-[#FFC873] tracking-wide">
    SETTINGS
  </span>

  <PopoverMenu
    ref={popoverRef}
    isOpen={isPopoverOpen}
    toggleMenu={() => setIsPopoverOpen(false)}
  />
</div>


        </div>
        </>
      )}
    </footer>
  );
};

export default BottomBar;
