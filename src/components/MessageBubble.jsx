import React, { useState } from "react";
import { Play, Reply, Download, Pause } from "lucide-react";
import Avatar from "./Avatar";
import MessageStatus from "./MessageStatus";

const MessageBubble = ({ message, isOwn, user, onReply, replyToMessage }) => {
  const [showReplyButton, setShowReplyButton] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  return (
    <div
      className={`flex mb-4 group ${
        isOwn ? "justify-end" : "justify-start"
      } animate-in slide-in-from-bottom-2 duration-300`}
      onMouseEnter={() => setShowReplyButton(true)}
      onMouseLeave={() => setShowReplyButton(false)}
    >
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg relative ${
          isOwn ? "order-2" : "order-1"
        }`}
      >
        {!isOwn && (
          <Avatar
            src={user?.avatar}
            alt={user?.name}
            size="sm"
            className="mb-2"
          />
        )}

        <div
          className={`px-4 py-3 rounded-2xl backdrop-blur-md border shadow-lg relative transition-all duration-300 hover:shadow-xl ${
            isOwn
              ? "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white ml-2 rounded-br-md"
              : "bg-white/90 text-gray-800 mr-2 rounded-bl-md border-gray-200"
          }`}
        >
          {/* Reply context */}
          {replyToMessage && (
            <div
              className={`mb-3 p-3 rounded-lg border-l-4 text-sm transition-all duration-200 hover:bg-opacity-80 ${
                isOwn
                  ? "bg-white/20 border-white/50"
                  : "bg-gray-100 border-purple-400"
              }`}
            >
              <div
                className={`font-medium text-xs mb-1 ${
                  isOwn ? "text-white/80" : "text-purple-600"
                }`}
              >
                Replying to{" "}
                {replyToMessage.senderId === user?.id ? user?.name : "You"}
              </div>
              <div
                className={`${
                  isOwn ? "text-white/90" : "text-gray-700"
                } line-clamp-2`}
              >
                {replyToMessage.text || "📎 Media message"}
              </div>
            </div>
          )}

          {/* Image message */}
          {message.type === "image" && (
            <div className="mb-2 group">
              <div className="relative rounded-lg overflow-hidden shadow-md">
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
                <button className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Download size={16} />
                </button>
              </div>
              {message.caption && (
                <div
                  className={`mt-2 text-sm ${
                    isOwn ? "text-white/90" : "text-gray-700"
                  }`}
                >
                  {message.caption}
                </div>
              )}
            </div>
          )}

          {/* Voice message */}
          {message.type === "voice" && (
            <div className="flex items-center space-x-3 min-w-48 py-1">
              <button
                onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md ${
                  isOwn
                    ? "bg-white/20 hover:bg-white/30"
                    : "bg-purple-100 hover:bg-purple-200"
                }`}
              >
                {isPlayingVoice ? <Pause size={16} /> : <Play size={16} />}
              </button>

              {/* Waveform visualization */}
              <div className="flex-1 h-8 flex items-center">
                <div
                  className={`w-full h-2 rounded-full ${
                    isOwn ? "bg-white/30" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isOwn ? "bg-white" : "bg-purple-500"
                    }`}
                    style={{ width: "35%" }}
                  ></div>
                </div>
              </div>

              <span
                className={`text-xs font-mono ${
                  isOwn ? "text-white/80" : "text-gray-500"
                }`}
              >
                0:{message.duration || "15"}
              </span>
            </div>
          )}

          {/* Text message */}
          {message.type === "text" && (
            <div className="break-words leading-relaxed">{message.text}</div>
          )}

          {/* Document message */}
          {message.type === "document" && (
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                isOwn ? "bg-white/20" : "bg-gray-100"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  isOwn ? "bg-white/30" : "bg-purple-100"
                }`}
              >
                <Download size={20} />
              </div>
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    isOwn ? "text-white" : "text-gray-800"
                  }`}
                >
                  {message.fileName || "Document"}
                </div>
                <div
                  className={`text-xs ${
                    isOwn ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {message.fileSize
                    ? `${(message.fileSize / 1024 / 1024).toFixed(1)} MB`
                    : "Unknown size"}
                </div>
              </div>
            </div>
          )}

          {/* Message timestamp and status */}
          <div
            className={`flex items-center justify-end mt-2 text-xs space-x-1 ${
              isOwn ? "text-white/70" : "text-gray-500"
            }`}
          >
            <span className="font-medium">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <MessageStatus status={message.status} isOwn={isOwn} />
          </div>
        </div>

        {/* Reply button */}
        {showReplyButton && onReply && (
          <button
            onClick={() => onReply(message)}
            className={`absolute top-2 p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 z-10 ${
              isOwn ? "-left-12" : "-right-12"
            }`}
            title="Reply to message"
          >
            <Reply size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
