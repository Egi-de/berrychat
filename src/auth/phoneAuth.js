import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/config";

// Initialize reCAPTCHA
export const setupRecaptcha = (containerId) => {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal",
    callback: (response) => {
      // reCAPTCHA solved - will proceed with submit function
    },
    "expired-callback": () => {
      // Response expired - user needs to solve reCAPTCHA again
    },
  });
};

// Send verification code
export const sendVerificationCode = async (phoneNumber) => {
  try {
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    return { success: true, confirmationResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Verify code and sign in
export const verifyCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
