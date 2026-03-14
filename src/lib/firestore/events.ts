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
  if (!data.repeatDays?.length || !data.repeatUntil) {
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

  // Recurring event — expand occurrences on selected days of the week
  const repeatUntilDate = new Date(data.repeatUntil + 'T23:59:59');
  const recurrenceGroupId = crypto.randomUUID();
  const batch = writeBatch(db);
  const MAX_DAYS = 364; // 52 weeks cap

  let firstDocId: string | null = null;
  let index = 0;

  // Iterate day-by-day from start date up to repeatUntilDate (capped at MAX_DAYS)
  const currentDay = new Date(startDate);
  const endCap = new Date(startDate.getTime() + MAX_DAYS * 24 * 60 * 60 * 1000);
  const effectiveEnd = repeatUntilDate < endCap ? repeatUntilDate : endCap;

  while (currentDay <= effectiveEnd) {
    if (data.repeatDays.includes(currentDay.getDay())) {
      // Build start/end for this occurrence, preserving the original time-of-day
      const occurrenceStart = new Date(currentDay);
      occurrenceStart.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
      const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);

      const docRefForOccurrence = doc(eventsRef(calendarId));
      if (index === 0) {
        firstDocId = docRefForOccurrence.id;
      }

      batch.set(docRefForOccurrence, {
        title: data.title,
        description: data.description,
        startTime: Timestamp.fromDate(occurrenceStart),
        endTime: Timestamp.fromDate(occurrenceEnd),
        meetingLink: data.meetingLink,
        meetingProvider,
        status: 'active',
        cancelReason: null,
        recurrenceGroupId,
        recurrenceIndex: index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      index++;
    }

    // Advance by 1 day
    currentDay.setDate(currentDay.getDate() + 1);
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
  data: Partial<EventFormData>,
  userId?: string
): Promise<void> {
  // Strip repeatUntil and repeatDays — they're only used during creation, not updates
  const { repeatUntil, repeatDays, ...rest } = data as EventFormData;
  const updateData: Record<string, any> = {
    ...rest,
    updatedAt: serverTimestamp(),
  };
  if (userId) {
    updateData.updatedBy = userId;
  }
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
  reason: string,
  userId?: string
): Promise<void> {
  const updateData: Record<string, any> = {
    status: 'cancelled',
    cancelReason: reason,
    updatedAt: serverTimestamp(),
  };
  if (userId) {
    updateData.updatedBy = userId;
  }
  await updateDoc(doc(db, 'calendars', calendarId, 'events', eventId), updateData);
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
