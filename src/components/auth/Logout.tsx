import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { persistor } from "../../store/store";
import { tablesLoaded } from "../../store/tablesSlice";
import { favTablesLoaded } from "../../store/favTablesSlice";
import { globalWsInstance } from "../utils/WebSocket";
import { SpriteAnimation } from "../utils/SpriteAnimation";
import csrfTokenService from "../utils/csrfTokenService";
import authService from "../utils/authService";
interface LogoutProps {
  isOpen: boolean;
  onClose: () => void;
}
const Logout: React.FC<LogoutProps> = ({ isOpen, onClose }) => {
  const [deviceType] = useState(localStorage.getItem("deviceType"));
  const [modalStyles, setModalStyles] = useState({
    width: "600px",
    height: "340px",
    padding: "44px",
    titleSize: "text-[16px] font-semibold bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
    textSize: "text-[14px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
    titleMargin: "-mt-[26px]",
    buttonSpacing: "mt-8",
    spriteDimensions: { width: 52, height: 52 },
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const updateStyles = () => {
      const vw = window.innerWidth;
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      if (vw >= 1024) {
        setModalStyles({
          width: "710px",
          height: "352px",
          padding: "60px",
          titleSize: "text-[28px] font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          textSize: "text-[22px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          titleMargin: "-mt-[10px]",
          buttonSpacing: "mt-10",
          spriteDimensions: { width: 168, height: 76 },
        });
      } else if (vw >= 640 && vw < 1024) {
        setModalStyles({
          width: "550px",
          height: "285px",
          padding: "60px",
          titleSize: "text-[20px] font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          textSize: "text-[18px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          titleMargin: "-mt-[10px]",
          buttonSpacing: "mt-8",
          spriteDimensions: { width: 128, height: 76 },
        });
      } else {
        setModalStyles({
          width: isPortrait ? "380px" : "470px",
          height: isPortrait ? "190px" : "230px",
          padding: isPortrait ? "14px" : "44px",
          titleSize: isPortrait ? "text-[15px] font-semibold bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]" : "text-[18px] font-semibold bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          textSize: isPortrait ? "text-[15px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]" : "text-[18px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          titleMargin: isPortrait ?"mt-[10px]":"-mt-[0px]",
          buttonSpacing: "mt-6",
          spriteDimensions: isPortrait ? { width: 108, height: 56 } : {  width: 108, height: 56 },
        });
      }
    };

    updateStyles();
    window.addEventListener("resize", updateStyles);
    return () => window.removeEventListener("resize", updateStyles);
  }, []);

  const logoutUser = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.warn("No session token found. Using auth service to handle logout.");
        authService.clearAuthState("No token found during logout");
        return navigate("/login");
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
        // Use auth service for consistent logout handling
        authService.clearAuthState("Manual logout");

        // Clear Redux state
        dispatch(tablesLoaded([]));
        dispatch(favTablesLoaded([]));

        // Purge persisted state
        await persistor.purge();

        navigate("/login");
        location.reload();
        console.log("Logout successful.");
      } else {
        console.error("Logout failed.");
        // Still clear auth state even if API call failed
        authService.clearAuthState("Logout API failed");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Clear auth state on error
      authService.clearAuthState("Logout error");
      navigate("/login");
    } finally {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex w-full h-full fixed top-0 left-0 bg-black/[0.7] z-[1000] items-center justify-center">
      <div
        className="flex flex-col z-[150]"
        style={{
          width: modalStyles.width,
          height: modalStyles.height,
          padding: modalStyles.padding,
          backgroundImage: `url(https://cdn.bougeegames.com/modal_bg.png)`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderRadius: "10px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-center items-center ${modalStyles.titleMargin}`}>
          <div className={modalStyles.titleSize}>Logout</div>
        </div>
        <div className={`text-center text-white ${modalStyles.textSize} mt-4`}>Are you sure you want to logout?</div>
        <div className={`flex justify-around ${modalStyles.buttonSpacing}`}>
           <SpriteAnimation
                spriteSheetImage="sprites/button_bg.png"
                frameWidth={modalStyles.spriteDimensions.width}
                frameHeight={modalStyles.spriteDimensions.height}
                onClick={() => onClose()}
                totalFrames = {25}
                rows = {5}
                cols = {5}
              >
                <button
                  type="button"
                  className={`w-full h-full text-center py-1 ${
                    deviceType === "desktop" ? "text-[20px] px-3" : "text-[14px] px-2"
                  }`}
                  onClick={onClose}
                >
                  Cancel
                </button>
              </SpriteAnimation>
              <SpriteAnimation
                spriteSheetImage="sprites/button_bg.png"
                frameWidth={modalStyles.spriteDimensions.width}
                frameHeight={modalStyles.spriteDimensions.height}
                onClick={() => logoutUser()}
                totalFrames = {25}
                rows = {5}
                cols = {5}
              >
                <button
                  type="button"
                  className={`w-full h-full text-center py-1 ${
                    deviceType === "desktop" ? "text-[20px] px-3" : "text-[14px] px-2"
                  }`}
                  onClick={logoutUser}
                >
                  Logout
                </button>
              </SpriteAnimation>
          {/* <Button text="Cancel" onClick={onClose} />
          <Button text="Logout" onClick={logoutUser} /> */}
        </div>
      </div>
    </div>
  );
};

export default Logout;
