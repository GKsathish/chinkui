import React, { useState, useEffect } from "react";
import { SpriteAnimation } from "../../components/utils/SpriteAnimation";
import home from "../../assets/home.png";
import { useNavigate } from "react-router-dom";
import bougeeLogo from "../../assets/icons/bougeelogo.png";
import expo from "../../assets/dev-expo.png";
const GlobeIcon = () => (
  <svg
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.5 22C18.0228 22 22.5 17.5228 22.5 12C22.5 6.47715 18.0228 2 12.5 2C6.97715 2 2.5 6.47715 2.5 12C2.5 17.5228 6.97715 22 12.5 22Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 12H22.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 2C15.0013 4.73835 16.4228 8.29203 16.5 12C16.4228 15.708 15.0013 19.2616 12.5 22C9.99872 19.2616 8.57725 15.708 8.5 12C8.57725 8.29203 9.99872 4.73835 12.5 2V2Z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const AppleIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_1_14)">
      <path
        d="M25.424 21.8208C25.0005 22.7991 24.4993 23.6995 23.9186 24.5274C23.127 25.656 22.4789 26.4372 21.9794 26.871C21.2051 27.5831 20.3755 27.9478 19.4871 27.9685C18.8494 27.9685 18.0802 27.7871 17.185 27.4189C16.2867 27.0525 15.4613 26.871 14.7065 26.871C13.9149 26.871 13.066 27.0525 12.1579 27.4189C11.2485 27.7871 10.5158 27.9789 9.95566 27.9979C9.10376 28.0342 8.25463 27.6592 7.40705 26.871C6.86608 26.3992 6.18944 25.5903 5.37884 24.4444C4.50914 23.2208 3.79413 21.8018 3.23397 20.1841C2.63407 18.4367 2.33334 16.7447 2.33334 15.1065C2.33334 13.2301 2.7388 11.6117 3.55095 10.2554C4.18923 9.16606 5.03836 8.30672 6.10112 7.67588C7.16387 7.04503 8.31218 6.72356 9.54881 6.703C10.2255 6.703 11.1128 6.9123 12.2155 7.32364C13.315 7.73637 14.0211 7.94567 14.3306 7.94567C14.562 7.94567 15.3464 7.70094 16.676 7.21303C17.9333 6.76055 18.9945 6.5732 19.8639 6.647C22.2196 6.83712 23.9894 7.76575 25.1664 9.43879C23.0596 10.7153 22.0174 12.5033 22.0381 14.797C22.0571 16.5836 22.7053 18.0703 23.9791 19.2508C24.5563 19.7986 25.201 20.2221 25.9183 20.5228C25.7627 20.9739 25.5985 21.406 25.424 21.8208ZM20.0212 0.560465C20.0212 1.96078 19.5096 3.26826 18.4899 4.47844C17.2593 5.91712 15.7708 6.74845 14.1567 6.61727C14.1362 6.44927 14.1242 6.27247 14.1242 6.08667C14.1242 4.74236 14.7095 3.30369 15.7487 2.12738C16.2676 1.53179 16.9274 1.03657 17.7277 0.641523C18.5262 0.252369 19.2814 0.037159 19.9918 0.000305176C20.0125 0.187506 20.0212 0.374719 20.0212 0.560447V0.560465Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_1_14">
        <rect width="28" height="28" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
const AndroidIcon = () => (
  <svg
    width="28"
    height="16"
    viewBox="0 0 28 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.67745 0.461418C3.07746 0.0814642 3.71848 0.0814642 4.1185 0.461418L7.41233 3.73867C9.35693 2.76678 11.65 2.30487 14 2.30487C16.35 2.30487 18.6431 2.76678 20.5877 3.73867L23.8815 0.461418C24.2815 0.0814642 24.9225 0.0814642 25.3226 0.461418C25.7226 0.841372 25.7226 1.51526 25.3226 1.89521L22.2346 4.7628C25.6964 7.18351 27.9988 11.0175 27.9988 15.4139C27.9988 15.5223 28.0015 15.7157 27.9988 15.8235H0.00120729C-0.00150911 15.7157 0.00120729 15.5223 0.00120729 15.4139C0.00120729 11.0175 2.30359 7.18351 5.76542 4.7628L2.67745 1.89521C2.27743 1.51526 2.27743 0.841372 2.67745 0.461418ZM8.44166 11.3173C9.19593 11.3173 9.88271 10.8048 9.88271 10.0883C9.88271 9.37188 9.19593 8.65454 8.44166 8.65454C7.68738 8.65454 7.20647 9.37188 7.20647 10.0883C7.20647 10.8048 7.68738 11.3173 8.44166 11.3173ZM20.7935 10.0883C20.7935 10.8048 20.3126 11.3173 19.5583 11.3173C18.8041 11.3173 18.1173 10.8048 18.1173 10.0883C18.1173 9.37188 18.8041 8.65454 19.5583 8.65454C20.3126 8.65454 20.7935 9.37188 20.7935 10.0883Z"
      fill="white"
    />
  </svg>
);
export default function Home() {
  const userType = sessionStorage.getItem("userType");
  const navigate = useNavigate();
  const [frameDimensions, setFrameDimensions] = useState({
    width: 52,
    height: 52,
  });
  const [showIOSDetails, setShowIOSDetails] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const screenHeight = window.innerHeight;

      let newSize = 52; // Default size

      if (screenHeight < 500) {
        newSize = 30;
      } else if (screenHeight >= 500 && screenHeight < 700) {
        newSize = 40;
      } else if (screenHeight >= 700 && screenHeight < 900) {
        newSize = 50;
      } else {
        newSize = 60;
      }

      setFrameDimensions({ width: newSize, height: newSize });
    };
    window.addEventListener("resize", updateDimensions);
    updateDimensions(); // Run on initial load

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleAndroid = () => {
    try {
      const s3Url =
        "https://s3.eu-west-2.amazonaws.com/static.inferixai.link/SpinFiesta777.apk";
      const link = document.createElement("a");
      link.href = s3Url;
      link.setAttribute("download", "SpinFiesta777.apk"); // Suggest a filename

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error initiating download:", error);
      alert("An error occurred while downloading the APK.");
    }
  };

  const handleWebClick = () => {
    navigate("/login");
  };
  const handleBackClick = () => {
    setShowIOSDetails(false);
  };
  const handleIOSClick = () => {
    setShowIOSDetails(true);
  };
  return (
    <>
      <div className="fixed inset-0 bg-black overflow-hidden">
        <div className="h-full mx-auto relative" style={{ maxWidth: "430px" }}>
          <div className="h-full w-full relative">
            <img
              src={home}
              alt="Las Vegas background"
              className="absolute w-full h-full object-cover"
            />
          </div>

          <div className="absolute inset-0 z-10">
            <div className="h-full w-full flex flex-col items-center px-4">
              {/* Logo Placeholder - positioned above the text in the background */}
              <div className="w-46 h-46 mt-2">
                {userType !== "BOT" ? (
                  <img
                    src={bougeeLogo}
                    width={frameDimensions.width * 2.3}
                    height={frameDimensions.height * 2.3}
                    alt="Loading"
                  />
                ) : (
                  <SpriteAnimation
                    spriteSheetImage={"sprites/fiesta_logo.png"}
                    frameWidth={frameDimensions.width * 3}
                    frameHeight={frameDimensions.height * 3}
                    totalFrames={49}
                    rows={7}
                    cols={7}
                    fps={21}
                    delay={3000}
                  />
                )}
              </div>
              {!showIOSDetails ? (
                <div className="w-full space-y-3 mt-auto mb-4 pb-safe px-4 md:px-8">
                  <button
                    className="relative w-full h-[58px] md:h-[52px] group"
                    onClick={() => handleAndroid()}
                  >
                    {/* Gradient border background */}
                    <div className="absolute inset-0 rounded-[13px] bg-gradient-to-r from-[#D02E2D] to-[#E65F05] p-[3px]">
                      <div className="w-full h-full  bg-[#004e16] hover:bg-[#004e16]/90 text-[#FDF2A5] flex items-center justify-center gap-3 rounded-[10px] text-[20px] md:text-[16px]  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.2)] cursor-pointer">
                        <AndroidIcon />
                        Download for Android
                      </div>
                    </div>
                  </button>
                  <button
                    className="relative w-full h-[48px] md:h-[52px] group"
                    onClick={() => handleIOSClick()}
                  >
                    {/* Gradient border background */}
                    <div className="absolute inset-0 rounded-[13px] bg-gradient-to-r from-[#D02E2D] to-[#E65F05] p-[3px]">
                      <div className="w-full h-full pl-[-10] bg-gradient-to-r from-[#5c1400] to-[#ff6b00] hover:opacity-90 text-[#FDF2A5] flex items-center justify-center gap-3 rounded-[10px] text-[20px] md:text-[16px]  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.2)] cursor-pointer">
                        <span className="ml-[-30px]">
                          <AppleIcon />
                        </span>
                        Download for iOS
                      </div>
                    </div>
                  </button>
                  <button
                    className="relative w-full h-[48px] md:h-[52px] group"
                    onClick={() => handleWebClick()}
                  >
                    {/* Gradient border background */}
                    <div className="absolute inset-0 rounded-[13px] bg-gradient-to-r from-[#D02E2D] to-[#E65F05] p-[3px]">
                      {/* Inner button with background */}
                      <div className="w-full h-full bg-[#252525] rounded-[10px] flex items-center justify-center gap-3 text-[20px] text-[#FDF2A5] md:text-[16px]  transition-colors group-hover:bg-[#252525]/90 cursor-pointer">
                        <GlobeIcon />
                        Play Instantly on Web
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-full space-y-3 mt-auto mb-4 pb-safe px-4 md:px-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <h2 className="text-2xl">IOS</h2>
                      <img src={expo} alt="iOS 1" width={150} height={150} />
                    </div>
                    <p>
                      Install EXPO GO application from AppStore scan the above
                      QR with camera to open the Spin Fiesta 777
                    </p>

                    {/* <h2 className="text-2xl">IOS 2</h2>
              <p>Additional details about iOS 2.</p> */}
                    <div className="flex items-right w-20 px-1 rounded-xl bg-[#40000c] text-[#FFC873] border-2 border-[#FFC873]">
                      <button onClick={handleBackClick} className="w-20 h-10">
                        Back
                      </button>
                    </div>
                    {/* <button onClick={handleBackClick} className="text-lg text-blue-400 underline">Back</button> */}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
