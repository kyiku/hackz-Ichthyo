import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MAP_LAYOUT, NPCS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, PLAYER_START_POSITION, MOVING_NPCS } from '../constants';
import { TileType, Position, Direction, NpcData } from '../types';
import Map from './Map';
import Player from './Player';
import Npc from './Npc';
import DialogueBox from './DialogueBox';
import ChatHistory from './ChatHistory';

const Game: React.FC = () => {
    const [playerPosition, setPlayerPosition] = useState<Position>(PLAYER_START_POSITION);
    const [playerDirection, setPlayerDirection] = useState<Direction>(Direction.DOWN);
    const [dialogue, setDialogue] = useState<string[] | null>(null);
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [movingNpcs, setMovingNpcs] = useState<NpcData[]>(MOVING_NPCS);
    const [callingNpcId, setCallingNpcId] = useState<number | null>(null);
    const [isCallOnCooldown, setIsCallOnCooldown] = useState<boolean>(false);
    const [playerInput, setPlayerInput] = useState<string>('');
    const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
    const [inBattle, setInBattle] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    const [showChatHistory, setShowChatHistory] = useState<boolean>(false);

    const playerPositionRef = useRef(playerPosition);
    useEffect(() => {
        playerPositionRef.current = playerPosition;
    }, [playerPosition]);

    const dialogueRef = useRef(dialogue);
    useEffect(() => {
        dialogueRef.current = dialogue;
    }, [dialogue]);

    const isWalkable = useCallback((pos: Position): boolean => {
        if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) return false;
        const tile = MAP_LAYOUT[pos.y][pos.x];
        if (tile === TileType.WALL) return false;
        if (NPCS.some(npc => npc.position.x === pos.x && npc.position.y === pos.y)) return false;
        if (movingNpcs.some(npc => npc.position.x === pos.x && npc.position.y === pos.y)) return false;
        return true;
    }, [movingNpcs]);

    const handlePlayerAction = () => {
        setChatHistory(prev => [...prev, `Player: ${playerInput}`]);
        if (playerInput.trim() === "' OR 1=1; --") {
            const victoryMessage = ["な…に…！？身体が…データに…ぐあああ！"];
            setDialogue(victoryMessage);
            setChatHistory(prev => [...prev, `SYSTEM: ${victoryMessage[0]}`]);
            setDialogueIndex(0);
            setInBattle(false);
            setIsPlayerTurn(false);
        } else {
            const failureMessage = ["……。", "…何も起きなかった。"];
            setDialogue(failureMessage);
            setChatHistory(prev => [...prev, `SYSTEM: ${failureMessage[0]}`]);
            setDialogueIndex(0);
            setIsPlayerTurn(false);
        }
        setPlayerInput('');
    };

    const handleInteraction = () => {
        if (dialogue) {
            if (dialogueIndex < dialogue.length - 1) {
                const nextIndex = dialogueIndex + 1;
                setChatHistory(prev => [...prev, `NPC: ${dialogue[nextIndex]}`]);
                setDialogueIndex(nextIndex);
            } else {
                if (inBattle) {
                    setIsPlayerTurn(true);
                }
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

        const targetMovingNpc = movingNpcs.find(npc =>
            npc.position.x === targetPos.x && npc.position.y === targetPos.y && npc.id === callingNpcId
        );
        if (targetMovingNpc) {
            const { x, y } = targetMovingNpc.position;
            const adjacentPositions = [ { x, y: y - 1 }, { x, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y } ];
            const nearbyNpc = adjacentPositions.map(pos =>
                NPCS.find(staticNpc => staticNpc.position.x === pos.x && staticNpc.position.y === pos.y)
            ).find(npc => npc);

            let newDialogue: string[] = [];
            if (nearbyNpc) {
                switch (nearbyNpc.sprite) {
                    case '👾': newDialogue = ["おい、店員！このゲーム機、コインを飲み込んだぞ！", "金返せ！どうにかしろ！"]; break;
                    case '🚀': newDialogue = ["店員さん！このシューティングゲーム、途中で止まった！", "最高記録出そうだったのに！"]; break;
                    case '🎵': newDialogue = ["おい！この音ゲー、音がズレてるじゃないか！", "パーフェクト狙ってたのに！"]; break;
                    case '💰': newDialogue = ["両替機が壊れてる！1000円札が戻ってこない！", "すぐに直してくれ！"]; break;
                    case '🕹️': newDialogue = ["レトロゲームのコントローラーが効かない！", "上が押せないんだ！"]; break;
                    case '📸': newDialogue = ["プリクラ機でお金だけ取られた！", "写真が出てこないぞ！"]; break;
                    case '🥤': newDialogue = ["自販機でジュース買ったけど出てこない！", "お金返して！"]; break;
                    case 'ℹ️': newDialogue = ["インフォメーションに誰もいない！", "質問したいことがあるのに！"]; break;
                    case '🧸':
                    default:
                        newDialogue = ["おい、店員！このクレーンゲーム、アームが弱すぎるぞ！", "景品が全然取れないじゃないか。どうにかしろ！"];
                        break;
                }
            } else {
                newDialogue = ["おい、店員！なんだお前は！", "用事があったのに忘れちまったじゃねえか！"];
            }

            setDialogue(newDialogue);
            setChatHistory(prev => [...prev, '--- Battle Start ---', `NPC: ${newDialogue[0]}`]);
            setDialogueIndex(0);
            setIsPlayerTurn(false);
            setInBattle(true);
            setCallingNpcId(null);
            setIsCallOnCooldown(true);
            setTimeout(() => setIsCallOnCooldown(false), 10000);
            return;
        }

        const targetNpc = NPCS.find(npc => npc.position.x === targetPos.x && npc.position.y === targetPos.y);
        if (targetNpc) {
            setDialogue(targetNpc.message);
            setChatHistory(prev => [...prev, '--- Conversation Start ---', `NPC: ${targetNpc.message[0]}`]);
            setDialogueIndex(0);
            setIsPlayerTurn(false);
            setInBattle(false);
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'h') {
            setShowChatHistory(prev => !prev);
            return;
        }
        if (e.key === 'Escape') {
            if (dialogue) {
                setDialogue(null);
                setDialogueIndex(0);
                setIsPlayerTurn(false);
                setInBattle(false);
                setCallingNpcId(null);
                setIsCallOnCooldown(true);
                setTimeout(() => setIsCallOnCooldown(false), 10000);
                e.preventDefault();
            }
            return;
        }
        const isInputFocused = document.activeElement?.tagName === 'INPUT';
        if (dialogue) {
            if ((e.key === ' ' || e.key === 'Enter') && !isInputFocused) {
                e.preventDefault();
                handleInteraction();
            }
            return;
        }
        let newPosition = { ...playerPosition };
        let newDirection = playerDirection;
        switch (e.key) {
            case 'ArrowUp': newPosition.y--; newDirection = Direction.UP; break;
            case 'ArrowDown': newPosition.y++; newDirection = Direction.DOWN; break;
            case 'ArrowLeft': newPosition.x--; newDirection = Direction.LEFT; break;
            case 'ArrowRight': newPosition.x++; newDirection = Direction.RIGHT; break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                handleInteraction();
                return;
            default: return;
        }
        e.preventDefault();
        setPlayerDirection(newDirection);
        if (isWalkable(newPosition)) {
            setPlayerPosition(newPosition);
        }
    }, [playerPosition, playerDirection, dialogue, dialogueIndex, isWalkable, handleInteraction, movingNpcs, callingNpcId]);

    useEffect(() => {
        const gameLoop = setInterval(() => {
            if (dialogueRef.current) return;
            setMovingNpcs(currentNpcs => {
                const movedNpcs = currentNpcs.map(npc => {
                    if (npc.id === callingNpcId) return npc;
                    const direction = Math.floor(Math.random() * 4);
                    const nextPos = { ...npc.position };
                    if (direction === 0) nextPos.y--; else if (direction === 1) nextPos.y++; else if (direction === 2) nextPos.x--; else if (direction === 3) nextPos.x++;
                    const isNextPosWall = MAP_LAYOUT[nextPos.y]?.[nextPos.x] === TileType.WALL;
                    const isNextPosOutOfBounds = nextPos.x < 0 || nextPos.x >= MAP_WIDTH || nextPos.y < 0 || nextPos.y >= MAP_HEIGHT;
                    const isNextPosStaticNpc = NPCS.some(staticNpc => staticNpc.position.x === nextPos.x && staticNpc.position.y === nextPos.y);
                    const isNextPosPlayer = playerPositionRef.current.x === nextPos.x && playerPositionRef.current.y === nextPos.y;
                    const isNextPosOtherMovingNpc = currentNpcs.some(otherNpc => otherNpc.id !== npc.id && otherNpc.position.x === nextPos.x && otherNpc.position.y === nextPos.y);
                    if (!isNextPosWall && !isNextPosOutOfBounds && !isNextPosStaticNpc && !isNextPosPlayer && !isNextPosOtherMovingNpc) return { ...npc, position: nextPos };
                    return npc;
                });
                if (callingNpcId === null && !isCallOnCooldown) {
                    for (const npc of movedNpcs) {
                        const { x, y } = npc.position;
                        const adjacentPositions = [ { x, y: y - 1 }, { x, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y } ];
                        const nearbyStaticNpc = adjacentPositions.map(pos => NPCS.find(staticNpc => staticNpc.position.x === pos.x && staticNpc.position.y === pos.y)).find(npc => npc);
                        if (nearbyStaticNpc) {
                            setCallingNpcId(npc.id);
                            break;
                        }
                    }
                }
                return movedNpcs;
            });
        }, 1000);
        return () => clearInterval(gameLoop);
    }, [callingNpcId, isCallOnCooldown]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); };
    }, [handleKeyDown]);

    return (
        <div className="relative bg-black border-4 border-gray-600 shadow-lg" style={{ width: `${MAP_WIDTH * TILE_SIZE}px`, height: `${MAP_HEIGHT * TILE_SIZE}px` }}>
            {showChatHistory && <ChatHistory history={chatHistory} />}
            <Map layout={MAP_LAYOUT} />
            {NPCS.map(npc => (<Npc key={npc.id} position={npc.position} sprite={npc.sprite} />))}
            {movingNpcs.map(npc => (<Player key={npc.id} position={npc.position} direction={Direction.DOWN} color="red" isCalling={npc.id === callingNpcId} />))}
            <Player position={playerPosition} direction={playerDirection} color="blue" />
            {dialogue && (
                <DialogueBox
                    message={dialogue[dialogueIndex]}
                    hasNext={!isPlayerTurn}
                    onClose={handleInteraction}
                    showInput={isPlayerTurn && inBattle}
                    inputValue={playerInput}
                    onInputChange={(e) => setPlayerInput(e.target.value)}
                    onSubmit={handlePlayerAction}
                />
            )}
        </div>
    );
};

export default Game;