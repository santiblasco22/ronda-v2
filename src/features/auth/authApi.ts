import {
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateFirebaseProfile(credential.user, { displayName: displayName.trim() });
  }
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ese email ya está registrado. Probá iniciar sesión.';
    case 'auth/invalid-email':
      return 'El email ingresado no es válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Esperá un momento y volvé a intentar.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil.';
    default:
      return 'Ocurrió un error. Volvé a intentarlo.';
  }
}
