import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Camera,
  Phone,
  Edit3,
  Check,
  AlertCircle,
  Loader,
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import { createDocumentWithId } from "../firestore/helpers";
import { useAuth } from "../hooks/useAuth";
import { uploadToCloudinary, validateImageFile } from "../utils/cloudinary";

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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (formData.displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }

    if (
      formData.phoneNumber &&
      !/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ""))
    ) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let avatarUrl = formData.avatar;
      let avatarPublicId = null;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);

          const uploadResult = await uploadToCloudinary(avatarFile, {
            folder: "berrychat/avatars",
            transformation: "c_fill,w_400,h_400,q_auto,f_auto",
            tags: ["avatar", "profile", currentUser.uid],
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (uploadResult.success) {
            avatarUrl = uploadResult.url;
            avatarPublicId = uploadResult.publicId;

            // CRITICAL: Clean up blob URL after successful upload
            if (avatarPreview && avatarPreview.startsWith("blob:")) {
              URL.revokeObjectURL(avatarPreview);
              setAvatarPreview(null);
            }
          } else {
            throw new Error(uploadResult.error);
          }
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          setError(
            "Failed to upload avatar. Profile will be created without it."
          );
          avatarUrl = null;
          avatarPublicId = null;

          // Clean up blob URL on upload failure
          if (avatarPreview && avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
          }
        }
      }

      // CRITICAL: Never store blob URLs in the database
      // Only store the final uploaded URL or null
      const finalAvatarUrl =
        avatarUrl && !avatarUrl.startsWith("blob:") ? avatarUrl : null;

      // Create user profile document
      const userProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        bio: formData.bio.trim(),
        avatar: finalAvatarUrl, // Use final URL, not blob URL
        avatarPublicId: avatarPublicId,
        status: "online",
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        contacts: [],
        settings: {
          notifications: true,
          darkMode: true,
          language: "en",
        },
      };

      const result = await createDocumentWithId(
        "users",
        currentUser.uid,
        userProfile
      );

      if (result.success) {
        // Update Firebase Auth profile
        try {
          await updateProfile(auth.currentUser, {
            displayName: formData.displayName.trim(),
            photoURL: finalAvatarUrl,
          });
        } catch (authUpdateError) {
          console.error("Auth profile update failed:", authUpdateError);
          // Continue anyway as the main profile was created
        }

        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("Profile setup error:", err);
      setError(err.message || "Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file using our utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Clean up previous blob URL if it exists
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);

    // Create preview using createObjectURL
    try {
      const blobUrl = URL.createObjectURL(file);
      setAvatarPreview(blobUrl);
    } catch (err) {
      console.error("Failed to create image preview:", err);
      setError("Failed to preview image file");
    }
  };

  const removeAvatar = () => {
    // Clean up blob URL if it exists
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSkip = () => {
    if (formData.displayName.trim()) {
      const syntheticEvent = {
        preventDefault: () => {},
      };
      handleSubmit(syntheticEvent);
    } else {
      setError("Display name is required to continue");
    }
  };

  // Use preview for display, but ensure we don't pass blob URLs to Avatar component unnecessarily
  const displayAvatar = avatarPreview || formData.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
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

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50"
        >
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle
                  size={18}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Profile Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn(
                          "Profile preview failed to load:",
                          displayAvatar
                        );
                        // Don't try to manipulate DOM, just hide the image
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={`absolute -bottom-1 -right-1 w-8 h-8 ${
                    isLoading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-purple-500 hover:bg-purple-600 active:scale-95"
                  } rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={16} className="text-white" />
                  )}
                </button>

                {displayAvatar && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    disabled={isLoading}
                    className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
                    aria-label="Remove avatar"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {isLoading && uploadProgress > 0 && (
                <div className="mt-4 w-full max-w-xs mx-auto">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Uploading...</span>
                    <span className="text-sm text-gray-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Click to upload a profile picture (max 10MB)
              </p>
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
                  placeholder="Your display name"
                  disabled={isLoading}
                  maxLength={50}
                  required
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.displayName.length}/50
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    handleInputChange("phoneNumber", e.target.value);
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200"
                  placeholder="+1 (555) 123-4567"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This helps friends find you on BerryChat
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Me
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Setting up your profile...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>Complete Setup</span>
                </>
              )}
            </button>

            {/* Skip Option */}
            {!isLoading && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Skip additional details
              </button>
            )}
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            By continuing, you agree to BerryChat's Terms of Service and Privacy
            Policy.
            <br />
            You can update this information later in settings.
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileSetup;
