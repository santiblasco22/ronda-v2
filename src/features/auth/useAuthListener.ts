import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

import { getUserProfile } from '@/features/users/usersApi';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';

/**
 * Escucha los cambios de sesión de Firebase Auth y sincroniza el store global
 * con el perfil de Firestore correspondiente. Debe montarse una sola vez en
 * la raíz de la app.
 */
export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        reset();
        setInitializing(false);
        return;
      }

      setSession(firebaseUser.uid, firebaseUser.email);
      try {
        const profile = await getUserProfile(firebaseUser.uid);
        setProfile(profile);
      } catch (error) {
        console.warn('[Ronda] No se pudo cargar el perfil de Firestore', error);
        setProfile(null);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
