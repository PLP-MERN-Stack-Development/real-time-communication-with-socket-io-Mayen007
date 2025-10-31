import React, { useState, useEffect } from "react";
import FileUpload from "./FileUpload";
import MessageList from "./MessageList";
import MessageItem from "./MessageItem";
import UserList from "./UserList";
import TypingIndicator from "./TypingIndicator";
import PrivateChat from "./PrivateChat";
import PMPanel from "./PMPanel";
import { requestPermission } from "../utils/notifications";

export default function ChatLayout(props) {
  // Local state for join form and message input
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [roomSelection, setRoomSelection] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUsersMobile, setShowUsersMobile] = useState(false);

  // message search
  const [searchTerm, setSearchTerm] = useState("");

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  useEffect(() => {
    try {
      const n = localStorage.getItem("notifications_enabled");
      const s = localStorage.getItem("sound_enabled");
      setNotificationsEnabled(n === null ? true : n === "true");
      setSoundEnabled(s === null ? true : s === "true");
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "notifications_enabled",
        notificationsEnabled ? "true" : "false"
      );
      if (notificationsEnabled) requestPermission();
    } catch (e) {}
  }, [notificationsEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("sound_enabled", soundEnabled ? "true" : "false");
    } catch (e) {}
  }, [soundEnabled]);

  const handleFileUpload = async (fileInfo) => {
    if (props.sendMessage) {
      props.sendMessage({
        message:
          fileInfo.fileType && fileInfo.fileType.startsWith("image/")
            ? `![image](${fileInfo.fileUrl})`
            : `[file](${fileInfo.fileUrl})`,
        ...fileInfo,
      });
    }
  };

  return (
    <div className="px-4 py-6 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h1 className="flex items-center gap-2 text-2xl wrap-break-word">
            Realtime Chat
            {props.unreadCount > 0 && (
              <span className="bg-red-600 text-white rounded-full px-2 text-xs ml-1 sm:ml-2">
                {props.unreadCount}
              </span>
            )}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setShowUsersMobile(true)}
              className="md:hidden bg-gray-100 px-2 py-1 rounded"
            >
              Users
            </button>

            <div className="text-sm flex items-center gap-2">
              <input
                id="notifications-checkbox"
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="mr-1"
              />
              <label htmlFor="notifications-checkbox" className="truncate">
                Notifications
              </label>
            </div>

            <div className="text-sm flex items-center gap-2">
              <input
                id="sound-checkbox"
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="mr-1"
              />
              <label htmlFor="sound-checkbox" className="truncate">
                Sound
              </label>
            </div>
          </div>
        </div>

        <div className="mb-4 mt-3">
          <div className="mt-2 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                props.clearUsernameError && props.clearUsernameError();
              }}
              className={`border rounded px-2 py-1 w-full md:w-auto ${
                props.usernameError ? "border-red-500 ring-1 ring-red-200" : ""
              }`}
            />
            <button
              onClick={() => props.connect(name)}
              disabled={!name || props.isConnected}
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 w-full md:w-auto"
            >
              Join
            </button>
            <button
              onClick={() => props.disconnect()}
              disabled={!props.isConnected}
              className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50 w-full md:w-auto"
            >
              Leave
            </button>
          </div>

          {props.usernameError && (
            <div className="text-sm text-red-600 mt-1">
              {props.usernameError}
            </div>
          )}

          {props.currentUsername && (
            <div className="mt-2 text-green-600">
              Connected as {props.currentUsername} • Room:{" "}
              {props.currentRoom || "none"}
              {props.unreadCount > 0 && (
                <span className="ml-2 text-xs text-red-600">
                  ({props.unreadCount} unread)
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <select
              value={roomSelection}
              onChange={(e) => setRoomSelection(e.target.value)}
              className="border rounded px-2 py-1 w-full sm:w-auto"
            >
              <option value="">Select room...</option>
              {props.roomsList &&
                props.roomsList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                if (roomSelection) props.joinRoom(roomSelection);
              }}
              disabled={!roomSelection}
              className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 w-full sm:w-auto"
            >
              Join
            </button>
            <input
              placeholder="New room"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="border rounded px-2 py-1 w-full sm:w-auto"
            />
            <button
              onClick={() => {
                if (newRoomName.trim()) {
                  props.createRoom(newRoomName.trim());
                  setNewRoomName("");
                }
              }}
              className="bg-green-500 text-white px-2 py-1 rounded w-full sm:w-auto"
            >
              Create & Join
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-4">
          <div className="md:col-start-1">
            <div className="bg-white rounded-lg shadow p-3">
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <input
                  placeholder="Search messages"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-2 py-1 w-full sm:w-1/2"
                />
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>
                    {props.messages
                      ? props.messages.filter((m) => {
                          const q = searchTerm.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (m.message &&
                              m.message.toLowerCase().includes(q)) ||
                            (m.fileName &&
                              m.fileName.toLowerCase().includes(q)) ||
                            (m.sender && m.sender.toLowerCase().includes(q))
                          );
                        }).length
                      : 0}
                    /{props.messages ? props.messages.length : 0}
                  </span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-2 py-1 bg-gray-100 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <MessageList
                messages={
                  props.messages
                    ? props.messages.filter((m) => {
                        const q = searchTerm.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (m.message && m.message.toLowerCase().includes(q)) ||
                          (m.fileName &&
                            m.fileName.toLowerCase().includes(q)) ||
                          (m.sender && m.sender.toLowerCase().includes(q))
                        );
                      })
                    : []
                }
                renderItem={(m) => (
                  <MessageItem
                    key={m.id}
                    m={m}
                    currentUsername={props.currentUsername}
                    currentUserId={props.currentUserId}
                    markAsRead={props.markAsRead}
                    addReaction={props.addReaction}
                    containerRef={props.messagesRef}
                  />
                )}
                ref={props.messagesRef}
                className="h-64 md:h-80 overflow-auto bg-white"
              />
            </div>

            <div className="mt-2 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  props.setTyping && props.setTyping(e.target.value.length > 0);
                }}
                onBlur={() => props.setTyping && props.setTyping(false)}
                placeholder="Type a message"
                className="border rounded px-2 py-1 w-full md:w-3/5"
              />
              <button
                onClick={() => {
                  props.sendMessage && props.sendMessage(text);
                  setText("");
                  props.setTyping && props.setTyping(false);
                }}
                disabled={!props.isConnected || !text}
                className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Send
              </button>
              <FileUpload
                onUpload={handleFileUpload}
                disabled={!props.isConnected}
              />
            </div>

            <TypingIndicator
              typingUsers={props.typingUsers}
              currentUsername={props.currentUsername}
            />
          </div>

          <div className="hidden md:block md:col-start-2 w-64">
            <div className="bg-white rounded-lg shadow p-3">
              <UserList
                users={props.users}
                currentUsername={props.currentUsername}
                onPm={props.onPm}
              />
            </div>
          </div>
        </div>

        <PMPanel
          open={Boolean(props.pmTarget)}
          onClose={() => props.onClosePm && props.onClosePm()}
          pmTarget={props.pmTarget}
          privateMessages={props.privateMessages}
          currentUserId={props.currentUserId}
          currentUsername={props.currentUsername}
          sendPrivateMessage={props.sendPrivateMessage}
          markAsRead={props.markAsRead}
          addReaction={props.addReaction}
        />
        {showUsersMobile && (
          <div className="fixed inset-0 bg-white z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Users</h2>
              <button
                onClick={() => setShowUsersMobile(false)}
                className="px-2 py-1 rounded bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="overflow-auto">
              <UserList
                users={props.users}
                currentUsername={props.currentUsername}
                onPm={(u) => {
                  props.onPm && props.onPm(u);
                  setShowUsersMobile(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
