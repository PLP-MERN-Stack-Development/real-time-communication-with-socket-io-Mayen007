import React from "react";
const MessageList = React.forwardRef(function MessageList(
  { messages, renderItem, className = "", style = {}, ...rest },
  ref
) {
  // default to a vertical stack with gaps; allow container to override via className
  const classes = `w-full flex flex-col gap-3 ${className}`.trim();

  return (
    <div ref={ref} className={classes} style={style} {...rest}>
      {messages.map((m) => (
        <div key={m.id} className="w-full">
          {renderItem(m)}
        </div>
      ))}
    </div>
  );
});

export default MessageList;
