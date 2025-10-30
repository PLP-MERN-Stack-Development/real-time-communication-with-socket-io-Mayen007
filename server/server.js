// server.js - Main server file for Socket.io chat application

const express = require('express');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use timestamp + original name for uniqueness
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store connected users and messages
const users = {};
// knownUsers keeps a registry of usernames seen by the server and their online status
const knownUsers = {};
const messages = [];
// store private messages separately to avoid leaking into global feed
const privateMessages = [];
// rooms registry (simple in-memory list). Start with a default 'general' room.
const rooms = {
  general: { name: 'general', createdAt: new Date().toISOString() },
};
// typing users per room
const typingUsersByRoom = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Immediately send the current room list to the connecting socket so
  // the client UI can populate room selector before the user joins.
  socket.emit('room_list', Object.keys(rooms));

  // Handle user joining
  socket.on('user_join', (username) => {
    const clean = (username || '').toString().trim();
    if (!clean) {
      socket.emit('username_error', { message: 'Username cannot be empty' });
      return;
    }

    // Enforce unique usernames across all known users (strict: disallow reuse)
    if (knownUsers[clean]) {
      socket.emit('username_error', { message: 'Username already taken' });
      return;
    }

    users[socket.id] = { username: clean, id: socket.id };
    // Update knownUsers registry
    knownUsers[clean] = {
      username: clean,
      online: true,
      lastSeen: null,
      id: socket.id,
    };
    // Acknowledge the joining socket first
    socket.emit('join_success', { username: clean, id: socket.id });

    // Auto-join the default room
    const defaultRoom = 'general';
    socket.join(defaultRoom);
    users[socket.id].room = defaultRoom;
    // send room joined ack with recent history for the room
    socket.emit('room_joined', {
      room: defaultRoom,
      history: messages.filter((m) => m.room === defaultRoom),
    });
    // publish known rooms to clients
    io.emit('room_list', Object.keys(rooms));

    // Broadcast updated lists and join event to everyone else
    io.emit('user_list', Object.values(knownUsers));
    io.emit('user_joined', { username: clean, id: socket.id });
    console.log(`${clean} joined the chat`);
  });

  // Allow clients to join/leave rooms
  socket.on('join_room', (roomName) => {
    if (!users[socket.id]) {
      socket.emit('not_authenticated', { message: 'You must join before switching rooms' });
      return;
    }

    const room = (roomName || 'general').toString();
    // create room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = { name: room, createdAt: new Date().toISOString() };
    }

    const prev = users[socket.id].room;
    if (prev && prev !== room) {
      socket.leave(prev);
      io.to(prev).emit('system', { message: `${users[socket.id].username} left the room ${prev}` });
    }

    socket.join(room);
    users[socket.id].room = room;
    // send history for the room
    socket.emit('room_joined', { room, history: messages.filter((m) => m.room === room) });
    io.emit('room_list', Object.keys(rooms));
  });

  // Allow clients to explicitly request the room list
  socket.on('request_room_list', () => {
    socket.emit('room_list', Object.keys(rooms));
  });

  socket.on('leave_room', (roomName) => {
    if (!users[socket.id]) return;
    const room = (roomName || users[socket.id].room || 'general').toString();
    socket.leave(room);
    if (users[socket.id]) users[socket.id].room = null;
    socket.emit('room_left', { room });
    io.emit('room_list', Object.keys(rooms));
  });

  // Handle chat messages (room-scoped)
  socket.on('send_message', (messageData) => {
    // Require that the socket has joined with a username
    if (!users[socket.id]) {
      socket.emit('not_authenticated', { message: 'You must join with a username before sending messages' });
      return;
    }

    const room = (messageData && messageData.room) || users[socket.id].room || 'general';
    const message = {
      ...messageData,
      room,
      id: Date.now(),
      sender: users[socket.id].username,
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);

    // Limit stored messages to prevent memory issues
    if (messages.length > 100) {
      messages.shift();
    }

    // Emit message to the specific room instead of broadcasting globally
    io.to(room).emit('receive_message', message);
  });

  // typing payload may be boolean or { isTyping, room }
  socket.on('typing', (payload) => {
    if (!users[socket.id]) return;

    const username = users[socket.id].username;
    const isTyping = typeof payload === 'boolean' ? payload : !!payload?.isTyping;
    const room = (payload && payload.room) || users[socket.id].room || 'general';

    typingUsersByRoom[room] = typingUsersByRoom[room] || {};

    if (isTyping) {
      typingUsersByRoom[room][socket.id] = username;
    } else {
      if (typingUsersByRoom[room]) delete typingUsersByRoom[room][socket.id];
    }

    io.to(room).emit('typing_users', Object.values(typingUsersByRoom[room] || {}));
  });

  // Handle private messages
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      to,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };

    // store in privateMessages (separate from global messages)
    privateMessages.push(messageData);
    if (privateMessages.length > 500) privateMessages.shift();

    // send only to recipient and sender
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle adding reactions to messages
  socket.on('add_reaction', ({ messageId, emoji }) => {
    if (!users[socket.id]) {
      socket.emit('not_authenticated', { message: 'You must join before reacting' });
      return;
    }

    let message = messages.find((m) => m.id === messageId);
    let isPrivateMessage = false;
    if (!message) {
      message = privateMessages.find((m) => m.id === messageId);
      isPrivateMessage = true;
    }
    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    // initialize reactions array
    if (!Array.isArray(message.reactions)) message.reactions = [];

    // Enforce one reaction per user per message.
    // If the user already reacted with the same emoji, remove that reaction (toggle off).
    // Otherwise, remove any other reactions by this user on the message and add the new one.
    const username = users[socket.id].username;
    const sameIdx = message.reactions.findIndex((r) => r.emoji === emoji && r.by === username);
    if (sameIdx !== -1) {
      // remove the existing identical reaction (toggle off)
      message.reactions.splice(sameIdx, 1);
    } else {
      // remove any other reactions by this user (enforce single reaction per user per message)
      for (let i = message.reactions.length - 1; i >= 0; i--) {
        if (message.reactions[i].by === username) {
          message.reactions.splice(i, 1);
        }
      }
      // add the new reaction
      message.reactions.push({ emoji, by: username, timestamp: new Date().toISOString() });
    }

    // Broadcast updated message. If message is private, send only to involved parties.
    if (isPrivateMessage || message.isPrivate) {
      // message.to is recipient socket id, message.senderId is sender socket id
      const recipientSocketId = message.to;
      const senderSocketId = message.senderId;

      // notify the reacting socket and both parties if present
      socket.emit('message_updated', message);
      if (recipientSocketId && recipientSocketId !== socket.id) {
        socket.to(recipientSocketId).emit('message_updated', message);
      }
      if (senderSocketId && senderSocketId !== socket.id && senderSocketId !== recipientSocketId) {
        socket.to(senderSocketId).emit('message_updated', message);
      }
    } else {
      // publish the update to the room the message belongs to
      const room = message.room || 'general';
      io.to(room).emit('message_updated', message);
    }
  });

  // Handle read receipts (message read by a user)
  socket.on('message_read', ({ messageId }) => {
    if (!users[socket.id]) return;

    const username = users[socket.id].username;

    let message = messages.find((m) => m.id === messageId);
    let isPrivateMessage = false;
    if (!message) {
      message = privateMessages.find((m) => m.id === messageId);
      isPrivateMessage = true;
    }
    if (!message) return;

    if (!Array.isArray(message.readBy)) message.readBy = [];
    if (!message.readBy.includes(username)) {
      message.readBy.push(username);

      // Notify relevant clients about the updated read state
      if (isPrivateMessage || message.isPrivate) {
        const recipientSocketId = message.to;
        const senderSocketId = message.senderId;

        socket.emit('message_updated', message);
        if (recipientSocketId && recipientSocketId !== socket.id) {
          socket.to(recipientSocketId).emit('message_updated', message);
        }
        if (senderSocketId && senderSocketId !== socket.id && senderSocketId !== recipientSocketId) {
          socket.to(senderSocketId).emit('message_updated', message);
        }
      } else {
        const room = message.room || 'general';
        io.to(room).emit('message_updated', message);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      // mark known user as offline
      if (knownUsers[username]) {
        knownUsers[username].online = false;
        knownUsers[username].lastSeen = new Date().toISOString();
        knownUsers[username].id = null;
      }

      io.emit('user_left', { username, id: socket.id });
      console.log(`${username} left the chat`);
    }

    // remove from any typingUsersByRoom entries
    Object.keys(typingUsersByRoom).forEach((r) => {
      if (typingUsersByRoom[r] && typingUsersByRoom[r][socket.id]) {
        delete typingUsersByRoom[r][socket.id];
        io.to(r).emit('typing_users', Object.values(typingUsersByRoom[r] || {}));
      }
    });

    delete users[socket.id];

    // Emit the full known users list (including offline users)
    io.emit('user_list', Object.values(knownUsers));
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Build an absolute URL for the uploaded file so clients don't have to
  // prepend the server address. Prefer explicit SERVER_URL env var when set
  // (useful behind proxies or in deployments), otherwise construct from
  // request protocol and host.
  const filename = req.file.filename;
  const relativePath = `/uploads/${filename}`;
  const serverUrl = (process.env.SERVER_URL && process.env.SERVER_URL.replace(/\/$/, '')) || `${req.protocol}://${req.get('host')}`;
  const url = `${serverUrl}${relativePath}`;

  // Return the absolute URL for convenience on the client
  res.json({ url });
});

// API routes
app.get('/api/messages', (req, res) => {
  const room = req.query.room;
  if (room) {
    return res.json(messages.filter((m) => m.room === room));
  }
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  // Return known users with online/offline status
  res.json(Object.values(knownUsers));
});

app.get('/api/rooms', (req, res) => {
  res.json(Object.values(rooms));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 