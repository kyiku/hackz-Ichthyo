import React, { useState, useEffect } from 'react';

interface TitleProps {
  onGameStart: () => void;
}

const Title: React.FC<TitleProps> = ({ onGameStart }) => {
  const [blinkText, setBlinkText] = useState(true);
  const [selectedOption, setSelectedOption] = useState(0);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkText(prev => !prev);
    }, 800);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setSelectedOption(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          setSelectedOption(prev => Math.min(2, prev + 1));
          break;
        case 'Enter':
        case ' ':
          if (selectedOption === 0) {
            onGameStart();
          } else if (selectedOption === 1) {
            // クレジット画面
            alert('開発者: あなた\n音楽: なし\n特別な感謝: Claude');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, onGameStart]);

  const menuItems = [
    'ゲームスタート',
    'クレジット'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* 背景のアニメーション星 */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          />
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 text-center">
        {/* タイトルロゴ */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 mb-2 tracking-wider"
              style={{
                textShadow: '4px 4px 0 #000, 2px 2px 0 #ff6b6b',
                fontFamily: 'monospace'
              }}>
            🎮 ARCADE 🎮
          </h1>
          <h2 className="text-2xl text-cyan-300 tracking-widest"
              style={{ textShadow: '2px 2px 0 #000' }}>
            ～ゲームセンター物語～
          </h2>
        </div>

        {/* ゲーム機のASCIIアート風装飾 */}
        <div className="mb-8 text-green-400 text-sm leading-4">
          <pre>{`
    ┌─────────────────────┐
    │  ████████████████   │
    │  █              █   │
    │  █   👾  🚀  🎵   █   │
    │  █              █   │
    │  █   💰  🕹️  📸   █   │
    │  █              █   │
    │  ████████████████   │
    └─────────────────────┘
          `}</pre>
        </div>

        {/* メニュー */}
        <div className="mb-8">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`text-2xl mb-4 transition-all duration-200 ${
                selectedOption === index
                  ? 'text-yellow-300 scale-110 font-bold'
                  : 'text-white hover:text-gray-300'
              }`}
              style={{
                textShadow: selectedOption === index ? '2px 2px 0 #000' : '1px 1px 0 #000'
              }}
            >
              {selectedOption === index ? '▶ ' : '  '}{item}
            </div>
          ))}
        </div>

        {/* 操作説明 */}
        <div className={`text-sm text-gray-400 transition-opacity duration-300 ${blinkText ? 'opacity-100' : 'opacity-50'}`}>
          ↑↓キーで選択、ENTERまたはSPACEキーで決定
        </div>

        </div>
      {/* サイドの装飾 */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce">
        🕹️
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>
        🎮
      </div>
    </div>
  );
};

export default Title;