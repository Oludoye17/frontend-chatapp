import React from 'react';

const MessageList = () => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="mb-4">
        <div className="bg-blue-500 text-white p-2 rounded-md inline-block">Hello!</div>
      </div>
      <div className="mb-4 text-right">
        <div className="bg-gray-300 text-black p-2 rounded-md inline-block">Hi there!</div>
      </div>
    </div>
  );
};

export default MessageList;