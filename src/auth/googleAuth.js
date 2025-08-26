import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth } from "../firebase/config";

const provider = new GoogleAuthProvider();

// Sign in with Google popup
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with Google redirect (better for mobile)
export const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, provider);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
