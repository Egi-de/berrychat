// src/components/auth/WelcomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Heart, Star, Zap } from "lucide-react";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Floating icons animation */}
        <div className="relative mb-12">
          <div className="absolute -top-8 -left-8 text-white/20 animate-bounce">
            <Heart size={32} />
          </div>
          <div className="absolute -top-4 -right-6 text-white/20 animate-pulse">
            <Star size={24} />
          </div>
          <div className="absolute -bottom-6 -left-4 text-white/20 animate-bounce delay-300">
            <Zap size={28} />
          </div>

          {/* Main logo */}
          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl">
            <MessageCircle size={40} className="text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to BerryChat
        </h1>

        <p className="text-white/80 text-lg mb-12 leading-relaxed">
          Connect, chat, and share moments with friends in a beautiful, secure
          environment.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/signup")}
            className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 active:scale-95"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-4 bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-white/30 transform hover:scale-105 transition-all duration-300 active:scale-95"
          >
            I Already Have an Account
          </button>
        </div>

        <div className="mt-12 flex justify-center space-x-8">
          <div className="text-center text-white/60">
            <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <p className="text-sm">Chat</p>
          </div>

          <div className="text-center text-white/60">
            <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center">
              <Heart size={20} />
            </div>
            <p className="text-sm">Connect</p>
          </div>

          <div className="text-center text-white/60">
            <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center">
              <Star size={20} />
            </div>
            <p className="text-sm">Share</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
