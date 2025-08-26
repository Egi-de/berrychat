import React from "react";
import { Video, File } from "lucide-react";

const MediaPreview = ({ file, onRemove, type }) => (
  <div className="relative inline-block mr-2 mb-2 group">
    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-200 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
      {type === "image" ? (
        <img
          src={URL.createObjectURL(file)}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      ) : type === "video" ? (
        <div className="text-purple-500 bg-purple-50 p-3 rounded-full">
          <Video size={24} />
        </div>
      ) : (
        <div className="text-gray-600 bg-gray-100 p-3 rounded-full">
          <File size={24} />
        </div>
      )}
    </div>
    <button
      onClick={onRemove}
      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transform hover:scale-110 transition-all duration-200 active:scale-95"
    >
      ×
    </button>
    {/* File name tooltip */}
    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-xl truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {file.name}
    </div>
  </div>
);

export default MediaPreview;
