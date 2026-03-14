import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch,
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
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);
  const meetingProvider = detectMeetingProvider(data.meetingLink);

  // Calculate duration in ms to apply to each occurrence
  const durationMs = endDate.getTime() - startDate.getTime();

  // Non-recurring event
  if (!data.repeatUntil) {
    const docRef = await addDoc(eventsRef(calendarId), {
      title: data.title,
      description: data.description,
      startTime: Timestamp.fromDate(startDate),
      endTime: Timestamp.fromDate(endDate),
      meetingLink: data.meetingLink,
      meetingProvider,
      status: 'active',
      cancelReason: null,
      recurrenceGroupId: null,
      recurrenceIndex: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // Recurring event — expand weekly occurrences
  const repeatUntilDate = new Date(data.repeatUntil + 'T23:59:59');
  const recurrenceGroupId = crypto.randomUUID();
  const batch = writeBatch(db);
  const MAX_OCCURRENCES = 52;

  let firstDocId: string | null = null;
  let currentStart = new Date(startDate);
  let index = 0;

  while (currentStart <= repeatUntilDate && index < MAX_OCCURRENCES) {
    const currentEnd = new Date(currentStart.getTime() + durationMs);
    const docRefForOccurrence = doc(eventsRef(calendarId));

    if (index === 0) {
      firstDocId = docRefForOccurrence.id;
    }

    batch.set(docRefForOccurrence, {
      title: data.title,
      description: data.description,
      startTime: Timestamp.fromDate(currentStart),
      endTime: Timestamp.fromDate(currentEnd),
      meetingLink: data.meetingLink,
      meetingProvider,
      status: 'active',
      cancelReason: null,
      recurrenceGroupId,
      recurrenceIndex: index,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Advance by 7 days
    currentStart = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    index++;
  }

  await batch.commit();
  return firstDocId!;
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
  // Strip repeatUntil — it's only used during creation, not updates
  const { repeatUntil, ...rest } = data as EventFormData;
  const updateData: Record<string, any> = {
    ...rest,
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

export async function getRecurrenceGroupEvents(
  calendarId: string,
  groupId: string
): Promise<CalendarEvent[]> {
  const q = query(
    eventsRef(calendarId),
    where('recurrenceGroupId', '==', groupId),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
}
