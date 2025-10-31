# 🔄 Real-Time Chat Application

A Socket.io-powered chat app with rooms, private messaging, file sharing, and real-time features.

## 🌐 Live Demo

[View Live Application](https://realtime-me02.onrender.com)

**Backend API:** https://realtime-server-s93o.onrender.com

## Features

- **Real-time messaging** with Socket.io
- **Multiple chat rooms** with dynamic creation
- **Private messaging** between users
- **File & image sharing**
- **Message reactions** and read receipts
- **Message search** and pagination
- **Sound & browser notifications**
- **Responsive design**

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Socket.io Client  
**Backend:** Node.js, Express.js, Socket.io, Multer

## Quick Start

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Run development servers
cd server && npm run dev    # Terminal 1
cd client && npm run dev    # Terminal 2
```

Open `http://localhost:5173`

## Usage

1. Enter a unique username to join
2. Chat in rooms or send private messages
3. Upload files and images
4. React to messages with emojis
5. Search messages and load older ones

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
└── README.md
```

## Configuration

**Server (.env):**

```
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Client (.env):**

```
VITE_SOCKET_URL=http://localhost:5000
```

---

Built for PLP MERN Stack Development course.
