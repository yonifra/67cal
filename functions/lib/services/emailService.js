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
exports.sendEmail = sendEmail;
exports.sendEmails = sendEmails;
const nodemailer = __importStar(require("nodemailer"));
const params_1 = require("firebase-functions/params");
const SMTP_HOST = (0, params_1.defineString)('SMTP_HOST', { default: '' });
const SMTP_PORT = (0, params_1.defineString)('SMTP_PORT', { default: '587' });
const SMTP_USER = (0, params_1.defineString)('SMTP_USER', { default: '' });
const SMTP_PASS = (0, params_1.defineString)('SMTP_PASS', { default: '' });
const SMTP_FROM = (0, params_1.defineString)('SMTP_FROM', { default: '' });
let transporter = null;
function getTransporter() {
    if (transporter)
        return transporter;
    const host = SMTP_HOST.value();
    const port = parseInt(SMTP_PORT.value(), 10);
    const user = SMTP_USER.value();
    const pass = SMTP_PASS.value();
    if (!host || !user || !pass) {
        console.warn('SMTP not configured — skipping email send');
        return null;
    }
    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
    return transporter;
}
async function sendEmail(payload) {
    const t = getTransporter();
    if (!t)
        return;
    const from = SMTP_FROM.value() || SMTP_USER.value();
    await t.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
    });
}
async function sendEmails(payloads) {
    await Promise.all(payloads.map((p) => sendEmail(p).catch((err) => {
        console.error(`Failed to send email to ${p.to}:`, err);
    })));
}
//# sourceMappingURL=emailService.js.map