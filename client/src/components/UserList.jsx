import React from "react";

export default function UserList({ users, currentUsername, onPm }) {
  return (
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
            <button onClick={() => onPm(u)}>PM</button>
          )}
        </li>
      ))}
    </ul>
  );
}
