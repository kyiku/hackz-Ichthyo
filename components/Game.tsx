import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MAP_LAYOUT, NPCS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, PLAYER_START_POSITION, MOVING_NPCS } from '../constants';
import { TileType, Position, Direction, NpcData } from '../types';
import Map from './Map';
import Player from './Player';
import Npc from './Npc';
import DialogueBox from './DialogueBox';
import ChatHistory from './ChatHistory';
import axios from 'axios';

interface GameProps {
  onReturnToTitle?: () => void;
  onMoneyChange?: (amount: number) => void;
}

interface DroppedMoney {
  id: string;
  position: Position;
  amount: number;
}

const Game: React.FC<GameProps> = ({ onReturnToTitle, onMoneyChange }) => {
    const [playerPosition, setPlayerPosition] = useState<Position>(PLAYER_START_POSITION);
    const [playerDirection, setPlayerDirection] = useState<Direction>(Direction.DOWN);
    const [dialogue, setDialogue] = useState<string[] | null>(null);
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [movingNpcs, setMovingNpcs] = useState<NpcData[]>(MOVING_NPCS);
    const [callingNpcId, setCallingNpcId] = useState<number | null>(null);
    const [currentInteractingNpc, setCurrentInteractingNpc] = useState<NpcData | null>(null);
    const [bannedCustomers, setBannedCustomers] = useState<Set<number>>(new Set()); // 出禁顧客のIDリスト
    const [isCallOnCooldown, setIsCallOnCooldown] = useState<boolean>(false);
    const [playerInput, setPlayerInput] = useState<string>('');
    const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
    const [inBattle, setInBattle] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
    const [showCustomerTable, setShowCustomerTable] = useState<boolean>(false);
    const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
    const [exitSelected, setExitSelected] = useState<number>(0);
    const [droppedMoney, setDroppedMoney] = useState<DroppedMoney[]>([]);
    const [nextCustomerId, setNextCustomerId] = useState<number>(1000);
    const [customerData, setCustomerData] = useState<{id: number, customer_name: string, age: number, money?: number}[]>([]);
    const [currentMoney, setCurrentMoney] = useState<number>(0);
    const [playerId, setPlayerId] = useState<number>(1); // プレイヤーIDを追加
    const [magicEffect, setMagicEffect] = useState<{
        type: string,
        message: string,
        duration: number,
        phase: 'casting' | 'impact' | 'result'
    } | null>(null);
    const [effectFrame, setEffectFrame] = useState<number>(0);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameOverReason, setGameOverReason] = useState<string>('');

    const [debug, setDebug] = useState<boolean>(true);

    const playerPositionRef = useRef(playerPosition);
    useEffect(() => {
        playerPositionRef.current = playerPosition;
    }, [playerPosition]);

    const spawnNewCustomerRef = useRef<(() => void) | null>(null);

    // 初期顧客のスポーン関数
    const spawnInitialCustomers = useCallback((initialCustomers: {id: number, customer_name: string, age: number, money?: number, icon_url?: string, profile?: string, level?: number}[]) => {
        const entrancePosition = { x: 18, y: 7 };

        // 初期の2体を順次スポーンさせる
        initialCustomers.forEach((customer, index) => {
            setTimeout(() => {
                setMovingNpcs(prev => {
                    // 既に同じIDの顧客がいないかチェック
                    const exists = prev.some(npc => npc.id === customer.id);
                    if (exists) {
                        console.log(`顧客 ${customer.customer_name} (ID: ${customer.id}) は既に店内にいます`);
                        return prev;
                    }

                    const newCustomer: NpcData = {
                        id: customer.id,
                        position: { ...entrancePosition },
                        message: ["..."],
                        sprite: 'P',
                        customerName: customer.customer_name,
                        age: customer.age,
                        money: customer.money,
                        status: 'alive',
                        icon_url: customer.icon_url,
                        icon_urls: customer.icon_urls,
                        profile: customer.profile,
                        level: customer.level
                    };

                    console.log(`初期顧客をスポーン: ${customer.customer_name}さん (ID: ${customer.id})`);
                    setChatHistory(prev => [...prev, `SYSTEM: 初期来店 - ${customer.customer_name}さん (${customer.age}歳) が来店しました！`]);

                    return [...prev, newCustomer];
                });
            }, index * 2000); // 2秒間隔でスポーン
        });
    }, []);


    const fetchData = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_URL
            console.log(baseUrl)
            // より多くの顧客データを取得（10体分）
            const customerPromises = Array.from({ length: 10 }, () =>
                axios.get(baseUrl + `/customer`)
            );

            const responses = await Promise.all(customerPromises);
            console.log("全顧客データ:", responses);

            const allCustomerData: {id: number, customer_name: string, age: number, money?: number}[] = [];

            responses.forEach((response, index) => {
                console.log(`API応答 ${index + 1}:`, response.data);
                // "No customer found" エラーの場合もログに記録
                if (response.data && response.data.error === "No customer found") {
                    console.log(`API応答 ${index + 1}: 顧客が見つかりません`);
                    setChatHistory(prev => [...prev, `SYSTEM: API応答${index + 1} - 顧客データなし`]);
                } else if (response.data && response.data.name && response.data.age) {
                    // Google DriveのURLを直接表示用URLに変換（複数の形式を試す）
                    const convertGoogleDriveUrl = (url: string) => {
                        if (url && url.includes('drive.google.com')) {
                            const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
                            if (fileId) {
                                // 複数のURL形式を試せるように配列で返す
                                return {
                                    primary: `https://drive.google.com/uc?export=view&id=${fileId}`,
                                    fallback1: `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`,
                                    fallback2: `https://lh3.googleusercontent.com/d/${fileId}=w200`,
                                    fallback3: `https://drive.google.com/file/d/${fileId}/view`
                                };
                            }
                        }
                        return { primary: url, fallback1: null, fallback2: null, fallback3: null };
                    };

                    const customerInfo = {
                        id: response.data.id,
                        customer_name: response.data.name,
                        age: response.data.age,
                        money: response.data.money || Math.floor(Math.random() * 10000) + 1000, // APIにmoneyがない場合はランダム生成
                        icon_url: response.data.icon_url ? convertGoogleDriveUrl(response.data.icon_url).primary : null, // 顧客の画像URL（プライマリ）
                        icon_urls: response.data.icon_url ? convertGoogleDriveUrl(response.data.icon_url) : null, // 全てのURL形式
                        profile: response.data.profile, // 顧客のプロフィール
                        level: response.data.level // 顧客のレベル
                    };
                    allCustomerData.push(customerInfo);
                    console.log(`顧客情報作成:`, customerInfo);
                    setChatHistory(prev => [...prev, `SYSTEM: 顧客データ${index + 1}取得 - 名前: ${response.data.name}, 年齢: ${response.data.age}, 所持金: ${customerInfo.money}円`]);
                } else {
                    console.log(`API応答 ${index + 1} が不完全です:`, response.data);
                }
            });

            // 有効な顧客データがない場合は例外を投げてcatchブロックに移行
            if (allCustomerData.length === 0) {
                throw new Error("有効な顧客データが取得できませんでした");
            }

            setCustomerData(allCustomerData);
            console.log("全顧客データ設定完了:", allCustomerData);

            // ゲーム開始時に全顧客のステータスを生存にリセット
            setBannedCustomers(new Set()); // 出禁リストをクリア
            console.log("全顧客のステータスを生存にリセットし、出禁リストをクリアしました");

            // 全顧客を店外状態に設定（最初は誰も店内にいない）
            setMovingNpcs([]);
            console.log("全顧客を店外状態に設定しました");

            // 最初の2体だけスポーン処理で入店させる
            setTimeout(() => {
                spawnInitialCustomers(allCustomerData.slice(0, 2));
            }, 1000); // 1秒後に最初の2体をスポーン

            // チャット履歴にステータスリセットメッセージを追加
            setChatHistory(prev => [...prev, 'SYSTEM: ゲーム開始 - 全顧客を店外状態に設定し、2体の初期顧客が間もなく来店します。']);
        } catch (error) {
            console.error("データ取得エラー:", error);
            console.log("フォールバックデータを使用します");

            // API失敗時のフォールバックデータ（より多く設定）
            const fallbackCustomerData = [
                { id: 1001, customer_name: "田中太郎", age: 25, money: 5000, icon_url: null, profile: "ゲーム好きのサラリーマン", level: 50 },
                { id: 1002, customer_name: "佐藤花子", age: 30, money: 8000, icon_url: null, profile: "アーケードゲームのベテラン", level: 75 },
                { id: 1003, customer_name: "山田次郎", age: 22, money: 3500, icon_url: null, profile: "大学生で格ゲー好き", level: 30 },
                { id: 1004, customer_name: "鈴木美咲", age: 28, money: 7200, icon_url: null, profile: "音ゲーが得意なOL", level: 85 },
                { id: 1005, customer_name: "高橋一郎", age: 35, money: 6500, icon_url: null, profile: "クレーンゲーム愛好家", level: 60 },
                { id: 1006, customer_name: "中村清子", age: 24, money: 4800, icon_url: null, profile: "パズルゲームマニア", level: 40 },
                { id: 1007, customer_name: "小林健一", age: 31, money: 9200, icon_url: null, profile: "シューティングゲームの達人", level: 90 },
                { id: 1008, customer_name: "加藤美香", age: 27, money: 5800, icon_url: null, profile: "レースゲーム好きの会社員", level: 55 }
            ];

            setCustomerData(fallbackCustomerData);
            console.log("フォールバック顧客データ設定完了:", fallbackCustomerData);

            // ゲーム開始時に全顧客のステータスを生存にリセット
            setBannedCustomers(new Set()); // 出禁リストをクリア
            console.log("全顧客のステータスを生存にリセットし、出禁リストをクリアしました");

            // 全顧客を店外状態に設定（最初は誰も店内にいない）
            setMovingNpcs([]);
            console.log("全顧客を店外状態に設定しました");

            // 最初の2体だけスポーン処理で入店させる
            setTimeout(() => {
                spawnInitialCustomers(fallbackCustomerData.slice(0, 2));
            }, 1000); // 1秒後に最初の2体をスポーン

            // チャット履歴にステータスリセットメッセージを追加
            setChatHistory(prev => [...prev, 'SYSTEM: API接続失敗 - フォールバックデータを使用しています。']);
        }
    };

    if (debug) {
        fetchData();
        setDebug(false);
    }

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

    const checkExitTile = useCallback((pos: Position): boolean => {
        if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) return false;
        const tile = MAP_LAYOUT[pos.y][pos.x];
        return tile === TileType.EXIT;
    }, []);

    const checkAndPickupMoney = useCallback(async (pos: Position) => {
        const money = droppedMoney.find(m => m.position.x === pos.x && m.position.y === pos.y);
        if (money && onMoneyChange) {
            try {
                const baseUrl = import.meta.env.VITE_APP_URL;
                const newTotalMoney = currentMoney + money.amount;

                // APIにお金の更新を送信
                const response = await axios.put(`${baseUrl}/player/money`, {
                    id: playerId,
                    money: newTotalMoney
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data) {
                    // API呼び出し成功時
                    onMoneyChange(money.amount);
                    setCurrentMoney(newTotalMoney);
                    setDroppedMoney(prev => prev.filter(m => m.id !== money.id));
                    setChatHistory(prev => [...prev, `SYSTEM: ${money.amount}円を拾いました！キラキラ✨ (合計: ${newTotalMoney}円)`]);
                }
            } catch (error) {
                console.error("お金の更新エラー:", error);

                // エラー時もUI上では更新（フォールバック）
                onMoneyChange(money.amount);
                setCurrentMoney(prev => prev + money.amount);
                setDroppedMoney(prev => prev.filter(m => m.id !== money.id));
                setChatHistory(prev => [...prev, `SYSTEM: ${money.amount}円を拾いました！キラキラ✨ (オフライン)`]);
            }
        }
    }, [droppedMoney, onMoneyChange, currentMoney, playerId]);

    const spawnNewCustomer = useCallback(() => {
        console.log("spawnNewCustomer 関数が呼び出されました");
        console.log("現在の顧客データ:", customerData);
        console.log("顧客データの長さ:", customerData.length);

        // 顧客データが読み込まれていない場合は何もしない
        if (!customerData || customerData.length === 0) {
            console.log("顧客データが読み込まれていないため、スポーンをスキップします");
            return;
        }

        const entrancePosition = { x: 18, y: 7 };

        // 入り口が空いているかチェック
        setMovingNpcs(currentMovingNpcs => {
            const isEntranceOccupied = currentMovingNpcs.some(npc =>
                npc.position.x === entrancePosition.x && npc.position.y === entrancePosition.y
            ) || (playerPosition.x === entrancePosition.x && playerPosition.y === entrancePosition.y);

            if (isEntranceOccupied) {
                console.log("入り口が塞がっているため、顧客をスポーンできません");
                return currentMovingNpcs; // 変更なし
            }

            // 既に店内にいる顧客のIDを取得
            const existingCustomerIds = new Set(currentMovingNpcs.map(npc => npc.id));
            console.log("現在店内にいる顧客のID:", Array.from(existingCustomerIds));
            console.log("出禁顧客のID:", Array.from(bannedCustomers));

            // 出禁でない、かつ店内にいない顧客データのみから選択
            const availableCustomers = customerData.filter(customer =>
                !bannedCustomers.has(customer.id) && !existingCustomerIds.has(customer.id)
            );
            console.log("スポーン可能な顧客:", availableCustomers);

            if (availableCustomers.length > 0) {
                // ランダムに顧客データを選択
                const randomCustomer = availableCustomers[Math.floor(Math.random() * availableCustomers.length)];

                const newCustomer: NpcData = {
                    id: randomCustomer.id,
                    position: entrancePosition,
                    message: ["..."],
                    sprite: 'P',
                    customerName: randomCustomer.customer_name,
                    age: randomCustomer.age,
                    money: randomCustomer.money,
                    status: 'alive', // 新規スポーン時は常に生存状態
                    icon_url: randomCustomer.icon_url,
                    icon_urls: randomCustomer.icon_urls,
                    profile: randomCustomer.profile,
                    level: randomCustomer.level
                };

                console.log(`新しい顧客をスポーン: ${randomCustomer.customer_name}さん (ID: ${randomCustomer.id})`);

                // チャット履歴に追加
                setChatHistory(prev => [...prev, `SYSTEM: 新しいお客さんが来店しました！(${randomCustomer.customer_name}さん, ${randomCustomer.age}歳)`]);

                return [...currentMovingNpcs, newCustomer];
            } else {
                console.log("スポーン可能な顧客がいません（全員出禁または既に店内）");
                if (customerData.length > 0) {
                    setChatHistory(prev => [...prev, 'SYSTEM: 全ての顧客が出禁または既に店内にいるため、新しい来店者はいません。']);
                }
                return currentMovingNpcs; // 変更なし
            }
        });
    }, [playerPosition, customerData, bannedCustomers]);

    // spawnNewCustomer関数のrefを更新
    useEffect(() => {
        spawnNewCustomerRef.current = spawnNewCustomer;
    }, [spawnNewCustomer]);

    // RPGツクール風フレームアニメーション
    useEffect(() => {
        if (magicEffect) {
            const frameInterval = setInterval(() => {
                setEffectFrame(prev => {
                    const newFrame = prev + 1;

                    // フェーズ遷移の管理
                    if (magicEffect?.type === 'destruction') {
                        // バルス魔法の特別なタイミング
                        if (newFrame === 60) { // 2秒後に詠唱→発動
                            setMagicEffect(current => current ? {...current, phase: 'impact'} : null);
                        } else if (newFrame === 150) { // 5秒後に発動→結果
                            setMagicEffect(current => current ? {...current, phase: 'result'} : null);
                        } else if (newFrame >= 240) { // 8秒後に終了
                            setMagicEffect(null);
                            setEffectFrame(0);
                            return 0;
                        }
                    } else {
                        // 通常魔法のタイミング
                        if (newFrame === 30) { // 1秒後に詠唱→発動
                            setMagicEffect(current => current ? {...current, phase: 'impact'} : null);
                        } else if (newFrame === 90) { // 3秒後に発動→結果
                            setMagicEffect(current => current ? {...current, phase: 'result'} : null);
                        } else if (newFrame >= 150) { // 5秒後に終了
                            setMagicEffect(null);
                            setEffectFrame(0);
                            return 0;
                        }
                    }

                    return newFrame;
                });
            }, 33); // 30FPS

            return () => clearInterval(frameInterval);
        }
    }, [magicEffect]);

    const handlePlayerAction = async () => {
        setChatHistory(prev => [...prev, `Player: ${playerInput}`]);

        // バルス魔法の特別処理
        if (playerInput.trim().toLowerCase() === 'バルス！' || playerInput.trim().toLowerCase() === 'balus') {
            // バルス魔法による店舗破壊とゲームオーバー
            setMagicEffect({
                type: 'destruction',
                message: 'バルス！！！',
                duration: 8000,
                phase: 'casting'
            });
            setEffectFrame(0);

            // 少し遅れてゲームオーバーを設定
            setTimeout(() => {
                setGameOver(true);
                setGameOverReason('バルス魔法により店舗が完全に破壊されました...');
            }, 6000);

            setPlayerInput('');
            setChatHistory(prev => [...prev, 'SYSTEM: バルス魔法が発動！店舗が崩壊し始めます...']);
            return;
        }


        // まず魔法の判定を行う
        const magicEffect = await checkMagicSpell(playerInput);
        if (magicEffect) {
            // 魔法が発動した場合
            const magicResult = executeMagicEffect(magicEffect);
            if (magicResult && magicResult.success) {
                // RPGツクール風の3段階エフェクト開始
                setMagicEffect({
                    type: magicResult.effectType || 'general',
                    message: magicResult.message || '魔法が発動しました！',
                    duration: 5000,
                    phase: 'casting'
                });
                setEffectFrame(0);

                if (magicResult.effectType === "death") {
                    // 死亡効果の場合は具体的な効果文章と獲得金額を表示して会話終了
                    const moneyMessage = magicResult.money > 0 ? ` ${magicResult.money}円を獲得！` : '';
                    const magicMessage = [`${magicResult.message}${moneyMessage}`];
                    setDialogue(magicMessage);
                    setChatHistory(prev => [...prev, `SYSTEM: ${magicMessage[0]}`]);
                    setDialogueIndex(0);
                    setInBattle(false);
                    setIsPlayerTurn(false);
                    setPlayerInput('');
                    return; // 魔法が発動したら終了
                } else if (magicResult.effectType === "survival" || magicResult.effectType === "curse") {
                    // 生存・呪い効果の場合は魔法効果をAPIに送信して顧客の反応を取得
                    try {
                        const baseUrl = import.meta.env.VITE_APP_URL;
                        // 呪い効果の場合は**で囲む、生存効果の場合はそのまま
                        const apiMessage = magicResult.effectType === "curse"
                            ? `**${magicResult.message}**`
                            : magicResult.message;

                        const response = await axios.post(`${baseUrl}/customers/messages`, {
                            message: apiMessage,
                            customer_id: currentInteractingNpc?.id || 0
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.data) {
                            const customerResponse = response.data || "返答がありません。";
                            setChatHistory(prev => [...prev, `NPC: ${customerResponse}`]);
                            setDialogue([customerResponse]);
                            setDialogueIndex(0);
                            setInBattle(true); // 会話を継続
                            setIsPlayerTurn(true); // プレイヤーの番に戻す
                        } else {
                            // レスポンスがない場合のデフォルト処理
                            const defaultMessage = ["通信エラーが発生しました。"];
                            setDialogue(defaultMessage);
                            setChatHistory(prev => [...prev, `SYSTEM: ${defaultMessage[0]}`]);
                            setDialogueIndex(0);
                            setIsPlayerTurn(true);
                        }
                    } catch (error) {
                        console.error("魔法効果API通信エラー:", error);
                        const errorMessage = ["API通信に失敗しました。"];
                        setDialogue(errorMessage);
                        setChatHistory(prev => [...prev, `SYSTEM: ${errorMessage[0]}`]);
                        setDialogueIndex(0);
                        setIsPlayerTurn(true);
                    }
                    setPlayerInput('');
                    return;
                } else {
                    // その他の効果（従来通り）
                    const magicMessage = ["魔法が発動しました！✨"];
                    setDialogue(magicMessage);
                    setChatHistory(prev => [...prev, `SYSTEM: ${magicMessage[0]}`]);
                    setDialogueIndex(0);
                    setInBattle(false);
                    setIsPlayerTurn(false);
                    setPlayerInput('');
                    return;
                }
            }
        }

        // APIレスポンス待ちの状態を表示
        setDialogue(["お客さんが考えています..."]);
        setDialogueIndex(0);
        setIsPlayerTurn(false);

        try {
            const baseUrl = import.meta.env.VITE_APP_URL;

            // APIにメッセージを送信（同じcustomers/messagesエンドポイントを使用）
            const response = await axios.post(`${baseUrl}/customers/messages`, {
                message: playerInput,
                customer_id: currentInteractingNpc?.id || 0
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // APIからのレスポンスを処理
            if (response.data) {
                const customerResponse = response.data || "返答がありません。"; // APIの返答を取得
                setChatHistory(prev => [...prev, `NPC: ${customerResponse}`]); // チャット履歴に追加
                setDialogue([customerResponse]); // ダイアログに反映
                setDialogueIndex(0);
                setInBattle(true); // 会話を継続
                setIsPlayerTurn(true); // プレイヤーの番に戻す
        } else {
                // レスポンスがない場合のデフォルト処理
                const defaultMessage = ["通信エラーが発生しました。"];
                setDialogue(defaultMessage);
                setChatHistory(prev => [...prev, `SYSTEM: ${defaultMessage[0]}`]);
                setDialogueIndex(0);
                setIsPlayerTurn(true); // プレイヤーの番に戻す
            }
        } catch (error) {
            console.error("API通信エラー:", error);

            // エラー時のフォールバック処理（元のロジックを維持）
            if (playerInput.trim() === "' OR 1=1; --") {
                const victoryMessage = ["な…に…！？身体が…データに…ぐあああ！"];
                setDialogue(victoryMessage);
                setChatHistory(prev => [...prev, `SYSTEM: ${victoryMessage[0]}`]);
                setDialogueIndex(0);
                setInBattle(false); // この場合は会話終了
                setIsPlayerTurn(false);
            } else {
                const failureMessage = ["……。", "…何も起きなかった。"];
                setDialogue(failureMessage);
                setChatHistory(prev => [...prev, `SYSTEM: ${failureMessage[0]}`]);
                setDialogueIndex(0);
                setIsPlayerTurn(true); // 会話を継続
            }
        }

        setPlayerInput('');
    };

    // プレイヤーの所持金を更新するAPI呼び出し
    const updatePlayerMoney = async (newAmount: number) => {
        try {
            const baseUrl = import.meta.env.VITE_APP_URL;
            await axios.put(`${baseUrl}/player/money`, {
                id: 1, // プレイヤーIDを仮定
                money: newAmount
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`プレイヤーの所持金を${newAmount}円に更新しました`);
        } catch (error) {
            console.error("所持金更新API呼び出しエラー:", error);
        }
    };

    // 顧客の所持金をプレイヤーに移譲
    const transferCustomerMoney = async (amount: number) => {
        if (onMoneyChange) {
            onMoneyChange(amount);

            // 現在の所持金を取得してAPIで更新
            const currentMoney = (await getCurrentMoney()) || 0;
            const newTotal = currentMoney + amount;
            await updatePlayerMoney(newTotal);
        }
    };

    // 現在の所持金を取得（この関数は実装に応じて調整）
    const getCurrentMoney = async () => {
        // 簡易的に、アプリの状態から現在の所持金を推定
        // 実際の実装では、App.tsxの money state にアクセスする必要があります
        return 0; // 仮の実装
    };

    // 顧客を出禁にする関数
    const banCustomer = async () => {
        if (!currentInteractingNpc) return;

        try {
            const baseUrl = import.meta.env.VITE_APP_URL;

            // 出禁通知をAPIに送信して顧客の捨て台詞を取得
            const response = await axios.post(`${baseUrl}/customers/messages`, {
                message: "*あなたは出禁になりました*",
                customer_id: currentInteractingNpc.id
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let finalWords = "..."; // デフォルトの捨て台詞
            if (response.data) {
                finalWords = response.data;
            }

            // 顧客の捨て台詞を表示
            setDialogue([finalWords]);
            setChatHistory(prev => [...prev, `NPC: ${finalWords}`]);
            setDialogueIndex(0);
            setIsPlayerTurn(false);

            // 短時間表示した後で出禁処理を実行
            setTimeout(() => {
                // 出禁リストに顧客IDを追加
                setBannedCustomers(prev => new Set([...prev, currentInteractingNpc.id]));

                // 現在のゲームから顧客を除去
                setMovingNpcs(prev => prev.filter(npc => npc.id !== currentInteractingNpc.id));

                // チャット履歴に出禁メッセージを追加
                setChatHistory(prev => [...prev, `SYSTEM: ${currentInteractingNpc.customerName}さんを出禁にしました。二度と店に入れません。`]);

                // 会話終了
                setDialogue(null);
                setInBattle(false);
                setIsPlayerTurn(false);
                setCurrentInteractingNpc(null);

                console.log(`顧客 ${currentInteractingNpc.customerName} (ID: ${currentInteractingNpc.id}) を出禁にしました`);
            }, 3000); // 3秒間捨て台詞を表示

        } catch (error) {
            console.error("出禁通知API呼び出しエラー:", error);

            // API呼び出しに失敗した場合は即座に出禁処理
            setBannedCustomers(prev => new Set([...prev, currentInteractingNpc.id]));
            setMovingNpcs(prev => prev.filter(npc => npc.id !== currentInteractingNpc.id));
            setChatHistory(prev => [...prev, `SYSTEM: ${currentInteractingNpc.customerName}さんを出禁にしました。二度と店に入れません。`]);

            setDialogue(null);
            setInBattle(false);
            setIsPlayerTurn(false);
            setCurrentInteractingNpc(null);
        }
    };

    const checkMagicSpell = async (spellName: string) => {
        try {
            const baseUrl = import.meta.env.VITE_APP_URL;
            const response = await axios.get(`${baseUrl}/magic`, {
                params: { magic_name: spellName.trim() }
            });

            if (response.data && response.data.effect) {
                return response.data.effect;
            }
        } catch (error) {
            // 404エラーの場合は魔法が存在しない
            if (error.response?.status === 404) {
                return null;
            }
            console.error("魔法チェックエラー:", error);
            return null;
        }
        return null;
    };

    const executeMagicEffect = (effect: string) => {
        // 魔法効果による顧客ステータス分類
        const deathEffects = [
            "強制的に店外に飛ばされ、店を二度と見つけられなくなった。",
            "店内中のメダルが全身に張りつき、身動きが取れなくなった。",
            "消し去りました。",
            "店舗爆発！！！！！"
        ];

        const survivalEffects = [
            "着てる服の後ろ半分だけ丸焦げになり、びん○っちゃまスタイルになった。",
            "ずぶ濡れになった。",
            "蹴りました。",
            "殴りました。"
        ];

        const curseEffects = [
            "耳元で謎の赤い生き物の歌が聞こえ続けるようになった。",
            "今まで使った金額を忘れ、貯金残高0円になるまで浪費を続けた。",
            "スマホの懐中電灯が点いて消えなくなった。地味に嫌。",
            "あまりの可愛さに客の機嫌が良くなった。"
        ];

        let effectMessage = effect;
        let customMessage = null;

        try {
            // 効果の種類に応じて処理を分岐
            const effectData = JSON.parse(effect);
            effectMessage = effectData.message || effectData.effect || effect;

            // 顧客ステータス更新処理
            let statusResult = { type: null, message: null, money: 0 };
            if (currentInteractingNpc) {
                statusResult = updateCustomerStatus(effectMessage);
            }

            if (effectData.type === "money") {
                // お金を増やす魔法
                const amount = effectData.amount || 0;
                if (onMoneyChange && amount > 0) {
                    onMoneyChange(amount);
                    setCurrentMoney(prev => prev + amount);
                    setChatHistory(prev => [...prev, `✨魔法効果✨: ${amount}円を獲得しました！`]);
                }
                return {
                    success: true,
                    effectType: "money",
                    message: `${amount}円を獲得しました！`,
                    money: amount
                };
            } else {
                // カスタム効果メッセージ
                setChatHistory(prev => [...prev, `✨魔法効果✨: ${effectMessage}`]);
            }

            return {
                success: true,
                effectType: statusResult.type,
                message: statusResult.message,
                money: statusResult.money
            };
        } catch (error) {
            // JSON解析に失敗した場合、そのままメッセージとして表示し顧客ステータス更新
            let statusResult = { type: null, message: null, money: 0 };
            if (currentInteractingNpc) {
                statusResult = updateCustomerStatus(effect);
            }
            setChatHistory(prev => [...prev, `✨魔法効果✨: ${effect}`]);
            return {
                success: true,
                effectType: statusResult.type,
                message: statusResult.message,
                money: statusResult.money
            };
        }

        // 顧客ステータス更新関数
        function updateCustomerStatus(effectMessage: string) {
            if (!currentInteractingNpc) return { type: null, message: null, money: 0 };

            let newStatus = "alive"; // デフォルトは生存
            let result = { type: null, message: null, money: 0 };

            if (deathEffects.includes(effectMessage)) {
                newStatus = "dead";
                const customerMoney = currentInteractingNpc.money || 0;
                result = { type: "death", message: effectMessage, money: customerMoney };

                // 顧客のお金をプレイヤーに移譲
                if (customerMoney > 0) {
                    transferCustomerMoney(customerMoney);
                }

                // 死亡した顧客をゲームから除去
                setMovingNpcs(prev => prev.filter(npc => npc.id !== currentInteractingNpc.id));
                setChatHistory(prev => [...prev, `SYSTEM: ${currentInteractingNpc.customerName}さんは*死亡*しました。${customerMoney > 0 ? `${customerMoney}円を獲得！` : ''}`]);

                // 会話終了
                setDialogue(null);
                setInBattle(false);
                setIsPlayerTurn(false);
                setCurrentInteractingNpc(null);
            } else if (survivalEffects.includes(effectMessage)) {
                newStatus = "alive";
                result = { type: "survival", message: effectMessage, money: 0 };
                setChatHistory(prev => [...prev, `SYSTEM: ${currentInteractingNpc.customerName}さんは生存しています。`]);
            } else if (curseEffects.includes(effectMessage)) {
                newStatus = "cursed";
                result = { type: "curse", message: effectMessage, money: 0 };
                // 呪われた顧客のステータス更新
                setMovingNpcs(prev => prev.map(npc =>
                    npc.id === currentInteractingNpc.id
                        ? { ...npc, status: newStatus }
                        : npc
                ));
                setChatHistory(prev => [...prev, `SYSTEM: ${currentInteractingNpc.customerName}さんは*呪い*状態になりました。`]);
            }

            console.log(`顧客 ${currentInteractingNpc.customerName} のステータスを ${newStatus} に更新しました。`);
            return result;
        }
    };

    const handleInteraction = async () => {
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

        // プレイヤーから話しかける場合も処理する（callingNpcIdがnullでもOK）
        const targetMovingNpc = movingNpcs.find(npc =>
            npc.position.x === targetPos.x && npc.position.y === targetPos.y
        );
        if (targetMovingNpc) {
            const { x, y } = targetMovingNpc.position;
            const adjacentPositions = [ { x, y: y - 1 }, { x, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y } ];
            const nearbyNpc = adjacentPositions.map(pos =>
                NPCS.find(staticNpc => staticNpc.position.x === pos.x && staticNpc.position.y === pos.y)
            ).find(npc => npc);

            // 筐体の種類を特定
            let machineType = "unknown";
            let machineName = "ゲーム機";
            if (nearbyNpc) {
                switch (nearbyNpc.sprite) {
                    case '👾':
                        machineType = "arcade_game";
                        machineName = "アーケードゲーム機";
                        break;
                    case '🚀':
                        machineType = "shooting_game";
                        machineName = "シューティングゲーム";
                        break;
                    case '🎵':
                        machineType = "music_game";
                        machineName = "音楽ゲーム";
                        break;
                    case '💰':
                        machineType = "exchange_machine";
                        machineName = "両替機";
                        break;
                    case '🕹️':
                        machineType = "retro_game";
                        machineName = "レトロゲーム";
                        break;
                    case '📸':
                        machineType = "photo_booth";
                        machineName = "プリクラ機";
                        break;
                    case '🥤':
                        machineType = "vending_machine";
                        machineName = "自販機";
                        break;
                    case 'ℹ️':
                        machineType = "information_desk";
                        machineName = "インフォメーション";
                        break;
                    case '🧸':
                    default:
                        machineType = "crane_game";
                        machineName = "クレーンゲーム";
                        break;
                }
            }

            // まず会話開始を表示してAPIレスポンスを待つ
            setDialogue(["お客さんの話を聞いています..."]);
            setChatHistory(prev => [...prev, '--- Battle Start ---', 'SYSTEM: お客さんの話を聞いています...']);
            setDialogueIndex(0);
            setIsPlayerTurn(false);
            setInBattle(true);
            setCurrentInteractingNpc(targetMovingNpc);

            try {
                const baseUrl = import.meta.env.VITE_APP_URL;

                // APIに初回メッセージを送信
                const response = await axios.post(`${baseUrl}/customers/messages`, {
                    customer_id: targetMovingNpc.id,
                    message: `店員が${machineName}の近くにいる私に話しかけてきました。${machineName}に問題があって困っています。`
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data) {
                    // APIからのレスポンスを対話として設定
                    const customerResponse = response.data;
                    const newDialogue = Array.isArray(customerResponse) ? customerResponse : [customerResponse];

                    setDialogue(newDialogue);
                    setChatHistory(prev => [...prev, `NPC: ${newDialogue[0]}`]);
                    setDialogueIndex(0);
                    setIsPlayerTurn(false);
                } else {
                    // APIレスポンスがない場合はフォールバック
                    throw new Error("APIレスポンスが空です");
                }
            } catch (error) {
                console.error("初回対話取得エラー:", error);

                // エラー時のフォールバック（元のハードコードメッセージ）
                let newDialogue: string[] = [];
                const customerInfo = targetMovingNpc.customerName && targetMovingNpc.age ?
                    `[${targetMovingNpc.customerName}さん (${targetMovingNpc.age}歳)]` : "";

                if (nearbyNpc) {
                    switch (nearbyNpc.sprite) {
                        case '👾': newDialogue = [`${customerInfo} おい、店員！このゲーム機、コインを飲み込んだぞ！`, "金返せ！どうにかしろ！"]; break;
                        case '🚀': newDialogue = [`${customerInfo} 店員さん！このシューティングゲーム、途中で止まった！`, "最高記録出そうだったのに！"]; break;
                        case '🎵': newDialogue = [`${customerInfo} おい！この音ゲー、音がズレてるじゃないか！`, "パーフェクト狙ってたのに！"]; break;
                        case '💰': newDialogue = [`${customerInfo} 両替機が壊れてる！1000円札が戻ってこない！`, "すぐに直してくれ！"]; break;
                        case '🕹️': newDialogue = [`${customerInfo} レトロゲームのコントローラーが効かない！`, "上が押せないんだ！"]; break;
                        case '📸': newDialogue = [`${customerInfo} プリクラ機でお金だけ取られた！`, "写真が出てこないぞ！"]; break;
                        case '🥤': newDialogue = [`${customerInfo} 自販機でジュース買ったけど出てこない！`, "お金返して！"]; break;
                        case 'ℹ️': newDialogue = [`${customerInfo} インフォメーションに誰もいない！`, "質問したいことがあるのに！"]; break;
                        case '🧸':
                        default:
                            newDialogue = [`${customerInfo} おい、店員！このクレーンゲーム、アームが弱すぎるぞ！`, "景品が全然取れないじゃないか。どうにかしろ！"];
                            break;
                    }
                } else {
                    newDialogue = [`${customerInfo} おい、店員！なんだお前は！`, "用事があったのに忘れちまったじゃねえか！"];
                }

                setDialogue(newDialogue);
                setChatHistory(prev => [...prev, '--- Battle Start ---', `NPC: ${newDialogue[0]}`]);
                setDialogueIndex(0);
                setIsPlayerTurn(false);
                setInBattle(true);
                setCurrentInteractingNpc(targetMovingNpc);
            }
            // プレイヤーから話しかけた場合のみクールダウンを設定
            if (callingNpcId === null) {
                setIsCallOnCooldown(true);
                setTimeout(() => setIsCallOnCooldown(false), 10000);
            }
            setCallingNpcId(null);
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

        if (e.key.toLowerCase() === 'c') {
            setShowCustomerTable(prev => !prev);
            return;
        }

        if (showExitConfirm) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                setExitSelected(prev => prev === 0 ? 1 : 0);
                e.preventDefault();
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (exitSelected === 0 && onReturnToTitle) {
                    onReturnToTitle();
                } else {
                    setShowExitConfirm(false);
                }
                e.preventDefault();
            } else if (e.key === 'Escape') {
                setShowExitConfirm(false);
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'Escape') {
            if (dialogue) {
                setDialogue(null);
                setDialogueIndex(0);
                setIsPlayerTurn(false);
                setInBattle(false);
                setCallingNpcId(null);
                setCurrentInteractingNpc(null); // 対話終了時にクリア
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
        if (checkExitTile(newPosition)) {
            setShowExitConfirm(true);
            setExitSelected(0);
        } else if (isWalkable(newPosition)) {
            setPlayerPosition(newPosition);
            // 非同期でお金の拾得をチェック
            checkAndPickupMoney(newPosition).catch(error =>
                console.error("お金の拾得処理でエラー:", error)
            );
        }
    }, [playerPosition, playerDirection, dialogue, dialogueIndex, isWalkable, checkExitTile, checkAndPickupMoney, handleInteraction, movingNpcs, callingNpcId, showExitConfirm, exitSelected, onReturnToTitle]);

    // 新しい客のスポーンタイマー（12秒 = 12000ms）
    useEffect(() => {
        console.log("顧客スポーンタイマーを開始します (12秒間隔)");

        const customerSpawnTimer = setInterval(() => {
            console.log("タイマー発火: spawnNewCustomer を呼び出します");
            if (spawnNewCustomerRef.current) {
                spawnNewCustomerRef.current();
            }
        }, 12000);

        return () => {
            console.log("顧客スポーンタイマーをクリアします");
            clearInterval(customerSpawnTimer);
        };
    }, []); // 依存配列を空にしてマウント時に一度だけ実行

    useEffect(() => {
        const gameLoop = setInterval(() => {
            if (dialogueRef.current) return;
            setMovingNpcs(currentNpcs => {
                const movedNpcs = currentNpcs.map(npc => {
                    if (npc.id === callingNpcId) return npc;
                    const oldPosition = { ...npc.position };
                    const direction = Math.floor(Math.random() * 4);
                    const nextPos = { ...npc.position };
                    if (direction === 0) nextPos.y--; else if (direction === 1) nextPos.y++; else if (direction === 2) nextPos.x--; else if (direction === 3) nextPos.x++;
                    const isNextPosWall = MAP_LAYOUT[nextPos.y]?.[nextPos.x] === TileType.WALL;
                    const isNextPosOutOfBounds = nextPos.x < 0 || nextPos.x >= MAP_WIDTH || nextPos.y < 0 || nextPos.y >= MAP_HEIGHT;
                    const isNextPosStaticNpc = NPCS.some(staticNpc => staticNpc.position.x === nextPos.x && staticNpc.position.y === nextPos.y);
                    const isNextPosPlayer = playerPositionRef.current.x === nextPos.x && playerPositionRef.current.y === nextPos.y;
                    const isNextPosOtherMovingNpc = currentNpcs.some(otherNpc => otherNpc.id !== npc.id && otherNpc.position.x === nextPos.x && otherNpc.position.y === nextPos.y);

                    if (!isNextPosWall && !isNextPosOutOfBounds && !isNextPosStaticNpc && !isNextPosPlayer && !isNextPosOtherMovingNpc) {
                        // CPUが移動した場合、3%の確率でお金を落とす
                        if (Math.random() < 0.03) {
                            const moneyId = `money_${Date.now()}_${npc.id}`;
                            setDroppedMoney(prev => [...prev, {
                                id: moneyId,
                                position: oldPosition,
                                amount: 100
                            }]);
                        }
                        return { ...npc, position: nextPos };
                    }
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
            {showCustomerTable && (
                <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-4 border-blue-400 rounded-lg p-6 text-white font-mono max-w-4xl w-full max-h-full overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl text-blue-400 font-bold">📊 Customer Database</h2>
                            <button
                                onClick={() => setShowCustomerTable(false)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                            >
                                ✕ Close
                            </button>
                        </div>

                        <div className="mb-4 text-sm text-gray-300">
                            <p>💡 Press 'C' key to toggle this table</p>
                            <p>Total Customers: {customerData.length}</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-600">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="border border-gray-600 px-3 py-2 text-left">ID</th>
                                        <th className="border border-gray-600 px-3 py-2 text-left">Name</th>
                                        <th className="border border-gray-600 px-3 py-2 text-left">Age</th>
                                        <th className="border border-gray-600 px-3 py-2 text-left">Money</th>
                                        <th className="border border-gray-600 px-3 py-2 text-left">Status</th>
                                        <th className="border border-gray-600 px-3 py-2 text-left">Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerData.map((customer) => {
                                        const currentNpc = movingNpcs.find(npc => npc.id === customer.id);
                                        const isBanned = bannedCustomers.has(customer.id);
                                        const isInStore = !!currentNpc;
                                        const status = isBanned ? 'Banned' : currentNpc?.status || 'Outside';

                                        return (
                                            <tr key={customer.id} className={`
                                                ${isBanned ? 'bg-red-900 bg-opacity-50' : ''}
                                                ${isInStore ? 'bg-green-900 bg-opacity-30' : 'bg-gray-800 bg-opacity-50'}
                                            `}>
                                                <td className="border border-gray-600 px-3 py-2">{customer.id}</td>
                                                <td className="border border-gray-600 px-3 py-2">{customer.customer_name}</td>
                                                <td className="border border-gray-600 px-3 py-2">{customer.age}歳</td>
                                                <td className="border border-gray-600 px-3 py-2">¥{customer.money?.toLocaleString()}</td>
                                                <td className="border border-gray-600 px-3 py-2">
                                                    <span className={`
                                                        ${isBanned ? 'text-red-400' : ''}
                                                        ${status === 'alive' ? 'text-green-400' : ''}
                                                        ${status === 'dead' ? 'text-red-400' : ''}
                                                        ${status === 'cursed' ? 'text-purple-400' : ''}
                                                        ${status === 'Outside' ? 'text-gray-400' : ''}
                                                    `}>
                                                        {isBanned ? '🚫 ' : ''}
                                                        {status === 'alive' ? '💚 Alive' : ''}
                                                        {status === 'dead' ? '💀 Dead' : ''}
                                                        {status === 'cursed' ? '🌀 Cursed' : ''}
                                                        {status === 'Outside' ? '🏠 Outside' : ''}
                                                        {status === 'Banned' ? '🚫 Banned' : ''}
                                                    </span>
                                                </td>
                                                <td className="border border-gray-600 px-3 py-2">
                                                    {currentNpc ?
                                                        `(${currentNpc.position.x}, ${currentNpc.position.y})` :
                                                        'Not in store'
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 text-xs text-gray-400">
                            <p>Legend: 💚 Alive | 💀 Dead | 🌀 Cursed | 🚫 Banned | 🏠 Outside</p>
                        </div>
                    </div>
                </div>
            )}
            <Map layout={MAP_LAYOUT} />
            {NPCS.map(npc => (<Npc key={`static-${npc.id}`} position={npc.position} sprite={npc.sprite} />))}
            {movingNpcs.map(npc => (
                <div key={`moving-${npc.id}`} className="absolute">
                    <Player position={npc.position} direction={Direction.DOWN} color="red" isCalling={npc.id === callingNpcId} />
                    {npc.customerName && (
                        <div
                            className="absolute text-xs text-white bg-black bg-opacity-70 px-1 rounded text-center pointer-events-none"
                            style={{
                                left: `${npc.position.x * TILE_SIZE}px`,
                                top: `${npc.position.y * TILE_SIZE + TILE_SIZE + 2}px`,
                                fontSize: '10px',
                                whiteSpace: 'nowrap',
                                transform: 'translateX(-50%)',
                                marginLeft: `${TILE_SIZE / 2}px`
                            }}
                        >
                            {npc.customerName}
                        </div>
                    )}
                </div>
            ))}
            <Player position={playerPosition} direction={playerDirection} color="blue" />

            {/* 落ちているお金のキラキラエフェクト */}
            {droppedMoney.map(money => (
                <div
                    key={money.id}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${money.position.x * TILE_SIZE}px`,
                        top: `${money.position.y * TILE_SIZE}px`,
                        width: `${TILE_SIZE}px`,
                        height: `${TILE_SIZE}px`,
                        zIndex: 5
                    }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* キラキラアニメーション */}
                        <div className="absolute animate-ping">
                            <span className="text-2xl">✨</span>
                        </div>
                        <div className="absolute animate-pulse">
                            <span className="text-xl text-yellow-400">💰</span>
                        </div>
                        <div className="absolute animate-bounce" style={{ animationDelay: '0.5s' }}>
                            <span className="text-xs text-white font-bold bg-black bg-opacity-50 px-1 rounded">
                                {money.amount}
                            </span>
                        </div>
                        {/* 追加のキラキラエフェクト */}
                        <div className="absolute top-0 left-0 animate-ping" style={{ animationDelay: '0.2s' }}>
                            <span className="text-sm">⭐</span>
                        </div>
                        <div className="absolute bottom-0 right-0 animate-ping" style={{ animationDelay: '0.8s' }}>
                            <span className="text-sm">✨</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* 出口確認ダイアログ */}
            {showExitConfirm && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-4 border-yellow-400 rounded-lg p-6 text-center text-white font-mono">
                        <h2 className="text-xl text-yellow-400 mb-4">閉店しますか？</h2>
                        <div className="flex gap-4 justify-center">
                            <button
                                className={`px-6 py-2 border-2 rounded ${
                                    exitSelected === 0
                                        ? 'border-yellow-400 bg-yellow-400 text-black font-bold'
                                        : 'border-gray-500 text-gray-300'
                                }`}
                            >
                                はい
                            </button>
                            <button
                                className={`px-6 py-2 border-2 rounded ${
                                    exitSelected === 1
                                        ? 'border-yellow-400 bg-yellow-400 text-black font-bold'
                                        : 'border-gray-500 text-gray-300'
                                }`}
                            >
                                いいえ
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">←→キーで選択、ENTERで決定</p>
                    </div>
                </div>
            )}

            {/* RPGツクール風魔法エフェクト */}
            {magicEffect && (
                <div className="absolute inset-0 pointer-events-none z-40">
                    {/* 詠唱フェーズ */}
                    {magicEffect.phase === 'casting' && (
                        <div className="absolute inset-0 bg-black bg-opacity-50">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    {/* 魔法陣 */}
                                    <div
                                        className={`
                                            w-64 h-64 border-4 rounded-full relative
                                            ${magicEffect.type === 'death' ? 'border-red-500' : ''}
                                            ${magicEffect.type === 'survival' ? 'border-blue-500' : ''}
                                            ${magicEffect.type === 'curse' ? 'border-purple-500' : ''}
                                            ${magicEffect.type === 'money' ? 'border-yellow-500' : ''}
                                            ${magicEffect.type === 'general' ? 'border-green-500' : ''}
                                        `}
                                        style={{
                                            animation: 'spin 3s linear infinite'
                                        }}
                                    >
                                        {/* 内側の魔法陣 */}
                                        <div
                                            className={`
                                                absolute inset-4 border-2 rounded-full
                                                ${magicEffect.type === 'death' ? 'border-red-400' : ''}
                                                ${magicEffect.type === 'survival' ? 'border-blue-400' : ''}
                                                ${magicEffect.type === 'curse' ? 'border-purple-400' : ''}
                                                ${magicEffect.type === 'money' ? 'border-yellow-400' : ''}
                                                ${magicEffect.type === 'general' ? 'border-green-400' : ''}
                                            `}
                                            style={{
                                                animation: 'spin 2s linear infinite reverse'
                                            }}
                                        >
                                            {/* 魔法陣の中心 */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className={`
                                                    text-6xl animate-pulse
                                                    ${magicEffect.type === 'death' ? 'text-red-300' : ''}
                                                    ${magicEffect.type === 'survival' ? 'text-blue-300' : ''}
                                                    ${magicEffect.type === 'curse' ? 'text-purple-300' : ''}
                                                    ${magicEffect.type === 'money' ? 'text-yellow-300' : ''}
                                                    ${magicEffect.type === 'general' ? 'text-green-300' : ''}
                                                `}>
                                                    {magicEffect.type === 'death' && '☠️'}
                                                    {magicEffect.type === 'survival' && '⚡'}
                                                    {magicEffect.type === 'curse' && '🔮'}
                                                    {magicEffect.type === 'money' && '💰'}
                                                    {magicEffect.type === 'general' && '✨'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 魔法陣の星 */}
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`
                                                    absolute w-4 h-4 text-2xl animate-pulse
                                                    ${magicEffect.type === 'death' ? 'text-red-400' : ''}
                                                    ${magicEffect.type === 'survival' ? 'text-blue-400' : ''}
                                                    ${magicEffect.type === 'curse' ? 'text-purple-400' : ''}
                                                    ${magicEffect.type === 'money' ? 'text-yellow-400' : ''}
                                                    ${magicEffect.type === 'general' ? 'text-green-400' : ''}
                                                `}
                                                style={{
                                                    top: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                                                    left: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    animationDelay: `${i * 0.1}s`
                                                }}
                                            >
                                                ★
                                            </div>
                                        ))}
                                    </div>

                                    {/* 詠唱テキスト */}
                                    <div className="mt-8 text-white text-2xl font-bold animate-pulse">
                                        {magicEffect.type === 'destruction' ?
                                            <div className="text-orange-400 text-3xl">
                                                ⚠️ 禁断の魔法を詠唱中... ⚠️<br/>
                                                <span className="text-red-500 text-4xl animate-bounce">バルス！！！</span>
                                            </div>
                                            : '魔法を詠唱中...'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 発動フェーズ */}
                    {magicEffect.phase === 'impact' && (
                        <div className="absolute inset-0">
                            {/* フラッシュエフェクト */}
                            <div className={`
                                absolute inset-0 animate-pulse
                                ${magicEffect.type === 'death' ? 'bg-red-500' : ''}
                                ${magicEffect.type === 'survival' ? 'bg-blue-500' : ''}
                                ${magicEffect.type === 'curse' ? 'bg-purple-500' : ''}
                                ${magicEffect.type === 'money' ? 'bg-yellow-500' : ''}
                                ${magicEffect.type === 'general' ? 'bg-green-500' : ''}
                            `} style={{ opacity: Math.sin(effectFrame * 0.5) * 0.3 + 0.3 }} />

                            {/* 爆発エフェクト */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {Array.from({ length: 30 }).map((_, i) => {
                                    const angle = (i * Math.PI * 2) / 30;
                                    const distance = (effectFrame - 30) * 5;
                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                absolute text-4xl animate-ping
                                                ${magicEffect.type === 'death' ? 'text-red-400' : ''}
                                                ${magicEffect.type === 'survival' ? 'text-blue-400' : ''}
                                                ${magicEffect.type === 'curse' ? 'text-purple-400' : ''}
                                                ${magicEffect.type === 'money' ? 'text-yellow-400' : ''}
                                                ${magicEffect.type === 'general' ? 'text-green-400' : ''}
                                            `}
                                            style={{
                                                left: `${50 + Math.cos(angle) * distance / 5}%`,
                                                top: `${50 + Math.sin(angle) * distance / 5}%`,
                                                transform: 'translate(-50%, -50%)',
                                                opacity: Math.max(0, 1 - distance / 100)
                                            }}
                                        >
                                            ✨
                                        </div>
                                    );
                                })}

                                {/* 中央の大爆発 */}
                                <div className={`
                                    text-9xl font-bold animate-bounce
                                    ${magicEffect.type === 'death' ? 'text-red-300' : ''}
                                    ${magicEffect.type === 'survival' ? 'text-blue-300' : ''}
                                    ${magicEffect.type === 'curse' ? 'text-purple-300' : ''}
                                    ${magicEffect.type === 'money' ? 'text-yellow-300' : ''}
                                    ${magicEffect.type === 'general' ? 'text-green-300' : ''}
                                `}>
                                    {magicEffect.type === 'death' && '💥'}
                                    {magicEffect.type === 'survival' && '⚡'}
                                    {magicEffect.type === 'curse' && '🌀'}
                                    {magicEffect.type === 'money' && '💰'}
                                    {magicEffect.type === 'general' && '✨'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 結果フェーズ */}
                    {magicEffect.phase === 'result' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                            <div className={`
                                text-center p-8 rounded-lg border-4 bg-opacity-90
                                ${magicEffect.type === 'death' ? 'bg-red-900 border-red-500' : ''}
                                ${magicEffect.type === 'survival' ? 'bg-blue-900 border-blue-500' : ''}
                                ${magicEffect.type === 'curse' ? 'bg-purple-900 border-purple-500' : ''}
                                ${magicEffect.type === 'money' ? 'bg-yellow-900 border-yellow-500' : ''}
                                ${magicEffect.type === 'general' ? 'bg-green-900 border-green-500' : ''}
                            `}>
                                <div className="text-6xl mb-4 animate-pulse">
                                    {magicEffect.type === 'death' && '💀'}
                                    {magicEffect.type === 'survival' && '⚡'}
                                    {magicEffect.type === 'curse' && '🌀'}
                                    {magicEffect.type === 'money' && '💰'}
                                    {magicEffect.type === 'general' && '✨'}
                                </div>
                                <div className="text-white text-3xl font-bold max-w-2xl">
                                    {magicEffect.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ゲームオーバー画面 */}
            {gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
                    <div className="text-center text-white font-mono">
                        {/* 崩壊する店舗のエフェクト */}
                        <div className="mb-8">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute text-6xl animate-bounce text-orange-500"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        animationDuration: `${Math.random() * 2 + 1}s`
                                    }}
                                >
                                    🏢💥
                                </div>
                            ))}
                        </div>

                        {/* ゲームオーバーテキスト */}
                        <div className="relative z-10">
                            <h1 className="text-8xl font-bold text-red-500 mb-6 animate-pulse"
                                style={{ textShadow: '4px 4px 0 #000, 2px 2px 0 #ff0000' }}>
                                GAME OVER
                            </h1>

                            <div className="text-4xl text-orange-400 mb-4 animate-bounce">
                                🏗️💥 店舗崩壊 💥🏗️
                            </div>

                            <p className="text-2xl text-white mb-8 max-w-2xl mx-auto leading-relaxed">
                                {gameOverReason}
                            </p>

                            <div className="text-lg text-gray-300 mb-6">
                                <p>禁断の魔法「バルス」により、</p>
                                <p>あなたの経営するゲームセンターは</p>
                                <p>跡形もなく消し飛んでしまいました...</p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setGameOver(false);
                                        setGameOverReason('');
                                        // ゲームをリセット
                                        setPlayerPosition(PLAYER_START_POSITION);
                                        setMovingNpcs([]);
                                        setCustomerData([]);
                                        setBannedCustomers(new Set());
                                        setDialogue(null);
                                        setMagicEffect(null);
                                        setChatHistory(['SYSTEM: ゲームがリセットされました。新しい店舗で再開します！']);
                                        setDebug(true); // データを再取得
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors duration-200 mr-4"
                                >
                                    🔄 再挑戦
                                </button>

                                {onReturnToTitle && (
                                    <button
                                        onClick={onReturnToTitle}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors duration-200"
                                    >
                                        🏠 タイトルへ
                                    </button>
                                )}
                            </div>

                            <div className="mt-8 text-sm text-gray-500">
                                <p>ヒント: 「バルス」は使用禁止魔法です</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {dialogue && (
                <DialogueBox
                    message={dialogue[dialogueIndex]}
                    hasNext={!isPlayerTurn}
                    onClose={handleInteraction}
                    showInput={isPlayerTurn && inBattle}
                    inputValue={playerInput}
                    onInputChange={(e) => setPlayerInput(e.target.value)}
                    onSubmit={handlePlayerAction}
                    customerName={currentInteractingNpc?.customerName}
                    customerAge={currentInteractingNpc?.age}
                    customerIconUrl={currentInteractingNpc?.icon_url}
                    customerIconUrls={currentInteractingNpc?.icon_urls}
                    onBanCustomer={banCustomer}
                    showBanButton={inBattle && currentInteractingNpc !== null}
                />
            )}
        </div>
    );
};


const Component = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = process.env["url "] || ""; // .envからURLを取得
                const response = await axios.get(`${baseUrl}/player`); // "/player"エンドポイントにリクエスト
                setData(response.data); // データをstateに保存
            } catch (error) {
                console.error("データ取得エラー:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            {data ? (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            ) : (
                <p>データを読み込み中...</p>
            )}
        </div>
    );
};




export default Game;