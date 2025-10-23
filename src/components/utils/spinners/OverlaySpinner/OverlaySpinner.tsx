import { SpriteAnimation } from "../../SpriteAnimation";
import "./OverlaySpinner.css";
import bougeeLogo from "../../../../assets/icons/bougeelogo.png"
interface OverlaySpinnerProps {
  text?: string;
}

export default function OverlaySpinner({ text }: OverlaySpinnerProps) {
  const userType = sessionStorage.getItem("userType");
  return (
    <div className="spinner-overlay rounded-lg flex flex-col">
   {/* {userType !== "BOT" ? ( */}
      <img 
        src={bougeeLogo} 
        width={150} 
        height={150} 
        alt="Loading" 
      />
    {/* ) : (
      <SpriteAnimation
      spriteSheetImage={"sprites/fiesta_loader.png"}
      frameWidth={150}
      frameHeight={150}
      totalFrames={49}
      rows={7}
      cols={7}
      fps={21}
    />
    )} */}
      {text && (
        <div className="text-white font-medium text-md mt-4">{text}</div>
      )}
    </div>
  );
}
