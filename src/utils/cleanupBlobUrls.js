import { getDocs, updateDoc, doc, collection } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Clean up invalid blob URLs from user profiles in the database
 * This should be run once to fix existing data
 */
export const cleanupBlobUrlsFromDatabase = async () => {
  try {
    console.log("Starting cleanup of blob URLs from database...");

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const updates = [];

    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();

      // Check if avatar is a blob URL
      if (userData.avatar && userData.avatar.startsWith("blob:")) {
        console.log(`Found blob URL for user ${userDoc.id}:`, userData.avatar);

        // Update this user's avatar to null
        updates.push(
          updateDoc(doc(db, "users", userDoc.id), {
            avatar: null,
            avatarPublicId: null,
            updatedAt: new Date(),
          })
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Cleaned up ${updates.length} blob URLs from database`);
      return {
        success: true,
        cleanedCount: updates.length,
        message: `Successfully cleaned ${updates.length} invalid avatar URLs`,
      };
    } else {
      console.log("No blob URLs found in database");
      return {
        success: true,
        cleanedCount: 0,
        message: "No invalid URLs found to clean",
      };
    }
  } catch (error) {
    console.error("Error cleaning up blob URLs:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to clean up invalid URLs",
    };
  }
};

/**
 * Validate that a URL is not a blob URL before storing
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid for storage
 */
export const isValidStorageUrl = (url) => {
  if (!url) return true; // null/undefined is fine

  // Check if it's a blob URL
  if (url.startsWith("blob:")) {
    console.error("Attempt to store blob URL detected:", url);
    return false;
  }

  // Check if it's a data URL
  if (url.startsWith("data:")) {
    console.error("Attempt to store data URL detected:", url);
    return false;
  }

  // Check if it looks like a valid HTTP(S) URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Safe avatar URL getter that filters out invalid URLs
 * @param {Object} user - User object from database
 * @returns {string|null} - Valid avatar URL or null
 */
export const getSafeAvatarUrl = (user) => {
  const avatarUrl = user?.avatar;

  if (!avatarUrl) return null;

  if (!isValidStorageUrl(avatarUrl)) {
    console.warn("Invalid avatar URL detected for user:", user?.uid, avatarUrl);
    return null;
  }

  return avatarUrl;
};

/**
 * Hook to periodically check and clean invalid URLs from local state
 */
export const useAvatarUrlCleaner = (users, setUsers) => {
  const cleanLocalAvatarUrls = () => {
    if (!users || users.length === 0) return;

    let hasChanges = false;
    const cleanedUsers = users.map((user) => {
      if (user.avatar && !isValidStorageUrl(user.avatar)) {
        console.warn(
          "Cleaning invalid avatar URL from local state:",
          user.avatar
        );
        hasChanges = true;
        return { ...user, avatar: null, avatarPublicId: null };
      }
      return user;
    });

    if (hasChanges && setUsers) {
      setUsers(cleanedUsers);
    }
  };

  return { cleanLocalAvatarUrls };
};
