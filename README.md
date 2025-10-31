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

````bash
# Install dependencies
cd server && npm install
# 🔄 Realtime Chat

Compact realtime chat app built with Socket.io, React (Vite), and Express.

## 🌐 Live demo

[Open the app → https://realtime-me02.onrender.com]

**Backend API:** https://realtime-server-s93o.onrender.com

## Key features

- Realtime messaging (Socket.io)
- Multiple chat rooms and private messages
- File/image uploads
- Message reactions, read receipts, search, and pagination
- Desktop/browser notifications and responsive UI

## Quick start (development)

1. Install dependencies

```powershell
cd server; npm install
cd ../client; npm install
````

2. Run servers (two terminals)

```powershell
cd server; npm run dev
cd client; npm run dev
```

Open http://localhost:5173

## Environment variables

Server (`server/.env` or Render env):

- CLIENT_URL=http://localhost:5173 (frontend origin)
- PORT=5000 (Render provides its own PORT in production)
- SERVER_URL=https://your-backend.example.com (optional; used for absolute file URLs)
- MAX_UPLOAD_BYTES=5242880

Client (`client/.env` or Render env):

- VITE_SOCKET_URL=http://localhost:5000 (or the production backend URL)

> After deploying, set `CLIENT_URL` and `VITE_SOCKET_URL` to the deployed frontend/backend URLs to avoid CORS/socket errors.

## Project layout

```
client/   # React + Vite frontend
server/   # Express + Socket.io backend
```

## Deployment notes

- Deploy the backend as a Node web service and set `CLIENT_URL` to the frontend origin.
- Deploy the frontend as a static site (build with `cd client && npm run build`, publish `client/dist`).
- Ensure production `VITE_SOCKET_URL` and `SERVER_URL` are set so Socket.io and uploads work without CORS issues.

---

MIT — see repository for details.
