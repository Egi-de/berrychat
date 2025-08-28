import React, { useState, useEffect } from "react";
import { Video, File, Music, Image, X, Download, Eye } from "lucide-react";

const MediaPreview = ({ file, onRemove, type, index = 0 }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Initialize preview URL safely
  useEffect(() => {
    if (!file) return;

    try {
      let url = null;

      // Handle different file input types
      if (file instanceof File || file instanceof Blob) {
        url = URL.createObjectURL(file);
      } else if (typeof file === "string") {
        url = file;
      } else if (file.url) {
        url = file.url;
      }

      if (url) {
        setPreviewUrl(url);

        // Cleanup function
        return () => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        };
      }
    } catch (error) {
      console.error("Error creating preview:", error);
      setLoadError(true);
    }
  }, [file]);

  const getFileIcon = () => {
    switch (type) {
      case "image":
        return <Image size={20} className="text-purple-500" />;
      case "video":
        return <Video size={20} className="text-blue-500" />;
      case "audio":
      case "voice":
        return <Music size={20} className="text-green-500" />;
      default:
        return <File size={20} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const truncateFileName = (name, maxLength = 15) => {
    if (!name || name.length <= maxLength) return name || "Unknown";
    const extension = name.split(".").pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
    const truncatedName =
      nameWithoutExt.substring(0, maxLength - extension.length - 4) + "...";
    return `${truncatedName}.${extension}`;
  };

  const getFileName = () => {
    if (file?.name) return file.name;
    if (typeof file === "string") return file.split("/").pop() || "Unknown";
    return "Unknown";
  };

  const getFileSize = () => {
    if (file?.size) return file.size;
    return 0;
  };

  const renderPreviewContent = () => {
    if (loadError || !previewUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          {getFileIcon()}
          <span className="text-xs mt-1">Preview unavailable</span>
        </div>
      );
    }

    switch (type) {
      case "image":
        return (
          <img
            src={previewUrl}
            alt={getFileName()}
            className="w-full h-full object-cover"
            onError={() => setLoadError(true)}
            loading="lazy"
          />
        );
      case "video":
        return (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              onError={() => setLoadError(true)}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Video size={24} className="text-white drop-shadow-lg" />
            </div>
          </div>
        );
      case "audio":
      case "voice":
        return (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex flex-col items-center justify-center">
            <Music size={24} className="text-green-600 mb-1" />
            <span className="text-xs text-green-700 font-medium">
              {type === "voice" ? "Voice" : "Audio"}
            </span>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
            {getFileIcon()}
            <span className="text-xs text-gray-600 mt-1 font-medium">
              {file?.type?.split("/")[1]?.toUpperCase() || "FILE"}
            </span>
          </div>
        );
    }
  };

  return (
    <>
      <div className="relative inline-block mr-2 mb-2 group animate-fadeIn">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          {renderPreviewContent()}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            {(type === "image" || type === "video") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullPreview(true);
                }}
                className="p-1.5 bg-white/90 hover:bg-white rounded-full mr-1 transition-colors"
                title="View full size"
              >
                <Eye size={12} />
              </button>
            )}
          </div>
        </div>
        {/* Remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transform hover:scale-110 transition-all duration-200 active:scale-95 z-10"
            title="Remove file"
          >
            <X size={12} />
          </button>
        )}
        {/* File info tooltip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="font-medium truncate" title={getFileName()}>
            {truncateFileName(getFileName(), 12)}
          </div>
          <div className="text-gray-300">{formatFileSize(getFileSize())}</div>
        </div>
        {/* Upload progress indicator */}
        {file?.uploading && (
          <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-1"></div>
              <div className="text-xs text-gray-600">Uploading...</div>
            </div>
          </div>
        )}
      </div>
      {/* Full-size preview modal */}
      {showFullPreview && (type === "image" || type === "video") && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullPreview(false)}
        >
          <div className="relative max-w-full max-h-full">
            {type === "image" ? (
              <img
                src={previewUrl}
                alt={getFileName()}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
            <button
              onClick={() => setShowFullPreview(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg">
              <div className="font-medium">{getFileName()}</div>
              <div className="text-sm text-gray-300">
                {formatFileSize(getFileSize())} • {file?.type || "Unknown type"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Add CSS for fadeIn animation if it doesn't exist
if (!document.querySelector("#media-preview-styles")) {
  const style = document.createElement("style");
  style.id = "media-preview-styles";
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
  `;
  document.head.appendChild(style);
}

export default MediaPreview;
