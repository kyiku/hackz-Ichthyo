
import React, { useEffect, useState } from 'react';

interface DialogueBoxProps {
  message: string;
  onClose: () => void;
  hasNext: boolean;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ message, onClose, hasNext }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(message.substring(0, i + 1));
      i++;
      if (i >= message.length) {
        clearInterval(interval);
      }
    }, 30); // Typing speed in ms

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1/4 bg-black bg-opacity-80 border-t-4 border-gray-400 p-4 text-white font-mono text-xl cursor-pointer"
      onClick={onClose}
    >
      <p>{displayedText}</p>
      {displayedText.length === message.length && (
        <div className="absolute bottom-4 right-4 animate-pulse">
            {hasNext ? '▼' : 'x'}
        </div>
      )}
    </div>
  );
};

export default DialogueBox;
