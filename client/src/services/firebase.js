import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.apps.firebasestorage.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Get the Google ID token
    const idToken = await user.getIdToken()
    
    return {
      googleId: user.uid,
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL,
      idToken
    }
  } catch (error) {
    console.error('Google Sign In Error:', error)
    throw error
  }
}

// Sign Out
export const signOutGoogle = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Sign Out Error:', error)
    throw error
  }
}

export { auth }
export default app
