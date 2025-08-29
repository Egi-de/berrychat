"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Search,
  Archive,
  Users,
  UserPlus,
  MoreVertical,
  Pin,
  Volume2,
  VolumeX,
  Trash2,
  MessageSquare,
  Star,
  Clock,
  CheckCheck,
  Check,
  LogOut,
  X,
  Globe,
  Shield,
  HelpCircle,
  Info,
  User,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";
import AddContactModal from "./AddContactModal";
import UserProfile from "./UserProfile";

// Message Status Component
const MessageStatus = ({ status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sent":
        return <Check size={12} className="text-gray-400" />;
      case "delivered":
        return <CheckCheck size={12} className="text-gray-400" />;
      case "read":
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return <Clock size={12} className="text-gray-300" />;
    }
  };

  return getStatusIcon();
};

// Settings Modal Component
const SettingsModal = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onLogout,
}) => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    userProfile?.settings?.language || "en"
  );

  if (!isOpen) return null;

  const handleLanguageChange = async (language) => {
    setSelectedLanguage(language);
    try {
      await onUpdateProfile({
        settings: {
          ...userProfile?.settings,
          language: language,
        },
      });
      setShowLanguageModal(false);
    } catch (error) {
      console.error("Error updating language:", error);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onClose();
      onLogout();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Globe size={20} className="text-gray-600" />
              <span className="font-medium text-gray-900">Language</span>
            </div>
            <span className="text-sm text-gray-500 capitalize">
              {selectedLanguage === "en" ? "English" : selectedLanguage}
            </span>
          </button>

          <button
            onClick={() => setShowPrivacyModal(true)}
            className="w-full flex items-center space-x-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Shield size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">
              Privacy & Security
            </span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center space-x-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <HelpCircle size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">Help & Support</span>
          </button>

          <button
            onClick={() => setShowAboutModal(true)}
            className="w-full flex items-center space-x-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Info size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">About</span>
          </button>

          <hr className="my-4 border-gray-200" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={20} className="text-red-500" />
            <span className="font-medium text-red-500">Logout</span>
          </button>
        </div>
      </div>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Select Language
              </h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { code: "en", name: "English", flag: "🇺🇸" },
                { code: "es", name: "Español", flag: "🇪🇸" },
                { code: "fr", name: "Français", flag: "🇫🇷" },
                { code: "de", name: "Deutsch", flag: "🇩🇪" },
                { code: "it", name: "Italiano", flag: "🇮🇹" },
                { code: "pt", name: "Português", flag: "🇵🇹" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                    selectedLanguage === lang.code
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-gray-900">{lang.name}</span>
                  {selectedLanguage === lang.code && (
                    <Check size={16} className="text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Privacy & Security
              </h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">
                  End-to-End Encryption
                </h4>
                <p className="text-sm text-gray-600">
                  Your messages are secured with end-to-end encryption. Only you
                  and the recipient can read them.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Data Protection
                </h4>
                <p className="text-sm text-gray-600">
                  We don't store your messages on our servers. All data is
                  encrypted and stored locally.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Help & Support
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Getting Started
                </h4>
                <p className="text-sm text-gray-600">
                  Add contacts using their email or phone number to start
                  chatting.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Contact Support
                </h4>
                <p className="text-sm text-gray-600">
                  Need help? Email us at support@berrychat.com
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                About BerryChat
              </h3>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">BerryChat</h4>
                <p className="text-sm text-gray-600">Version 1.0.0</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 text-center">
                  A secure, modern messaging app built with React and Firebase.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatList = ({ onSelectChat, selectedChat, onLogout }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showOptions, setShowOptions] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile and contacts
  useEffect(() => {
    if (!currentUser) return;

    const loadUserProfile = async () => {
      try {
        console.log("Loading user profile for:", currentUser.uid);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User profile loaded:", userData);
          setUserProfile(userData);

          // Load contacts
          if (userData.contacts && userData.contacts.length > 0) {
            const contactsData = await Promise.all(
              userData.contacts.map(async (contactId) => {
                const contactDoc = await getDoc(doc(db, "users", contactId));
                return contactDoc.exists()
                  ? { id: contactDoc.id, ...contactDoc.data() }
                  : null;
              })
            );
            setContacts(contactsData.filter(Boolean));
          }
        } else {
          console.log("No user profile found, creating basic profile");
          // Create a basic profile if none exists
          const basicProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            about: "Hey there! I am using BerryChat.",
            avatar: currentUser.photoURL || null,
            status: "online",
            contacts: [],
            createdAt: new Date(),
          };

          await updateDoc(doc(db, "users", currentUser.uid), basicProfile);
          setUserProfile(basicProfile);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // Load chats with real-time updates
  useEffect(() => {
    if (!currentUser || contacts.length === 0) return;

    const unsubscribes = [];

    contacts.forEach((contact) => {
      const chatId = getChatId(currentUser.uid, contact.uid);
      const messagesRef = collection(db, "chats", chatId, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"));

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));

        const lastMessage = messages[0] || null;

        const unreadCount = messages.filter(
          (msg) =>
            msg.senderId !== currentUser.uid &&
            (!msg.status || msg.status === "sent" || msg.status === "delivered")
        ).length;

        setChats((prevChats) => {
          const updatedChats = prevChats.filter(
            (chat) => chat.id !== contact.uid
          );
          const newChat = {
            id: contact.uid,
            name: contact.displayName,
            avatar: contact.avatar,
            status: contact.status,
            lastSeen: contact.lastSeen?.toDate() || new Date(),
            lastMessage,
            unreadCount,
            isPinned: false,
            isMuted: false,
            isTyping: false,
            isGroup: false,
            chatId,
            contact,
          };

          return [...updatedChats, newChat];
        });
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser, contacts]);

  // Generate consistent chat ID for two users
  const getChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays < 1) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays < 7) {
      return messageTime.toLocaleDateString([], { weekday: "short" });
    } else {
      return messageTime.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatMessagePreview = (message) => {
    if (!message) return "Start a conversation";

    const prefix = message.senderId === currentUser.uid ? "You: " : "";

    switch (message.type) {
      case "image":
        return `${prefix}📷 Photo`;
      case "video":
        return `${prefix}🎥 Video`;
      case "voice":
        return `${prefix}🎵 Audio`;
      case "document":
        return `${prefix}📄 Document`;
      default:
        return `${prefix}${message.text || "Message"}`;
    }
  };

  const getTotalUnreadCount = () => {
    return chats.filter((c) => c.unreadCount > 0).length;
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === "All" ||
        (activeTab === "Unread" && chat.unreadCount > 0) ||
        (activeTab === "Groups" && chat.isGroup))
  );

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const aTime = a.lastMessage?.timestamp || new Date(0);
    const bTime = b.lastMessage?.timestamp || new Date(0);
    return new Date(bTime) - new Date(aTime);
  });

  const handleChatClick = async (chat) => {
    onSelectChat({
      id: chat.id,
      name: chat.name,
      avatar: chat.avatar,
      status: chat.status,
      lastSeen: chat.lastSeen,
      chatId: chat.chatId,
      contact: chat.contact,
    });

    if (chat.unreadCount > 0) {
      try {
        const messagesRef = collection(db, "chats", chat.chatId, "messages");
        const messagesSnapshot = await getDocs(messagesRef);
        const batch = writeBatch(db);

        let hasUpdates = false;

        messagesSnapshot.docs.forEach((doc) => {
          const messageData = doc.data();
          // Only update messages that are not from current user and not already read
          if (
            messageData.senderId !== currentUser.uid &&
            (!messageData.status || messageData.status !== "read")
          ) {
            batch.update(doc.ref, { status: "read" });
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          await batch.commit();
          console.log("Messages marked as read successfully");
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  const handleChatOptions = (chatId, action) => {
    console.log(`Action: ${action} for chat: ${chatId}`);
    setShowOptions(null);
  };

  const handleContactAdded = (newContact) => {
    setContacts((prev) => [...prev, newContact]);
    setShowAddContact(false);
  };

  const handleUpdateProfile = async (updates) => {
    try {
      console.log("Updating profile with:", updates);
      await updateDoc(doc(db, "users", currentUser.uid), updates);
      setUserProfile((prev) => ({ ...prev, ...updates }));
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile: " + error.message);
    }
  };

  const handleProfileClick = () => {
    console.log("Profile clicked, userProfile:", userProfile);
    setShowProfile(true);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0F172A]  text-[#F7F9FC] flex items-center justify-center">
        <div className="text-center w-110">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-300 bg-[#0F172A] text-[#F7F9FC] flex">
      {/* Left Sidebar */}
      <div className="w-12 bg-gray-800 flex flex-col items-center py-3 space-y-3 border-r border-gray-700">
        {/* Navigation Icons */}
        <div className="flex flex-col space-y-3">
          <button
            className="p-2 text-white bg-gray-700 rounded-lg transition-all duration-200 hover:bg-gray-600 relative"
            title="Chats"
          >
            <MessageSquare size={18} />
            {getTotalUnreadCount() > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {getTotalUnreadCount() > 9 ? "9+" : getTotalUnreadCount()}
                </span>
              </div>
            )}
          </button>

          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Status"
          >
            <div className="relative">
              <div className="w-5 h-5 rounded-full border-2 border-current"></div>
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-current rounded-full"></div>
            </div>
          </button>

          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Calls"
          >
            <div className="transform rotate-12">
              <div className="w-5 h-5 rounded-full border-2 border-current relative">
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-current rounded-full"></div>
              </div>
            </div>
          </button>

          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Groups"
          >
            <Users size={18} />
          </button>
        </div>

        {/* Bottom Icons */}
        <div className="flex-1 flex flex-col justify-end items-center space-y-3 pb-10">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          <div
            onClick={handleProfileClick}
            className=" w-5 h-5  rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            title="Profile"
          >
            {userProfile?.avatar ? (
              <Avatar
                src={userProfile.avatar}
                alt={userProfile.displayName || "User"}
                size="xs"
                status="online"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium hover:bg-gray-500 transition-colors">
                {(userProfile?.displayName || userProfile?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="p-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">BerryChat</h1>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowAddContact(true)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Add Contact"
              >
                <UserPlus size={18} />
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200">
                <Search size={18} />
              </button>

              {/* Main Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMainMenu(!showMainMenu)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  <MoreVertical size={18} />
                </button>

                {showMainMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-gray-800 rounded-lg shadow-xl border border-gray-600 py-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-600 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                          {(
                            userProfile?.displayName ||
                            userProfile?.email ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {userProfile?.displayName || "User"}
                          </p>
                          <p className="text-gray-400 text-xs">Online</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowMainMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Users size={16} />
                      <span>New group</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMainMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Star size={16} />
                      <span>Starred messages</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMainMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Check size={16} />
                      <span>Select chats</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowMainMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>

                    <hr className="my-2 border-gray-600" />

                    <button
                      onClick={() => {
                        setShowMainMenu(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <LogOut size={16} />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex space-x-2 overflow-x-auto">
            {["All", "Unread", "Groups"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all duration-200 text-sm relative ${
                  activeTab === tab
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab}
                {tab === "All" && getTotalUnreadCount() > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    {getTotalUnreadCount()}
                  </span>
                )}
                {tab === "Unread" &&
                  chats.filter((c) => c.unreadCount > 0).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                      {chats.filter((c) => c.unreadCount > 0).length}
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
              <MessageSquare size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm text-center mb-3">
                {searchTerm
                  ? "No chats match your search"
                  : "Add contacts to start chatting"}
              </p>
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Add Contact
              </button>
            </div>
          ) : (
            sortedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className={`relative flex items-center px-3 py-2.5 hover:bg-gray-800 cursor-pointer transition-all duration-200 group ${
                  selectedChat?.id === chat.id ? "bg-gray-800" : ""
                }`}
              >
                {chat.isPinned && (
                  <Pin
                    size={10}
                    className="absolute top-1.5 left-1.5 text-gray-400 rotate-45"
                  />
                )}

                <div className="relative mr-2.5">
                  <Avatar
                    src={chat.avatar}
                    alt={chat.name}
                    size="sm"
                    status={chat.status}
                  />
                  {chat.isGroup && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <Users size={8} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-medium text-white truncate text-sm">
                        {chat.name}
                      </h3>
                      {chat.isMuted && (
                        <VolumeX size={12} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(chat.lastMessage?.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                      {chat.isTyping ? (
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-0.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs text-green-400">
                            typing...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          {chat.lastMessage &&
                            chat.lastMessage.senderId === currentUser.uid && (
                              <MessageStatus
                                status={chat.lastMessage?.status}
                              />
                            )}
                          <p className="text-xs text-gray-400 truncate">
                            {formatMessagePreview(chat.lastMessage)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2">
                      {chat.unreadCount > 0 && (
                        <div className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </div>
                      )}

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOptions(
                              showOptions === chat.id ? null : chat.id
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {showOptions === chat.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-gray-700 rounded-lg shadow-xl border border-gray-600 py-2 z-50">
                            <button
                              onClick={() =>
                                handleChatOptions(chat.id, "archive")
                              }
                              className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-600 transition-colors text-sm"
                            >
                              <Archive size={14} className="inline mr-2" />
                              Archive chat
                            </button>
                            <button
                              onClick={() => handleChatOptions(chat.id, "mute")}
                              className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-600 transition-colors text-sm"
                            >
                              {chat.isMuted ? (
                                <Volume2 size={14} className="inline mr-2" />
                              ) : (
                                <VolumeX size={14} className="inline mr-2" />
                              )}
                              {chat.isMuted ? "Unmute" : "Mute"} notifications
                            </button>
                            <button
                              onClick={() => handleChatOptions(chat.id, "pin")}
                              className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-600 transition-colors text-sm"
                            >
                              <Pin size={14} className="inline mr-2" />
                              {chat.isPinned ? "Unpin" : "Pin"} chat
                            </button>
                            <hr className="my-1 border-gray-600" />
                            <button
                              onClick={() =>
                                handleChatOptions(chat.id, "delete")
                              }
                              className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-600 transition-colors text-sm"
                            >
                              <Trash2 size={14} className="inline mr-2" />
                              Delete chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        currentUser={userProfile}
        onContactAdded={handleContactAdded}
      />

      <UserProfile
        user={userProfile}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onUpdateProfile={handleUpdateProfile}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onLogout={onLogout}
      />

      {/* Click outside handlers */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(null)}
        />
      )}

      {showMainMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMainMenu(false)}
        />
      )}
    </div>
  );
};

export default ChatList;
