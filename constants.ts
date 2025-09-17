import axios from 'axios';
import { TileType, NpcData, Position } from './types'; // types.ts ファイルがある前提だよ


export const TILE_SIZE = 48;
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 15;

export const PLAYER_START_POSITION: Position = { x: 10, y: 12 };

// 0: Floor, 1: Wall, 2: Vertical Carpet, 3: Horizontal Carpet, 4: Exit
export const MAP_LAYOUT: TileType[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
] as TileType[][];

export const NPCS: NpcData[] = [
  { id: 1, position: { x: 3, y: 3 }, message: ["'Pixel Racer 3D'へようこそ！", "ハイスコア: 999,999... おっと、故障中のようだ。"], sprite: '👾' },
  { id: 2, position: { x: 7, y: 3 }, message: ["'Starship Guardian' が起動！", "地球を守る最後の希望は君だ！"], sprite: '🚀' },
  { id: 3, position: { x: 12, y: 3 }, message: ["ここはクレーンゲームコーナーです。", "景品: ふわふわのアルパカ人形。取れそうで取れない絶妙なバランス。"], sprite: '🧸' },
  { id: 4, position: { x: 16, y: 3 }, message: ["音楽ゲーム 'Beat Master'！", "新曲が追加されました！全国ランキングに挑戦しよう！"], sprite: '🎵' },
  { id: 5, position: { x: 3, y: 10 }, message: ["レトロゲームコーナー。", "'Galactic Invaders' は今でも名作だ。"], sprite: '🕹️' },
  { id: 6, position: { x: 7, y: 10 }, message: ["これは両替機です。", "ガチャン！コインの音が鳴り響く。"], sprite: '💰' },
  { id: 7, position: { x: 12, y: 10 }, message: ["プリクラ機 'KiraKira Eyes'。", "最新の美肌モードとデカ目効果を搭載！"], sprite: '📸' },
  { id: 8, position: { x: 16, y: 10 }, message: ["自動販売機だ。", "冷たい飲み物で一息つこう。"], sprite: '🥤' },
  { id: 9, position: { x: 9, y: 6 }, message: ["インフォメーションデスク。", "何かお困りですか？...誰もいないようだ。"], sprite: 'ℹ️' },
];

export const MOVING_NPCS: NpcData[] = [
  { id: 100, position: { x: 5, y: 7 }, message: ["..."], sprite: 'P' },
  { id: 101, position: { x: 13, y: 3 }, message: ["..."], sprite: 'P' },
];
