import React from 'react';

const MessageInput = () => {
  return (
    <div className="p-4 border-t">
      <div className="flex">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-l-md"
        />
        <button className="bg-blue-500 text-white px-4 rounded-r-md">Send</button>
      </div>
    </div>
  );
};

export default MessageInput;