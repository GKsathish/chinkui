import React, { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import rotatePhoneAnimation from "../../assets/Mobile rotate.json";
import portrait from "../../assets/Portrait.json";
import { SpriteAnimation } from "../utils/SpriteAnimation";

interface RotatePhoneProps {
  orientation: "landscape-primary" | "portrait-primary" | undefined;
}

const RotatePhone: React.FC<RotatePhoneProps> = ({ orientation }) => {
  const deviceType = localStorage.getItem("deviceType");
  const parentRef = useRef<HTMLDivElement>(null);
  const [frameDimensions, setFrameDimensions] = useState({
    width: window.innerWidth * 0.1,
    height: window.innerWidth * 0.1,
  });

  useEffect(() => {
    const pfc = parentRef.current;

    const updateFrameSize = () => {
      if (pfc) {
        const parentWidth = pfc.offsetWidth;
        const mFactor = deviceType === "desktop" ? 0.08 : 0.12;
        const newWidth = parentWidth * mFactor;
        setFrameDimensions({
          width: newWidth,
          height: newWidth,
        });
      }
    };

    const observer = new ResizeObserver(updateFrameSize);
    if (pfc) {
      observer.observe(pfc);
    }

    return () => {
      if (pfc) {
        observer.unobserve(pfc);
      }
    };
  }, [deviceType]);

  if (!orientation) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className="relative w-full h-screen flex flex-col items-center justify-center bg-black/[0.7]"
    >
      {/* Top Logo */}
      {orientation === "landscape-primary" && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <SpriteAnimation
            spriteSheetImage={"sprites/fiesta_logo.png"}
            frameWidth={frameDimensions.width * 2}
            frameHeight={frameDimensions.height * 2}
            totalFrames={49}
            rows={7}
            cols={7}
            fps={21}
            delay={3000}
          />
        </div>
      )}
      {/* Rotate Animation and Message */}
      <div className="flex flex-col items-center justify-center text-2xl top-panel-gradient-text font-bold m-2 text-center">
        <div className="w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 mb-2">
          {orientation === "landscape-primary" ? (
            <Lottie animationData={rotatePhoneAnimation} loop />
          ) : (
            <Lottie animationData={portrait} loop />
          )}
        </div>
        <p>
          Please rotate your device to{" "}
          <span className="capitalize">
            {orientation.replace("-primary", "")}
          </span>{" "}
          mode for the best experience.
        </p>
        <p>
          For fullscreen:
          <br />
          1. Tap Share → Add to Home Screen
          <br />
          2. Open from Home Screen
          <br />
        </p>
      </div>
    </div>
  );
};

export default RotatePhone;
