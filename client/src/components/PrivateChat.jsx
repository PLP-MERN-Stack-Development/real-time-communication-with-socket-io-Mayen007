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
      <div className="mt-3 border-t pt-2">
        <h4 className="font-semibold">Private chat with {pmTarget.username}</h4>
        <div
          ref={pmRef}
          className="border border-gray-200 p-2 h-48 overflow-auto"
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
        <div className="mt-2">
          <input
            placeholder={`Message ${pmTarget.username}`}
            className="border rounded px-2 py-1 w-full"
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
