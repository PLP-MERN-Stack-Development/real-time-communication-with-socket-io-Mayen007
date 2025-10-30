import React, { useRef, useState } from "react";
import { useSocket } from "./socket/socket";
import ChatLayout from "./components/ChatLayout";

export default function App() {
  const {
    connect,
    disconnect,
    isConnected,
    messages,
    privateMessages,
    users,
    sendMessage,
    sendPrivateMessage,
    addReaction,
    setTyping,
    typingUsers,
    usernameError,
    currentUsername,
    currentUserId,
    roomsList,
    currentRoom,
    joinRoom,
    createRoom,
    requestRooms,
    markAsRead,
  } = useSocket();

  // Local state for PM target and refs
  const [pmTarget, setPmTarget] = useState(null);
  const messagesRef = useRef(null);

  // Handler for PM button
  const handlePm = (user) => {
    setPmTarget(user);
  };

  return (
    <ChatLayout
      messages={messages}
      users={users}
      typingUsers={typingUsers}
      currentUsername={currentUsername}
      currentUserId={currentUserId}
      markAsRead={markAsRead}
      addReaction={addReaction}
      messagesRef={messagesRef}
      pmTarget={pmTarget}
      privateMessages={privateMessages}
      onPm={handlePm}
      connect={connect}
      disconnect={disconnect}
      isConnected={isConnected}
      sendMessage={sendMessage}
      setTyping={setTyping}
      roomsList={roomsList}
      currentRoom={currentRoom}
      joinRoom={joinRoom}
      createRoom={createRoom}
    />
  );
}
