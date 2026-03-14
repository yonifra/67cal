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
exports.hashCalendarPassword = exports.verifyCalendarPassword = exports.onEventUpdated = void 0;
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