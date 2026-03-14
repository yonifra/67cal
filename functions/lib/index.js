"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCalendarPassword = exports.joinAsCollaborator = exports.joinCalendar = exports.verifyCalendarPassword = exports.onEventUpdated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const bcrypt = __importStar(require("bcryptjs"));
admin.initializeApp();
const db = admin.firestore();
var onEventUpdated_1 = require("./triggers/onEventUpdated");
Object.defineProperty(exports, "onEventUpdated", { enumerable: true, get: function () { return onEventUpdated_1.onEventUpdated; } });
exports.verifyCalendarPassword = functions.https.onCall(async (data, context) => {
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
    const calendarData = calendarDoc.data();
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
});
/**
 * Join a calendar without a password.
 * Validates the invite code server-side and adds the user as a member
 * using the Admin SDK (bypasses Firestore security rules).
 */
exports.joinCalendar = functions.https.onCall(async (data, context) => {
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
    const calendarData = calendarDoc.data();
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
});
/**
 * Join a calendar as a collaborator (teacher).
 * Validates the collaborator invite code server-side and adds the user
 * as both a collaborator and member using the Admin SDK.
 */
exports.joinAsCollaborator = functions.https.onCall(async (data, context) => {
    const { calendarId, collaboratorInviteCode } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    if (!calendarId || !collaboratorInviteCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing calendarId or collaboratorInviteCode');
    }
    const calendarDoc = await db.collection('calendars').doc(calendarId).get();
    if (!calendarDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Calendar not found');
    }
    const calendarData = calendarDoc.data();
    // Verify the collaborator invite code matches
    if (calendarData.collaboratorInviteCode !== collaboratorInviteCode) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid collaborator invite code');
    }
    // Check if user is already the owner
    if (calendarData.ownerId === context.auth.uid) {
        throw new functions.https.HttpsError('already-exists', 'You are the owner of this calendar');
    }
    await db.collection('calendars').doc(calendarId).update({
        collaborators: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
        members: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
});
// Hash password when calendar is created or password is updated
exports.hashCalendarPassword = functions.https.onCall(async (data, context) => {
    const { password } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    if (!password) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing password');
    }
    const hash = await bcrypt.hash(password, 10);
    return { hash };
});
//# sourceMappingURL=index.js.map