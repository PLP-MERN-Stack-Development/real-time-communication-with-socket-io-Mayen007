import React from "react";

export default function UserList({ users, currentUsername, onPm }) {
  return (
    <>
      <ul className="list-none p-0 m-0 w-full">
        {users.map((u) => (
          <li
            key={u.username || u.id}
            className="py-2 px-1 flex items-center gap-3 justify-between w-full"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={
                  "inline-block w-3.5 h-3.5 rounded-full shrink-0 " +
                  (u.online ? "bg-green-500" : "bg-gray-300")
                }
                title={u.online ? "Online" : "Offline"}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.username}</div>
                {!u.online && (
                  <div className="text-xs text-gray-500 truncate">
                    {u.lastSeen
                      ? `last seen ${new Date(u.lastSeen).toLocaleString()}`
                      : "offline"}
                  </div>
                )}
              </div>
            </div>

            {u.id && u.username !== currentUsername && (
              <button
                onClick={() => onPm(u)}
                className="text-sm px-2 py-1 rounded bg-blue-500 text-white shrink-0 w-16 text-center"
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
