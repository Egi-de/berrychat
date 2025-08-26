// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  resetPassword,
} from "../auth/emailAuth";
import { signInWithGooglePopup } from "../auth/googleAuth";
import {
  setupRecaptcha,
  sendVerificationCode,
  verifyCode,
} from "../auth/phoneAuth";

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Clear error function
  const clearError = () => setError(null);

  // Email/Password signup
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await signUpWithEmail(email, password);

      if (result.success && displayName) {
        // Update display name if provided
        await result.user.updateProfile({ displayName });
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Email/Password login
  const login = async (email, password) => {
    try {
      setError(null);
      return await signInWithEmail(email, password);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    try {
      setError(null);
      return await signInWithGooglePopup();
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Phone auth setup
  const setupPhoneAuth = (containerId) => {
    try {
      setError(null);
      setupRecaptcha(containerId);
    } catch (err) {
      setError(err.message);
    }
  };

  // Send phone verification code
  const sendPhoneCode = async (phoneNumber) => {
    try {
      setError(null);
      return await sendVerificationCode(phoneNumber);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Verify phone code
  const verifyPhoneCode = async (confirmationResult, code) => {
    try {
      setError(null);
      return await verifyCode(confirmationResult, code);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Reset password
  const resetUserPassword = async (email) => {
    try {
      setError(null);
      return await resetPassword(email);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      return await signOutUser();
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    setupPhoneAuth,
    sendPhoneCode,
    verifyPhoneCode,
    resetUserPassword,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
