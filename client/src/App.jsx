import React, { useState, useRef, useEffect } from "react";
import useVisibility from "./hooks/useVisibility";
import { useSocket } from "./socket/socket";

function MessageItem({
  m,
  currentUsername,
  currentUserId,
  markAsRead,
  addReaction,
  containerRef,
}) {
  const onVisible = () => {
    if (m && m.senderId && m.senderId !== currentUserId) {
      markAsRead && markAsRead(m.id);
    }
  };

  const ref = useVisibility(onVisible, {
    rootRef: containerRef,
    threshold: 0.6,
    debounceMs: 200,
  });

  return (
    <div ref={ref} style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 600 }}>{m.sender || "system"}</div>
      <div>{m.message}</div>
      <div style={{ color: "#888", fontSize: 12 }}>
        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}
      </div>
      {m.readBy && m.readBy.length > 0 && (
        <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
          Read by: {m.readBy.join(", ")}
        </div>
      )}
      <div style={{ marginTop: 6 }}>
        {["👍", "❤️", "😂"].map((e) => (
          <button
            key={e}
            onClick={() => addReaction(m.id, e)}
            style={{ marginRight: 6 }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

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

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [pmTarget, setPmTarget] = useState(null);
  const [roomSelection, setRoomSelection] = useState("");
  const [newRoomName, setNewRoomName] = useState("");

  const messagesRef = useRef(null);
  const pmRef = useRef(null);

  // Ask the server for the current room list when the component mounts
  useEffect(() => {
    if (typeof requestRooms === "function") requestRooms();
  }, []);

  useEffect(() => {
    // quick read-mark for existing messages (best-effort)
    if (!currentUsername || !currentUserId) return;
    messages.forEach((m) => {
      if (!m) return;
      if (m.senderId && m.senderId !== currentUserId) {
        const readers = Array.isArray(m.readBy) ? m.readBy : [];
        if (!readers.includes(currentUsername)) markAsRead(m.id);
      }
    });
  }, [messages, currentUserId, currentUsername, markAsRead]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Realtime Chat</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={() => connect(name)}
          disabled={!name || isConnected}
          style={{ marginLeft: 8 }}
        >
          Join
        </button>
        <button
          onClick={() => disconnect()}
          disabled={!isConnected}
          style={{ marginLeft: 8 }}
        >
          Leave
        </button>
        {currentUsername && (
          <div style={{ marginTop: 6, color: "green" }}>
            Connected as {currentUsername} • Room: {currentRoom || "none"}
          </div>
        )}
        {/* Rooms selector */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <select
            value={roomSelection}
            onChange={(e) => setRoomSelection(e.target.value)}
          >
            <option value="">Select room...</option>
            {roomsList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (roomSelection) joinRoom(roomSelection);
            }}
            disabled={!roomSelection}
          >
            Join
          </button>
          <input
            placeholder="New room"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <button
            onClick={() => {
              if (newRoomName.trim()) {
                createRoom(newRoomName.trim());
                setNewRoomName("");
              }
            }}
          >
            Create & Join
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            ref={messagesRef}
            style={{
              border: "1px solid #ddd",
              padding: 8,
              height: 300,
              overflow: "auto",
            }}
          >
            {messages.map((m) => (
              <MessageItem
                key={m.id}
                m={m}
                currentUsername={currentUsername}
                currentUserId={currentUserId}
                markAsRead={markAsRead}
                addReaction={addReaction}
                containerRef={messagesRef}
              />
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              style={{ width: "70%" }}
            />
            <button
              onClick={() => {
                sendMessage(text);
                setText("");
              }}
              disabled={!isConnected || !text}
              style={{ marginLeft: 8 }}
            >
              Send
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            {typingUsers &&
              typingUsers.filter((u) => u !== currentUsername).length > 0 && (
                <div style={{ color: "#555", fontStyle: "italic" }}>
                  {typingUsers.filter((u) => u !== currentUsername).join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing
                </div>
              )}
          </div>
        </div>

        <div style={{ width: 220 }}>
          <h3>Users</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {users.map((u) => (
              <li
                key={u.username || u.id}
                style={{
                  padding: "6px 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: 6,
                    background: u.online ? "#32a852" : "#bbb",
                  }}
                  title={u.online ? "Online" : "Offline"}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.username}</div>
                  {!u.online && (
                    <div style={{ fontSize: 11, color: "#777" }}>
                      {u.lastSeen
                        ? `last seen ${new Date(u.lastSeen).toLocaleString()}`
                        : "offline"}
                    </div>
                  )}
                </div>
                {u.id && u.username !== currentUsername && (
                  <button
                    onClick={() =>
                      setPmTarget({ id: u.id, username: u.username })
                    }
                  >
                    PM
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {pmTarget && (
        <div
          style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 8 }}
        >
          <h4>Private chat with {pmTarget.username}</h4>
          <div
            ref={pmRef}
            style={{
              border: "1px solid #ddd",
              padding: 8,
              height: 200,
              overflow: "auto",
            }}
          >
            {privateMessages
              .filter(
                (m) =>
                  (m.senderId === currentUserId && m.to === pmTarget.id) ||
                  (m.senderId === pmTarget.id && m.to === currentUserId)
              )
              .map((m) => (
                <MessageItem
                  key={m.id}
                  m={m}
                  currentUsername={currentUsername}
                  currentUserId={currentUserId}
                  markAsRead={markAsRead}
                  addReaction={addReaction}
                  containerRef={pmRef}
                />
              ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              placeholder={`Message ${pmTarget.username}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendPrivateMessage(pmTarget.id, e.target.value);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
