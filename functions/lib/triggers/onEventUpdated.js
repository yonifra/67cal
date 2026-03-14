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
exports.onEventUpdated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const emailService_1 = require("../services/emailService");
const eventNotificationEmail_1 = require("../templates/eventNotificationEmail");
const db = admin.firestore();
exports.onEventUpdated = (0, firestore_1.onDocumentUpdated)('calendars/{calendarId}/events/{eventId}', async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!event.data)
        return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    const calendarId = event.params.calendarId;
    const eventId = event.params.eventId;
    // Detect what changed
    const timeChanged = ((_b = (_a = before.startTime) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) !== ((_d = (_c = after.startTime) === null || _c === void 0 ? void 0 : _c.toMillis) === null || _d === void 0 ? void 0 : _d.call(_c)) ||
        ((_f = (_e = before.endTime) === null || _e === void 0 ? void 0 : _e.toMillis) === null || _f === void 0 ? void 0 : _f.call(_e)) !== ((_h = (_g = after.endTime) === null || _g === void 0 ? void 0 : _g.toMillis) === null || _h === void 0 ? void 0 : _h.call(_g));
    const cancelled = before.status !== 'cancelled' && after.status === 'cancelled';
    if (!timeChanged && !cancelled)
        return;
    // Get calendar doc for members list, title, and language
    const calDoc = await db.collection('calendars').doc(calendarId).get();
    if (!calDoc.exists) {
        console.error(`Calendar ${calendarId} not found`);
        return;
    }
    const calData = calDoc.data();
    const calendarTitle = calData.title || '';
    const calendarLanguage = calData.language || 'en';
    const members = calData.members || [];
    // Determine who made the change
    const actorId = after.updatedBy || '';
    // Filter out the actor from recipients
    const recipientIds = members.filter((uid) => uid !== actorId);
    if (recipientIds.length === 0)
        return;
    // Get actor profile for name
    let actorName = 'Someone';
    if (actorId) {
        const actorDoc = await db.collection('users').doc(actorId).get();
        if (actorDoc.exists) {
            actorName = actorDoc.data().displayName || 'Someone';
        }
    }
    const eventTitle = after.title || 'Untitled Event';
    // Determine notification type and build context
    const notificationType = cancelled ? 'event_cancelled' : 'event_time_changed';
    // Batch-create notification documents
    const batch = db.batch();
    for (const recipientId of recipientIds) {
        const notifRef = db.collection('notifications').doc();
        const notifData = {
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
    const recipientDocs = await Promise.all(recipientIds.map((uid) => db.collection('users').doc(uid).get()));
    const emailPayloads = [];
    for (const recipientDoc of recipientDocs) {
        if (!recipientDoc.exists)
            continue;
        const recipientData = recipientDoc.data();
        const email = recipientData.email;
        if (!email)
            continue;
        let emailContent;
        if (cancelled) {
            emailContent = (0, eventNotificationEmail_1.buildCancelledEmail)({
                eventTitle,
                calendarTitle,
                actorName,
                cancelReason: after.cancelReason || undefined,
                calendarId,
                eventId,
            }, calendarLanguage);
        }
        else {
            emailContent = (0, eventNotificationEmail_1.buildTimeChangedEmail)({
                eventTitle,
                calendarTitle,
                actorName,
                previousStart: before.startTime.toDate(),
                newStart: after.startTime.toDate(),
                previousEnd: before.endTime.toDate(),
                newEnd: after.endTime.toDate(),
                calendarId,
                eventId,
            }, calendarLanguage);
        }
        emailPayloads.push({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
        });
    }
    if (emailPayloads.length > 0) {
        await (0, emailService_1.sendEmails)(emailPayloads);
    }
    console.log(`Notification: ${notificationType} for event ${eventId} — ` +
        `${recipientIds.length} notification(s) created, ${emailPayloads.length} email(s) sent`);
});
//# sourceMappingURL=onEventUpdated.js.map