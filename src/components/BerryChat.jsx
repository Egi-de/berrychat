"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { createDocument } from "../firestore/helpers";
import { useAuth } from "../hooks/useAuth";
import ChatList from "./ChatList";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

// Helper function to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const BerryChat = () => {
  const { currentUser, logout } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Real-time message listener
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    console.log("Setting up message listener for chatId:", selectedChat.chatId);

    const messagesRef = collection(
      db,
      "chats",
      selectedChat.chatId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messageList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let processedData = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          };

          // For voice messages, convert base64 back to blob URL if needed
          if (data.type === "voice" && data.voiceBlob && !data.mediaUrl) {
            try {
              // Convert base64 back to blob
              const base64Data = data.voiceBlob.split(",")[1];
              const mimeType = data.voiceBlob
                .split(",")[0]
                .split(":")[1]
                .split(";")[0];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });
              const blobUrl = URL.createObjectURL(blob);
              processedData.mediaUrl = blobUrl;
            } catch (error) {
              console.error("Error recreating blob URL:", error);
            }
          }

          messageList.push(processedData);
        });
        setMessages(messageList);

        const unreadMessages = messageList.filter(
          (msg) =>
            msg.senderId !== currentUser.uid &&
            (!msg.status || msg.status !== "read")
        );

        if (unreadMessages.length > 0) {
          const markAsRead = async () => {
            try {
              const batch = writeBatch(db);
              unreadMessages.forEach((msg) => {
                const msgRef = doc(
                  db,
                  "chats",
                  selectedChat.chatId,
                  "messages",
                  msg.id
                );
                batch.update(msgRef, { status: "read" });
              });
              await batch.commit();
            } catch (error) {
              console.error("Error auto-marking messages as read:", error);
            }
          };

          // Small delay to ensure UI is ready
          setTimeout(markAsRead, 500);
        }
      },
      (error) => {
        console.error("Error listening to messages:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  const handleSendMessage = async (messageData) => {
    if (!selectedChat || !currentUser) {
      console.error("Missing selectedChat or currentUser");
      return;
    }

    // Updated validation to handle voice messages properly
    const hasText = messageData.text?.trim();
    const hasFiles = messageData.files?.length > 0;
    const hasMediaUrl = messageData.mediaUrl;
    const isVoiceMessage = messageData.type === "voice";

    if (!hasText && !hasFiles && !hasMediaUrl && !isVoiceMessage) {
      console.error("Empty message");
      return;
    }

    setSendingMessage(true);
    const chatId = selectedChat.chatId;

    // Debug logging for voice messages
    if (messageData.type === "voice") {
      console.log("Sending voice message:", messageData);
    }

    // Process files safely - Skip file processing for voice messages
    let processedFiles = null;
    if (
      messageData.files &&
      messageData.files.length > 0 &&
      messageData.type !== "voice"
    ) {
      processedFiles = messageData.files.map((file) => {
        let fileUrl = null;

        try {
          if (file instanceof File || file instanceof Blob) {
            fileUrl = URL.createObjectURL(file);
          } else if (file.__blob) {
            // Handle our custom file objects
            fileUrl = URL.createObjectURL(file.__blob);
          } else if (file.url) {
            // File already has a URL
            fileUrl = file.url;
          } else {
            console.warn("Could not create URL for file:", file);
            fileUrl = null;
          }
        } catch (error) {
          console.error("Error creating object URL:", error);
          fileUrl = null;
        }

        return {
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
        };
      });
    }

    const messagePayload = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || "Anonymous",
      text: messageData.text || "",
      timestamp: serverTimestamp(),
      status: "sent",
      type: messageData.type || "text",
      ...(processedFiles && { files: processedFiles }),
      // For voice messages, store the blob URL and blob data
      ...(messageData.type === "voice" && {
        mediaUrl: messageData.mediaUrl,
        voiceBlob: messageData.files?.[0]?.blob
          ? await blobToBase64(messageData.files[0].blob)
          : null,
      }),
      ...(messageData.replyTo && { replyTo: messageData.replyTo }),
    };

    try {
      const result = await createDocument(
        `chats/${chatId}/messages`,
        messagePayload
      );

      if (result.success) {
        setReplyTo(null);
      } else {
        console.error("Failed to send message:", result.error);
        alert("Failed to send message: " + result.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const getReplyToMessage = (replyToId) => {
    return messages.find((msg) => msg.id === replyToId);
  };

  const handleBack = () => {
    setSelectedChat(null);
    setMessages([]);
    setReplyTo(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-25 to-indigo-50 overflow-hidden">
      <div className="flex h-full">
        {/* Chat List - Hidden on mobile when chat is selected */}
        <div
          className={`${
            isMobile && selectedChat ? "hidden" : "flex"
          } w-full md:w-80 border-r border-gray-200/50`}
        >
          <ChatList
            onSelectChat={setSelectedChat}
            selectedChat={selectedChat}
            onLogout={handleLogout}
          />
        </div>

        {/* Chat Interface */}
        <div
          className={`${
            isMobile && !selectedChat ? "hidden" : "flex"
          } flex-1 flex-col`}
        >
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                user={selectedChat}
                onBack={handleBack}
                isGroup={selectedChat.isGroup}
              />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/30 to-pink-50/30">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageCircle
                        size={48}
                        className="mx-auto mb-4 opacity-50"
                      />
                      <p>Start your conversation with {selectedChat.name}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === currentUser.uid;
                    const user = isOwn ? currentUser : selectedChat;
                    const replyToMessage = message.replyTo
                      ? getReplyToMessage(message.replyTo)
                      : null;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        user={user}
                        onReply={handleReply}
                        replyToMessage={replyToMessage}
                      />
                    );
                  })
                )}

                {/* Sending indicator */}
                {sendingMessage && (
                  <div className="flex justify-end">
                    <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-2xl animate-pulse">
                      Sending...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                disabled={sendingMessage}
                placeholder={`Message ${selectedChat.name}...`}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center text-gray-500">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  Welcome to BerryChat
                </h3>
                <p className="mb-4">Select a conversation to start messaging</p>
                {currentUser && (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Logged in as:{" "}
                      {currentUser.displayName || currentUser.email}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BerryChat;
