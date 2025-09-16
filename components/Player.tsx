
import React from 'react';
import { TILE_SIZE } from '../constants';
import { Position, Direction } from '../types';

interface PlayerProps {
  position: Position;
  direction: Direction;
}

const Player: React.FC<PlayerProps> = ({ position, direction }) => {
  return (
    <div
      className="absolute flex items-center justify-center transition-all duration-200"
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        top: position.y * TILE_SIZE,
        left: position.x * TILE_SIZE,
        zIndex: 10,
      }}
    >
      <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-blue-200 shadow-lg relative flex items-center justify-center">
        <div className="absolute w-4 h-4 bg-white rounded-full -top-1"></div>
        <div className="text-sm font-bold text-blue-900">P</div>
      </div>
    </div>
  );
};

export default Player;
