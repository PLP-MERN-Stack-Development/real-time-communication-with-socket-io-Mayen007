import React from "react";

export default function UserList({ users, currentUsername, onPm }) {
  return (
    <>
      <ul className="list-none p-0 m-0">
        {users.map((u) => (
          <li
            key={u.username || u.id}
            className="py-2 px-1 flex items-center gap-2"
          >
            <span
              className={
                "inline-block w-2.5 h-2.5 rounded-full " +
                (u.online ? "bg-green-500" : "bg-gray-300")
              }
              title={u.online ? "Online" : "Offline"}
            />
            <div className="flex-1">
              <div className="font-semibold">{u.username}</div>
              {!u.online && (
                <div className="text-xs text-gray-500">
                  {u.lastSeen
                    ? `last seen ${new Date(u.lastSeen).toLocaleString()}`
                    : "offline"}
                </div>
              )}
            </div>
            {u.id && u.username !== currentUsername && (
              <button
                onClick={() => onPm(u)}
                className="text-sm px-2 py-1 rounded bg-blue-500 text-white"
              >
                PM
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
