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

// Create document - FIXED VERSION
export const createDocument = async (path, data) => {
  try {
    console.log("Attempting to create document at path:", path);
    console.log("With data:", data);

    // Handle nested collection paths like "chats/chatId/messages"
    const pathParts = path.split("/");
    let collectionRef;

    if (pathParts.length === 1) {
      // Simple collection like "users"
      collectionRef = collection(db, pathParts[0]);
    } else if (pathParts.length === 3) {
      // Nested collection like "chats/chatId/messages"
      collectionRef = collection(db, pathParts[0], pathParts[1], pathParts[2]);
    } else {
      throw new Error(
        "Invalid path format. Use 'collection' or 'collection/docId/subcollection'"
      );
    }

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
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "Document not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all documents in collection
export const getCollection = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update document
export const updateDocument = async (collectionName, docId, data) => {
  try {
    await updateDoc(doc(db, collectionName, docId), data);
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
