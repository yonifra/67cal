import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, AuthorRole } from '@/types';

function messagesRef(calendarId: string, eventId: string) {
  return collection(db, 'calendars', calendarId, 'events', eventId, 'messages');
}

export async function sendMessage(
  calendarId: string,
  eventId: string,
  data: {
    authorId: string;
    authorName: string;
    authorRole: AuthorRole;
    text: string;
  }
): Promise<string> {
  const docRef = await addDoc(messagesRef(calendarId, eventId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteMessage(
  calendarId: string,
  eventId: string,
  messageId: string
): Promise<void> {
  await deleteDoc(doc(db, 'calendars', calendarId, 'events', eventId, 'messages', messageId));
}

export function subscribeToMessages(
  calendarId: string,
  eventId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(messagesRef(calendarId, eventId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    callback(messages);
  });
}
