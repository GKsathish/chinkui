import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SpriteAnimation } from "../utils/SpriteAnimation";
import smallmodal from "../../assets/modal_small_bg.png";
import csrfTokenService from "../utils/csrfTokenService";

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}
const ChangePassword: React.FC<ChangePasswordProps> = ({ isOpen, onClose }) => {
  const [deviceType] = useState(localStorage.getItem("deviceType"));
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showSpinner, setShowSpinner] = useState<boolean>(false);
  const [spinnerText, setSpinnerText] = useState<string>("");
  const [modalStyles, setModalStyles] = useState({
    width: "600px",
    height: "340px",
    padding: "44px",
    titleSize: "text-[16px] font-semibold bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
    textSize: "text-[14px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
    titleMargin: "-mt-[26px]",
    buttonSpacing: "mt-8",
    inputWidth: "90%",
    inputHeight:"90%",
    spriteDimensions: { width: 52, height: 52 },
    url:`url(https://cdn.bougeegames.com/modal_bg.png)`
  });
  const navigate = useNavigate();

  useEffect(() => {
    const updateStyles = () => {
      const vw = window.innerWidth;
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;

      setIsPortrait(isPortrait);
      if (vw >= 1024) {
        setModalStyles({
          width: "710px",
          height: "372px",
          padding: "60px",
          titleSize: "text-[12px] font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#9E211A] via-[#5A1815] to-[#5C1613]",
          textSize: "text-[22px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          titleMargin: "-mt-[50px] mb-[50px]",
          buttonSpacing: "mt-3",
          inputWidth: "80%",
          inputHeight:"90%",
          spriteDimensions: { width: 168, height: 76 },
          url:`url(https://cdn.bougeegames.com/modal_bg.png)`
        });
      } else if (vw >= 640 && vw < 1024) {
        setModalStyles({
          width: "550px",
          height: "285px",
          padding: "40px",
          titleSize: "text-[10px] font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#9E211A] via-[#5A1815] to-[#5C1613]",
          textSize: "text-[18px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          titleMargin: "-mt-[35px] mb-[30px]",
          buttonSpacing: "-mt-[10px]",
          inputWidth: "80%",
          inputHeight:"80%",
          spriteDimensions: { width: 128, height: 76 },
          url:`url(https://cdn.bougeegames.com/modal_bg.png)`
        });
      } else {
        setModalStyles({
          width: isPortrait ? "350px" : "470px",
          height: isPortrait ? "330px" : "230px",
          padding: isPortrait ? "10px" : "44px",
          titleSize: isPortrait ? "text-[7px] font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#9E211A] via-[#5A1815] to-[#5C1613]" : "text-[12px] font-semibold bg-clip-text text-transparent bg-gradient-to-b from-[#9E211A] via-[#5A1815] to-[#5C1613]",
          textSize: isPortrait ? "text-[15px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]" : "text-[18px] bg-clip-text text-transparent bg-gradient-to-b from-[#ffd07a] via-[#ffcf60] to-[#ffa93f]",
          titleMargin: isPortrait ? "mt-[37px] mb-[15px]" : "mt-[0px]",
          buttonSpacing: "mt-0",
          inputWidth: "80%",
          inputHeight:"70%",
          spriteDimensions: isPortrait ? { width: 108, height: 56 } : { width: 108, height: 56 },
          url:`url(https://cdn.bougeegames.com/modal_small_bg.png)`
        });
      }
    };

    updateStyles();
    window.addEventListener("resize", updateStyles);
    return () => window.removeEventListener("resize", updateStyles);
  }, []);
  const validateCurrentPassword = () => {
    if (currentPassword.length < 8) {
      setCurrentPasswordError("Current password must be at least 8 characters");
    } else {
      setCurrentPasswordError("");
    }
  };

  const validateNewPassword = () => {
    if (newPassword.length < 8) {
      setNewPasswordError("New password must be at least 8 characters");
    } else if (newPassword === currentPassword) {
      setNewPasswordError("New password must be different from the current password");
    } else {
      setNewPasswordError("");
    }
  };

  const validateConfirmPassword = () => {
    if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setSpinnerText("Updating Password...");
    setShowSpinner(true);

    // Run all validations before submitting
    validateCurrentPassword();
    validateNewPassword();
    validateConfirmPassword();

    // Check if any validation errors exist
    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      setShowSpinner(false);
      setError("Please fix the errors before submitting");
      return;
    }

    try {
      const response = await csrfTokenService.post(
        `/api/updatepassword`,
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        setSpinnerText("Password changed successfully!");
        setTimeout(() => {
          sessionStorage.clear();
          setShowSpinner(false);
          onClose();
          navigate("/login");
          location.reload();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to Change Password");
      }
      setShowSpinner(false);
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
          backgroundImage: modalStyles.url,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderRadius: "10px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-center items-center ${modalStyles.titleMargin}`}>
          <div className={modalStyles.titleSize}>Change Password</div>
        </div>
         {/* <div className="flex justify-end -mt-8">
                  <SpriteAnimation
                    spriteSheetImage={"sprites/close.png"}
                    frameWidth={40}
                    frameHeight={40}
                    onClick={onClose}
                  />
                  </div> */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center px-4 w-full">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2 mb-2 border border-gray-300 rounded bg-transparent text-white"
            style={{ width: modalStyles.inputWidth,height:modalStyles.inputHeight }}
            required
          />
            {currentPasswordError && <p className="text-red-300 text-xs">{currentPasswordError}</p>}
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 mb-2 border border-gray-300 rounded bg-transparent text-white"
            style={{ width: modalStyles.inputWidth,height:modalStyles.inputHeight }}
            required
          />
            {newPasswordError && <p className="text-red-300 text-xs">{newPasswordError}</p>}
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded bg-transparent text-white"
            style={{ width: modalStyles.inputWidth,height:modalStyles.inputHeight }}
            required
          />
         {confirmPasswordError && <p className="text-red-300 text-xs">{confirmPasswordError}</p>}
          <div className={`flex justify-around ${modalStyles.buttonSpacing} w-full`}>
            <SpriteAnimation
              spriteSheetImage="sprites/button_bg.png"
              frameWidth={modalStyles.spriteDimensions.width}
              frameHeight={modalStyles.spriteDimensions.height}
              onClick={onClose}
              totalFrames = {25}
              rows = {5}
              cols = {5}
            >
              <button 
             onClick={()=>onClose}
               className={`w-full h-full text-center py-1 ${
                 deviceType === "desktop" ? "text-[20px] px-3" : "text-[14px] px-2"
               }`}type="button">Cancel</button>
            </SpriteAnimation>
            <SpriteAnimation
              spriteSheetImage="sprites/button_bg.png"
              frameWidth={modalStyles.spriteDimensions.width}
              frameHeight={modalStyles.spriteDimensions.height}
              onClick={()=>handleSubmit}
              totalFrames = {25}
              rows = {5}
              cols = {5}
            >
              <button
               type="submit"
               className={`w-full h-full text-center py-1 ${
                 deviceType === "desktop" ? "text-[20px] px-3" : "text-[14px] px-2"
               }`}
             onClick={()=>handleSubmit}
              >Save</button>
            </SpriteAnimation>
          </div>
        </form>
        <div className="flex w-full p-2 -mt-3 text-red-300 text-xs font-medium justify-center">
          {error && <p>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
