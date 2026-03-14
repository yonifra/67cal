import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types';

export async function createUserProfile(
  uid: string,
  data: { displayName: string; email: string; role: UserRole }
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    // Profile already exists (race condition from onAuthStateChanged) — update role
    await updateDoc(ref, { role: data.role });
  } else {
    await setDoc(ref, {
      uid,
      displayName: data.displayName,
      email: data.email,
      role: data.role,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; avatarStyle?: string; avatarSeed?: string }
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getUserProfiles(uids: string[]): Promise<UserProfile[]> {
  if (uids.length === 0) return [];
  const profiles: UserProfile[] = [];
  for (const uid of uids) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      profiles.push(docSnap.data() as UserProfile);
    }
  }
  return profiles;
}
