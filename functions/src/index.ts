import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';

admin.initializeApp();
const db = admin.firestore();

export { onEventUpdated } from './triggers/onEventUpdated';

export const verifyCalendarPassword = functions.https.onCall(
  async (data: { calendarId: string; password: string }, context) => {
    const { calendarId, password } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    if (!calendarId || !password) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing calendarId or password');
    }

    const calendarDoc = await db.collection('calendars').doc(calendarId).get();

    if (!calendarDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Calendar not found');
    }

    const calendarData = calendarDoc.data()!;

    if (!calendarData.passwordHash) {
      // No password required, just add member
      await db.collection('calendars').doc(calendarId).update({
        members: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    }

    const isValid = await bcrypt.compare(password, calendarData.passwordHash);

    if (!isValid) {
      return { success: false };
    }

    await db.collection('calendars').doc(calendarId).update({
      members: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

/**
 * Join a calendar without a password.
 * Validates the invite code server-side and adds the user as a member
 * using the Admin SDK (bypasses Firestore security rules).
 */
export const joinCalendar = functions.https.onCall(
  async (data: { calendarId: string; inviteCode: string }, context) => {
    const { calendarId, inviteCode } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    if (!calendarId || !inviteCode) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing calendarId or inviteCode');
    }

    const calendarDoc = await db.collection('calendars').doc(calendarId).get();

    if (!calendarDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Calendar not found');
    }

    const calendarData = calendarDoc.data()!;

    // Verify the invite code matches — prevents unauthorized joins
    if (calendarData.inviteCode !== inviteCode) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid invite code');
    }

    // If the calendar has a password, reject — they should use verifyCalendarPassword instead
    if (calendarData.passwordHash) {
      throw new functions.https.HttpsError('failed-precondition', 'This calendar requires a password');
    }

    await db.collection('calendars').doc(calendarId).update({
      members: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// Hash password when calendar is created or password is updated
export const hashCalendarPassword = functions.https.onCall(
  async (data: { password: string }, context) => {
    const { password } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    if (!password) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing password');
    }

    const hash = await bcrypt.hash(password, 10);
    return { hash };
  }
);
