import React from "react";
import { Check, CheckCheck } from "lucide-react";

const MessageStatus = ({ status, isOwn }) => {
  if (!isOwn) return null;

  const getStatusStyle = () => {
    switch (status) {
      case "sent":
        return "text-gray-400";
      case "delivered":
        return "text-gray-400";
      case "read":
        return "text-blue-400 animate-pulse";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div
      className={`flex items-center ml-1 transition-colors duration-200 ${getStatusStyle()}`}
    >
      {status === "sent" && <Check size={14} className="drop-shadow-sm" />}
      {(status === "delivered" || status === "read") && (
        <CheckCheck size={14} className="drop-shadow-sm" />
      )}
    </div>
  );
};

export default MessageStatus;
