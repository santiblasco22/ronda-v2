import { collection, doc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ProAccountRequest, UserProfile } from '@/types/models';

function proRequestsCol() {
  return collection(db, 'pro_account_requests');
}

function fromSnapshot(id: string, data: Record<string, unknown>): ProAccountRequest {
  return {
    id,
    userId: data.userId as string,
    userUsername: data.userUsername as string,
    userDisplayName: data.userDisplayName as string,
    message: (data.message as string) ?? '',
    status: data.status as ProAccountRequest['status'],
    reviewerNote: (data.reviewerNote as string | null) ?? null,
    createdAt: Number(data.createdAt ?? Date.now()),
    reviewedAt: (data.reviewedAt as number | null) ?? null,
  };
}

export async function getLatestProRequest(uid: string): Promise<ProAccountRequest | null> {
  const q = query(
    proRequestsCol(),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const first = snap.docs[0]!;
  return fromSnapshot(first.id, first.data());
}

export async function createProRequest(user: UserProfile, message: string): Promise<void> {
  const newRef = doc(proRequestsCol());
  await setDoc(newRef, {
    userId: user.uid,
    userUsername: user.username,
    userDisplayName: user.displayName,
    message: message.trim(),
    status: 'pending',
    reviewerNote: null,
    createdAt: Date.now(),
    reviewedAt: null,
  });
}
