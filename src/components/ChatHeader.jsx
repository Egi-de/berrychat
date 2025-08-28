import React, { useState } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Search,
  Info,
} from "lucide-react";
import Avatar from "./Avatar";

const ChatHeader = ({ user, onBack, isGroup = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getLastSeenText = () => {
    if (!user?.lastSeen) return "Unknown";
    if (user?.status === "online") return "Online";

    const now = Date.now();
    const lastSeen = new Date(user.lastSeen);
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffInMinutes < 1) return "Last seen just now";
    if (diffInMinutes < 60) return `Last seen ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440)
      return `Last seen ${Math.floor(diffInMinutes / 60)}h ago`;
    return `Last seen ${lastSeen.toLocaleDateString()}`;
  };

  return (
    <div className="flex items-center justify-between  bg-[#F7F9FC]/9 backdrop-blur-lg border-b border-[#4CC9F0]/20 shadow-sm">
      {/* Left section */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#4CC9F0]/20 rounded-full md:hidden transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <ArrowLeft size={20} className="text-[#3A0CA3]" />
        </button>

        <Avatar
          src={user?.avatar}
          alt={user?.name}
          size="md"
          status={user?.status}
          className="flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#0F172A] truncate text-lg">
            {user?.name}
            {isGroup && (
              <span className="ml-2 text-xs bg-[#4CC9F0]/20 text-[#3A0CA3] px-2 py-1 rounded-full">
                Group
              </span>
            )}
          </h3>
          <p
            className={`text-sm truncate transition-colors duration-200 ${
              user?.status === "online"
                ? "text-green-600 font-medium"
                : "text-[#0F172A]/50"
            }`}
          >
            {getLastSeenText()}
          </p>
        </div>
      </div>

      {/* Right section - Action buttons */}
      <div className="flex items-center space-x-1 relative">
        <button className="p-2.5 text-[#3A0CA3] hover:text-[#4361EE] hover:bg-[#4CC9F0]/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95">
          <Phone size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 text-[#3A0CA3] hover:text-[#4361EE] hover:bg-[#4CC9F0]/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <MoreVertical size={20} />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#F7F9FC] rounded-xl shadow-xl border border-[#4CC9F0]/20 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
              <button className="w-full px-4 py-2 text-left text-[#0F172A] hover:bg-[#4CC9F0]/10 flex items-center space-x-3 transition-colors duration-200">
                <Info size={16} />
                <span>Contact info</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-[#0F172A] hover:bg-[#4CC9F0]/10 flex items-center space-x-3 transition-colors duration-200">
                <Search size={16} />
                <span>Search messages</span>
              </button>
              <hr className="my-2 border-[#4CC9F0]/20" />
              <button className="w-full px-4 py-2 text-left text-[#4361EE] hover:bg-[#4361EE]/10 flex items-center space-x-3 transition-colors duration-200">
                <span>Block contact</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ChatHeader;
