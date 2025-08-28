import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { Send, Paperclip, Mic, X, Image, File, Loader } from "lucide-react";
import MediaPreview from "./MediaPreview";
import VoiceRecorder from "./VoiceRecorder";
import {
  uploadToCloudinary,
  validateChatFile,
  getCloudinaryUrl,
} from "../utils/cloudinary";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
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

  // Upload files to Cloudinary
  const uploadFiles = async (selectedFiles) => {
    const uploadPromises = selectedFiles.map(async (file, index) => {
      const fileId = `${Date.now()}_${index}`;

      try {
        // Update progress
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // Validate file
        const validation = await validateChatFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 15, 90),
          }));
        }, 300);

        // Determine folder and options based on file type
        const getUploadOptions = () => {
          if (file.type.startsWith("image/")) {
            return {
              folder: "berrychat/images",
              tags: ["chat", "image"],
              // No transformation here - apply via URL generation later
            };
          } else if (file.type.startsWith("video/")) {
            return {
              folder: "berrychat/videos",
              tags: ["chat", "video"],
              resourceType: "video",
            };
          } else if (file.type.startsWith("audio/")) {
            return {
              folder: "berrychat/audio",
              tags: ["chat", "audio"],
              resourceType: "video", // Cloudinary uses 'video' for audio files
            };
          } else {
            return {
              folder: "berrychat/files",
              tags: ["chat", "document"],
              resourceType: "raw",
            };
          }
        };

        const uploadResult = await uploadToCloudinary(file, getUploadOptions());

        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }

        // Generate optimized URL for images
        let finalUrl = uploadResult.url;
        if (file.type.startsWith("image/")) {
          finalUrl = getCloudinaryUrl(uploadResult.publicId, {
            width: 1200,
            height: 1200,
            crop: "limit",
            quality: "auto",
            format: "auto",
          });
        }

        return {
          name: file.name,
          size: file.size,
          type: file.type,
          url: finalUrl,
          originalUrl: uploadResult.url, // Keep original URL as backup
          publicId: uploadResult.publicId,
          originalFile: file,
          uploadId: fileId,
        };
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        setUploadProgress((prev) => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
        throw error;
      }
    });

    return Promise.allSettled(uploadPromises);
  };

  // File selection with upload
  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    setUploading(true);
    setShowAttachments(false);

    try {
      // Add files to preview immediately with loading state
      const tempFiles = selectedFiles.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary preview only
        uploading: true,
        uploadId: `${Date.now()}_${index}`,
      }));

      setFiles((prev) => [...prev, ...tempFiles]);

      // Upload files to Cloudinary
      const uploadResults = await uploadFiles(selectedFiles);

      // Update files with upload results
      setFiles((prev) => {
        const updated = [...prev];

        uploadResults.forEach((result, index) => {
          const tempFileIndex = updated.findIndex(
            (f) => f.uploadId === tempFiles[index].uploadId
          );

          if (tempFileIndex !== -1) {
            // Clean up temporary blob URL
            URL.revokeObjectURL(updated[tempFileIndex].url);

            if (result.status === "fulfilled") {
              // Replace with uploaded file
              updated[tempFileIndex] = {
                ...result.value,
                uploading: false,
              };
            } else {
              // Remove failed upload
              updated.splice(tempFileIndex, 1);
              console.error("Upload failed:", result.reason);
              alert(
                `Upload failed for ${tempFiles[index].name}: ${
                  result.reason?.message || "Unknown error"
                }`
              );
            }
          }
        });

        return updated;
      });
    } catch (error) {
      console.error("File upload error:", error);
      // Clean up any temporary URLs and failed uploads
      setFiles((prev) => {
        prev.forEach((f) => {
          if (f.url?.startsWith("blob:")) {
            URL.revokeObjectURL(f.url);
          }
        });
        return prev.filter((f) => !f.uploading);
      });
      alert(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }

    // Clear the input
    e.target.value = "";
  };

  const removeFile = (index) => {
    const fileToRemove = files[index];

    // Clean up blob URL if it exists
    if (fileToRemove?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.url);
    }

    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  };

  // Voice recording with Cloudinary upload
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use a supported audio format, prefer formats that work better with Cloudinary
      let options = {};
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        options = { mimeType: "audio/ogg;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        // Use the actual MIME type from the MediaRecorder
        const fullMimeType = recorder.mimeType || "audio/webm";

        // Clean the MIME type for Cloudinary (remove codecs)
        const mimeType = fullMimeType.split(";")[0];

        const blob = new Blob(chunks, { type: mimeType });

        // Determine file name based on MIME type
        let fileName = "voice_message.webm";

        if (mimeType.includes("mp4")) {
          fileName = "voice_message.mp4";
        } else if (mimeType.includes("ogg")) {
          fileName = "voice_message.ogg";
        } else if (mimeType.includes("wav")) {
          fileName = "voice_message.wav";
        } else if (mimeType.includes("mp3")) {
          fileName = "voice_message.mp3";
        }

        // Create a file-like object for better handling
        const audioFile = {
          name: fileName,
          type: mimeType,
          size: blob.size,
          lastModified: Date.now(),
          // Add blob methods and properties
          stream: () => blob.stream(),
          arrayBuffer: () => blob.arrayBuffer(),
          text: () => blob.text(),
          slice: (start, end, contentType) =>
            blob.slice(start, end, contentType),
          // Store the original blob for upload
          _blob: blob,
        };

        // Create blob URL for voice message (no Cloudinary upload needed)
        try {
          console.log("Creating voice message:", {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
            cleanedMimeType: mimeType,
            fullMimeType: fullMimeType,
          });

          // Create a blob URL for local playback
          const blobUrl = URL.createObjectURL(audioFile._blob);

          const voiceFileData = {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
            url: blobUrl,
            blob: audioFile._blob, // Store the blob for Firebase
          };

          handleSendVoiceMessage(voiceFileData);
        } catch (error) {
          console.error("Voice message creation failed:", error);
          alert(`Failed to create voice message: ${error.message}`);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert(
        "Microphone access denied. Please allow microphone access and try again."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSendVoiceMessage = (voiceFile) => {
    const messageData = {
      type: "voice",
      text: "",
      mediaUrl: voiceFile.url, // Blob URL for immediate playback
      files: [voiceFile], // Include the blob for storage
      ...(replyTo && { replyTo: replyTo.id }),
    };

    console.log("ChatInput: Sending voice message data:", messageData);
    console.log("ChatInput: Voice file:", voiceFile);
    onSendMessage(messageData);
  };

  // Enhanced send function
  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || disabled || uploading)
      return;

    // Check if any files are still uploading
    const hasUploadingFiles = files.some((f) => f.uploading);
    if (hasUploadingFiles) {
      alert("Please wait for all files to finish uploading");
      return;
    }

    let messageData = {
      text: message.trim(),
      type: files.length ? getFileType(files[0]) : "text",
      files: files.length ? files : null,
      ...(replyTo && { replyTo: replyTo.id }),
    };

    // For media messages, use the Cloudinary URL
    if (files.length > 0) {
      const firstFile = files[0];
      const fileType = getFileType(firstFile);

      if (
        fileType === "image" ||
        fileType === "video" ||
        fileType === "audio"
      ) {
        messageData.mediaUrl = firstFile.url; // This is now a Cloudinary URL
      }
    }

    onSendMessage(messageData);
    setMessage("");

    // Clean up any remaining blob URLs before clearing files
    files.forEach((file) => {
      if (file.url?.startsWith("blob:")) {
        URL.revokeObjectURL(file.url);
      }
    });
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.url?.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [files]);

  if (isRecording) {
    return (
      <div className="p-4 bg-[#F7F9FC]/95 backdrop-blur-lg border-t border-[#4CC9F0]/20">
        <VoiceRecorder
          onStop={stopRecording}
          onCancel={() => {
            if (mediaRecorder && mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
            setIsRecording(false);
            setMediaRecorder(null);
          }}
          isRecording={isRecording}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FC]/9 backdrop-blur-lg border-t border-[#4CC9F0]/20">
      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between bg-[#4CC9F0]/10 rounded-lg p-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#3A0CA3] mb-1">
                Replying to {replyTo.senderName || "Unknown"}
              </div>
              <div className="text-sm text-[#0F172A]/70 truncate">
                {replyTo.text || "📎 Media message"}
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 p-1 hover:bg-[#4CC9F0]/20 rounded-full transition-colors duration-200"
            >
              <X size={16} className="text-[#3A0CA3]" />
            </button>
          </div>
        </div>
      )}

      {/* Upload progress indicator */}
      {uploading && (
        <div className="px-4 pt-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Loader size={16} className="text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">
                Uploading files...
              </span>
            </div>
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="mb-1">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((file, index) => (
              <MediaPreview
                key={file.uploadId || index}
                file={file}
                type={getFileType(file)}
                onRemove={() => removeFile(index)}
                index={index}
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
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image size={16} />
              <span className="text-sm font-medium">Photos</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <File size={16} />
              <span className="text-sm font-medium">Files</span>
            </button>
            <button
              onClick={startRecording}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic size={16} />
              <span className="text-sm font-medium">Voice</span>
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-2">
        <div className="flex items-end space-x-3">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            disabled={disabled || uploading}
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
              showAttachments
                ? "bg-purple-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploading ? "Uploading files..." : placeholder}
              disabled={disabled || uploading}
              className="w-full resize-none bg-[#F7F9FC]/50 border-2 border-[#4CC9F0]/30 rounded-3xl px-6 py-3 pr-12 focus:border-[#4361EE] focus:bg-[#F7F9FC] outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: "48px", maxHeight: "12px" }}
            />

            {/* Emoji picker */}
            <div className="absolute right-3 bottom-3">
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                disabled={disabled || uploading}
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

          {message.trim() || (files.length > 0 && !uploading) ? (
            <button
              onClick={handleSend}
              disabled={disabled || uploading || files.some((f) => f.uploading)}
              className="p-3 bg-gradient-to-r from-[#3A0CA3] to-[#4361EE] hover:from-[#4361EE] hover:to-[#4CC9F0] text-[#F7F9FC] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={disabled || uploading}
              className="p-3 bg-[#4CC9F0]/20 hover:bg-[#4CC9F0]/30 text-[#3A0CA3] hover:text-[#4361EE] rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
          disabled={uploading}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Emoji picker overlay */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default ChatInput;
