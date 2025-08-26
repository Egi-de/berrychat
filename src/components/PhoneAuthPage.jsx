// src/components/auth/PhoneAuthPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Phone, ArrowLeft, MessageCircle, AlertCircle } from "lucide-react";

const PhoneAuthPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("phone");
  const [formData, setFormData] = useState({
    phone: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { setupPhoneAuth, sendPhoneCode, verifyPhoneCode, error, clearError } =
    useAuth();

  const validateForm = (currentStep) => {
    const errors = {};

    if (currentStep === "phone") {
      if (!formData.phone) errors.phone = "Phone number is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!validateForm("phone")) return;

    setIsLoading(true);
    clearError();

    // Setup reCAPTCHA
    setupPhoneAuth("recaptcha-container");

    const result = await sendPhoneCode(formData.phone);

    if (result.success) {
      setConfirmationResult(result.confirmationResult);
      setStep("verify");
    } else {
      setFormErrors({ submit: result.error });
    }

    setIsLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setFormErrors({ code: "Please enter the verification code" });
      return;
    }

    setIsLoading(true);
    clearError();

    const result = await verifyPhoneCode(confirmationResult, verificationCode);

    if (!result.success) {
      setFormErrors({ submit: result.error });
    }

    setIsLoading(false);
  };

  const handleResendCode = () => {
    setStep("phone");
    setVerificationCode("");
    setConfirmationResult(null);
    setFormErrors({});
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
            onClick={() => navigate("/login")}
            className="mb-6 p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>

          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Phone size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {step === "phone" ? "Phone Verification" : "Enter Code"}
          </h2>
          <p className="text-gray-600">
            {step === "phone"
              ? "We'll send you a verification code"
              : "Enter the code we sent to your phone"}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50">
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
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
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 ${
                      formErrors.phone ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200`}
                    placeholder="+1 (555) 123-4567"
                    disabled={isLoading}
                  />
                </div>
                <ErrorMessage message={formErrors.phone} />
                <p className="text-xs text-gray-500 mt-2">
                  Please include country code (e.g., +1 for US)
                </p>
              </div>

              <div id="recaptcha-container"></div>

              <ErrorMessage message={formErrors.submit || error} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "Sending Code..." : "Send Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                    formErrors.code ? "border-red-300" : "border-gray-200"
                  } rounded-xl focus:border-purple-400 focus:bg-white outline-none transition-all duration-200 text-center text-2xl font-mono tracking-widest`}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                />
                <ErrorMessage message={formErrors.code} />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Code sent to {formData.phone}
                </p>
              </div>

              <ErrorMessage message={formErrors.submit || error} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  disabled={isLoading}
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-6">
            <span className="text-gray-600">Want to use email instead? </span>
            <button
              onClick={() => navigate("/login")}
              className="text-purple-600 hover:text-purple-700 font-semibold"
              disabled={isLoading}
            >
              Sign in with Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuthPage;
