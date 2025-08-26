import React, { useState, useEffect, useRef } from "react";
import { MicOff, Trash2 } from "lucide-react";

const VoiceRecorder = ({ onStop, onCancel, isRecording }) => {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setDuration(0);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-full shadow-lg backdrop-blur-sm">
      {/* Recording indicator */}
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
        <span className="text-red-600 font-mono text-lg font-bold tracking-wider">
          {formatTime(duration)}
        </span>
      </div>

      {/* Waveform animation */}
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-red-400 rounded-full animate-pulse`}
            style={{
              height: `${Math.random() * 20 + 10}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onCancel}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
          title="Cancel recording"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onStop}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
          title="Send recording"
        >
          <MicOff size={16} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
