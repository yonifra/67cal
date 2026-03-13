import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarEvent, EventFormData } from '@/types';
import { detectMeetingProvider } from '@/lib/meetingProvider';

function eventsRef(calendarId: string) {
  return collection(db, 'calendars', calendarId, 'events');
}

export async function createEvent(
  calendarId: string,
  data: EventFormData
): Promise<string> {
  const docRef = await addDoc(eventsRef(calendarId), {
    title: data.title,
    description: data.description,
    startTime: Timestamp.fromDate(new Date(data.startTime)),
    endTime: Timestamp.fromDate(new Date(data.endTime)),
    meetingLink: data.meetingLink,
    meetingProvider: detectMeetingProvider(data.meetingLink),
    status: 'active',
    cancelReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getEvent(
  calendarId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const docSnap = await getDoc(doc(db, 'calendars', calendarId, 'events', eventId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as CalendarEvent;
}

export async function getCalendarEvents(calendarId: string): Promise<CalendarEvent[]> {
  const q = query(eventsRef(calendarId), orderBy('startTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CalendarEvent));
}

export function subscribeToEvents(
  calendarId: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const q = query(eventsRef(calendarId), orderBy('startTime', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CalendarEvent));
    callback(events);
  });
}

export async function updateEvent(
  calendarId: string,
  eventId: string,
  data: Partial<EventFormData>
): Promise<void> {
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.startTime) {
    updateData.startTime = Timestamp.fromDate(new Date(data.startTime));
  }
  if (data.endTime) {
    updateData.endTime = Timestamp.fromDate(new Date(data.endTime));
  }
  if (data.meetingLink) {
    updateData.meetingProvider = detectMeetingProvider(data.meetingLink);
  }
  await updateDoc(doc(db, 'calendars', calendarId, 'events', eventId), updateData);
}

export async function cancelEvent(
  calendarId: string,
  eventId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId, 'events', eventId), {
    status: 'cancelled',
    cancelReason: reason,
    updatedAt: serverTimestamp(),
  });
}
