
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
  customerName?: string;
  age?: number;
  status?: string; // alive, dead, cursed
  money?: number; // customer's money
  icon_url?: string; // customer's profile image (primary)
  icon_urls?: { // multiple URL formats for fallback
    primary: string;
    fallback1: string | null;
    fallback2: string | null;
    fallback3: string | null;
  } | null;
  profile?: string; // customer's profile description
  level?: number; // customer's level
}
