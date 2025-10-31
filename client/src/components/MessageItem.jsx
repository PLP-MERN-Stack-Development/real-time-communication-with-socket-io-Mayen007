import React from "react";
import useVisibility from "../hooks/useVisibility";
import { SOCKET_URL } from "../socket/socket";

export default function MessageItem({
  m = {},
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

  const reactionEmojis = ["👍", "❤️", "😂"];
  const reactions = Array.isArray(m.reactions) ? m.reactions : [];
  const userReaction = reactions.find((r) => r.by === currentUsername);

  const makeUrl = (u) => {
    if (!u) return u;
    if (/^https?:\/\//i.test(u) || /^\/\//.test(u)) return u;
    if (SOCKET_URL) return `${SOCKET_URL.replace(/\/$/, "")}${u}`;
    return u;
  };

  const isMe =
    m.senderId && currentUserId && String(m.senderId) === String(currentUserId);
  const initials = (m.sender || "?")
    .split(" ")
    .map((p) => (p ? p[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // prepare the content to render (file, markdown image, plain text, or JSON)
  let content = null;

  if (m && m.fileUrl) {
    if (m.fileType && m.fileType.startsWith("image/")) {
      content = (
        <img
          src={makeUrl(m.fileUrl)}
          alt={m.fileName || "uploaded image"}
          className="w-full max-w-full md:max-w-[220px] max-h-64 object-contain rounded"
        />
      );
    } else {
      content = (
        <a
          href={makeUrl(m.fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${
            isMe ? "text-white underline" : "text-blue-600 underline"
          } wrap-break-word`}
        >
          {m.fileName || "Download file"}
        </a>
      );
    }
  } else if (m && typeof m.message === "string") {
    const imageMatch = m.message.match(/!\[.*?]\((.*?)\)/);
    if (imageMatch) {
      const imageUrl = imageMatch[1];
      content = (
        <img
          src={makeUrl(imageUrl)}
          alt="uploaded image"
          className="w-full max-w-full md:max-w-[220px] max-h-64 object-contain rounded"
        />
      );
    } else {
      content = <span className="whitespace-pre-wrap">{m.message}</span>;
    }
  } else {
    content = (
      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
        {JSON.stringify(m.message)}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className={`mb-3 flex items-start ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {!isMe && (
        <div className="shrink-0 mr-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-sm md:text-base">
            {initials}
          </div>
        </div>
      )}

      <div
        className={`max-w-[85%] md:max-w-[72%] ${
          isMe ? "text-right" : "text-left"
        }`}
      >
        <div className="text-xs text-gray-500 mb-1 truncate">
          {m.sender || "system"}
        </div>

        <div
          className={`${
            isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
          } px-3 py-2 rounded-lg wrap-break-word max-w-full`}
        >
          {content}
        </div>

        <div className="text-gray-400 text-[11px] mt-1">
          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}
        </div>

        {m.readBy && m.readBy.length > 0 && (
          <div className="text-xs text-gray-600 mt-1 truncate">
            Read by: {m.readBy.join(", ")}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 justify-end flex-wrap">
          {reactionEmojis.map((e) => {
            const usersForEmoji = reactions
              .filter((r) => r.emoji === e)
              .map((r) => r.by);
            const reacted = userReaction && userReaction.emoji === e;
            return (
              <span key={e} className="flex items-center gap-1">
                <button
                  onClick={() => addReaction && addReaction(m.id, e)}
                  className={`px-2 py-1 rounded border text-sm ${
                    reacted
                      ? "bg-gray-200 border-gray-500 font-bold"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
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
                  <span className="text-xs text-gray-600">
                    ({usersForEmoji.length})
                  </span>
                )}
              </span>
            );
          })}

          {reactions.length > 0 && (
            <span className="text-xs text-gray-500 ml-2 truncate">
              {reactions.map((r) => `${r.by} ${r.emoji}`).join(", ")}
            </span>
          )}
        </div>
      </div>

      {isMe && (
        <div className="shrink-0 ml-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center font-medium text-sm md:text-base">
            {initials}
          </div>
        </div>
      )}
    </div>
  );
}
