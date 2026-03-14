import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      );
    }

    // Fetch the calendar document for its title
    const calDoc = await adminDb.collection('calendars').doc(calendarId).get();
    if (!calDoc.exists) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }
    const calendarTitle = calDoc.data()?.title || '67Cal';

    // Fetch all events for this calendar, ordered by start time
    const eventsSnap = await adminDb
      .collection('calendars')
      .doc(calendarId)
      .collection('events')
      .orderBy('startTime', 'asc')
      .get();

    const ical = await import('ical-generator');
    const calendar = ical.default({
      name: calendarTitle,
    });

    for (const eventDoc of eventsSnap.docs) {
      const data = eventDoc.data();

      // Skip cancelled events
      if (data.status === 'cancelled') continue;

      calendar.createEvent({
        start: data.startTime.toDate(),
        end: data.endTime.toDate(),
        summary: data.title || 'Untitled Event',
        description: data.description || '',
        url: data.meetingLink || undefined,
        location: data.meetingLink || undefined,
      });
    }

    const icsContent = calendar.toString();
    const safeTitle = calendarTitle.replace(/[^a-zA-Z0-9\u0590-\u05FF\s-]/g, '').trim() || 'calendar';

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeTitle}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating calendar ICS:', error);
    return NextResponse.json({ error: 'Failed to generate ICS file' }, { status: 500 });
  }
}
