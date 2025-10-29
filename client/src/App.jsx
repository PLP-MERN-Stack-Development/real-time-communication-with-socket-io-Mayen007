import React, { useState, useRef } from "react";
import { useSocket } from "./socket/socket";

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
  } = useSocket();
  const typingTimeoutRef = useRef(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [nameError, setNameError] = useState(null);
  const [pmTarget, setPmTarget] = useState(null);
  const [pmText, setPmText] = useState("");

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
                {/* Reactions display (group by emoji, show who reacted on hover) */}
                {m.reactions && m.reactions.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {(() => {
                      const groups = m.reactions.reduce((acc, r) => {
                        if (!acc[r.emoji])
                          acc[r.emoji] = { count: 0, users: [] };
                        acc[r.emoji].count += 1;
                        acc[r.emoji].users.push(r.by);
                        return acc;
                      }, {});

                      return Object.entries(groups).map(([emoji, data]) => (
                        <div
                          key={emoji}
                          style={{ fontSize: 14 }}
                          title={data.users.join(", ")}
                        >
                          {emoji} {data.count}
                        </div>
                      ));
                    })()}
                  </div>
                )}
                {/* Reaction buttons (toggle) */}
                <div style={{ marginTop: 6 }}>
                  {(() => {
                    const emojis = ["👍", "❤️", "😂"];
                    return emojis.map((emoji) => {
                      const userReacted =
                        m.reactions &&
                        m.reactions.some(
                          (r) => r.by === currentUsername && r.emoji === emoji
                        );
                      return (
                        <button
                          key={emoji}
                          onClick={() => addReaction(m.id, emoji)}
                          style={{
                            marginRight: 6,
                            background: userReacted ? "#e6f7ff" : undefined,
                          }}
                        >
                          {emoji}
                        </button>
                      );
                    });
                  })()}
                </div>
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
                {/* Private message button (only for other users with an id) */}
                {u.id && u.username !== currentUsername && (
                  <button
                    onClick={() => {
                      // open PM thread with this user
                      setPmTarget({ id: u.id, username: u.username });
                    }}
                    style={{ marginLeft: 6 }}
                  >
                    PM
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Private conversation panel (appears when a PM target is selected) */}
      {pmTarget && (
        <div
          style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 8 }}
        >
          <h4>Private chat with {pmTarget.username}</h4>
          <div
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
                <div key={m.id} style={{ marginBottom: 6 }}>
                  <strong>{m.sender}</strong>: {m.message}{" "}
                  <span style={{ color: "#888", fontSize: 11 }}>
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              value={pmText}
              onChange={(e) => setPmText(e.target.value)}
              placeholder={`Message ${pmTarget.username}`}
              style={{ width: "70%" }}
            />
            <button
              onClick={() => {
                if (!pmText.trim()) return;
                sendPrivateMessage(pmTarget.id, pmText.trim());
                setPmText("");
              }}
              style={{ marginLeft: 8 }}
            >
              Send PM
            </button>
            <button onClick={() => setPmTarget(null)} style={{ marginLeft: 8 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
