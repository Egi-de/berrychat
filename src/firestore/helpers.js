import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

/** ---------------- Firebase Helpers ---------------- **/

// Create document
export const createDocument = async (path, data) => {
  try {
    console.log(
      "Attempting to create document at path:",
      path,
      "with data:",
      data
    );
    const pathParts = path.split("/");
    let collectionRef;

    if (pathParts.length === 1) collectionRef = collection(db, pathParts[0]);
    else if (pathParts.length === 3)
      collectionRef = collection(db, pathParts[0], pathParts[1], pathParts[2]);
    else throw new Error("Invalid path format");

    const docRef = await addDoc(collectionRef, data);
    console.log("Document created successfully with ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating document:", error);
    return { success: false, error: error.message };
  }
};

// Create document with custom ID
export const createDocumentWithId = async (collectionName, docId, data) => {
  try {
    await setDoc(doc(db, collectionName, docId), data);
    return { success: true, id: docId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get document
export const getDocument = async (collectionName, docId) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists())
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    else return { success: false, error: "Document not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all documents in collection
export const getCollection = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    querySnapshot.forEach((doc) =>
      documents.push({ id: doc.id, ...doc.data() })
    );
    return { success: true, data: documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update document
export const updateDocument = async (path, data) => {
  try {
    const pathParts = path.split("/");
    if (pathParts.length !== 2)
      throw new Error("Invalid path format. Use 'collection/docId'");
    const docRef = doc(db, pathParts[0], pathParts[1]);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete document
export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/** ---------------- Cropping Helper ---------------- **/

/**
 * Converts the cropped area from react-easy-crop into a Blob
 * @param {string} imageSrc - base64/image URL
 * @param {object} pixelCrop - {x, y, width, height}
 * @returns {Promise<Blob>}
 */
export const getCroppedImg = (imageSrc, pixelCrop) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";

    image.onload = () => {
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Canvas is empty"));
        else resolve(blob);
      }, "image/png");
    };

    image.onerror = (error) => reject(error);
  });
};
