'use client'

import { 
  getAuth as firebaseGetAuth,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPhoneNumber as firebaseSignInWithPhone,
  RecaptchaVerifier,
  User
} from 'firebase/auth'
import { app } from './config'

const auth = firebaseGetAuth(app)

// Export getAuth function for external use
export function getAuth() {
  return auth
}

// Sign in with email/password
export async function signIn(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password)
}

// Sign up with email/password
export async function signUp(email: string, password: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }
  
  return userCredential
}

// Sign out
export async function logOut() {
  return await signOut(auth)
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser
}

// Auth state listener
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// Update user profile
export async function updateUserProfile(data: { displayName?: string; photoURL?: string }) {
  const user = auth.currentUser
  if (!user) throw new Error('No user logged in')
  
  return await updateProfile(user, data)
}

// Send password reset email
export async function resetPassword(email: string) {
  return await sendPasswordResetEmail(auth, email)
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('No user logged in')
  
  // Re-authenticate first
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  
  // Then update password
  return await updatePassword(user, newPassword)
}

// Phone authentication
export async function signInWithPhone(phoneNumber: string, recaptchaContainer: HTMLElement) {
  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
    size: 'invisible'
  })
  
  return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

// Get ID token
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  
  return await user.getIdToken()
}

export { auth }
