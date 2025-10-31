import React, { useRef, useEffect, useState } from "react";
import MessageItem from "./MessageItem";
import FileUpload from "./FileUpload";

export default function PMPanel({
  open,
  onClose,
  pmTarget,
  privateMessages,
  currentUserId,
  currentUsername,
  sendPrivateMessage,
  markAsRead,
  addReaction,
}) {
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (open && listRef.current) {
      // scroll to bottom when opened
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, privateMessages]);

  if (!pmTarget) return null;

  const messagesForPm = (privateMessages || []).filter(
    (m) =>
      (m.senderId === currentUserId && m.to === pmTarget.id) ||
      (m.senderId === pmTarget.id && m.to === currentUserId)
  );

  const handleSend = () => {
    if (!text || !sendPrivateMessage) return;
    sendPrivateMessage(pmTarget.id, text);
    setText("");
  };

  const handleUpload = (fileInfo) => {
    // fileInfo contains fileUrl, fileName, fileType
    if (!sendPrivateMessage || !pmTarget) return;
    sendPrivateMessage(pmTarget.id, {
      message:
        fileInfo.fileType && fileInfo.fileType.startsWith("image/")
          ? `![image](${fileInfo.fileUrl})`
          : `[file](${fileInfo.fileUrl})`,
      ...fileInfo,
    });
  };

  return (
    <div
      ref={panelRef}
      className={
        "fixed right-0 top-0 h-full bg-white shadow-lg z-50 flex flex-col transition-transform duration-200 w-full md:w-[360px] " +
        (open ? "translate-x-0" : "translate-x-full")
      }
    >
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <div className="font-bold">{pmTarget.username}</div>
          <div className="text-sm text-gray-600">
            {pmTarget.online ? "Online" : "Offline"}
          </div>
        </div>
        <div>
          <button
            onClick={onClose}
            aria-label="Close PM"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100 hover:cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      <div ref={listRef} className="p-2 overflow-auto flex-1">
        {messagesForPm.map((m) => (
          <MessageItem
            key={m.id}
            m={m}
            currentUsername={currentUsername}
            currentUserId={currentUserId}
            markAsRead={markAsRead}
            addReaction={addReaction}
            containerRef={listRef}
          />
        ))}
      </div>

      <div className="p-2 border-t">
        <div className="flex gap-2 items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder={`Message ${pmTarget.username}`}
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!text}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 hover:disabled:cursor-not-allowed hover:bg-blue-700 hover:cursor-pointer"
          >
            Send
          </button>
        </div>
        <div className="mt-2">
          <FileUpload onUpload={handleUpload} />
        </div>
      </div>
    </div>
  );
}
