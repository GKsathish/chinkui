import { useState } from "react";
import LoginForm from "../../components/auth/LoginForm";
import SignUpForm from "../../components/auth/SignupForm";
import OverlaySpinner from "../../components/utils/spinners/OverlaySpinner/OverlaySpinner";
import {SpriteAnimation} from "../../components/utils/SpriteAnimation";
import "./Login.css";

export default function Page() {
  const [showSignup, setShowSignup] = useState<boolean>(false);
  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  // Placeholder dimensions for the sprite sheet frames
  const frameDimensions = { width: 100, height: 100 };

  return (
    <div className="flex w-full h-screen items-center justify-center relative bg-cover bg-center">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-6xl px-4">
        {/* Logo Section - Hidden on smaller screens */}
        <div className="hidden md:flex items-center justify-left w-2/4">
          <SpriteAnimation
            spriteSheetImage={"sprites/fiesta_logo.png"}
            frameWidth={frameDimensions.width * 2.5}
            frameHeight={frameDimensions.height * 2.5}
            totalFrames={49}
            rows={7}
            cols={7}
            fps={21}
            delay={3000}
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-2/4 max-w-md">
          <div className="flex flex-col w-full bg-[#000000B2] rounded-lg shadow-lg p-6">
            {showSpinner && <OverlaySpinner />}
            {showSignup ? (
              <SignUpForm
                onSuccess={() => setShowSignup(false)}
                showSpinner={(val: boolean) => setShowSpinner(val)}
              />
            ) : (
              <LoginForm showSpinner={(val: boolean) => setShowSpinner(val)} />
            )}
            <div className="flex font-medium text-xs leading-[14.5px] items-baseline justify-center mt-2">
              {showSignup ? (
                <>
                  Already Registered?
                  <span
                    className="text-sm leading-[16.94px] cursor-pointer font-bold px-1 hover:scale-110 underline"
                    onClick={() => setShowSignup(false)}
                  >
                    Login
                  </span>
                </>
              ) : (
                <>
                  Not Registered?
                  <span
                    className="text-sm leading-[16.94px] cursor-pointer font-bold px-1 hover:scale-110 underline"
                    onClick={() => setShowSignup(true)}
                  >
                    Sign Up
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
