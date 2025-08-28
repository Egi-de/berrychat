import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Reply,
  Download,
  Pause,
  Volume2,
  X,
  Image,
  Video,
  File,
  Music,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Trash2,
  ArrowLeft,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";

const MessageBubble = ({
  message,
  isOwn,
  user,
  onReply,
  replyToMessage,
  onMessageSeen,
}) => {
  const [showReplyButton, setShowReplyButton] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [fullPreviewUrl, setFullPreviewUrl] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const messageRef = useRef(null);

  const openFullPreview = (imageUrl) => {
    setFullPreviewUrl(imageUrl);
    setShowFullPreview(true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileType = (file) => {
    if (!file) return "document";
    let mimeType = file.type;
    if (!mimeType && file.name) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
        mimeType = "image";
      } else if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext)) {
        mimeType = "video";
      } else if (["mp3", "wav", "ogg", "aac", "m4a"].includes(ext)) {
        mimeType = "audio";
      }
    }
    if (mimeType) {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType.startsWith("video/")) return "video";
      if (mimeType.startsWith("audio/")) return "audio";
    }
    return "document";
  };

  const getFileUrl = (file) => {
    if (!file) return null;
    if (typeof file === "string") return file;
    if (file.url) return file.url;
    if (file instanceof File || file instanceof Blob) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  useEffect(() => {
    if (!isOwn && onMessageSeen && message.status !== "read") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              onMessageSeen(message.id);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.5 }
      );
      if (messageRef.current) observer.observe(messageRef.current);
      return () => observer.disconnect();
    }
  }, [isOwn, onMessageSeen, message.id, message.status]);

  useEffect(() => {
    if (message.type === "voice" && message.mediaUrl) {
      const audio = new Audio(message.mediaUrl);
      audioRef.current = audio;
      const updateProgress = () => {
        if (audio.duration && audio.currentTime >= 0) {
          setVoiceProgress((audio.currentTime / audio.duration) * 100);
          setCurrentTime(audio.currentTime);
        }
      };
      const handleLoadedMetadata = () => setVoiceDuration(audio.duration || 0);
      const handleEnded = () => {
        setIsPlayingVoice(false);
        setVoiceProgress(0);
        setCurrentTime(0);
      };
      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);
      return () => {
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.pause();
      };
    }
  }, [message.mediaUrl, message.type]);

  const toggleVoicePlayback = () => {
    if (audioRef.current) {
      if (isPlayingVoice) audioRef.current.pause();
      else audioRef.current.play().catch(console.error);
      setIsPlayingVoice(!isPlayingVoice);
    }
  };

  const renderFileAttachments = () => {
    if (!message.files || !message.files.length) return null;
    return (
      <div className="space-y-2 mb-3">
        {message.files.map((file, index) => {
          const fileType = getFileType(file);
          const fileUrl = getFileUrl(file);
          const fileName = file.name || `File ${index + 1}`;
          const fileSize = file.size || 0;
          switch (fileType) {
            case "image":
              return (
                <div key={index} className="group relative">
                  <div className="relative rounded-lg overflow-hidden shadow-md max-w-64 min-w-48">
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="w-full h-auto max-h-80 object-cover rounded-lg transition-transform duration-300 cursor-pointer"
                      onClick={() => openFullPreview(fileUrl)}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-32 bg-gray-200 rounded-lg items-center justify-center flex-col">
                      <Image size={24} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">
                        Image failed to load
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(fileUrl, fileName);
                        }}
                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            case "video":
              return (
                <div key={index} className="group relative">
                  <div className="relative rounded-lg overflow-hidden shadow-md max-w-64 min-w-48">
                    <video
                      src={fileUrl}
                      controls
                      className="w-full h-auto max-h-80 object-cover rounded-lg bg-black"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-32 bg-gray-200 rounded-lg items-center justify-center flex-col">
                      <Video size={24} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">
                        Video failed to load
                      </span>
                    </div>
                  </div>
                </div>
              );
            case "audio":
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    isOwn ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        isOwn ? "bg-white/30" : "bg-green-100"
                      }`}
                    >
                      <Music
                        size={20}
                        className={isOwn ? "text-white" : "text-green-600"}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-medium text-sm ${
                          isOwn ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {fileName}
                      </div>
                      <div
                        className={`text-xs ${
                          isOwn ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {formatFileSize(fileSize)}
                      </div>
                    </div>
                    <audio controls src={fileUrl} className="max-w-32">
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              );
            default:
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isOwn
                      ? "bg-white/20 border-white/30"
                      : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        isOwn ? "bg-white/30" : "bg-blue-100"
                      }`}
                    >
                      <File
                        size={20}
                        className={isOwn ? "text-white" : "text-blue-600"}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-medium text-sm ${
                          isOwn ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {fileName}
                      </div>
                      <div
                        className={`text-xs ${
                          isOwn ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {formatFileSize(fileSize)} • {file.type || "Document"}
                      </div>
                    </div>
                    {fileUrl && (
                      <button
                        onClick={() => handleDownload(fileUrl, fileName)}
                        className={`p-2 rounded-full transition-colors ${
                          isOwn
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-blue-100 text-blue-600"
                        }`}
                        title="Download file"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
          }
        })}
      </div>
    );
  };

  return (
    <div
      ref={messageRef}
      className={`flex mb-4 group ${isOwn ? "justify-end" : "justify-start"}`}
      style={{
        animation: "slideInFromBottom 0.1s ease-out",
      }}
      onMouseEnter={() => setShowReplyButton(true)}
      onMouseLeave={() => setShowReplyButton(false)}
    >
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg relative ${
          isOwn ? "order-2" : "order-1"
        }`}
      >
        {!isOwn && (
          <div className="w-8 h-8 bg-gray-300 rounded-full mb-2 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div
          className={`flex gap-4 px-4 py-3 rounded-2xl backdrop-blur-md border shadow-lg relative transition-all duration-300 hover:shadow-xl ${
            isOwn
              ? "bg-gradient-to-br from-[#3A0CA3] via-[#4361EE] to-[#4CC9F0] text-[#F7F9FC] ml-2 rounded-br-md"
              : "bg-[#F7F9FC]/90 text-[#0F172A] mr-2 rounded-bl-md border-[#4CC9F0]/20"
          }`}
        >
          {replyToMessage && (
            <div
              className={`mb-3 p-3 rounded-lg border-l-4 text-sm transition-all duration-200 hover:bg-opacity-80 ${
                isOwn
                  ? "bg-[#F7F9FC]/20 border-[#F7F9FC]/50"
                  : "bg-[#4CC9F0]/10 border-[#4361EE]"
              }`}
            >
              <div
                className={`font-medium text-xs mb-1 ${
                  isOwn ? "text-[#F7F9FC]/80" : "text-[#3A0CA3]"
                }`}
              >
                Replying to{" "}
                {replyToMessage.senderId === user?.id ? user?.name : "You"}
              </div>
              <div
                className={`${
                  isOwn ? "text-[#F7F9FC]/90" : "text-[#0F172A]/80"
                }`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {replyToMessage.text || "Media message"}
              </div>
            </div>
          )}
          {renderFileAttachments()}
          {!message.files && message.mediaUrl && (
            <>
              {message.type === "image" && (
                <div className="group">
                  <div className="relative rounded-lg overflow-hidden shadow-md max-w-64 min-w-48">
                    <img
                      src={message.mediaUrl}
                      alt="Shared image"
                      className="w-full h-auto max-h-80 object-cover rounded-lg transition-transform duration-300 cursor-pointer"
                      onClick={() => openFullPreview(message.mediaUrl)}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-32 bg-gray-200 rounded-lg items-center justify-center flex-col">
                      <Image size={24} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">
                        Image failed to load
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-200 flex items-start justify-end p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(message.mediaUrl, "image");
                        }}
                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {message.type === "video" && (
                <div className="group">
                  <div className="relative rounded-lg overflow-hidden shadow-md max-w-64 min-w-48">
                    <video
                      src={message.mediaUrl}
                      controls
                      className="w-full h-auto max-h-80 object-cover rounded-lg bg-black"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-32 bg-gray-200 rounded-lg items-center justify-center flex-col">
                      <Video size={24} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">
                        Video failed to load
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {message.type === "voice" && (
                <div className="flex items-center space-x-3 min-w-48 py-1">
                  <button
                    onClick={toggleVoicePlayback}
                    className={`p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md ${
                      isOwn
                        ? "bg-[#F7F9FC]/20 hover:bg-[#F7F9FC]/30"
                        : "bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30"
                    }`}
                  >
                    {isPlayingVoice ? (
                      <Pause
                        size={16}
                        className={isOwn ? "text-[#F7F9FC]" : "text-[#3A0CA3]"}
                      />
                    ) : (
                      <Play
                        size={16}
                        className={isOwn ? "text-[#F7F9FC]" : "text-[#3A0CA3]"}
                      />
                    )}
                  </button>
                  <div className="flex-1 h-8 flex items-center">
                    <div
                      className={`w-full h-2 rounded-full relative ${
                        isOwn ? "bg-[#F7F9FC]/30" : "bg-[#4CC9F0]/20"
                      }`}
                    >
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOwn ? "bg-[#F7F9FC]" : "bg-[#4361EE]"
                        }`}
                        style={{ width: `${voiceProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs font-mono ${
                        isOwn ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      {formatTime(currentTime)} / {formatTime(voiceDuration)}
                    </span>
                    <Volume2
                      size={12}
                      className={`${
                        isOwn ? "text-white/60" : "text-gray-400"
                      } mt-1`}
                    />
                  </div>
                </div>
              )}
              {message.type === "audio" && (
                <div className="mb-2">
                  <audio controls className="w-full" src={message.mediaUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </>
          )}
          {message.text && (
            <div className="break-words leading-relaxed">{message.text}</div>
          )}
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
          </div>
        </div>
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
        {showFullPreview && fullPreviewUrl && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFullPreview(false)}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={fullPreviewUrl}
                alt="Full preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setShowFullPreview(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add CSS animation
if (
  typeof document !== "undefined" &&
  !document.querySelector("#message-bubble-styles")
) {
  const style = document.createElement("style");
  style.id = "message-bubble-styles";
  style.textContent = `
    @keyframes slideInFromBottom {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

export default MessageBubble;
