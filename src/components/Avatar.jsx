import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

/**
 * Validate that a URL is safe to use
 */
const isValidImageUrl = (url) => {
  if (!url) return false;
  if (url.startsWith("data:")) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

const Avatar = ({
  src,
  alt,
  size = "md",
  status,
  loading = false,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-20 h-20",
    "3xl": "w-24 h-24",
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 40,
    "3xl": 48,
  };

  const statusSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5",
    "3xl": "w-6 h-6",
  };

  const validImageUrl = isValidImageUrl(src) ? src : null;

  // Reset loading/error when src changes
  useEffect(() => {
    if (validImageUrl) setImageLoading(true);
    else setImageLoading(false);
    setImageError(false);
  }, [src, validImageUrl]);

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg ring-2 ring-white/20`}
        role="img"
        aria-label={alt || "User avatar"}
      >
        {/* Image */}
        {validImageUrl && !imageError && (
          <img
            src={validImageUrl}
            alt={alt || "User avatar"}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              console.warn("Avatar image failed to load:", validImageUrl);
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        )}

        {/* Fallback */}
        {(!validImageUrl || imageError) && (
          <User className="text-white drop-shadow-sm" size={iconSizes[size]} />
        )}

        {/* Loading overlay */}
        {imageLoading && loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full backdrop-blur-sm">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Status indicators */}
      {status === "online" && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} bg-green-500 border-2 border-white rounded-full shadow-sm`}
          aria-label="Online status"
        >
          <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}
      {status === "offline" && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} bg-gray-400 border-2 border-white rounded-full shadow-sm`}
          aria-label="Offline status"
        />
      )}
      {status === "away" && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} bg-yellow-400 border-2 border-white rounded-full shadow-sm`}
          aria-label="Away status"
        />
      )}
    </div>
  );
};

export default Avatar;
