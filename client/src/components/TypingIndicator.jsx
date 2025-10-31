import React from "react";

export default function TypingIndicator({ typingUsers = [], currentUsername }) {
  // Normalize typingUsers into an array of display names.
  let names = [];

  if (!typingUsers) typingUsers = [];

  if (typeof typingUsers === "string") {
    names = [typingUsers];
  } else if (Array.isArray(typingUsers)) {
    names = typingUsers
      .map((u) => {
        if (!u) return null;
        if (typeof u === "string") return u;
        if (typeof u === "object")
          return u.username || u.name || u.displayName || null;
        return String(u);
      })
      .filter(Boolean);
  } else if (typingUsers instanceof Set) {
    names = Array.from(typingUsers).map(String);
  } else if (typeof typingUsers === "object") {
    // maybe an object keyed by username
    names = Object.keys(typingUsers).filter((k) => Boolean(typingUsers[k]));
  }

  // Exclude the current user from the shown list
  const others = names.filter((n) => n !== currentUsername);

  if (!others || others.length === 0) {
    // If there are no other users typing, don't show indicator.
    return null;
  }

  const label = others.length === 1 ? "is" : "are";
  const text = others.join(", ");

  return (
    <div className="text-gray-600 italic flex items-center gap-2">
      {text} {label} typing<span className="ml-1">...</span>
    </div>
  );
}
