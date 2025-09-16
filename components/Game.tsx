
import React, { useState, useEffect, useCallback } from 'react';
import { MAP_LAYOUT, NPCS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, PLAYER_START_POSITION } from '../constants';
import { TileType, Position, Direction, NpcData } from '../types';
import Map from './Map';
import Player from './Player';
import Npc from './Npc';
import DialogueBox from './DialogueBox';

const Game: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState<Position>(PLAYER_START_POSITION);
  const [playerDirection, setPlayerDirection] = useState<Direction>(Direction.DOWN);
  const [dialogue, setDialogue] = useState<string[] | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);

  const isWalkable = (pos: Position): boolean => {
    if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) {
      return false;
    }
    const tile = MAP_LAYOUT[pos.y][pos.x];
    if (tile === TileType.WALL) {
      return false;
    }
    if (NPCS.some(npc => npc.position.x === pos.x && npc.position.y === pos.y)) {
      return false;
    }
    return true;
  };

  const handleInteraction = () => {
      if (dialogue) {
          if (dialogueIndex < dialogue.length - 1) {
              setDialogueIndex(prev => prev + 1);
          } else {
              setDialogue(null);
              setDialogueIndex(0);
          }
          return;
      }

      let targetPos = { ...playerPosition };
      switch (playerDirection) {
          case Direction.UP:    targetPos.y--; break;
          case Direction.DOWN:  targetPos.y++; break;
          case Direction.LEFT:  targetPos.x--; break;
          case Direction.RIGHT: targetPos.x++; break;
      }

      const targetNpc = NPCS.find(npc => npc.position.x === targetPos.x && npc.position.y === targetPos.y);
      if (targetNpc) {
          setDialogue(targetNpc.message);
          setDialogueIndex(0);
      }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (dialogue) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleInteraction();
      }
      return;
    }

    let newPosition = { ...playerPosition };
    let newDirection = playerDirection;
    
    switch (e.key) {
      case 'ArrowUp':
        newPosition.y--;
        newDirection = Direction.UP;
        break;
      case 'ArrowDown':
        newPosition.y++;
        newDirection = Direction.DOWN;
        break;
      case 'ArrowLeft':
        newPosition.x--;
        newDirection = Direction.LEFT;
        break;
      case 'ArrowRight':
        newPosition.x++;
        newDirection = Direction.RIGHT;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleInteraction();
        return;
      default:
        return;
    }
    
    e.preventDefault();
    setPlayerDirection(newDirection);
    if (isWalkable(newPosition)) {
      setPlayerPosition(newPosition);
    }
  }, [playerPosition, playerDirection, dialogue, dialogueIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="relative bg-black border-4 border-gray-600 shadow-lg"
      style={{
        width: `${MAP_WIDTH * TILE_SIZE}px`,
        height: `${MAP_HEIGHT * TILE_SIZE}px`,
      }}
    >
      <Map layout={MAP_LAYOUT} />
      {NPCS.map(npc => (
        <Npc key={npc.id} position={npc.position} sprite={npc.sprite} />
      ))}
      <Player position={playerPosition} direction={playerDirection} />
      {dialogue && (
        <DialogueBox
          message={dialogue[dialogueIndex]}
          onClose={handleInteraction}
          hasNext={dialogueIndex < dialogue.length - 1}
        />
      )}
    </div>
  );
};

export default Game;
