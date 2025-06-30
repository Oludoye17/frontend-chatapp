import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-1/4 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-semibold mb-4">Chats</h2>
      <ul>
        <li className="mb-2 hover:bg-gray-700 p-2 rounded cursor-pointer">John Doe</li>
        <li className="mb-2 hover:bg-gray-700 p-2 rounded cursor-pointer">Jane Smith</li>
      </ul>
    </div>
  );
};

export default Sidebar;