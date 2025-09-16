
import React, { useState } from 'react';
import Game from './components/Game';
import Title from './components/Title';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [money, setMoney] = useState(0);

  const handleGameStart = () => {
    setGameStarted(true);
  };

  const handleReturnToTitle = () => {
    setGameStarted(false);
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
      <Game onReturnToTitle={handleReturnToTitle} />
    </div>
  );
};

export default App;
