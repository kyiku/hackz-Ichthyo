// src/components/DialogueBox.tsx

import React from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

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
  const { transcript, isListening, startListening, stopListening, isSupported } = useSpeechRecognition();

  React.useEffect(() => {
    if (transcript && showInput) {
      // 音声認識の結果をinput要素に反映
      const event = {
        target: { value: transcript }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(event);
    }
  }, [transcript, showInput, onInputChange]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
      <div className="absolute bottom-4 left-4 right-4 bg-gray-900 bg-opacity-80 border-2 border-gray-500 rounded-lg p-4 text-white shadow-lg z-20">
        <p className="text-xl mb-4">{message}</p>

        {/* --- ↓ここから下を新しく追加 --- */}
        {showInput ? (
            <div className="space-y-2">
              <form onSubmit={handleFormSubmit} className="flex space-x-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={onInputChange}
                    className="flex-grow bg-gray-800 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus // ダイアログが開いたら自動で入力状態にする
                    placeholder="テキスト入力またはマイクボタンで音声入力"
                />
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 rounded px-4 py-1 font-bold">
                  送信
                </button>
              </form>

              {/* マイクボタンと音声認識状態の表示 */}
              {isSupported && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleListening}
                    className={`${
                      isListening
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white rounded-full p-3 transition-all duration-200`}
                    title={isListening ? '録音停止' : '音声入力開始'}
                  >
                    {isListening ? (
                      // 録音中のアイコン
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      // マイクアイコン
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-gray-400">
                    {isListening ? '🎙️ 録音中... 話してください' : '🎤 マイクで音声入力'}
                  </span>
                </div>
              )}

              {!isSupported && (
                <p className="text-xs text-gray-500">
                  ※ お使いのブラウザは音声入力に対応していません
                </p>
              )}
            </div>
        ) : (
            <div className="text-right font-bold animate-pulse">
              {hasNext ? '▼' : 'END'}
            </div>
        )}
      </div>
  );
};

export default DialogueBox;