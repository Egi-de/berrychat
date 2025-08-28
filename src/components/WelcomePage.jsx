// src/components/auth/WelcomePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  MessageCircle,
  Heart,
  Star,
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

const WelcomePage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { signup, loginWithGoogle, error, clearError } = useAuth();

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Full name is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.password) errors.password = "Password is required";
    if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (error) clearError();
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
    } catch (err) {
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Google signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3A0CA3] via-[#4361EE] to-[#4CC9F0] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Welcome Content */}
          <div className="text-center lg:text-left">
            {/* Floating icons animation */}
            <div className="relative mb-8">
              <div className="absolute -top-8 -left-8 text-[#F7F9FC]/20 animate-bounce">
                <Heart size={32} />
              </div>
              <div className="absolute -top-4 -right-6 text-[#F7F9FC]/20 animate-pulse">
                <Star size={24} />
              </div>
              <div className="absolute -bottom-6 -left-4 text-[#F7F9FC]/20 animate-bounce delay-300">
                <Zap size={28} />
              </div>

              {/* Main logo */}
              <div className="w-20 h-20 mx-auto lg:mx-0 bg-[#F7F9FC]/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl">
                <MessageCircle size={36} className="text-[#F7F9FC]" />
              </div>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-[#F7F9FC] mb-6">
              Welcome to BerryChat
            </h1>

            <p className="text-[#F7F9FC]/80 text-xl mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Connect, chat, and share moments with friends in a beautiful, secure environment.
            </p>

            {/* Features */}
            <div className="flex justify-center lg:justify-start space-x-8 mb-8">
              <div className="text-center text-[#F7F9FC]/60">
                <div className="w-12 h-12 mx-auto mb-2 bg-[#F7F9FC]/10 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <p className="text-sm">Chat</p>
              </div>

              <div className="text-center text-[#F7F9FC]/60">
                <div className="w-12 h-12 mx-auto mb-2 bg-[#F7F9FC]/10 rounded-full flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <p className="text-sm">Connect</p>
              </div>

              <div className="text-center text-[#F7F9FC]/60">
                <div className="w-12 h-12 mx-auto mb-2 bg-[#F7F9FC]/10 rounded-full flex items-center justify-center">
                  <Star size={20} />
                </div>
                <p className="text-sm">Share</p>
              </div>
            </div>

            {/* Login Link for existing users */}
            <p className="text-[#F7F9FC]/60 text-lg">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#F7F9FC] font-semibold hover:underline"
              >
                Log In
              </button>
            </p>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-[#F7F9FC]/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-[#F7F9FC]/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[#F7F9FC] mb-2">
                  Join BerryChat
                </h2>
                <p className="text-[#F7F9FC]/80 text-sm">
                  Create your account to get started
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-[#4361EE]/20 border border-[#4361EE]/30 rounded-2xl flex items-center space-x-3">
                  <AlertCircle size={20} className="text-[#4361EE]" />
                  <span className="text-[#F7F9FC] text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Name Field */}
                <div>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#F7F9FC]/60"
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full pl-12 pr-4 py-3 bg-[#F7F9FC]/10 border border-[#F7F9FC]/20 rounded-2xl text-[#F7F9FC] placeholder-[#F7F9FC]/60 focus:outline-none focus:ring-2 focus:ring-[#4CC9F0]/50 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-[#4361EE] text-xs">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#F7F9FC]/60"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full pl-12 pr-4 py-3 bg-[#F7F9FC]/10 border border-[#F7F9FC]/20 rounded-2xl text-[#F7F9FC] placeholder-[#F7F9FC]/60 focus:outline-none focus:ring-2 focus:ring-[#4CC9F0]/50 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-[#4361EE] text-xs">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#F7F9FC]/60"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="w-full pl-12 pr-12 py-3 bg-[#F7F9FC]/10 border border-[#F7F9FC]/20 rounded-2xl text-[#F7F9FC] placeholder-[#F7F9FC]/60 focus:outline-none focus:ring-2 focus:ring-[#4CC9F0]/50 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#F7F9FC]/60 hover:text-[#F7F9FC] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="mt-1 text-[#4361EE] text-xs">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#F7F9FC]/60"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="w-full pl-12 pr-12 py-3 bg-[#F7F9FC]/10 border border-[#F7F9FC]/20 rounded-2xl text-[#F7F9FC] placeholder-[#F7F9FC]/60 focus:outline-none focus:ring-2 focus:ring-[#4CC9F0]/50 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#F7F9FC]/60 hover:text-[#F7F9FC] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-[#4361EE] text-xs">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#4CC9F0] text-[#0F172A] rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-4 flex items-center">
                <div className="flex-1 border-t border-[#F7F9FC]/20"></div>
                <span className="px-4 text-[#F7F9FC]/60 text-sm">or</span>
                <div className="flex-1 border-t border-[#F7F9FC]/20"></div>
              </div>

              {/* Google Sign Up */}
              <button
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full py-3 bg-[#F7F9FC]/20 border border-[#F7F9FC]/30 text-[#F7F9FC] rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:bg-[#F7F9FC]/30 transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
