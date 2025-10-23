import React, { ReactNode, useEffect, useState } from "react";
import OverlaySpinner from "../spinners/OverlaySpinner/OverlaySpinner";
import { SpriteAnimation } from "../SpriteAnimation";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleStyleClasses?: string;
  showSpinner?: boolean;
  spinnerText?: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleStyleClasses,
  showSpinner,
  spinnerText,
  children,
}) => {
  const deviceType = localStorage.getItem("deviceType");
  const [frameDimensions, setFrameDimensions] = useState({
    width: 52,
    height: 52,
  });

  useEffect(() => {
    if (deviceType === "desktop") {
      setFrameDimensions({ width: 82, height: 80 });
    } else {
      setFrameDimensions({ width: 56, height: 54 });
    }
  }, [deviceType]);

  if (!isOpen) return null;

  const handleOutsideClick = () => {
    if (!showSpinner) {
      onClose();
    }
  };

  return (
    <div
      className="flex w-full h-full fixed top-0 left-0 bg-black/[0.7] z-[1000] items-center justify-center"
      onClick={handleOutsideClick}
    >
      <div
        className={`flex flex-col bg-[url(https://cdn.bougeegames.com/modal_bg.png)] bg-no-repeat bg-center bg-cover z-[150] ${
          deviceType === "desktop"
            ? "w-[890px] h-[509px] p-[80px]"
            : "w-[600px] h-[340px] p-[44px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`modal-title capitalize ${
            deviceType === "desktop"
              ? "text-2xl font-bold -mt-[50px]"
              : "text-[16px] font-semibold -mt-[26px]"
          } ${titleStyleClasses ? titleStyleClasses : ""}`}
        >
          {title}
        </div>
        <div className="flex justify-end pt-4">
          <SpriteAnimation
            spriteSheetImage={"sprites/close.png"}
            frameWidth={frameDimensions.width}
            frameHeight={frameDimensions.height}
            onClick={onClose}
          />
          {/* <img
            src={closeIcon}
            alt="X"
            onClick={onClose}
            className={`cursor-pointer ${
              deviceType === "desktop"
                ? "w-[60px] h-[60px] hover:scale-[1.08]"
                : "w-[48px] h-[48px]"
            }`}
          /> */}
        </div>
        <div className="flex w-full">{children}</div>
      </div>
      {showSpinner && <OverlaySpinner text={spinnerText} />}
    </div>
  );
};

export default Modal;
