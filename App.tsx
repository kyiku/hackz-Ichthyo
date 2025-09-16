
import React, { useState } from 'react';
import Game from './components/Game';
import Title from './components/Title';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);

  const handleGameStart = () => {
    setGameStarted(true);
  };

  if (!gameStarted) {
    return <Title onGameStart={handleGameStart} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-mono p-4">
      <header className="mb-4 text-center">
      </header>
      <Game />
    </div>
  );
};

export default App;
