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
  customerName?: string; // 顧客名
  customerAge?: number; // 顧客の年齢
  customerIconUrl?: string; // 顧客のアイコン画像URL
  customerIconUrls?: { // 複数のURL形式（フォールバック用）
    primary: string;
    fallback1: string | null;
    fallback2: string | null;
    fallback3: string | null;
  } | null;
  onBanCustomer?: () => void; // 顧客を出禁にする関数
  showBanButton?: boolean; // 出禁ボタンを表示するかどうか
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
                                                   message,
                                                   hasNext,
                                                   onClose,
                                                   showInput,
                                                   inputValue,
                                                   onInputChange,
                                                   onSubmit,
                                                   customerName,
                                                   customerAge,
                                                   customerIconUrl,
                                                   customerIconUrls,
                                                   onBanCustomer,
                                                   showBanButton,
                                                 }) => {
  const { transcript, isListening, startListening, stopListening, isSupported } = useSpeechRecognition();
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(null);
  const [imageLoadAttempt, setImageLoadAttempt] = React.useState(0);

  // 画像URLが変更された時に初期化
  React.useEffect(() => {
    console.log('DialogueBox 画像URL更新:', {
      customerIconUrl,
      customerIconUrls,
      customerName
    });

    // customerIconUrlsが存在する場合はprimaryを、そうでなければcustomerIconUrlを使用
    if (customerIconUrls?.primary) {
      console.log('customerIconUrls.primaryを使用:', customerIconUrls.primary);
      setCurrentImageUrl(customerIconUrls.primary);
    } else {
      console.log('customerIconUrlを使用:', customerIconUrl);
      setCurrentImageUrl(customerIconUrl || null);
    }
    setImageLoadAttempt(0);
  }, [customerIconUrl, customerIconUrls, customerName]);

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

  const handleImageError = () => {
    if (customerIconUrls && imageLoadAttempt < 3) {
      const urls = [
        customerIconUrls.fallback1,
        customerIconUrls.fallback2,
        customerIconUrls.fallback3
      ];

      const nextUrl = urls[imageLoadAttempt];
      if (nextUrl) {
        console.log(`画像読み込み失敗、フォールバック${imageLoadAttempt + 1}を試行:`, nextUrl);
        setCurrentImageUrl(nextUrl);
        setImageLoadAttempt(prev => prev + 1);
      } else {
        console.log('全ての画像URLで読み込みに失敗しました');
        setCurrentImageUrl(null);
      }
    } else {
      console.log('画像読み込み失敗、表示をスキップします');
      setCurrentImageUrl(null);
    }
  };

  return (
      <div className="absolute bottom-4 left-4 right-4 bg-gray-900 bg-opacity-80 border-2 border-gray-500 rounded-lg p-4 text-white shadow-lg z-20">
        <div className="flex space-x-4">
          {/* 左側：メインコンテンツ */}
          <div className="flex-1">
            {/* 顧客情報の表示 */}
            {customerName && customerAge && (
              <div className="bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md px-3 py-1 mb-3 text-sm text-purple-200 flex justify-between items-center">
                <span>💬: <span className="font-bold text-white">{customerName}さん ({customerAge}歳)</span></span>
                {showBanButton && onBanCustomer && (
                  <button
                    onClick={onBanCustomer}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition-colors duration-200"
                    title="この顧客を出禁にする"
                  >
                    🚫 出禁
                  </button>
                )}
              </div>
            )}
            <p className="text-xl mb-4">{message}</p>
          </div>

          {/* 右側：顧客の画像 */}
          {currentImageUrl && (
            <div className="flex-shrink-0 w-24 h-24">
              <img
                src={currentImageUrl}
                alt={customerName ? `${customerName}さんのアイコン` : '顧客のアイコン'}
                className="w-full h-full object-cover rounded-lg border-2 border-purple-500"
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* 画像が利用できない場合のフォールバック */}
          {!currentImageUrl && customerName && (
            <div className="flex-shrink-0 w-24 h-24 bg-purple-800 border-2 border-purple-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl">👤</div>
                <div className="text-xs text-purple-200">{customerName.charAt(0)}</div>
              </div>
            </div>
          )}
        </div>

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