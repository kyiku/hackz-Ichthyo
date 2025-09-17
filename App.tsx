
import React, { useState } from 'react';
import Game from './components/Game';
import Title from './components/Title';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [money, setMoney] = useState(0);
  const [gameCleared, setGameCleared] = useState(false);

  const handleGameStart = () => {
    setGameStarted(true);
  };

  const handleReturnToTitle = () => {
    setGameStarted(false);
    setGameCleared(false);
    setMoney(0);
  };

  const handleMoneyChange = (amount: number) => {
    setMoney(prev => {
      const newAmount = prev + amount;
      if (newAmount >= 100000 && !gameCleared) {
        setGameCleared(true);
      }
      return newAmount;
    });
  };

  if (!gameStarted) {
    return <Title onGameStart={handleGameStart} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-mono p-4 relative">
      {/* 所持金表示 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 border-2 border-yellow-400 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">💰</span>
          <span className="text-white font-mono text-lg">
            ¥{money.toLocaleString()}
          </span>
        </div>
      </div>

      <header className="mb-4 text-center">
      </header>

      {/* ゲームクリア画面 */}
      {gameCleared && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 border-4 border-yellow-400 rounded-lg p-10 text-center text-white font-mono max-w-md animate-pulse">
            <h1 className="text-5xl font-bold text-yellow-300 mb-6 animate-bounce">
              🎉 GAME CLEAR! 🎉
            </h1>
            <p className="text-2xl mb-4">
              おめでとうございます！
            </p>
            <p className="text-xl mb-2">
              売上目標達成！
            </p>
            <p className="text-3xl font-bold text-yellow-200 mb-6">
              ¥{money.toLocaleString()}
            </p>
            <p className="text-lg mb-8">
              あなたは優秀な店員です！<br/>
              ゲームセンターは大繁盛！
            </p>
            <button
              onClick={handleReturnToTitle}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl px-8 py-4 rounded-lg transition-colors duration-300 shadow-lg"
            >
              タイトルに戻る
            </button>
          </div>
        </div>
      )}

      <Game onReturnToTitle={handleReturnToTitle} onMoneyChange={handleMoneyChange} />
    </div>
  );
};

export default App;
