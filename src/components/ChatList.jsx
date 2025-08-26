import React, { useState, useEffect } from "react";
import { Settings, Search, Plus, Archive, Users, UserPlus } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Avatar from "./Avatar";
import AddContactModal from "./AddContactModal";

const ChatList = ({
  selectedChat,
  onSelectChat,
  currentUser,
  messages = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'contacts'

  // Load user's contacts
  useEffect(() => {
    if (!currentUser) return;

    const loadContacts = async () => {
      try {
        // Get current user's data to access contacts array
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", currentUser.uid))
        );

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const contactIds = userData.contacts || [];

          if (contactIds.length > 0) {
            // Get contact details
            const contactsQuery = query(
              collection(db, "users"),
              where("uid", "in", contactIds)
            );
            const contactsSnapshot = await getDocs(contactsQuery);

            const contactsList = [];
            contactsSnapshot.forEach((doc) => {
              contactsList.push({ id: doc.id, ...doc.data() });
            });

            setContacts(contactsList);
          }
        }
      } catch (error) {
        console.error("Error loading contacts:", error);
      }
    };

    loadContacts();
  }, [currentUser]);

  // Load recent chats
  useEffect(() => {
    if (!currentUser) return;

    // Listen to chats where current user is a participant
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, orderBy("lastActivity", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userChats = [];
      snapshot.forEach((doc) => {
        const chatData = doc.data();
        // Check if current user is a participant
        if (
          chatData.participants &&
          chatData.participants.includes(currentUser.uid)
        ) {
          userChats.push({
            id: doc.id,
            ...chatData,
          });
        }
      });
      setRecentChats(userChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Get other participant in chat
  const getOtherParticipant = (chat) => {
    const otherParticipantId = chat.participants?.find(
      (id) => id !== currentUser.uid
    );
    return (
      contacts.find((contact) => contact.uid === otherParticipantId) || {
        uid: otherParticipantId,
        displayName: "Unknown User",
        status: "offline",
      }
    );
  };

  // Filter items based on search
  const getFilteredItems = () => {
    const items =
      activeTab === "chats"
        ? recentChats.map((chat) => ({
            ...chat,
            type: "chat",
            participant: getOtherParticipant(chat),
          }))
        : contacts.map((contact) => ({
            ...contact,
            type: "contact",
          }));

    if (!searchTerm) return items;

    return items.filter((item) => {
      const name =
        item.type === "chat" ? item.participant.displayName : item.displayName;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const formatMessagePreview = (message) => {
    if (!message) return "No messages yet";

    switch (message.type) {
      case "image":
        return "📷 Photo";
      case "video":
        return "🎥 Video";
      case "voice":
        return "🎵 Voice message";
      case "document":
        return "📄 Document";
      default:
        return message.text || "Message";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleItemClick = (item) => {
    if (item.type === "chat") {
      onSelectChat({
        id: item.participant.uid,
        name: item.participant.displayName,
        avatar: item.participant.avatar,
        status: item.participant.status,
        lastSeen: item.participant.lastSeen,
      });
    } else {
      // Create new chat with contact
      onSelectChat({
        id: item.uid,
        name: item.displayName,
        avatar: item.avatar,
        status: item.status,
        lastSeen: item.lastSeen,
      });
    }
  };

  const handleContactAdded = (newContact) => {
    setContacts((prev) => [...prev, newContact]);
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="h-full bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-white/90">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            BerryChat
          </h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowNewChatOptions(!showNewChatOptions)}
                className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Plus size={20} />
              </button>

              {/* New chat options */}
              {showNewChatOptions && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setShowAddContact(true);
                      setShowNewChatOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <UserPlus size={16} />
                    <span>Add contact</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-200">
                    <Users size={16} />
                    <span>New group</span>
                  </button>
                </div>
              )}
            </div>

            <button className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search chats and contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 hover:bg-gray-50 focus:bg-white rounded-2xl border-2 border-transparent focus:border-purple-300 outline-none transition-all duration-200 text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("chats")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeTab === "chats"
                ? "bg-purple-100 text-purple-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Chats ({recentChats.length})
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeTab === "contacts"
                ? "bg-purple-100 text-purple-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Contacts ({contacts.length})
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-1">
            <Archive size={12} />
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            {activeTab === "chats" ? (
              <>
                <Users size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No conversations yet</p>
                <p className="text-sm text-center">
                  Add contacts to start chatting
                </p>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:scale-105 transition-all duration-200"
                >
                  Add Contact
                </button>
              </>
            ) : (
              <>
                <UserPlus size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No contacts yet</p>
                <p className="text-sm text-center">
                  Start by adding your first contact
                </p>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:scale-105 transition-all duration-200"
                >
                  Add Contact
                </button>
              </>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected =
              selectedChat?.id ===
              (item.type === "chat" ? item.participant.uid : item.uid);
            const displayName =
              item.type === "chat"
                ? item.participant.displayName
                : item.displayName;
            const avatar =
              item.type === "chat" ? item.participant.avatar : item.avatar;
            const status =
              item.type === "chat" ? item.participant.status : item.status;
            const lastMessage = item.type === "chat" ? item.lastMessage : null;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex items-center space-x-3 p-4 hover:bg-white/80 cursor-pointer transition-all duration-200 border-b border-gray-100/50 group ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400"
                    : "hover:shadow-sm"
                }`}
              >
                <div className="relative">
                  <Avatar
                    src={avatar}
                    alt={displayName}
                    size="lg"
                    status={status}
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-semibold truncate transition-colors duration-200 ${
                        isSelected ? "text-purple-700" : "text-gray-800"
                      }`}
                    >
                      {displayName}
                    </h3>
                    {lastMessage && (
                      <span
                        className={`text-xs flex-shrink-0 ml-2 ${
                          isSelected ? "text-purple-500" : "text-gray-500"
                        }`}
                      >
                        {formatTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        isSelected ? "text-purple-600" : "text-gray-500"
                      }`}
                    >
                      {item.type === "chat"
                        ? formatMessagePreview(lastMessage)
                        : item.bio || "Tap to start chatting"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        currentUser={currentUser}
        onContactAdded={handleContactAdded}
      />

      {/* Click outside to close dropdown */}
      {showNewChatOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNewChatOptions(false)}
        />
      )}
    </div>
  );
};

export default ChatList;
