import React, { useState } from "react";
import FileUpload from "./FileUpload";
import MessageList from "./MessageList";
import MessageItem from "./MessageItem";
import UserList from "./UserList";
import TypingIndicator from "./TypingIndicator";
import PrivateChat from "./PrivateChat";

export default function ChatLayout(props) {
  // Local state for join form and message input
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [roomSelection, setRoomSelection] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (fileInfo) => {
    if (props.sendMessage) {
      props.sendMessage({
        message: fileInfo.fileType.startsWith("image/")
          ? `![image](${fileInfo.fileUrl})`
          : `[file](${fileInfo.fileUrl})`,
        ...fileInfo,
      });
    }
  };

  return (
    <>
      <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
        <h1>Realtime Chat</h1>

        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={() => props.connect(name)}
            disabled={!name || props.isConnected}
            style={{ marginLeft: 8 }}
          >
            Join
          </button>
          <button
            onClick={() => props.disconnect()}
            disabled={!props.isConnected}
            style={{ marginLeft: 8 }}
          >
            Leave
          </button>
          {props.currentUsername && (
            <div style={{ marginTop: 6, color: "green" }}>
              Connected as {props.currentUsername} • Room:{" "}
              {props.currentRoom || "none"}
            </div>
          )}
          {/* Rooms selector */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <select
              value={roomSelection}
              onChange={(e) => setRoomSelection(e.target.value)}
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
            >
              Join
            </button>
            <input
              placeholder="New room"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <button
              onClick={() => {
                if (newRoomName.trim()) {
                  props.createRoom(newRoomName.trim());
                  setNewRoomName("");
                }
              }}
            >
              Create & Join
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <MessageList
              messages={props.messages}
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
              style={{
                border: "1px solid #ddd",
                padding: 8,
                height: 300,
                overflow: "auto",
              }}
            />

            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  props.setTyping && props.setTyping(e.target.value.length > 0);
                }}
                onBlur={() => props.setTyping && props.setTyping(false)}
                placeholder="Type a message"
                style={{ width: "60%" }}
              />
              <button
                onClick={() => {
                  props.sendMessage && props.sendMessage(text);
                  setText("");
                  props.setTyping && props.setTyping(false);
                }}
                disabled={!props.isConnected || !text}
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

          <div style={{ width: 220 }}>
            <UserList
              users={props.users}
              currentUsername={props.currentUsername}
              onPm={props.onPm}
            />
          </div>
        </div>

        <PrivateChat
          pmTarget={props.pmTarget}
          privateMessages={props.privateMessages}
          currentUserId={props.currentUserId}
          currentUsername={props.currentUsername}
          markAsRead={props.markAsRead}
          addReaction={props.addReaction}
        />
      </div>
    </>
  );
}
