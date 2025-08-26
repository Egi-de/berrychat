import React, { useState } from "react";
import { User, Camera, Phone, Edit3, Check } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import { createDocumentWithId } from "../firestore/helpers";
import { useAuth } from "../hooks/useAuth";

const UserProfileSetup = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    phoneNumber: currentUser?.phoneNumber || "",
    bio: "Hey there! I am using BerryChat.",
    avatar: currentUser?.photoURL || null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create user profile document
      const userProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
        status: "online",
        lastSeen: new Date(),
        createdAt: new Date(),
        contacts: [],
      };

      const result = await createDocumentWithId(
        "users",
        currentUser.uid,
        userProfile
      );

      if (result.success) {
        // Update Firebase Auth profile using the auth object directly
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName.trim(),
          photoURL: formData.avatar,
        });

        onComplete();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, create a local URL. In production, upload to Firebase Storage
      const avatarUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-25 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <User size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Help others recognize you on BerryChat
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50">
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 hover:scale-110">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <div className="relative">
                <Edit3
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    handleInputChange("displayName", e.target.value)
                  }
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200"
                  placeholder="Your name"
                  disabled={isLoading}
                  maxLength={25}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.displayName.length}/25
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200"
                  placeholder="+1234567890"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200 resize-none"
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={isLoading}
                maxLength={139}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.bio.length}/139
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !formData.displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Setting up profile...</span>
              ) : (
                <>
                  <Check size={20} />
                  <span>Complete Setup</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center mt-4 text-xs text-gray-500">
            You can update this information later in settings
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;
