// src/components/ChatApp.jsx
import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { createDocument } from "../firestore/helpers";
import { useAuth } from "../hooks/useAuth";
import ChatList from "./ChatList";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

const ChatApp = () => {
  const { currentUser, logout } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Sample chat data
  const chats = [
    {
      id: "user2",
      name: "Alice Johnson",
      avatar: null,
      status: "online",
      lastSeen: new Date().toISOString(),
    },
    {
      id: "user3",
      name: "Bob Wilson",
      avatar: null,
      status: "offline",
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "user4",
      name: "Carol Smith",
      avatar: null,
      status: "online",
      lastSeen: new Date().toISOString(),
    },
  ];

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

    const chatId = getChatId(currentUser.uid, selectedChat.id);
    console.log("Setting up message listener for chatId:", chatId);

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Received snapshot with", snapshot.size, "messages");
        const messageList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messageList.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          });
        });
        console.log("Updated messages:", messageList);
        setMessages(messageList);
      },
      (error) => {
        console.error("Error listening to messages:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  // Generate consistent chat ID for two users
  const getChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedChat || !currentUser) {
      console.error("Missing selectedChat or currentUser");
      return;
    }

    if (!messageData.text?.trim() && !messageData.files?.length) {
      console.error("Empty message");
      return;
    }

    setSendingMessage(true);
    const chatId = getChatId(currentUser.uid, selectedChat.id);

    const messagePayload = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || "Anonymous",
      text: messageData.text || "",
      timestamp: serverTimestamp(),
      status: "sent",
      type: messageData.type || "text",
      ...(messageData.files &&
        messageData.files.length > 0 && { files: messageData.files }),
      ...(messageData.replyTo && { replyTo: messageData.replyTo }),
    };

    console.log("Sending message with payload:", messagePayload);
    console.log("To path: chats/" + chatId + "/messages");

    try {
      const result = await createDocument(
        `chats/${chatId}/messages`,
        messagePayload
      );

      if (result.success) {
        console.log("Message sent successfully with ID:", result.id);
        setReplyTo(null);
      } else {
        console.error("Failed to send message:", result.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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

  // Debug info
  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("Selected chat:", selectedChat);
    console.log("Messages count:", messages.length);
  }, [currentUser, selectedChat, messages]);

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
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            currentUser={currentUser}
            messages={messages}
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
              <ChatHeader user={selectedChat} onBack={handleBack} />

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
                      {currentUser && (
                        <p className="text-xs mt-2">
                          Logged in as: {currentUser.email}
                        </p>
                      )}
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
                    <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-2xl">
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
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center text-gray-500">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  Welcome to BerryChat
                </h3>
                <p className="mb-4">Select a chat to start messaging</p>
                {currentUser && (
                  <p className="text-sm mb-4">
                    Logged in as: {currentUser.email}
                  </p>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
