import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = () => {
  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <div className="bg-white p-4 border-b font-semibold">John Doe</div>
      <MessageList />
      <MessageInput />
    </div>
  );
};

export default ChatWindow;