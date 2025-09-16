
import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-mono p-4">
      <header className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-yellow-400 tracking-wider" style={{ textShadow: '2px 2px 0 #000' }}>
        </h1>
      </header>
      <Game />
    </div>
  );
};

export default App;
