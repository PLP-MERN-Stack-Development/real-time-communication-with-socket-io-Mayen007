import React, { useRef } from "react";
import useVisibility from "../hooks/useVisibility";

export default function MessageItem({
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

  // Show reactions per user
  const reactionEmojis = ["👍", "❤️", "😂"];
  const reactions = Array.isArray(m.reactions) ? m.reactions : [];
  const userReaction = reactions.find((r) => r.by === currentUsername);

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
      <div
        style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}
      >
        {reactionEmojis.map((e) => {
          const usersForEmoji = reactions
            .filter((r) => r.emoji === e)
            .map((r) => r.by);
          const reacted = userReaction && userReaction.emoji === e;
          return (
            <span
              key={e}
              style={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <button
                onClick={() => addReaction(m.id, e)}
                style={{
                  marginRight: 2,
                  background: reacted ? "#e0e0e0" : undefined,
                  border: reacted ? "2px solid #888" : "1px solid #ccc",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: reacted ? 700 : 400,
                }}
                disabled={reacted}
                title={
                  usersForEmoji.length > 0
                    ? `Reacted: ${usersForEmoji.join(", ")}`
                    : "No reactions"
                }
              >
                {e}
              </button>
              {usersForEmoji.length > 0 && (
                <span style={{ fontSize: 11, color: "#555" }}>
                  ({usersForEmoji.length})
                </span>
              )}
            </span>
          );
        })}
        {/* Show all reactions and users */}
        {reactions.length > 0 && (
          <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>
            {reactions.map((r) => `${r.by} ${r.emoji}`).join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
