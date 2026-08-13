import { readFileSync } from 'node:fs';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

export const PROJECT_ID = 'demo-ronda-rules';

export async function createTestEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

export function userDoc(uid, overrides = {}) {
  return {
    email: `${uid}@example.com`,
    username: uid,
    usernameLower: uid,
    displayName: `Usuario ${uid}`,
    bio: '',
    avatarUrl: null,
    city: 'Córdoba',
    socialLinks: {},
    isPro: false,
    proSince: null,
    listingCount: 0,
    activeListingCount: 0,
    followerCount: 0,
    followingCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  };
}

export function listingDoc(sellerId, overrides = {}) {
  return {
    sellerId,
    sellerUsername: sellerId,
    sellerDisplayName: `Usuario ${sellerId}`,
    sellerAvatarUrl: null,
    sellerIsPro: false,
    title: 'Campera de jean',
    description: 'Casi nueva',
    price: 8000,
    category: 'Camperas',
    size: 'M',
    condition: 'Como nuevo',
    color: 'Azul',
    city: 'Córdoba',
    photos: [],
    status: 'active',
    likeCount: 0,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  };
}

/** Siembra documentos salteando las reglas (estado inicial de cada test). */
export async function seed(testEnv, entries) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [path, data] of entries) {
      const segments = path.split('/');
      await setDoc(doc(db, ...segments), data);
    }
  });
}
