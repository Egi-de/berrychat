import React, { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, X, Phone, Mail, Loader } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

import Avatar from "./Avatar";

const AddContactModal = ({ isOpen, onClose, currentUser, onContactAdded }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingContact, setAddingContact] = useState(null);

  const searchUsers = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      const results = new Map();

      // Search by email - exact match
      if (searchTerm.includes("@")) {
        try {
          const emailQuery = query(
            usersRef,
            where("email", "==", searchTerm.toLowerCase())
          );
          const emailSnapshot = await getDocs(emailQuery);
          emailSnapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.uid !== currentUser.uid) {
              results.set(userData.uid, userData);
            }
          });
        } catch (error) {
          console.log("Email search error:", error);
        }
      }

      // Search by phone - exact match
      if (searchTerm.startsWith("+") || /^\d+$/.test(searchTerm)) {
        try {
          const phoneQuery = query(
            usersRef,
            where("phoneNumber", "==", searchTerm)
          );
          const phoneSnapshot = await getDocs(phoneQuery);
          phoneSnapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.uid !== currentUser.uid) {
              results.set(userData.uid, userData);
            }
          });
        } catch (error) {
          console.log("Phone search error:", error);
        }
      }

      // Search by display name - partial match
      if (!searchTerm.includes("@") && !/^\+?\d+$/.test(searchTerm)) {
        try {
          const nameQuery = query(
            usersRef,
            where("displayName", ">=", searchTerm),
            where("displayName", "<=", searchTerm + "\uf8ff")
          );
          const nameSnapshot = await getDocs(nameQuery);
          nameSnapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.uid !== currentUser.uid) {
              results.set(userData.uid, userData);
            }
          });
        } catch (error) {
          console.log("Name search error:", error);
        }
      }

      setSearchResults(Array.from(results.values()));
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, currentUser]);

  // Debounced search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

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

      // Try using Firebase's updateDoc directly
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        contacts: updatedContacts,
      });

      onContactAdded(userToAdd);
      setSearchTerm("");
      setSearchResults([]);
      alert(`${userToAdd.displayName} added to contacts!`);
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("Failed to add contact: " + error.message);
    } finally {
      setAddingContact(null);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setIsSearching(false);
      setAddingContact(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#F7F9FC] rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#0F172A]">Add New Contact</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#4CC9F0]/20 rounded-full transition-all duration-200"
          >
            <X size={20} className="text-[#3A0CA3]" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3A0CA3]/60"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by email, phone, or name..."
            className="w-full pl-11 pr-4 py-3 text-[#0F172A] bg-[#F7F9FC]/50 border-2 border-[#4CC9F0]/30 rounded-xl focus:border-[#4361EE] focus:bg-[#F7F9FC] outline-none transition-all duration-200"
          />
          {isSearching && (
            <Loader
              size={16}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3A0CA3]/60 animate-spin"
            />
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {searchResults.length === 0 && searchTerm && !isSearching && (
            <div className="text-center py-8 text-[#0F172A]/50">
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
              className="flex items-center justify-between p-3 hover:bg-[#4CC9F0]/10 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                <Avatar
                  src={user.avatar}
                  alt={user.displayName}
                  size="md"
                  status={user.status}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0F172A] truncate">
                    {user.displayName}
                  </div>
                </div>
              </div>

              <button
                onClick={() => addContact(user)}
                disabled={addingContact === user.uid}
                className="ml-3 px-4 py-2 bg-gradient-to-r from-[#3A0CA3] to-[#4361EE] hover:from-[#4361EE] hover:to-[#4CC9F0] text-[#F7F9FC] rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
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
          <div className="text-center py-8 text-[#0F172A]/50">
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
