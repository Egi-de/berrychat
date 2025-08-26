import React, { useState } from "react";
import { Settings, Search, Plus, Archive, Users } from "lucide-react";
import Avatar from "./Avatar";

const ChatList = ({
  chats,
  selectedChat,
  onSelectChat,
  currentUser,
  messages = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);

  // Filter chats based on search
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessage = (chatId) => {
    return messages
      .filter(
        (m) =>
          m.senderId === chatId ||
          (m.senderId === currentUser?.uid && chatId === "user2")
      )
      .slice(-1)[0];
  };

  const formatMessagePreview = (message) => {
    if (!message) return "No messages yet";

    switch (message.type) {
      case "image":
        return "📷 Photo";
      case "video":
        return "🎥 Video";
      case "voice":
        return "🎵 Voice message";
      case "document":
        return "📄 Document";
      default:
        return message.text || "Message";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="h-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-white/90">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            BerryChat
          </h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowNewChatOptions(!showNewChatOptions)}
                className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Plus size={20} />
              </button>

              {/* New chat options */}
              {showNewChatOptions && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                    New chat
                  </button>
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-200">
                    <Users size={16} />
                    <span>New group</span>
                  </button>
                </div>
              )}
            </div>

            <button className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 hover:bg-gray-50 focus:bg-white rounded-2xl border-2 border-transparent focus:border-purple-300 outline-none transition-all duration-200 text-sm"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center space-x-2 mt-3">
          <button className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors duration-200">
            All
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors duration-200">
            Unread
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-1">
            <Archive size={12} />
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No chats found</p>
            <p className="text-sm text-center">Start a new conversation</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const lastMessage = getLastMessage(chat.id);
            const isSelected = selectedChat?.id === chat.id;
            const hasUnread =
              lastMessage?.senderId !== currentUser?.uid &&
              lastMessage?.status !== "read";

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center space-x-3 p-4 hover:bg-white/80 cursor-pointer transition-all duration-200 border-b border-gray-100/50 group ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400"
                    : "hover:shadow-sm"
                }`}
              >
                <div className="relative">
                  <Avatar
                    src={chat.avatar}
                    alt={chat.name}
                    size="lg"
                    status={chat.status}
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                      1
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-semibold truncate transition-colors duration-200 ${
                        isSelected ? "text-purple-700" : "text-gray-800"
                      } ${hasUnread ? "font-bold" : ""}`}
                    >
                      {chat.name}
                    </h3>
                    <span
                      className={`text-xs flex-shrink-0 ml-2 ${
                        isSelected ? "text-purple-500" : "text-gray-500"
                      }`}
                    >
                      {formatTime(lastMessage?.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        hasUnread
                          ? "text-gray-800 font-medium"
                          : isSelected
                          ? "text-purple-600"
                          : "text-gray-500"
                      }`}
                    >
                      {lastMessage?.senderId === currentUser?.uid && "✓ "}
                      {formatMessagePreview(lastMessage)}
                    </p>

                    {hasUnread && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full ml-2 flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Click outside to close new chat options */}
      {showNewChatOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNewChatOptions(false)}
        />
      )}
    </div>
  );
};

export default ChatList;
