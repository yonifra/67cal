import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';

admin.initializeApp();
const db = admin.firestore();

interface VerifyPasswordData {
  calendarId: string;
  password: string;
}

export const verifyCalendarPassword = functions.https.onCall(
  async (request: functions.https.CallableRequest<VerifyPasswordData>) => {
    const { calendarId, password } = request.data;
    const auth = request.auth;

    if (!auth) {
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
        members: admin.firestore.FieldValue.arrayUnion(auth.uid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    }

    const isValid = await bcrypt.compare(password, calendarData.passwordHash);

    if (!isValid) {
      return { success: false };
    }

    await db.collection('calendars').doc(calendarId).update({
      members: admin.firestore.FieldValue.arrayUnion(auth.uid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// Hash password when calendar is created or password is updated
export const hashCalendarPassword = functions.https.onCall(
  async (request: functions.https.CallableRequest<{ password: string }>) => {
    const { password } = request.data;
    const auth = request.auth;

    if (!auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    if (!password) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing password');
    }

    const hash = await bcrypt.hash(password, 10);
    return { hash };
  }
);
