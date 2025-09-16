
export enum TileType {
  FLOOR,
  WALL,
  CARPET_V,
  CARPET_H,
  EXIT,
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Position {
  x: number;
  y: number;
}

export interface NpcData {
  id: number;
  position: Position;
  message: string[];
  sprite: string;
}
