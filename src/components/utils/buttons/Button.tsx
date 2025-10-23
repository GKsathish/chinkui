import React, { useEffect, useState } from "react";
import { SpriteAnimation } from "../SpriteAnimation";
// Refer to App.css button section for styles

interface ButtonProps {
  text: string; // The text to be displayed on the button
  type?: "button" | "submit" | "reset"; // Optional type of the button
  classes?: string; // Optional additional CSS classes for styling
  onClick?: () => void; // Optional function to handle click event
  isLoading?: boolean; // Optional loading state
  loadingText?: string; // Optional text to display when loading
  disabled?: boolean; // Optional disabled state
}

const Button: React.FC<ButtonProps> = ({
  text,
  type = "button",
  classes = "",
  onClick,
  isLoading = false,
  loadingText = "Loading...",
  disabled = false,
}) => {
  const [frameDimensions, setFrameDimensions] = useState({
    width: 300,
    height: 100,
  });
  const deviceType = localStorage.getItem("deviceType");

  useEffect(() => {
    if (deviceType === "desktop") {
      setFrameDimensions({ width: 250, height: 90 });
    } else {
      setFrameDimensions({ width: 200, height: 67 });
    }
  }, [deviceType]);

  const handleClick = () => {
    if (!onClick || isLoading || disabled) return;
    onClick();
  };

  return (
    <SpriteAnimation
      spriteSheetImage="sprites/button_bg.png"
      frameWidth={frameDimensions.width}
      frameHeight={frameDimensions.height}
      onClick={!isLoading && !disabled ? () => handleClick() : undefined}
      totalFrames = {25}
      rows = {5}
      cols = {5}
    >
      <button
        type={type}
        className={`w-full h-full text-center py-1 ${
          deviceType === "desktop" ? "text-[20px] px-3" : "text-[14px] px-2"
        } ${(isLoading || disabled) ? "opacity-70 cursor-not-allowed" : ""}`}
        onClick={handleClick}
        disabled={isLoading || disabled}
      >
        {isLoading ? loadingText : text}
      </button>
    </SpriteAnimation>
  );
};

export default Button;
