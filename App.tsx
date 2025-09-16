
import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-mono p-4">
      <header className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-yellow-400 tracking-wider" style={{ textShadow: '2px 2px 0 #000' }}>
          React 2D Game Center
        </h1>
        <p className="text-gray-300">RPGツクール風ゲームセンター</p>
      </header>
      <Game />
      <footer className="mt-4 text-center text-gray-400 bg-gray-800 p-3 rounded-lg shadow-inner">
        <p>Use <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Arrow Keys</kbd> to move.</p>
        <p>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Spacebar</kbd> or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> to interact.</p>
      </footer>
    </div>
  );
};

export default App;
