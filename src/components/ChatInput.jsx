import React, { useState, useRef } from "react";
import { Send, Smile, Paperclip, Mic, Camera, X } from "lucide-react";
import MediaPreview from "./MediaPreview";
import VoiceRecorder from "./VoiceRecorder";

const ChatInput = ({ onSendMessage, replyTo, onCancelReply }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef();
  const textareaRef = useRef();

  const handleSend = (e) => {
    // Prevent default form submission if this is called from a form
    if (e) {
      e.preventDefault();
    }

    if (message.trim() || selectedFiles.length > 0) {
      onSendMessage({
        text: message.trim(),
        files: selectedFiles,
        replyTo: replyTo?.id,
        type: "text", // Ensure type is always set
      });
      setMessage("");
      setSelectedFiles([]);
      if (replyTo) onCancelReply();
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = ""; // Reset input
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    onSendMessage({
      type: "voice",
      text: "Voice message",
      duration: Math.floor(Math.random() * 30) + 5, // Mock duration
    });
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const quickEmojis = ["😀", "😂", "❤️", "👍", "🔥", "😍", "🎉", "💯"];

  return (
    <div className="p-4 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-lg">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-400 flex justify-between items-start shadow-sm">
          <div className="flex-1">
            <div className="text-xs text-purple-600 font-semibold mb-1">
              Replying to {replyTo.senderId === "user1" ? "You" : "Alice"}
            </div>
            <div className="text-sm text-gray-700 line-clamp-2">
              {replyTo.text || "📎 Media message"}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Media previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <MediaPreview
                key={index}
                file={file}
                type={
                  file.type.startsWith("image/")
                    ? "image"
                    : file.type.startsWith("video/")
                    ? "video"
                    : "document"
                }
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Voice recording interface */}
      {isRecording ? (
        <VoiceRecorder
          onStop={stopRecording}
          onCancel={cancelRecording}
          isRecording={isRecording}
        />
      ) : (
        <form onSubmit={handleSend} className="space-y-3">
          {/* Quick emoji bar */}
          {showEmojiPicker && (
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-full animate-in slide-in-from-bottom-2 duration-200">
              {quickEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setMessage((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform duration-200 p-1 hover:bg-white rounded-full"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Main input area */}
          <div className="flex items-end space-x-3">
            {/* Attachment buttons */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current?.click();
                }}
                className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                title="Take photo"
              >
                <Camera size={20} />
              </button>
            </div>

            {/* Text input area */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-gray-100 hover:bg-gray-50 focus:bg-white rounded-2xl border-2 border-transparent focus:border-purple-300 outline-none resize-none transition-all duration-200 text-sm leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50 transition-all duration-200"
                title="Add emoji"
              >
                <Smile size={18} />
              </button>
            </div>

            {/* Send/Voice button */}
            <button
              type="submit"
              onClick={
                message.trim() || selectedFiles.length > 0
                  ? undefined // Let form submission handle it
                  : (e) => {
                      e.preventDefault();
                      startRecording();
                    }
              }
              className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                message.trim() || selectedFiles.length > 0
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-600"
              }`}
              title={
                message.trim() || selectedFiles.length > 0
                  ? "Send message"
                  : "Record voice message"
              }
            >
              {message.trim() || selectedFiles.length > 0 ? (
                <Send size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>
          </div>
        </form>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ChatInput;
