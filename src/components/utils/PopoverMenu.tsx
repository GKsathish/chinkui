import { forwardRef, useState } from "react";
import ChangePassword from "../auth/ChangePassword";
import Logout from "../auth/Logout";
import { useNavigate } from "react-router-dom";

import BetHistory from "../../pages/bethistory/BetHistory";

interface PopoverMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const PopoverMenu = forwardRef<HTMLDivElement, PopoverMenuProps>(
  ({ isOpen, toggleMenu }, ref) => {
    const deviceType = localStorage.getItem("deviceType");
    const [isChangePasswordOpen, setIsChangePasswordOpen] =
      useState<boolean>(false);
          const navigate = useNavigate();

    const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);
    const [isBetOpen, setIsBetOpen] = useState<boolean>(false);

    return (
      <>
        {isOpen && (
          <div
              className={`flex w-full h-full fixed left-0 z-[1000] items-center justify-center ${
  deviceType === "desktop" ? "top-[0px]" : "top-[34px]"
}`}

            onClick={toggleMenu}
          >
            <div
              className={`absolute bg-[#0D0E0F] z-[1000] border-[3px] border-[#e3c4a3] shadow-[0px_4px_8px_rgba(0,0,0,0.3)] ${
                deviceType === "desktop"
                  ? "top-[80px]  right-6 rounded-2xl p-3 pb-5 min-w-[200px]"
                  : "bottom-[85px] right-3 rounded-xl p-2 "
              }`}
              onMouseLeave={toggleMenu}
            >
              <ul className="list-none p-0 m-0">
                <li
                  className={`gradient-text cursor-pointer ${
                    deviceType === "desktop"
                      ? "font-semibold text-xl pb-4 hover:scale-[1.08]"
                      : "font-medium text-sm p-1"
                  }`}
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  Change Password
                </li>
                  <li
                  className={`gradient-text cursor-pointer ${
                    deviceType === "desktop"
                      ? "font-semibold text-xl pb-4 hover:scale-[1.08]"
                      : "font-medium text-sm p-1"
                  }`}
                                  onClick={() => setIsBetOpen(true)}

                >
                  History
                </li>
                <li
                  className={`gradient-text cursor-pointer ${
                    deviceType === "desktop"
                      ? "font-semibold text-xl hover:scale-[1.08]"
                      : "font-medium text-sm p-1"
                  }`}
                  onClick={() => setIsLogoutOpen(true)}
                >
                  Logout
                </li>
              </ul>
            </div>
          </div>
        )}
        {isChangePasswordOpen && (
          <ChangePassword
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
          />
        )}
          {isBetOpen && (
          <BetHistory
            isOpen={isBetOpen}
            onClose={() => setIsBetOpen(false)}
          />
        )}
        {isLogoutOpen && (
          <Logout
            isOpen={isLogoutOpen}
            onClose={() => setIsLogoutOpen(false)}
          />
        )}
      </>
    );
  }
);

export default PopoverMenu;
