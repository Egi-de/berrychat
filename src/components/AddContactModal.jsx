import React, { useState } from "react";
import { Search, UserPlus, X, Phone, Mail, Loader } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { updateDocument } from "../firestore/helpers";
import Avatar from "./Avatar";

const AddContactModal = ({ isOpen, onClose, currentUser, onContactAdded }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingContact, setAddingContact] = useState(null);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");

      // Search by email
      const emailQuery = query(
        usersRef,
        where("email", "==", searchTerm.toLowerCase())
      );
      const emailSnapshot = await getDocs(emailQuery);

      // Search by phone (if it looks like a phone number)
      const phoneQuery =
        searchTerm.startsWith("+") || /^\d+$/.test(searchTerm)
          ? query(usersRef, where("phoneNumber", "==", searchTerm))
          : null;
      const phoneSnapshot = phoneQuery ? await getDocs(phoneQuery) : null;

      // Search by display name (partial match)
      const nameQuery = query(
        usersRef,
        where("displayName", ">=", searchTerm),
        where("displayName", "<=", searchTerm + "\uf8ff")
      );
      const nameSnapshot = await getDocs(nameQuery);

      const results = new Map();

      // Combine results
      [emailSnapshot, phoneSnapshot, nameSnapshot].forEach((snapshot) => {
        if (snapshot) {
          snapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            // Don't include current user in results
            if (userData.uid !== currentUser.uid) {
              results.set(userData.uid, userData);
            }
          });
        }
      });

      setSearchResults(Array.from(results.values()));
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addContact = async (userToAdd) => {
    setAddingContact(userToAdd.uid);
    try {
      // Get current user's contacts
      const currentContacts = currentUser.contacts || [];

      // Check if already a contact
      if (currentContacts.includes(userToAdd.uid)) {
        alert("User is already in your contacts");
        return;
      }

      // Add to current user's contacts
      const updatedContacts = [...currentContacts, userToAdd.uid];
      const result = await updateDocument("users", currentUser.uid, {
        contacts: updatedContacts,
      });

      if (result.success) {
        onContactAdded(userToAdd);
        setSearchTerm("");
        setSearchResults([]);
        alert(`${userToAdd.displayName} added to contacts!`);
      } else {
        alert("Failed to add contact: " + result.error);
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("Failed to add contact");
    } finally {
      setAddingContact(null);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounce search
    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Add New Contact</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by email, phone, or name..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200"
          />
          {isSearching && (
            <Loader
              size={16}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin"
            />
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {searchResults.length === 0 && searchTerm && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
              <p>No users found</p>
              <p className="text-sm">
                Try searching with email or phone number
              </p>
            </div>
          )}

          {searchResults.map((user) => (
            <div
              key={user.uid}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                <Avatar
                  src={user.avatar}
                  alt={user.displayName}
                  size="md"
                  status={user.status}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    {user.displayName}
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    {user.email && (
                      <div className="flex items-center space-x-1">
                        <Mail size={12} />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="flex items-center space-x-1">
                        <Phone size={12} />
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  {user.bio && (
                    <div className="text-xs text-gray-400 truncate mt-1">
                      {user.bio}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => addContact(user)}
                disabled={addingContact === user.uid}
                className="ml-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {addingContact === user.uid ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {searchTerm === "" && (
          <div className="text-center py-8 text-gray-500">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>Search for users to add as contacts</p>
            <p className="text-sm">Enter email, phone number, or name</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddContactModal;
