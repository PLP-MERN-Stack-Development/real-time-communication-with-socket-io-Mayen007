import React from "react";
const MessageList = React.forwardRef(function MessageList(
  { messages, renderItem, ...props },
  ref
) {
  return (
    <div ref={ref} {...props}>
      {messages.map((m) => renderItem(m))}
    </div>
  );
});

export default MessageList;
