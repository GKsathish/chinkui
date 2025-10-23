import React, { useEffect, useState } from "react";
import "./SliderInput.css";

interface SliderInputProps {
  id: string;
  min: number;
  max: number;
  step?: number;
  initialValue: number;
  onChange: (value: number) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({
  id,
  min,
  max,
  step = 1,
  initialValue,
  onChange,
}) => {
  const deviceType = localStorage.getItem("deviceType");
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const updateSliderBackground = () => {
      const percentage = ((value - min) / (max - min)) * 100;
      const slider = document.getElementById(
        `slider-${id}`
      ) as HTMLInputElement;
      if (slider) {
        slider.style.background = `linear-gradient(-90deg, #4c4c4c ${
          100 - percentage
        }%, transparent 0),
          repeating-linear-gradient(
          110deg,          /* Angle of the stripes */
          #d4a354,         /* First color */
          #d4a354 6px,     /* First color stop */
          #c57920 4px,     /* Second color starts */
          #c57920 14px     /* Second color stop */
        )`;
        slider.style.backgroundRepeat = "no-repeat";
      }
    };

    updateSliderBackground();
  }, [value, id, min, max]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div
      className={`slider-container flex w-full ${
        deviceType !== "desktop" && "mobile"
      }`}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        id={`slider-${id}`}
        className="styled-slider"
      />
    </div>
  );
};

export default SliderInput;
