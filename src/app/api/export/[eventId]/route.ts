import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      );
    }

    // Search across all calendars for this event
    const calendarsSnap = await adminDb.collection('calendars').get();
    let eventData: any = null;
    let calendarTitle = '';

    for (const calDoc of calendarsSnap.docs) {
      const eventDoc = await adminDb
        .collection('calendars')
        .doc(calDoc.id)
        .collection('events')
        .doc(eventId)
        .get();

      if (eventDoc.exists) {
        eventData = eventDoc.data();
        calendarTitle = calDoc.data().title;
        break;
      }
    }

    if (!eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const ical = await import('ical-generator');
    const calendar = ical.default({
      name: calendarTitle || '67Cal Event',
    });

    const startDate = eventData.startTime.toDate();
    const endDate = eventData.endTime.toDate();

    calendar.createEvent({
      start: startDate,
      end: endDate,
      summary: eventData.title,
      description: eventData.description || '',
      url: eventData.meetingLink || undefined,
      location: eventData.meetingLink || undefined,
    });

    const icsContent = calendar.toString();

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${eventData.title || 'event'}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating ICS:', error);
    return NextResponse.json({ error: 'Failed to generate ICS file' }, { status: 500 });
  }
}
