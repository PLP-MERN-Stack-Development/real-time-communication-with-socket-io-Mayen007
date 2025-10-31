import React from "react";
const MessageList = React.forwardRef(function MessageList(
  { messages, renderItem, className, style, ...rest },
  ref
) {
  return (
    <>
      <div ref={ref} className={className} style={style} {...rest}>
        {messages.map((m) => renderItem(m))}
      </div>
    </>
  );
});

export default MessageList;
