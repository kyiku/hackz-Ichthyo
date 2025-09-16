// src/components/DialogueBox.tsx

import React from 'react';

interface DialogueBoxProps {
  message: string;
  hasNext: boolean;
  onClose: () => void; // メッセージ送りの関数
  // --- ↓ここから下を新しく追加 ---
  showInput: boolean; // 入力欄を表示するかどうか
  inputValue: string; // 入力欄の文字
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // 入力欄の文字が変わった時の関数
  onSubmit: () => void; // 送信ボタンが押された時の関数
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
                                                   message,
                                                   hasNext,
                                                   onClose,
                                                   showInput,
                                                   inputValue,
                                                   onInputChange,
                                                   onSubmit,
                                                 }) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
      <div className="absolute bottom-4 left-4 right-4 bg-gray-900 bg-opacity-80 border-2 border-gray-500 rounded-lg p-4 text-white shadow-lg z-20">
        <p className="text-xl mb-4">{message}</p>

        {/* --- ↓ここから下を新しく追加 --- */}
        {showInput ? (
            <form onSubmit={handleFormSubmit} className="flex space-x-2">
              <input
                  type="text"
                  value={inputValue}
                  onChange={onInputChange}
                  className="flex-grow bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus // ダイアログが開いたら自動で入力状態にする
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 rounded px-4 py-1 font-bold">
                送信
              </button>
            </form>
        ) : (
            <div className="text-right font-bold animate-pulse">
              {hasNext ? '▼' : 'END'}
            </div>
        )}
      </div>
  );
};

export default DialogueBox;