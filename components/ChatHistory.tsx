import React from 'react';

interface ChatHistoryProps {
    history: string[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ history }) => {
    return (
        <div className="absolute top-4 left-4 w-1/3 max-w-sm h-2/3 bg-gray-900 bg-opacity-70 border-2 border-gray-600 rounded-lg p-4 text-white shadow-lg z-30 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 border-b border-gray-500">Chat History</h3>
            <ul className="space-y-1">
                {history.map((line, index) => (
                    <li key={index} className="text-sm break-words">{line}</li>
                ))}
            </ul>
        </div>
    );
};

export default ChatHistory;