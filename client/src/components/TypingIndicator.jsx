import React from "react";

export default function TypingIndicator({ typingUsers, currentUsername }) {
  if (
    !typingUsers ||
    typingUsers.filter((u) => u !== currentUsername).length === 0
  )
    return null;
  return (
    <div
      style={{
        color: "#555",
        fontStyle: "italic",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {typingUsers.filter((u) => u !== currentUsername).join(", ")}{" "}
      {typingUsers.length === 1 ? "is" : "are"} typing
      <span>{"..."}</span>
    </div>
  );
}
