import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendEmails, EmailPayload } from '../services/emailService';
import { buildTimeChangedEmail, buildCancelledEmail } from '../templates/eventNotificationEmail';

const db = admin.firestore();

export const onEventUpdated = onDocumentUpdated(
  'calendars/{calendarId}/events/{eventId}',
  async (event) => {
    if (!event.data) return;

    const before = event.data.before.data();
    const after = event.data.after.data();
    const calendarId = event.params.calendarId;
    const eventId = event.params.eventId;

    // Detect what changed
    const timeChanged =
      before.startTime?.toMillis?.() !== after.startTime?.toMillis?.() ||
      before.endTime?.toMillis?.() !== after.endTime?.toMillis?.();

    const cancelled =
      before.status !== 'cancelled' && after.status === 'cancelled';

    if (!timeChanged && !cancelled) return;

    // Get calendar doc for members list, title, and language
    const calDoc = await db.collection('calendars').doc(calendarId).get();
    if (!calDoc.exists) {
      console.error(`Calendar ${calendarId} not found`);
      return;
    }
    const calData = calDoc.data()!;
    const calendarTitle: string = calData.title || '';
    const calendarLanguage: string = calData.language || 'en';
    const members: string[] = calData.members || [];

    // Determine who made the change
    const actorId: string = after.updatedBy || '';

    // Filter out the actor from recipients
    const recipientIds = members.filter((uid: string) => uid !== actorId);
    if (recipientIds.length === 0) return;

    // Get actor profile for name
    let actorName = 'Someone';
    if (actorId) {
      const actorDoc = await db.collection('users').doc(actorId).get();
      if (actorDoc.exists) {
        actorName = actorDoc.data()!.displayName || 'Someone';
      }
    }

    const eventTitle: string = after.title || 'Untitled Event';

    // Determine notification type and build context
    const notificationType = cancelled ? 'event_cancelled' : 'event_time_changed';

    // Batch-create notification documents
    const batch = db.batch();
    for (const recipientId of recipientIds) {
      const notifRef = db.collection('notifications').doc();
      const notifData: Record<string, any> = {
        recipientId,
        type: notificationType,
        calendarId,
        calendarTitle,
        eventId,
        eventTitle,
        actorName,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (timeChanged && !cancelled) {
        notifData.changes = {
          previousStart: before.startTime,
          newStart: after.startTime,
          previousEnd: before.endTime,
          newEnd: after.endTime,
        };
      }

      if (cancelled) {
        notifData.cancelReason = after.cancelReason || '';
      }

      batch.set(notifRef, notifData);
    }
    await batch.commit();

    // Get recipient emails for email notifications
    const recipientDocs = await Promise.all(
      recipientIds.map((uid: string) => db.collection('users').doc(uid).get())
    );

    const emailPayloads: EmailPayload[] = [];

    for (const recipientDoc of recipientDocs) {
      if (!recipientDoc.exists) continue;
      const recipientData = recipientDoc.data()!;
      const email = recipientData.email;
      if (!email) continue;

      let emailContent: { subject: string; html: string };

      if (cancelled) {
        emailContent = buildCancelledEmail(
          {
            eventTitle,
            calendarTitle,
            actorName,
            cancelReason: after.cancelReason || undefined,
            calendarId,
            eventId,
          },
          calendarLanguage
        );
      } else {
        emailContent = buildTimeChangedEmail(
          {
            eventTitle,
            calendarTitle,
            actorName,
            previousStart: before.startTime.toDate(),
            newStart: after.startTime.toDate(),
            previousEnd: before.endTime.toDate(),
            newEnd: after.endTime.toDate(),
            calendarId,
            eventId,
          },
          calendarLanguage
        );
      }

      emailPayloads.push({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    if (emailPayloads.length > 0) {
      await sendEmails(emailPayloads);
    }

    console.log(
      `Notification: ${notificationType} for event ${eventId} — ` +
      `${recipientIds.length} notification(s) created, ${emailPayloads.length} email(s) sent`
    );
  }
);
