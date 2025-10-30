// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // Connect to socket server
  const connect = (username) => {
    socket.connect();
    if (username) {
      socket.emit('user_join', username);
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a message (scoped to currentRoom)
  const sendMessage = (message, room) => {
    const payload = { message };
    if (room) payload.room = room;
    else if (currentRoom) payload.room = currentRoom;
    socket.emit('send_message', payload);
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  // Set typing status (include room)
  const setTyping = (isTyping, room) => {
    const payload = typeof isTyping === 'boolean' ? { isTyping } : isTyping;
    payload.room = room || currentRoom;
    socket.emit('typing', payload);
  };

  const joinRoom = (roomName) => {
    socket.emit('join_room', roomName);
  };

  const leaveRoom = (roomName) => {
    socket.emit('leave_room', roomName);
  };

  const createRoom = (roomName) => {
    // just join a room; server will create it if missing
    socket.emit('join_room', roomName);
  };

  // Add a reaction to a message
  const addReaction = (messageId, emoji) => {
    socket.emit('add_reaction', { messageId, emoji });
  };

  // Mark a message as read (read receipt)
  const markAsRead = (messageId) => {
    socket.emit('message_read', { messageId });
  };

  // Request the current list of rooms from the server
  const requestRooms = () => {
    socket.emit('request_room_list');
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setCurrentUsername(null);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      // append message; UI can filter by currentRoom or room property
      setMessages((prev) => [...prev, message]);
    };

    const onUsernameError = (err) => {
      setUsernameError(err?.message || 'Username error');
    };

    const onJoinSuccess = ({ username, id }) => {
      setUsernameError(null);
      setCurrentUsername(username);
      setCurrentUserId(id);
      // Optionally add a system message acknowledging the join
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `You joined as ${username}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setPrivateMessages((prev) => [...prev, message]);
    };

    const onRoomList = (roomNames) => {
      setRoomsList(roomNames);
    };

    const onRoomJoined = ({ room, history }) => {
      setCurrentRoom(room);
      // Replace messages with room history (keeps UI focused)
      if (Array.isArray(history)) setMessages(history);
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      // You could add a system message here
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (user) => {
      // You could add a system message here
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    const onMessageUpdated = (updatedMessage) => {
      if (updatedMessage.isPrivate) {
        setPrivateMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)));
      } else {
        setMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)));
      }
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('username_error', onUsernameError);
    socket.on('join_success', onJoinSuccess);
    socket.on('private_message', onPrivateMessage);
    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('message_updated', onMessageUpdated);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('username_error', onUsernameError);
      socket.off('join_success', onJoinSuccess);
      socket.off('private_message', onPrivateMessage);
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('message_updated', onMessageUpdated);
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    privateMessages,
    users,
    typingUsers,
    usernameError,
    currentUsername,
    currentUserId,
    roomsList,
    currentRoom,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    addReaction,
    markAsRead,
    joinRoom,
    leaveRoom,
    createRoom,
    requestRooms,
  };
};

export default socket; 