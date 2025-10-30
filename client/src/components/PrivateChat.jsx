import React, { useRef } from "react";
import MessageItem from "./MessageItem";

export default function PrivateChat({
  pmTarget,
  privateMessages,
  currentUserId,
  currentUsername,
  markAsRead,
  addReaction,
}) {
  const pmRef = useRef(null);
  if (!pmTarget) return null;
  return (
    <>
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
                addReaction(pmTarget.id, e.target.value);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
