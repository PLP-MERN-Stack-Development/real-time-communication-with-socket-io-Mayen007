import React, { useState, useRef } from "react";
import { useSocket } from "./socket/socket";

export default function App() {
  const {
    connect,
    disconnect,
    isConnected,
    messages,
    users,
    sendMessage,
    setTyping,
    typingUsers,
    usernameError,
    currentUsername,
  } = useSocket();
  const typingTimeoutRef = useRef(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [nameError, setNameError] = useState(null);

  const handleJoin = () => {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      setNameError("Please enter a username");
      return;
    }
    setNameError(null);
    connect(trimmed);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Realtime Chat</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {nameError && (
          <div style={{ color: "red", marginTop: 6 }}>{nameError}</div>
        )}
        {usernameError && (
          <div style={{ color: "red", marginTop: 6 }}>{usernameError}</div>
        )}
        <button
          onClick={handleJoin}
          disabled={isConnected || !name.trim()}
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
            Connected as {currentUsername}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h3>Messages</h3>
          <div
            style={{
              border: "1px solid #ddd",
              padding: 8,
              height: 300,
              overflow: "auto",
            }}
          >
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 8 }}>
                <strong>{m.sender || "system"}</strong>: {m.message}{" "}
                <span style={{ color: "#888", fontSize: 12 }}>
                  (
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString()
                    : ""}
                  )
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <input
              value={text}
              onChange={(e) => {
                const v = e.target.value;
                setText(v);
                // Signal typing with debounce: send 'typing' true immediately,
                // then schedule a 'typing' false after 1s of inactivity.
                setTyping(true);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  setTyping(false);
                  typingTimeoutRef.current = null;
                }, 1000);
              }}
              placeholder="Type a message"
              style={{ width: "70%" }}
            />
            <button
              onClick={() => {
                sendMessage(text);
                setText("");
                // clear any pending timeout and notify server we've stopped typing
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
                setTyping(false);
              }}
              disabled={!isConnected || !text}
              style={{ marginLeft: 8 }}
            >
              Send
            </button>
          </div>
          {/* Typing indicator UI */}
          <div style={{ marginTop: 6, minHeight: 18 }}>
            {typingUsers &&
              typingUsers.length > 0 &&
              (() => {
                // Don't show the local user's typing status to themselves
                const visible = typingUsers.filter(
                  (u) => u !== currentUsername
                );
                if (visible.length === 0) return null;
                if (visible.length === 1) {
                  return (
                    <div
                      style={{
                        color: "#555",
                        fontStyle: "italic",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>{visible[0]} is typing</span>
                      <span className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    style={{
                      color: "#555",
                      fontStyle: "italic",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{visible.join(", ")} are typing</span>
                    <span className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                );
              })()}
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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
