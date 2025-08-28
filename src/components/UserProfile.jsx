import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Edit2,
  Camera,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Upload,
  AlertCircle,
} from "lucide-react";
import Avatar from "./Avatar";
import { updateDocument } from "../firestore/helpers";
import { uploadToCloudinary, validateImageFile } from "../utils/cloudinary";
import { isValidStorageUrl, getSafeAvatarUrl } from "../utils/cleanupBlobUrls";

// Simple image cropper implementation
const ImageCropper = ({ image, onCropComplete, onCancel }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleCropSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const size = 400;
      canvas.width = size;
      canvas.height = size;

      const scale = Math.min(size / img.width, size / img.height) * zoom;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      const x = (size - scaledWidth) / 2 + offset.x;
      const y = (size - scaledHeight) / 2 + offset.y;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
        },
        "image/jpeg",
        0.9
      );
    };

    img.crossOrigin = "anonymous";
    img.src = image;
  }, [image, zoom, offset, onCropComplete]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Crop Image</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden relative">
            <img
              src={image}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-contain transition-transform select-none"
              style={{
                transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
            <div className="absolute inset-4 border-2 border-white rounded-full shadow-lg pointer-events-none" />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center justify-between text-sm font-medium mb-2">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </label>
          <div className="flex items-center space-x-2">
            <ZoomOut size={16} />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
            <ZoomIn size={16} />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCropSave}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const UserProfile = ({ user, isOpen, onClose, onUpdateProfile }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setTempName(user.displayName || "");
    }
  }, [user]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cleanup blob URLs on unmount and when preview changes
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  if (!isOpen || !user) return null;

  const handleNameSave = async () => {
    if (!tempName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    if (tempName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    try {
      await onUpdateProfile({ displayName: tempName.trim() });
      setIsEditingName(false);
      setSuccess("Name updated successfully!");
    } catch (err) {
      console.error("Name update error:", err);
      setError("Failed to update name");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Clean up previous blob URL if it exists
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }

      // Create preview using FileReader (data URL) instead of createObjectURL
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result); // This is a data URL, not blob URL
        setShowCropper(true);
      };
      reader.onerror = () => {
        setError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File handling error:", err);
      setError("Failed to process image file");
    }
  };

  const uploadCroppedImage = async (croppedBlob) => {
    setUploading(true);
    setShowCropper(false);
    setError("");
    setUploadProgress(0);

    // Clean up preview image since we're done with cropper
    if (previewImage) {
      if (previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(null);
    }

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

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(croppedBlob, {
        folder: "berrychat/avatars",
        tags: ["avatar", "profile", user.uid],
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Get the final URL - use eager URL if available for better performance
      const finalAvatarUrl = uploadResult.eagerUrl || uploadResult.url;

      // CRITICAL: Validate the URL before storing
      if (!isValidStorageUrl(finalAvatarUrl)) {
        throw new Error("Invalid URL received from upload service");
      }

      // Update Firestore document
      await updateDocument(`users/${user.uid}`, {
        avatar: finalAvatarUrl,
        avatarPublicId: uploadResult.publicId,
        updatedAt: new Date(),
      });

      // Update local user profile
      await onUpdateProfile({
        avatar: finalAvatarUrl,
        avatarPublicId: uploadResult.publicId,
      });

      setSuccess("Profile picture updated successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // Clean up preview image when canceling
    if (previewImage) {
      if (previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && isEditingName) {
      handleNameSave();
    }
    if (e.key === "Escape" && isEditingName) {
      setTempName(user.displayName || "");
      setIsEditingName(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close profile"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {/* Status Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start space-x-2">
                <AlertCircle
                  size={18}
                  className="text-red-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-start space-x-2">
                <Check
                  size={18}
                  className="text-green-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-green-200 text-sm">{success}</span>
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <Avatar
                  src={getSafeAvatarUrl(user)} // Use the safe getter
                  alt={user?.displayName || "User"}
                  size="3xl"
                  status="online"
                  loading={uploading}
                />

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`absolute -bottom-2 -right-2 w-10 h-10 ${
                    uploading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 active:scale-95"
                  } rounded-full flex items-center justify-center transition-all shadow-lg`}
                  aria-label="Change profile picture"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white" />
                  )}
                </button>
              </div>

              {uploading && (
                <div className="w-full mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">
                      Uploading image...
                    </span>
                    <span className="text-sm text-gray-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Name Section */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400 font-medium">
                    Display Name
                  </label>
                  {!isEditingName && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Edit name"
                    >
                      <Edit2 size={16} className="text-gray-400" />
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your name"
                      autoFocus
                      maxLength={50}
                      disabled={uploading}
                    />
                    <button
                      onClick={handleNameSave}
                      disabled={!tempName.trim() || uploading}
                      className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                      aria-label="Save name"
                    >
                      <Check size={16} className="text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setTempName(user.displayName || "");
                        setIsEditingName(false);
                        setError("");
                      }}
                      disabled={uploading}
                      className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="Cancel editing"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <p className="text-white text-lg">
                    {user?.displayName || "Add your name"}
                  </p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm text-gray-400 font-medium mb-2">
                  Email
                </label>
                <p className="text-gray-300 bg-gray-800/50 px-3 py-2 rounded-lg">
                  {user?.email || "No email"}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-gray-400 font-medium mb-2">
                  Status
                </label>
                <p className="text-green-400 text-sm">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && previewImage && (
        <ImageCropper
          image={previewImage}
          onCropComplete={uploadCroppedImage}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
};

export default UserProfile;
