import React, { useState } from "react";
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
    usernameError,
  } = useSocket();
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Realtime Chat</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {usernameError && (
          <div style={{ color: "red", marginTop: 6 }}>{usernameError}</div>
        )}
        <button
          onClick={() => connect(name)}
          disabled={isConnected || !name}
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
                setText(e.target.value);
                setTyping(true);
              }}
              placeholder="Type a message"
              style={{ width: "70%" }}
            />
            <button
              onClick={() => {
                sendMessage(text);
                setText("");
                setTyping(false);
              }}
              disabled={!isConnected || !text}
              style={{ marginLeft: 8 }}
            >
              Send
            </button>
          </div>
        </div>

        <div style={{ width: 200 }}>
          <h3>Users</h3>
          <ul>
            {users.map((u) => (
              <li key={u.id}>{u.username}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
