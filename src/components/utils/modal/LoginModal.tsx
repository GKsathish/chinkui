import React, { useState, useEffect } from "react";
import "./Modal.css";
// import popupBg from "../../assets/popup_bg.png";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Button from "../buttons/Button";
import axios from "axios";
import { SpriteAnimation } from "../SpriteAnimation";
import { popupBg } from "../../../assets/popupBg";
import csrfTokenService from "../csrfTokenService";
interface GamepopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<GamepopupProps> = ({ isOpen, onClose }) => {
  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia("(orientation: portrait)").matches
  );
  const [deviceType] = useState(localStorage.getItem("deviceType"));
  // Update modal size based on device
  const [modalStyles, setModalStyles] = useState({
    width: "600px",
    height: "340px",
    padding: "44px",
    spriteDimensions: { width: 82, height: 82 },
    url: `url(https://cdn.bougeegames.com/modal_bg.png)`,
  });

  useEffect(() => {
    const updateDeviceType = () => {
      const vw = window.innerWidth;
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;

      setIsPortrait(isPortrait);
      if (vw >= 1024) {
        // Desktop
        setModalStyles({
          width: "710px",
          height: "352px",
          padding: "60px",
          spriteDimensions: { width: 152, height: 82 },
          url: `url(https://cdn.bougeegames.com/modal_bg.png)`,
        });
      } else if (vw >= 640 && vw < 1024) {
        // Tablet
        setModalStyles({
          width: "550px",
          height: "272px",
          padding: "60px",
          spriteDimensions: { width: 152, height: 82 },
          url: `url(https://cdn.bougeegames.com/modal_bg.png)`,
        });
      } else {
        if (isPortrait) {
          setModalStyles({
            width: "380px",
            height: "190px",
            padding: "24px",
            spriteDimensions: { width: 132, height: 62 },
            url: `url(https://cdn.bougeegames.com/modal_bg.png)`,
          });
        } else {
          setModalStyles({
            width: "470px",
            height: "230px",
            padding: "44px",
            spriteDimensions: { width: 132, height: 62 },
            url: `url(https://cdn.bougeegames.com/modal_bg.png)`,
          });
        }
      }
    };

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);
  if (!isOpen) return null;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();

  // Validation functions
  const validateUsername = () => {
    if (username.length < 4) {
      setUsernameError("Username must be at least 4 characters");
      return false;
    } else {
      setUsernameError("");
      return true;
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }

    // Don't proceed if already loading
    if (isLoading) return;

    sessionStorage.clear();
    setFormError("");
    setIsLoading(true); // Set loading state to true

    // Run all validations before submitting
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();

    // Check if any error exists
    if (!isUsernameValid || !isPasswordValid || !username || !password) {
      setIsLoading(false); // Reset loading state
      setFormError("Please fill all the fields before submitting");
      return;
    }

    try {
      const response = await csrfTokenService.post(
        `/api/login`,
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",

          },

        }
      );

      if (response && response.data.description === "Successful login") {
        const { token } = response.data;

        // Store the token in session storage
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("username", username);

        // Verify token was properly stored before navigation
        const storedToken = sessionStorage.getItem("token");

        if (storedToken) {
          // Token successfully stored, now navigate
          console.log("Login successful, token stored. Navigating to lobby.");
          navigate("/lobby");
          onClose();
        } else {
          // Token not stored properly, try again
          console.error("Token not stored properly. Retrying...");
          sessionStorage.setItem("token", token);

          // Check again after a small delay
          setTimeout(() => {
            const retryToken = sessionStorage.getItem("token");
            if (retryToken) {
              console.log("Token stored on retry. Navigating to lobby.");
              navigate("/lobby");
              onClose();
            } else {
              setFormError("Login successful but session could not be created. Please try again.");
            }
          }, 100);
        }
      } else if (response && response.data.description) {
        setFormError(response.data.description);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.description) {
        setFormError(err.response.data.description);
      } else {
        setFormError("Failed to login");
      }
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };
  return (
    <div className="flex w-full h-full fixed top-0 left-0 bg-black/[0.7] z-[1000] items-center justify-center">
      <div
        className="modal-container"
        style={{
          //  width: modalStyles.width,
          //  height: modalStyles.height,
          padding: modalStyles.padding,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center justify-center w-full">
          <form onSubmit={(e) => !isLoading && handleSubmit(e)} className="w-full">
            <div className="flex flex-col items-center justify-center mb-3">
              <label
                htmlFor="login-username"
                className="text-[#FDF2A5] text-sm mb-1 self-start pl-2"
              >
                Username
              </label>
              <input
                className={`w-72 sm:w-72 md:w-80 lg:w-96 px-3 py-2 border border-gray-300 rounded-md rounded ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                type="text"
                id="login-username"
                value={username}
                // placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                onBlur={validateUsername}
                disabled={isLoading}
                required
              />
              {usernameError && (
                <p className="text-red-500 text-sm">{usernameError}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <label
                htmlFor="login-username"
                className="text-[#FDF2A5] text-sm mb-1 self-start pl-2"
              >
                Password
              </label>
              <input
                className={`w-72 sm:w-72 md:w-80 lg:w-96 px-3 py-2 border border-gray-300 rounded-md rounded ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                type="password"
                id="login-password"
                value={password}
                // placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePassword}
                disabled={isLoading}
                required
              />
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>
            {/* <div className="flex w-full justify-center mt-5">
              <Button type="submit" text={"Login"} />
            </div> */}
            <div className={`flex justify-around mt-5 w-full`}>
              <SpriteAnimation
                spriteSheetImage="sprites/button_bg.png"
                frameWidth={modalStyles.spriteDimensions.width}
                frameHeight={modalStyles.spriteDimensions.height}
                onClick={!isLoading ? onClose : undefined}
                totalFrames = {25}
                rows = {5}
                cols = {5}
              >
                <button
                  className={`w-full h-full text-center py-1 ${
                    deviceType === "desktop"
                      ? "text-[20px] px-3"
                      : "text-[14px] px-2"
                  } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  type="button"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </SpriteAnimation>
              <SpriteAnimation
                spriteSheetImage="sprites/button_bg.png"
                frameWidth={modalStyles.spriteDimensions.width}
                frameHeight={modalStyles.spriteDimensions.height}
                onClick={() => {
                  if (!isLoading) {
                    const event = { preventDefault: () => {} } as React.FormEvent;
                    handleSubmit(event);
                  }
                }}
                totalFrames = {25}
                rows = {5}
                cols = {5}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-full text-center py-1 ${
                    deviceType === "desktop"
                      ? "text-[20px] px-3"
                      : "text-[14px] px-1"
                  } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                   Login
                </button>
              </SpriteAnimation>
            </div>
          </form>
          {formError && (
            <div className="flex w-full p-2 mt-3 text-red-600 text-sm font-medium justify-center">
              <p>{formError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
