// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';
import {
  requestPermission,
  sendBrowserNotification,
  playSound,
} from '../utils/notifications';

// Socket.io connection URL — read from Vite env (client/.env). If not set,
// we fall back to an empty string so relative URLs still work. Setting this
// is recommended for cross-origin development (e.g. server on port 5000).
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

if (!import.meta.env.VITE_SOCKET_URL) {
  // Developer hint: add VITE_SOCKET_URL to client/.env (example below)
  // VITE_SOCKET_URL=http://localhost:5000
  console.warn(
    "VITE_SOCKET_URL is not set. If your server runs on a different origin (e.g. localhost:5000), set VITE_SOCKET_URL in client/.env"
  );
}

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasNextPage: false });
  const [loadingMore, setLoadingMore] = useState(false);

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
  // Accept either a simple string (message text) or an object containing
  // additional properties (e.g. { message, fileUrl, fileType, fileName }).
  const sendMessage = (messageOrPayload, room) => {
    let payload = {};

    if (typeof messageOrPayload === 'string') {
      payload.message = messageOrPayload;
    } else if (messageOrPayload && typeof messageOrPayload === 'object') {
      // copy fields through so callers can pass a full message object
      payload = { ...messageOrPayload };
    } else {
      payload.message = '';
    }

    if (room) payload.room = room;
    else if (!payload.room && currentRoom) payload.room = currentRoom;

    socket.emit('send_message', payload);
  };

  // Send a private message
  // Accept either a simple string message or an object payload with
  // additional fields (fileUrl, fileName, fileType, etc.).
  const sendPrivateMessage = (to, messageOrPayload) => {
    let payload = { to };
    if (typeof messageOrPayload === 'string') {
      payload.message = messageOrPayload;
    } else if (messageOrPayload && typeof messageOrPayload === 'object') {
      payload = { ...payload, ...messageOrPayload };
    } else {
      payload.message = '';
    }
    socket.emit('private_message', payload);
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

  // Load more messages for pagination
  const loadMoreMessages = async () => {
    if (loadingMore || !pagination.hasNextPage) return;

    setLoadingMore(true);
    try {
      const nextPage = pagination.currentPage + 1;
      const response = await fetch(`${SOCKET_URL}/api/messages?room=${currentRoom || 'general'}&page=${nextPage}&limit=50`);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        // Prepend older messages to the beginning of the array
        setMessages(prev => [...data.messages, ...prev]);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    // ask for notification permission once if notifications are enabled
    try {
      const notificationsEnabledAtStart = typeof window !== 'undefined' ? localStorage.getItem('notifications_enabled') !== 'false' : true;
      if (notificationsEnabledAtStart) requestPermission();
    } catch (e) {
      // ignore
    }

    const onWindowFocus = () => {
      // clear unread count when user focuses the window
      setUnreadCount(0);
    };
    window.addEventListener('focus', onWindowFocus);
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
      try {
        // notify only for messages from others
        const fromMe = message.senderId && message.senderId === socket.id;
        if (!fromMe) {
          // If the window is hidden or message is for another room, count as unread
          if (document.hidden || (message.room && message.room !== currentRoom)) {
            setUnreadCount((c) => c + 1);
          }
          // browser notification and sound
          const title = message.sender || 'New message';
          const body = typeof message.message === 'string' ? message.message.replace(/!\[.*?]\((.*?)\)/g, '') : '';
          try {
            const notificationsEnabled = typeof window !== 'undefined' ? localStorage.getItem('notifications_enabled') !== 'false' : true;
            const soundEnabled = typeof window !== 'undefined' ? localStorage.getItem('sound_enabled') !== 'false' : true;
            if (notificationsEnabled) sendBrowserNotification(title, { body });
            if (soundEnabled) playSound();
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore notification errors
      }
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
      // clear unread when joining
      setUnreadCount(0);
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
      // Reset pagination when joining a room
      setPagination({ currentPage: 1, totalPages: 1, hasNextPage: false });
      // clear unread when switching/joining a room
      setUnreadCount(0);
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
      // small notification for join (respect settings)
      try {
        const notificationsEnabled = typeof window !== 'undefined' ? localStorage.getItem('notifications_enabled') !== 'false' : true;
        const soundEnabled = typeof window !== 'undefined' ? localStorage.getItem('sound_enabled') !== 'false' : true;
        if (notificationsEnabled) sendBrowserNotification('User joined', { body: `${user.username} joined` });
        if (soundEnabled) playSound();
      } catch (e) { }
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
      try {
        const notificationsEnabled = typeof window !== 'undefined' ? localStorage.getItem('notifications_enabled') !== 'false' : true;
        if (notificationsEnabled) sendBrowserNotification('User left', { body: `${user.username} left` });
      } catch (e) { }
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
      window.removeEventListener('focus', onWindowFocus);
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
    unreadCount,
    pagination,
    loadingMore,
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
    loadMoreMessages,
    // helper to clear username error from UI when user edits their name
    clearUsernameError: () => setUsernameError(null),
  };
};

export default socket; 