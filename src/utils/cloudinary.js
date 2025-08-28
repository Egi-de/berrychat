export const CLOUDINARY_CONFIG = {
  cloudName: "dsbhwgvka",
  uploadPreset: "berrychat_avatars",
};

/**
 * Upload any file type to Cloudinary using unsigned upload
 * @param {File|Blob} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadToCloudinary = async (file, options = {}) => {
  const {
    folder = "berrychat/avatars",
    tags = ["avatar", "profile"],
    resourceType = "auto",
    publicId,
    uploadPreset = CLOUDINARY_CONFIG.uploadPreset,
  } = options;

  try {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    if (folder) {
      formData.append("folder", folder);
    }

    if (tags.length > 0) {
      formData.append("tags", tags.join(","));
    }

    // Auto-generate public ID if not provided
    const finalPublicId =
      publicId ||
      `${folder.split("/").pop()}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}`;
    formData.append("public_id", finalPublicId);

    // Determine the correct endpoint based on resource type
    let endpoint = "image/upload"; // default

    if (resourceType === "raw") {
      endpoint = "raw/upload";
    } else if (
      resourceType === "video" ||
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/")
    ) {
      endpoint = "video/upload";
    } else if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/") &&
      !file.type.startsWith("audio/")
    ) {
      endpoint = "raw/upload";
    }

    console.log("Cloudinary upload:", {
      fileType: file.type,
      resourceType,
      endpoint,
      fileName: file.name || "unknown",
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${endpoint}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Upload failed";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      duration: data.duration,
      format: data.format,
      bytes: data.bytes,
      resourceType: data.resource_type,
      createdAt: data.created_at,
      eagerUrl: data.eager?.[0]?.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file",
    };
  }
};

export const deleteFromCloudinary = async (publicId) => {
  console.warn(
    "File deletion is not supported with unsigned uploads. " +
      "Implement deletion on your backend server with API credentials."
  );

  return {
    success: false,
    error: "Deletion requires backend implementation with signed requests",
    publicId,
  };
};

/**
 * Generate Cloudinary URL with transformations for images
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed image URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  if (!publicId) {
    throw new Error("Public ID is required");
  }

  const {
    width = 400,
    height = 400,
    crop = "fill",
    quality = "auto",
    format = "auto",
    gravity = "center",
    radius,
    effect,
    overlay,
  } = transformations;

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

  const transforms = [
    `c_${crop}`,
    `w_${width}`,
    `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
  ];

  if (gravity !== "center") {
    transforms.push(`g_${gravity}`);
  }

  if (radius) {
    transforms.push(`r_${radius}`);
  }

  if (effect) {
    transforms.push(`e_${effect}`);
  }

  if (overlay) {
    transforms.push(`l_${overlay}`);
  }

  const transformStr = transforms.join(",");
  return `${baseUrl}/${transformStr}/${publicId}`;
};

/**
 * Generate multiple sizes/formats for responsive images
 * @param {string} publicId - The public ID of the image
 * @param {Array} sizes - Array of size configurations
 * @returns {Object} Object with different size URLs
 */
export const getResponsiveUrls = (publicId, sizes = []) => {
  const defaultSizes = [
    { name: "thumbnail", width: 150, height: 150 },
    { name: "small", width: 400, height: 400 },
    { name: "medium", width: 800, height: 600 },
    { name: "large", width: 1200, height: 900 },
  ];

  const sizesToUse = sizes.length > 0 ? sizes : defaultSizes;

  return sizesToUse.reduce((acc, size) => {
    acc[size.name] = getCloudinaryUrl(publicId, {
      width: size.width,
      height: size.height,
      crop: size.crop || "fill",
      quality: size.quality || "auto",
      format: size.format || "auto",
    });
    return acc;
  }, {});
};

/**
 * Enhanced file validation for different types
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    minWidth = 100,
    minHeight = 100,
  } = options;

  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes
        .map((t) => t.split("/")[1])
        .join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        if (img.width < minWidth || img.height < minHeight) {
          resolve({
            valid: false,
            error: `Image too small. Minimum dimensions: ${minWidth}x${minHeight}px`,
          });
        } else {
          resolve({
            valid: true,
            width: img.width,
            height: img.height,
          });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: false,
          error: "Invalid image file",
        });
      };

      img.src = objectUrl;
    } else {
      resolve({
        valid: true,
      });
    }
  });
};

/**
 * Validate any file type for chat uploads
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateChatFile = (file, options = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB for chat files
    allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"],
    allowedAudioTypes = [
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "audio/webm",
    ],
    allowedDocumentTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  } = options;

  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  const allAllowedTypes = [
    ...allowedImageTypes,
    ...allowedVideoTypes,
    ...allowedAudioTypes,
    ...allowedDocumentTypes,
  ];

  if (!allAllowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  // Additional validation for images
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: true,
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: false,
          error: "Invalid image file",
        });
      };

      img.src = objectUrl;
    });
  }

  return {
    valid: true,
  };
};

/**
 * Helper function to handle upload with validation for chat files
 * @param {File} file - The file to upload
 * @param {Object} options - Combined options for validation and upload
 * @returns {Promise<Object>} Upload result with validation
 */
export const uploadChatFileWithValidation = async (file, options = {}) => {
  const validation = await validateChatFile(file, options.validation);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      stage: "validation",
    };
  }

  const uploadResult = await uploadToCloudinary(file, options.upload);

  if (uploadResult.success) {
    return {
      ...uploadResult,
      validation: {
        originalWidth: validation.width,
        originalHeight: validation.height,
      },
    };
  }

  return uploadResult;
};

/**
 * Helper function to handle upload with validation for avatars
 * @param {File} file - The file to upload
 * @param {Object} options - Combined options for validation and upload
 * @returns {Promise<Object>} Upload result with validation
 */
export const uploadWithValidation = async (file, options = {}) => {
  const validation = await validateImageFile(file, options.validation);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      stage: "validation",
    };
  }

  const uploadResult = await uploadToCloudinary(file, options.upload);

  if (uploadResult.success) {
    return {
      ...uploadResult,
      validation: {
        originalWidth: validation.width,
        originalHeight: validation.height,
      },
    };
  }

  return uploadResult;
};

/**
 * Batch upload multiple files
 * @param {FileList|Array} files - Files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Array of upload results
 */
export const batchUpload = async (files, options = {}) => {
  const fileArray = Array.from(files);
  const results = [];

  for (const [index, file] of fileArray.entries()) {
    try {
      const result = await uploadChatFileWithValidation(file, {
        ...options,
        upload: {
          ...options.upload,
          folder:
            options.upload?.folder || `berrychat/chat/batch_${Date.now()}`,
        },
      });

      results.push({
        index,
        filename: file.name,
        ...result,
      });
    } catch (error) {
      results.push({
        index,
        filename: file.name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};
