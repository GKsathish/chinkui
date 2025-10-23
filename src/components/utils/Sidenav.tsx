import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../store/store";
import { tablesFiltered } from "../../store/tablesSlice";
import { SpriteAnimation } from "./SpriteAnimation";
import { useState } from "react";

export default function SideNav({
  excludeTableId,
}: {
  excludeTableId?: string;
}) {
  const navigate = useNavigate();
  const favTables = useSelector((state: RootState) => state.favTables);
  const filteredTables = useSelector((state: RootState) =>
    tablesFiltered(state, { tables: "Slots" }, favTables, excludeTableId)
  );
  const frameDimensions = {
    width: 180,
    height: 200,
  };

  const [isClickable, setIsClickable] = useState(true); // Prevent rapid clicks

  const redirectTo = (path: string) => {
    if (!isClickable) return; // Ignore clicks if waiting

    setIsClickable(false); // Disable further clicks for 2 seconds
    navigate(path);

    setTimeout(() => {
      setIsClickable(true); // Re-enable clicks after 2 seconds
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full items-baseline p-4 justify-center items-center"></div>
      <div className="flex flex-col p-4 max-h-[90%] overflow-y-auto">
        {filteredTables.map((_table) => (
          <div
            className="flex flex-col w-[95%] hover:scale-[1.07]"
            key={_table.tableId + "_game_block"}
          >
            <SpriteAnimation
              spriteSheetImage={`game_thumbnail_sprites/${_table.slug}.png`}
              frameWidth={frameDimensions.width}
              frameHeight={frameDimensions.height}
              onClick={() => redirectTo(`/slot-games/${_table.slug}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
