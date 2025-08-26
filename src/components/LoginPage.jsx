// src/components/auth/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { login, loginWithGoogle, resetUserPassword, error, clearError } =
    useAuth();

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = "Email is required";
    if (!formData.password) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    clearError();

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setFormErrors({ submit: result.error });
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    clearError();

    const result = await loginWithGoogle();

    if (!result.success) {
      setFormErrors({ submit: result.error });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setFormErrors({ email: "Please enter your email address first" });
      return;
    }

    setIsLoading(true);
    clearError();

    const result = await resetUserPassword(formData.email);

    if (result.success) {
      alert("Password reset email sent! Check your inbox.");
    } else {
      setFormErrors({ submit: result.error });
    }

    setIsLoading(false);
  };

  const ErrorMessage = ({ message }) =>
    message ? (
      <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
        <AlertCircle size={16} />
        <span>{message}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-25 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/welcome")}
            className="mb-6 p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>

          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <MessageCircle size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600">Sign in to continue to BerryChat</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 ${
                    formErrors.email ? "border-red-300" : "border-gray-200"
                  } rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              <ErrorMessage message={formErrors.email} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`w-full pl-11 pr-12 py-3 bg-gray-50 border-2 ${
                    formErrors.password ? "border-red-300" : "border-gray-200"
                  } rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <ErrorMessage message={formErrors.password} />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <ErrorMessage message={formErrors.submit || error} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">
                or continue with
              </span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{isLoading ? "Signing in..." : "Google"}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/phone-auth")}
              disabled={isLoading}
              className="w-full py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Phone size={20} />
              <span>Sign in with Phone</span>
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              onClick={() => navigate("/signup")}
              className="text-purple-600 hover:text-purple-700 font-semibold"
              disabled={isLoading}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
