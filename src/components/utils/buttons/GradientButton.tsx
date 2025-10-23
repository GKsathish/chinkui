import { useEffect, useState } from "react";

interface GradientButtonProps {
  src: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean; // New prop to control active state
}

export const GradientButton = ({ 
  src, 
  className, 
  onClick, 
  isActive = false 
}: GradientButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 640);
  
  useEffect(() => {
    const updateScreenSize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);
  
  return (
    <div
      className={`relative cursor-pointer ${className || ""}`}
      style={{ 
        padding: "5px", // Add padding to create space between buttons
        position: "relative",
        zIndex: isActive ? 5 : 1 // Higher z-index for active button
      }}
    >
      {/* Wrapper to contain hover area */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {/* Glowing background effect - Only visible when active or hovered */}
        <div 
          className={`absolute bg-gradient-to-b from-[#FFF5AE] to-transparent blur-lg rounded-full transition-opacity duration-300 ${
            isActive ? "opacity-80" : isHovered ? "opacity-50" : "opacity-0"
          }`}
          style={{
            width: isMobile ? "90px" : "150px",
            height: "60px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -30%)"
          }}
        />

        {/* Button Wrapper */}
        <div
          className={`relative h-[37px] rounded-full overflow-hidden 
                    ${isMobile ? "w-[80px]" : "w-[120px] md:w-[100px] sm:w-[80px]"}`}
        >
          {/* Gradient background with hover/active effect */}
          <div 
            className={`absolute inset-0 transition-all duration-300 ${
              isActive || isHovered ? "brightness-150" : "brightness-100"
            }`} 
          />

          {/* Button content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={src || "/placeholder.svg"}
              alt="Button"
              className={`w-full h-full object-contain transition-all duration-300 ${
                isActive ? "brightness-125 scale-105" : 
                isHovered ? "brightness-125 scale-105" : "brightness-100"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};