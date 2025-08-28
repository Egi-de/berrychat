import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

import { Send, Paperclip, Mic, X, Image, File } from "lucide-react";
import MediaPreview from "./MediaPreview";
import VoiceRecorder from "./VoiceRecorder";

const ChatInput = ({
  onSendMessage,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [message]);

  // File selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length) {
      setFiles((prev) => [...prev, ...selectedFiles]);
      setShowAttachments(false);
    }
  };

  const removeFile = (index) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const getFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "document";
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const file = new File([blob], "voice_message.wav", {
          type: "audio/wav",
        });
        handleSendVoiceMessage(file);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSendVoiceMessage = (audioFile) => {
    const messageData = {
      type: "voice",
      files: [audioFile],
      text: "",
      ...(replyTo && { replyTo: replyTo.id }),
    };
    onSendMessage(messageData);
  };

  // Sending message
  const handleSend = () => {
    if ((!message.trim() && files.length === 0) || disabled) return;
    const messageData = {
      text: message.trim(),
      type: files.length ? getFileType(files[0]) : "text",
      files: files.length ? files : null,
      ...(replyTo && { replyTo: replyTo.id }),
    };
    onSendMessage(messageData);
    setMessage("");
    setFiles([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  if (isRecording) {
    return (
      <div className="p-4 bg-white/95 backdrop-blur-lg border-t border-gray-200">
        <VoiceRecorder
          onStop={stopRecording}
          onCancel={stopRecording}
          isRecording={isRecording}
        />
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200">
      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-purple-600 mb-1">
                Replying to {replyTo.senderName || "Unknown"}
              </div>
              <div className="text-sm text-gray-700 truncate">
                {replyTo.text || "📎 Media message"}
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 p-1 hover:bg-purple-100 rounded-full transition-colors duration-200"
            >
              <X size={16} className="text-purple-600" />
            </button>
          </div>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((file, index) => (
              <MediaPreview
                key={index}
                file={file}
                type={getFileType(file)}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Attachment options */}
      {showAttachments && (
        <div className="px-4 pt-3">
          <div className="flex space-x-3 pb-3">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Image size={16} />
              <span className="text-sm font-medium">Photos</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-all duration-200 hover:scale-105"
            >
              <File size={16} />
              <span className="text-sm font-medium">Files</span>
            </button>
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Mic size={16} />
              <span className="text-sm font-medium">Voice</span>
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end space-x-3">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            disabled={disabled}
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
              showAttachments
                ? "bg-purple-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none bg-gray-50 border-2 border-gray-200 rounded-3xl px-6 py-3 pr-12 focus:border-purple-400 focus:bg-white outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />

            {/* Emoji picker */}
            <div className="absolute right-3 bottom-3">
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-purple-500 transition-colors duration-200 disabled:opacity-50"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
          </div>

          {message.trim() || files.length > 0 ? (
            <button
              onClick={handleSend}
              disabled={disabled}
              className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={disabled}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-purple-500 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Mic size={20} />
            </button>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ChatInput;
