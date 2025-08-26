import React from "react";
import { User } from "lucide-react";

const Avatar = ({ src, alt, size = "md", status, className = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div
        className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <User className="w-1/2 h-1/2 text-white drop-shadow-sm" />
        )}
      </div>
      {status === "online" && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
      )}
    </div>
  );
};

export default Avatar;
