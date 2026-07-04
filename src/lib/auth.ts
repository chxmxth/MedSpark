import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export async function signInWithGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) {
        throw new Error("No ID token returned from native Google sign-in.");
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } else {
      const response = await signInWithPopup(auth, googleProvider);
      return response.user;
    }
  } catch (error) {
    console.error("Authentication failed: ", error);
    throw error;
  }
}

export async function logOutUser() {
  try {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
    await signOut(auth);
  } catch (error) {
    console.error("Sign out transaction failed: ", error);
    throw error;
  }
}
