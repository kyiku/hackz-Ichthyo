
import React from 'react';
import { TILE_SIZE } from '../constants';
import { Position } from '../types';

interface NpcProps {
  position: Position;
  sprite: string;
}

const Npc: React.FC<NpcProps> = ({ position, sprite }) => {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        top: position.y * TILE_SIZE,
        left: position.x * TILE_SIZE,
        zIndex: 5,
      }}
    >
      <div className="w-10 h-10 bg-gray-700 border-2 border-gray-500 rounded-md flex items-center justify-center shadow-lg">
        <span className="text-2xl">{sprite}</span>
      </div>
    </div>
  );
};

export default Npc;
