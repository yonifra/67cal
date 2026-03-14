import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, CalendarFormData, Theme, Language } from '@/types';
import { generateInviteCode } from '@/lib/inviteCodes';
import { hashPassword } from '@/lib/password';

const calendarsRef = collection(db, 'calendars');

export async function createCalendar(
  ownerId: string,
  data: CalendarFormData
): Promise<string> {
  const passwordHash = data.password ? await hashPassword(data.password) : null;
  const docRef = await addDoc(calendarsRef, {
    title: data.title,
    description: data.description,
    ownerId,
    theme: data.theme,
    language: data.language,
    colorMode: data.colorMode || 'light',
    firstDay: data.firstDay ?? 0,
    weekendDays: data.weekendDays || 'sat-sun',
    passwordHash,
    inviteCode: generateInviteCode(),
    collaborators: [],
    collaboratorInviteCode: generateInviteCode(),
    members: [ownerId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getCalendar(calendarId: string): Promise<Calendar | null> {
  const docSnap = await getDoc(doc(db, 'calendars', calendarId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Calendar;
}

export async function getOwnedCalendars(userId: string): Promise<Calendar[]> {
  const q = query(calendarsRef, where('ownerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Calendar));
}

export async function getMemberCalendars(userId: string): Promise<Calendar[]> {
  const q = query(calendarsRef, where('members', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Calendar));
}

export async function updateCalendar(
  calendarId: string,
  data: Partial<CalendarFormData>
): Promise<void> {
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    delete updateData.password;
  } else if (data.password === '') {
    updateData.passwordHash = null;
    delete updateData.password;
  } else {
    delete updateData.password;
  }
  await updateDoc(doc(db, 'calendars', calendarId), updateData);
}

export async function deleteCalendar(calendarId: string): Promise<void> {
  await deleteDoc(doc(db, 'calendars', calendarId));
}

export async function addMember(calendarId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId), {
    members: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeMember(calendarId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId), {
    members: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function getCalendarByInviteCode(inviteCode: string): Promise<Calendar | null> {
  const q = query(calendarsRef, where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Calendar;
}

export async function addCollaborator(calendarId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId), {
    collaborators: arrayUnion(userId),
    members: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeCollaborator(calendarId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId), {
    collaborators: arrayRemove(userId),
    members: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function getCalendarByCollaboratorInviteCode(code: string): Promise<Calendar | null> {
  const q = query(calendarsRef, where('collaboratorInviteCode', '==', code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Calendar;
}

export async function getCollaboratorCalendars(userId: string): Promise<Calendar[]> {
  const q = query(calendarsRef, where('collaborators', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Calendar));
}

export async function regenerateCollaboratorInviteCode(calendarId: string): Promise<string> {
  const newCode = generateInviteCode();
  await updateDoc(doc(db, 'calendars', calendarId), {
    collaboratorInviteCode: newCode,
    updatedAt: serverTimestamp(),
  });
  return newCode;
}
