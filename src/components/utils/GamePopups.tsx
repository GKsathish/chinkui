import React, { useState, useEffect } from "react";
import "./modal/Modal.css";
import warning from "../../assets/warning.png";
import Button from "./buttons/Button";

import { popupBg } from "../../assets/popupBg";
interface GamepopupProps {
  isOpen: boolean;
  popupName: string;
}

const GamePopups: React.FC<GamepopupProps> = ({
  isOpen,
  popupName,
}) => {
  const userType = sessionStorage.getItem("userType");
  const [isPortrait, setIsPortrait] = useState(
    globalThis.matchMedia("(orientation: portrait)").matches
  );


  // Update modal size based on device
  const [modalStyles, setModalStyles] = useState({
    width: "600px",
    height: "340px",
    padding: "44px",
    titleSize: "text-[16px] font-semibold",
    textSize: "text-[14px]",
    titleMargin: "-mt-[26px]",
    warningIconSize: "w-[24px] h-[24px] mr-[4px]",
  });

  const logoutUser = () => {
    globalThis.parent.postMessage({ type: "NAVIGATE_LOGIN" }, `${process.env.REACT_APP_URL}`);
  };

  const onReconnect = () => {
    globalThis.location.reload();
  };

  const handleReloadPopup = () => {
    globalThis.location.reload();
  };

  const handleLobbyNavigation = () => {
    globalThis.parent.postMessage({ type: "NAVIGATE_LOBBY" }, `${process.env.REACT_APP_URL}`);
  };

  const onClickOk = () => {
    const actionMap: Record<string, () => void> = {
      Inactive: logoutUser,
      NoInternet: handleReloadPopup,
      InitializationError: handleReloadPopup,
    };

    const action = actionMap[popupName] || handleLobbyNavigation;
    action();
  };

  useEffect(() => {
    const updateDeviceType = () => {
      const vw = globalThis.innerWidth;
      const isPortrait = globalThis.matchMedia("(orientation: portrait)").matches;

      setIsPortrait(isPortrait);
      if (vw >= 1024) {
        // Desktop
        setModalStyles({
          width: "710px",
          height: "352px",
          padding: "60px",
          titleSize: "text-[28px] font-bold",
          textSize: "text-[22px]",
          titleMargin: "-mt-[10px]",
          warningIconSize: "w-[26px] h-[26px] mr-[8px]",
        });
      } else if (vw >= 640 && vw < 1024) {
        // Tablet
        setModalStyles({
          width: "550px",
          height: "272px",
          padding: "60px",
          titleSize: "text-[20px] font-bold",
          textSize: "text-[18px]",
          titleMargin: "-mt-[30px]",
          warningIconSize: "w-[24px] h-[24px] mr-[6px]",
        });
      } else if (isPortrait) {
        setModalStyles({
          width: "380px",
          height: "190px",
          padding: "14px",
          titleSize: "text-[18px] font-semibold",
          textSize: "text-[15px]",
          titleMargin: "-mt-[10px]",
          warningIconSize: "w-[20px] h-[20px] mr-[4px]",
        });
      } else {
        setModalStyles({
          width: "470px",
          height: "230px",
          padding: "44px",
          titleSize: "text-[20px] font-semibold",
          textSize: "text-[18px]",
          titleMargin: "-mt-[26px]",
          warningIconSize: "w-[24px] h-[24px] mr-[4px]",
        });
      }
    };

    updateDeviceType();
    globalThis.addEventListener("resize", updateDeviceType);
    return () => globalThis.removeEventListener("resize", updateDeviceType);
  }, []);

  useEffect(() => {
    if (popupName === "Inactive" && !userType) {
      const timeout = setTimeout(() => {
        logoutUser();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [popupName, userType, logoutUser]);

  if (!isOpen) return null;

  const popupConfig: Record<string, { title: string; text1: (userType: string | null) => string; text2?: (userType: string | null) => string }> = {
    Inactive: {
      title: "Idle Time Out",
      text1: (userType) => userType ? "You have been logged out due to session timeout." : "Your connection has timed out, \nreconnect to continue.",
    },
    LowBalance: {
      title: "Low Balance",
      text1: (userType) => userType ? "Your current balance is below the minimum balance to play this game. Kindly add balance to your wallet." : "Balance is running low, recharge to continue playing.",
      text2: (userType) => userType ? "" : "Kindly close the current window and go back to the menu to relaunch the game.",
    },
    NoInternet: {
      title: "Slow Internet Connectivity",
      text1: (userType) => userType ? "Slow or No internet connection. \nKindly check your internet settings." : "Internet connection is unstable, reconnect for a smooth gaming experience.",
      text2: (userType) => userType ? "" : "Kindly close the current window and go back to the menu to relaunch the game.",
    },
    InitializationError: {
      title: "Game Loading Error",
      text1: (userType) => userType ? "Unable to load the game. \nPlease try again or contact support if the issue persists." : "Game failed to initialize properly.",
      text2: (userType) => userType ? "" : "Please close the current window and go back to the menu to relaunch the game.",
    },
  };

  const config = popupConfig[popupName] || { title: "", text1: () => "", text2: () => "" };
  const title = config.title;
  const text1 = config.text1(userType);
  const text2 = config.text2?.(userType) || "";

  return (
    <div
      className="flex fixed top-0 left-0 bg-black/[0.7] z-[1000] items-center justify-center"
      style={{
        width:"100vw", // Swap width & height
        height:"100vh",
        transform // Center the rotated div
          : "none",
        transformOrigin: "top left", // Rotate from top-left
        transition: "transform 0.3s ease-in-out", // Smooth rotation
        position: "fixed",
      }}
    >
      <dialog
        className={`flex flex-col z-[150]`}
        style={{
          width: modalStyles.width,
          height: modalStyles.height,
          padding: modalStyles.padding,
          backgroundImage: `url(${popupBg})`, // Use the imported image
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          border: "none",
          borderRadius: "8px",
        }}
        open
      >
        {/* Title Section */}
        <div
          className={`flex items-center justify-center ${modalStyles.titleMargin}`}
        >
          {/* Warning Icon */}
          <img
            src={warning}
            alt="Warning"
            className={modalStyles.warningIconSize}
          />
          {/* Title with Gradient */}
          <div
            className={modalStyles.titleSize}
            style={{
              background:
                "linear-gradient(140.71deg, #FFF5A5 17.73%, #C49223 38.81%, #DFBA52 70.5%, #C49223 88.9%, #FFF5A5 107.37%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </div>
        </div>

        {/* Text Section */}
        <div className="flex w-full">
          <div
            className={`flex flex-col mx-auto ${
              popupName === "Inactive" ? "mt-10" : "mt-6"
            }`}
          >
            <div
              className={`text-white ${modalStyles.textSize}

           whitespace-pre-line ${popupName === "Inactive" && "text-center"}`}
            >
              {text1}
            </div>
            {text2 && (
              <div className={`text-white ${modalStyles.textSize} mt-10`}>
                {text2}
              </div>
            )}
            {popupName === "Inactive" && userType && (
              <div className="flex items-center justify-center mt-10">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M18.0953 8.9521C16.8762 7.27591 15.0476 5.14258 11.8476 5.14258C8.03812 5.14258 5.14288 8.1902 5.14288 11.9997C5.14288 15.8092 8.1905 18.8569 11.8476 18.8569C13.8286 18.8569 15.6572 17.9426 16.8762 16.5711M18.8572 5.14258V8.9521C18.8572 9.40924 18.5524 9.71401 18.0953 9.71401H14.2857"
                    stroke="#FFE2A7"
                    strokeLinecap="round"
                  />
                </svg>
                <button
                  onClick={onReconnect}
                  className="text-[#FFE2A7] font-semibold text-[16px] cursor-pointer bg-transparent border-none p-0"
                  style={{
                    textDecoration: "underline", // Add underline effect
                    textDecorationColor: "#FFE2A7", // Match underline color with the text
                  }}
                >
                  Reconnect
                </button>
              </div>
            )}

            {!userType  && (
              <div
                className={`flex items-center justify-center ${
                  isPortrait ? "mt-2" : "mt-8"
                }`}
              >
                <Button  text="OK" onClick={onClickOk} />
              </div>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default GamePopups;
