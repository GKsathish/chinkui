import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import SliderInput from "./sliderInput/SliderInput";
import { SpriteAnimation } from "./SpriteAnimation";

const AudioSettings: React.FC = () => {
  const deviceType = localStorage.getItem("deviceType");
  const username = sessionStorage.getItem("username");
  const [musicVolume, setMusicVolume] = useState(0);
  const [soundVolume, setSoundVolume] = useState(0);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [frameDimensions, setFrameDimensions] = useState({
    width: 52,
    height: 52,
  });

  useEffect(() => {
    setShowControls(false);
    // set music colume from cookies
    const musicVol = Cookies.get(`${username}_music`);
    if (musicVol) {
      setMusicVolume(parseFloat(musicVol));
    }

    // set sound colume from cookies
    const soundVol = Cookies.get(`${username}_sound`);
    if (soundVol) {
      setSoundVolume(parseFloat(soundVol));
    }
    setShowControls(true);
  }, [username]);

  const handleMusicVolumeUpdate = (val: number) => {
    setMusicVolume(val);
    Cookies.set(`${username}_music`, val.toFixed(2), { expires: 365 });
  };

  const handleSoundVolumeUpdate = (val: number) => {
    setSoundVolume(val);
    Cookies.set(`${username}_sound`, val.toFixed(2), { expires: 365 });
  };

  useEffect(() => {
    if (deviceType === "desktop") {
      setFrameDimensions({ width: 92, height: 90 });
    } else {
      setFrameDimensions({ width: 72, height: 70 });
    }
  }, [deviceType]);

  return (
    <>
      {showControls && (
        <div className="flex flex-col w-full pr-3">
          <div className="flex w-full justify-start items-center mt-1">
            <div className="w-[36%] flex items-center justify-evenly">
              <SpriteAnimation
                key="music"
                spriteSheetImage={
                  musicVolume === 0
                    ? "sprites/music_off.png"
                    : "sprites/music_on.png"
                }
                frameWidth={frameDimensions.width}
                frameHeight={frameDimensions.height}
              />
              <div
                className={`gradient-text mr-3 ${
                  deviceType === "desktop"
                    ? "text-[32px] font-bold"
                    : "text-[16px] font-semibold"
                }`}
              >
                MUSIC
              </div>
            </div>
            <div className="w-[64%]">
              <SliderInput
                id="music"
                min={0}
                max={1}
                step={0.01}
                initialValue={musicVolume}
                onChange={(val: number) => handleMusicVolumeUpdate(val)}
              ></SliderInput>
            </div>
          </div>
          <div className="flex w-full justify-start items-center mt-2">
            <div className="w-[36%] flex items-center justify-evenly">
              <SpriteAnimation
                key="sound"
                spriteSheetImage={
                  soundVolume === 0
                    ? "sprites/sound_off.png"
                    : "sprites/sound_on.png"
                }
                frameWidth={frameDimensions.width}
                frameHeight={frameDimensions.height}
              />
              <div
                className={`gradient-text mr-3 ${
                  deviceType === "desktop"
                    ? "text-[32px] font-bold"
                    : "text-[16px] font-semibold"
                }`}
              >
                SOUND
              </div>
            </div>
            <div className="w-[64%]">
              <SliderInput
                id="sound"
                min={0}
                max={1}
                step={0.01}
                initialValue={soundVolume}
                onChange={(val: number) => handleSoundVolumeUpdate(val)}
              ></SliderInput>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AudioSettings;
