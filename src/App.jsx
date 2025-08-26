import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./hooks/useAuth";

// Import your authentication pages
import WelcomePage from "./components/WelcomePage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignUpPage";
import PhoneAuthPage from "./components/PhoneAuthPage";
import UserProfileSetup from "./components/UserProfileSetup";

// Import your main chat components
import ChatApp from "./components/ChatApp";

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-25 to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
        <MessageCircle size={24} className="text-white" />
      </div>
      <p className="text-gray-600">Loading BerryChat...</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { currentUser, loading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check if user has completed profile setup
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!currentUser) {
        setProfileLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
        } else {
          setUserProfile(null); // User needs to complete profile
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (currentUser) {
      checkUserProfile();
    }
  }, [currentUser]);

  const handleProfileComplete = () => {
    // Reload user profile after completion
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    loadProfile();
  };

  if (loading || profileLoading) return <LoadingScreen />;

  // If user is authenticated but hasn't completed profile setup
  if (currentUser && !userProfile) {
    return <UserProfileSetup onComplete={handleProfileComplete} />;
  }

  // If user is authenticated and has profile, show chat app
  if (currentUser && userProfile) {
    return <ChatApp />;
  }

  // If not authenticated, redirect to welcome
  return <Navigate to="/welcome" replace />;
};

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return currentUser ? children : <Navigate to="/welcome" replace />;
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return currentUser ? <Navigate to="/chat" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - only accessible when not authenticated */}
          <Route
            path="/welcome"
            element={
              <PublicRoute>
                <WelcomePage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/phone-auth"
            element={
              <PublicRoute>
                <PhoneAuthPage />
              </PublicRoute>
            }
          />

          {/* Protected routes - handles profile setup flow automatically */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
