// server.js - Main server file for Socket.io chat application

const express = require('express');
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

// Store connected users and messages
const users = {};
// knownUsers keeps a registry of usernames seen by the server and their online status
const knownUsers = {};
const messages = [];
// store private messages separately to avoid leaking into global feed
const privateMessages = [];
const typingUsers = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

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
    // Broadcast updated lists and join event to everyone else
    io.emit('user_list', Object.values(knownUsers));
    io.emit('user_joined', { username: clean, id: socket.id });
    console.log(`${clean} joined the chat`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    // Require that the socket has joined with a username
    if (!users[socket.id]) {
      socket.emit('not_authenticated', { message: 'You must join with a username before sending messages' });
      return;
    }

    const message = {
      ...messageData,
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

    io.emit('receive_message', message);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;

      if (isTyping) {
        typingUsers[socket.id] = username;
      } else {
        delete typingUsers[socket.id];
      }

      io.emit('typing_users', Object.values(typingUsers));
    }
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
      io.emit('message_updated', message);
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

    delete users[socket.id];
    delete typingUsers[socket.id];

    // Emit the full known users list (including offline users)
    io.emit('user_list', Object.values(knownUsers));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// API routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  // Return known users with online/offline status
  res.json(Object.values(knownUsers));
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