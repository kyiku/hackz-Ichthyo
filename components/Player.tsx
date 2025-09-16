import React from 'react';
import { TILE_SIZE } from '../constants';
import { Position, Direction } from '../types';

interface PlayerProps {
    position: Position;
    direction: Direction;
    color: 'blue' | 'red';
    isCalling?: boolean; // 助けを求めている状態かどうか
}

const Player: React.FC<PlayerProps> = ({ position, direction, color, isCalling }) => {
    return (
        <div
            className={`absolute flex items-center justify-center transition-all duration-200 ${isCalling ? 'animate-pulse' : ''}`}
            style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                top: position.y * TILE_SIZE,
                left: position.x * TILE_SIZE,
                zIndex: 10,
            }}
        >
            {/* colorが'blue'の時に表示する要素 */}
            {color === 'blue' && (
                <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-blue-200 shadow-lg relative flex items-center justify-center">
                    <div className="absolute w-4 h-4 bg-white rounded-full -top-1"></div>
                    <div className="text-sm font-bold text-blue-900">P</div>
                </div>
            )}

            {/* colorが'red'の時に表示する要素 */}
            {color === 'red' && (
                <div className="w-8 h-8 bg-red-400 rounded-full border-2 border-red-200 shadow-lg relative flex items-center justify-center">
                    <div className="absolute w-4 h-4 bg-white rounded-full -top-1"></div>
                    <div className="text-sm font-bold text-red-900">P</div>
                </div>
            )}

            {/* isCallingがtrueなら、‼️を表示 */}
            {isCalling && (
                <span className="absolute -top-6 text-2xl animate-bounce">‼️</span>
            )}
        </div>
    );
};

export default Player;