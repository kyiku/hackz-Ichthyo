
import React from 'react';
import { TILE_SIZE } from '../constants';
import { TileType } from '../types';

interface MapProps {
  layout: TileType[][];
}

const getTileClassName = (tile: TileType): string => {
  switch (tile) {
    case TileType.WALL:
      return 'bg-gray-800 border-t-2 border-l-2 border-gray-700';
    case TileType.FLOOR:
      return 'bg-gray-600';
    case TileType.CARPET_V:
        return 'bg-red-800';
    case TileType.CARPET_H:
        return 'bg-red-800';
    default:
      return 'bg-black';
  }
};

const Map: React.FC<MapProps> = ({ layout }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      {layout.map((row, y) =>
        row.map((tile, x) => (
          <div
            key={`${x}-${y}`}
            className={`absolute ${getTileClassName(tile)}`}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              top: y * TILE_SIZE,
              left: x * TILE_SIZE,
            }}
          >
            {tile === TileType.FLOOR && <div className="w-full h-full border border-gray-700/50"></div>}
          </div>
        ))
      )}
    </div>
  );
};

export default Map;
