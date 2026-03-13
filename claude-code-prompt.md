# Claude Code Prompt — Home Learning Scheduler

## Project Overview

Build a full-stack **Home Learning Scheduler** web application. Teachers create and manage weekly class schedules for remote/home learning. Pupils access calendars via a shared link or QR code, view upcoming sessions, and participate in per-class chat threads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router, Server Components) |
| Styling | Tailwind CSS v3 |
| UI components | shadcn/ui |
| Backend / DB | Firebase (Firestore, Auth, Storage, Functions) |
| i18n | next-intl |
| Forms | react-hook-form + zod |
| Date/time | date-fns |
| Calendar view | @fullcalendar/react |
| QR codes | qrcode.react |
| File upload | react-dropzone |
| Notifications | react-hot-toast |
| Icons | lucide-react |

---

## Firebase Project Setup

Initialize Firebase with the following services:
- **Authentication** — Email/password + Google OAuth
- **Firestore** — Primary database
- **Storage** — File attachments (PDF, DOCX)
- **Cloud Functions** — Server-side tasks (iCal export, email notifications)
- **Security Rules** — Role-based access per calendar

Create `lib/firebase.ts` for client initialization and `lib/firebase-admin.ts` for server-side/Functions use.

---

## Firestore Data Model

### Collection: `calendars`
```
calendars/{calendarId}
  id: string
  title: string
  description: string
  ownerId: string                  // teacher's Firebase UID
  theme: 'kids' | 'teen' | 'adult' | 'minimal'
  language: 'en' | 'he'
  passwordHash: string | null      // bcrypt hash; null = public
  inviteCode: string               // unique short code for sharing
  createdAt: Timestamp
  updatedAt: Timestamp
  members: string[]                // array of UIDs with access
```

### Subcollection: `calendars/{calendarId}/events`
```
events/{eventId}
  id: string
  title: string
  description: string
  startTime: Timestamp
  endTime: Timestamp
  meetingLink: string              // any URL (Zoom, Meet, Teams, etc.)
  meetingProvider: 'zoom' | 'meet' | 'teams' | 'other'
  status: 'active' | 'cancelled'
  cancelReason: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Subcollection: `calendars/{calendarId}/events/{eventId}/messages`
```
messages/{messageId}
  id: string
  authorId: string
  authorName: string
  authorRole: 'teacher' | 'pupil'
  text: string
  createdAt: Timestamp
```

### Subcollection: `calendars/{calendarId}/events/{eventId}/files`
```
files/{fileId}
  id: string
  name: string
  type: 'pdf' | 'docx' | 'doc'
  storagePath: string             // Firebase Storage path
  downloadUrl: string
  uploadedBy: string
  uploadedAt: Timestamp
  sizeBytes: number
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() { return request.auth != null; }
    function isOwner(calId) {
      return get(/databases/$(database)/documents/calendars/$(calId)).data.ownerId == request.auth.uid;
    }
    function isMember(calId) {
      return request.auth.uid in get(/databases/$(database)/documents/calendars/$(calId)).data.members;
    }

    match /calendars/{calId} {
      allow read: if isAuth() && (isOwner(calId) || isMember(calId));
      allow create: if isAuth();
      allow update, delete: if isAuth() && isOwner(calId);

      match /events/{eventId} {
        allow read: if isAuth() && (isOwner(calId) || isMember(calId));
        allow write: if isAuth() && isOwner(calId);

        match /messages/{msgId} {
          allow read: if isAuth() && (isOwner(calId) || isMember(calId));
          allow create: if isAuth() && (isOwner(calId) || isMember(calId));
          allow update, delete: if isAuth() && request.auth.uid == resource.data.authorId;
        }

        match /files/{fileId} {
          allow read: if isAuth() && (isOwner(calId) || isMember(calId));
          allow write: if isAuth() && isOwner(calId);
        }
      }
    }
  }
}
```

---

## App Directory Structure

```
src/
  app/
    [locale]/
      layout.tsx                  // i18n + theme provider
      page.tsx                    // landing / dashboard
      auth/
        login/page.tsx
        register/page.tsx
      dashboard/page.tsx          // teacher: list of owned calendars
      calendar/
        new/page.tsx              // teacher: create calendar
        [calendarId]/
          page.tsx                // calendar weekly view
          settings/page.tsx       // teacher: edit calendar settings
          event/
            new/page.tsx          // teacher: create event
            [eventId]/
              page.tsx            // event detail + chat + files
              edit/page.tsx       // teacher: edit event
      invite/
        [inviteCode]/page.tsx     // public entry: password gate → join
  components/
    calendar/
      WeekView.tsx
      EventCard.tsx
      EventForm.tsx
      CancelEventModal.tsx
    chat/
      ChatThread.tsx
      MessageBubble.tsx
      MessageInput.tsx
    files/
      FileUploader.tsx
      FileList.tsx
    invite/
      InviteModal.tsx
      QRCodeDisplay.tsx
      ShareLinkButton.tsx
    layout/
      Navbar.tsx
      Sidebar.tsx
      ThemeProvider.tsx
      LanguageSwitcher.tsx
    ui/                           // shadcn/ui components
  lib/
    firebase.ts
    firebase-admin.ts
    auth.ts
    firestore/
      calendars.ts
      events.ts
      messages.ts
      files.ts
    ical.ts                       // iCal / Google Calendar export
    password.ts                   // calendar password hashing
    inviteCodes.ts
  hooks/
    useCalendar.ts
    useEvents.ts
    useMessages.ts
    useAuth.ts
    useTheme.ts
  stores/
    authStore.ts                  // Zustand
    calendarStore.ts
  i18n/
    en.json
    he.json
  types/
    index.ts
  middleware.ts                   // next-intl locale routing
```

---

## Feature Specifications

### 1. Authentication
- Email/password registration and login via Firebase Auth
- Google OAuth sign-in
- Persistent session with `onAuthStateChanged`
- Protected routes: redirect unauthenticated users to `/login`
- Role is determined by ownership: if `calendar.ownerId === user.uid` → teacher; otherwise → pupil

### 2. Calendar Management (Teacher)
- Create a calendar with: title, description, theme, language, optional password
- Edit/delete owned calendars
- View list of all owned calendars on the dashboard
- Each calendar generates a unique `inviteCode` (nanoid, 8 chars)

### 3. Event Management (Teacher)
- Create events with: title, description, startTime, endTime, meetingLink
- Auto-detect meeting provider from URL (zoom.us → Zoom, meet.google.com → Google Meet, teams.microsoft.com → Teams)
- Edit events
- Cancel events: set `status = 'cancelled'` and show a reason; do NOT hard-delete
- Cancelled events display with a strikethrough style and "Cancelled" badge

### 4. Calendar View (All Users)
- Weekly view using `@fullcalendar/react` with `timeGrid` plugin
- Events show: title, time range, meeting provider icon, cancelled badge if applicable
- Click event → navigate to event detail page
- Teacher sees "Add Event" button; pupils do not

### 5. Invite System
- Teacher can open an InviteModal showing:
  - A shareable URL: `https://yourapp.com/invite/{inviteCode}`
  - A QR code generated with `qrcode.react`
  - A "Copy link" button
- Pupil visits `/invite/{inviteCode}`:
  - If calendar is password-protected → show a password input form
  - On correct password → add UID to `calendar.members` → redirect to calendar view
  - If no password → add UID to members immediately

### 6. Event Detail Page
- Shows full event info: title, description, time, meeting link (as a styled button with provider icon), status
- File attachments section (see §8)
- Chat thread section (see §7)
- "Export to Google Calendar" button (see §9)

### 7. Chat Thread
- Real-time Firestore listener (`onSnapshot`) on the `messages` subcollection
- Messages grouped by date
- Teacher messages: right-aligned, distinct colour from theme
- Pupil messages: left-aligned
- Message input at the bottom; submit on Enter or button click
- Show author name and timestamp on each message
- Teachers can delete any message; pupils can only delete their own

### 8. File Attachments
- Teacher can upload PDF or Word documents (`.pdf`, `.doc`, `.docx`) to an event
- Use `react-dropzone` for drag-and-drop upload UI
- Files are stored in Firebase Storage at path: `calendars/{calendarId}/events/{eventId}/{fileName}`
- After upload, write a document to the `files` subcollection
- Display file list with: file icon (PDF/Word), name, size, upload date, download button
- Teacher can delete files; pupils can only download

### 9. Google Calendar Export
- On the event detail page, provide an "Export to Google Calendar" button
- Generate a Google Calendar URL:
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={startISO}/{endISO}&details={description}&location={meetingLink}`
- Also expose an `.ics` download endpoint via a Next.js API route (`/api/export/[eventId].ics`) using the `ical-generator` npm package

### 10. Themes
Implement four themes as Tailwind CSS config extensions + CSS custom properties:

| Theme | Target audience | Palette style |
|---|---|---|
| `kids` | Young children | Bright, playful, rounded corners, large text |
| `teen` | Teenagers | Bold, modern, dark accents |
| `adult` | Adults / professional | Clean, neutral, business-like |
| `minimal` | Any | White/grey, max simplicity |

Themes affect: colour palette, border-radius scale, font size scale, and icon style. Store the active theme in `calendar.theme` and apply it via a `data-theme` attribute on `<html>`.

### 11. Internationalisation (EN / HE)
- Use `next-intl` with locale routing: `/en/...` and `/he/...`
- Hebrew is RTL: set `dir="rtl"` on `<html>` when locale is `he`
- Translation keys in `i18n/en.json` and `i18n/he.json` covering all UI strings
- Language switcher in the navbar persists preference to `localStorage`
- All date/time formatting uses `date-fns/locale` with `enUS` or `he` locale

### 12. Password Protection
- On calendar creation/edit, teacher can set an optional password
- Password is hashed server-side (Firebase Function) using `bcryptjs` before storing
- On the invite page, the entered password is sent to a Firebase callable function for verification (never send plaintext to Firestore directly)
- Firebase callable function: `verifyCalendarPassword(calendarId, password)` → returns `{ success: boolean }`
- On success, the function adds the caller's UID to `calendar.members`

---

## Key npm Packages

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "firebase": "^10.12.0",
    "firebase-admin": "^12.0.0",
    "next-intl": "^3.14.0",
    "tailwindcss": "^3.4.0",
    "@fullcalendar/react": "^6.1.0",
    "@fullcalendar/timegrid": "^6.1.0",
    "@fullcalendar/daygrid": "^6.1.0",
    "qrcode.react": "^3.1.0",
    "react-dropzone": "^14.2.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.6.0",
    "ical-generator": "^7.1.0",
    "bcryptjs": "^2.4.3",
    "nanoid": "^5.0.0",
    "zustand": "^4.5.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.379.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  }
}
```

---

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Implementation Notes

1. **Always use Server Components** for initial data fetching where possible; use Client Components (`'use client'`) only for interactive elements (forms, real-time listeners, chat).

2. **Real-time chat**: Use `onSnapshot` in a `useEffect` within a Client Component. Unsubscribe on cleanup.

3. **Meeting link detection**: Write a utility `detectMeetingProvider(url: string)` that checks the URL hostname and returns a provider enum + the corresponding icon component.

4. **RTL support**: Use Tailwind's `rtl:` variant for layout mirroring. FullCalendar has a `direction` prop — set it to `'rtl'` when locale is Hebrew.

5. **File size limit**: Enforce a 20 MB limit client-side in `react-dropzone` and server-side in Firebase Storage rules.

6. **Invite code generation**: Use `nanoid(8)` when creating a calendar. Store as `inviteCode` on the calendar document. Index this field in Firestore for fast lookup.

7. **Error boundaries**: Wrap each major page section in a React Error Boundary with a user-friendly fallback.

8. **Loading states**: Use Next.js `loading.tsx` files at route segment level, and `Suspense` boundaries around async Server Components.

9. **Accessibility**: All interactive elements must have ARIA labels. The chat input must be keyboard-navigable. Colour contrast must meet WCAG AA for all themes.

10. **Firebase Storage rules**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /calendars/{calId}/events/{eventId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 20 * 1024 * 1024
        && request.resource.contentType.matches('application/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)');
    }
  }
}
```

---

## Deliverables

Build the complete application end-to-end. Start with:
1. Project scaffold (`create-next-app`, Tailwind, shadcn/ui init, Firebase setup)
2. Auth flow (login, register, session)
3. Calendar CRUD + invite system
4. Event CRUD + weekly calendar view
5. Event detail page with chat thread and file uploads
6. Theme system and i18n (EN + HE with RTL)
7. Google Calendar export + `.ics` API route
8. Password protection (callable function)
9. Polish: loading states, error handling, empty states, mobile responsiveness
