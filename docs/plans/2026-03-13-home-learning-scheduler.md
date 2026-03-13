# Home Learning Scheduler — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack Home Learning Scheduler where teachers create weekly class schedules and pupils access them via shared links/QR codes, with per-event chat and file attachments.

**Architecture:** Next.js 14 App Router with locale-based routing (`[locale]/...`), Firebase for auth/db/storage/functions, Zustand for client state, real-time Firestore listeners for chat. Server Components for data fetching, Client Components for interactive elements.

**Tech Stack:** Next.js 14, Tailwind CSS v3, shadcn/ui, Firebase (Firestore/Auth/Storage/Functions), next-intl, react-hook-form + zod, date-fns, FullCalendar, qrcode.react, react-dropzone, Zustand, react-hot-toast, lucide-react

---

## Phase 1: Project Scaffold & Configuration

### Task 1: Initialize Next.js project with dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`

**Step 1: Create Next.js app**

```bash
cd /Users/yonifra/Documents/Projects/67cal
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbo
```

**Step 2: Install all dependencies**

```bash
npm install firebase firebase-admin next-intl @fullcalendar/react @fullcalendar/timegrid @fullcalendar/daygrid @fullcalendar/core qrcode.react react-dropzone react-hook-form zod @hookform/resolvers date-fns ical-generator bcryptjs nanoid zustand react-hot-toast lucide-react clsx tailwind-merge
npm install -D @types/bcryptjs
```

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card dialog dropdown-menu input label select separator sheet tabs textarea toast badge avatar scroll-area
```

**Step 4: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with all dependencies and shadcn/ui"
```

---

### Task 2: Configure environment and Firebase setup files

**Files:**
- Create: `.env.local.example`
- Create: `src/lib/firebase.ts`
- Create: `src/lib/firebase-admin.ts`
- Create: `.gitignore` (update)

**Step 1: Create .env.local.example**

```env
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

**Step 2: Create Firebase client initialization**

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

**Step 3: Create Firebase admin initialization**

```typescript
// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    : getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
```

**Step 4: Commit**

```bash
git add src/lib/firebase.ts src/lib/firebase-admin.ts .env.local.example
git commit -m "chore: add Firebase client and admin initialization"
```

---

### Task 3: TypeScript types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Define all types**

```typescript
// src/types/index.ts
import { Timestamp } from 'firebase/firestore';

export type Theme = 'kids' | 'teen' | 'adult' | 'minimal';
export type Language = 'en' | 'he';
export type MeetingProvider = 'zoom' | 'meet' | 'teams' | 'other';
export type EventStatus = 'active' | 'cancelled';
export type AuthorRole = 'teacher' | 'pupil';
export type FileType = 'pdf' | 'docx' | 'doc';

export interface Calendar {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  theme: Theme;
  language: Language;
  passwordHash: string | null;
  inviteCode: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  members: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  meetingLink: string;
  meetingProvider: MeetingProvider;
  status: EventStatus;
  cancelReason: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: AuthorRole;
  text: string;
  createdAt: Timestamp;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: FileType;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  sizeBytes: number;
}

export interface CalendarFormData {
  title: string;
  description: string;
  theme: Theme;
  language: Language;
  password?: string;
}

export interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions for all data models"
```

---

### Task 4: Utility functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/password.ts`
- Create: `src/lib/inviteCodes.ts`
- Create: `src/lib/meetingProvider.ts`

**Step 1: Create utility functions**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/meetingProvider.ts
import { MeetingProvider } from '@/types';

export function detectMeetingProvider(url: string): MeetingProvider {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('zoom.us') || hostname.includes('zoom.com')) return 'zoom';
    if (hostname.includes('meet.google.com')) return 'meet';
    if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) return 'teams';
    return 'other';
  } catch {
    return 'other';
  }
}

// src/lib/inviteCodes.ts
import { nanoid } from 'nanoid';

export function generateInviteCode(): string {
  return nanoid(8);
}

// src/lib/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Step 2: Commit**

```bash
git add src/lib/utils.ts src/lib/password.ts src/lib/inviteCodes.ts src/lib/meetingProvider.ts
git commit -m "feat: add utility functions for meeting detection, invite codes, passwords"
```

---

## Phase 2: i18n & Theme System

### Task 5: Internationalization setup (next-intl)

**Files:**
- Create: `src/i18n/en.json`
- Create: `src/i18n/he.json`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/routing.ts`
- Create: `src/middleware.ts`
- Modify: `next.config.mjs`

**Step 1: Create English translations**

Create `src/i18n/en.json` with all UI strings covering: nav, auth, dashboard, calendar, events, chat, files, invite, settings, common actions, validation messages.

**Step 2: Create Hebrew translations**

Mirror all keys in `src/i18n/he.json` with Hebrew translations.

**Step 3: Configure next-intl routing**

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'he'],
  defaultLocale: 'en',
});

// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`@/i18n/${locale}.json`)).default,
  };
});
```

**Step 4: Create middleware**

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|he)/:path*'],
};
```

**Step 5: Update next.config.mjs**

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
```

**Step 6: Commit**

```bash
git add src/i18n/ src/middleware.ts next.config.mjs
git commit -m "feat: configure next-intl with EN/HE locales and middleware"
```

---

### Task 6: Theme system

**Files:**
- Create: `src/components/layout/ThemeProvider.tsx`
- Modify: `tailwind.config.ts`
- Create: `src/app/globals.css` (modify with theme CSS variables)
- Create: `src/hooks/useTheme.ts`

**Step 1: Add CSS custom properties for all 4 themes**

Define CSS variables in globals.css for each theme via `[data-theme="kids"]`, `[data-theme="teen"]`, `[data-theme="adult"]`, `[data-theme="minimal"]` selectors. Each theme defines: `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, `--card`, `--border`, `--radius`, `--font-size-base`.

**Step 2: Extend tailwind.config.ts**

Map CSS variables to Tailwind theme values.

**Step 3: Create ThemeProvider**

Client component that reads the calendar's theme and sets `data-theme` on document.

**Step 4: Commit**

```bash
git add src/components/layout/ThemeProvider.tsx tailwind.config.ts src/app/globals.css src/hooks/useTheme.ts
git commit -m "feat: implement 4-theme system with CSS custom properties"
```

---

## Phase 3: Authentication

### Task 7: Auth store and hooks

**Files:**
- Create: `src/stores/authStore.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/lib/auth.ts`

**Step 1: Create Zustand auth store**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
```

**Step 2: Create auth hook with onAuthStateChanged listener**

**Step 3: Create auth utility functions** (signIn, signUp, signInWithGoogle, signOut)

**Step 4: Commit**

```bash
git add src/stores/authStore.ts src/hooks/useAuth.ts src/lib/auth.ts
git commit -m "feat: add authentication store, hook, and utility functions"
```

---

### Task 8: Auth pages (Login + Register)

**Files:**
- Create: `src/app/[locale]/auth/login/page.tsx`
- Create: `src/app/[locale]/auth/register/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/RegisterForm.tsx`
- Create: `src/components/auth/GoogleSignInButton.tsx`
- Create: `src/components/auth/AuthGuard.tsx`

**Step 1: Create LoginForm** — Client Component with react-hook-form + zod validation, email/password fields, Google sign-in button, link to register.

**Step 2: Create RegisterForm** — Similar with name + email + password + confirm password.

**Step 3: Create GoogleSignInButton** — Triggers Google OAuth popup.

**Step 4: Create AuthGuard** — Wraps protected routes, redirects to /login if not authenticated.

**Step 5: Create route pages** that render the forms.

**Step 6: Commit**

```bash
git add src/app/[locale]/auth/ src/components/auth/
git commit -m "feat: implement login and registration pages with Google OAuth"
```

---

## Phase 4: Layout & Navigation

### Task 9: App layout with Navbar and Sidebar

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/LanguageSwitcher.tsx`

**Step 1: Create root locale layout**

Set `dir="rtl"` for Hebrew, wrap with ThemeProvider, NextIntlClientProvider, Toaster. Include Navbar.

**Step 2: Create Navbar** — Logo, calendar title (if on calendar page), language switcher, user avatar dropdown with sign-out.

**Step 3: Create LanguageSwitcher** — Toggle between EN/HE, persists to localStorage.

**Step 4: Create Sidebar** — For dashboard: list of owned calendars, "Create Calendar" button.

**Step 5: Commit**

```bash
git add src/app/[locale]/layout.tsx src/components/layout/
git commit -m "feat: add app layout with navbar, sidebar, and language switcher"
```

---

## Phase 5: Firestore Data Layer

### Task 10: Firestore CRUD functions

**Files:**
- Create: `src/lib/firestore/calendars.ts`
- Create: `src/lib/firestore/events.ts`
- Create: `src/lib/firestore/messages.ts`
- Create: `src/lib/firestore/files.ts`

**Step 1: Calendar CRUD**

```typescript
// src/lib/firestore/calendars.ts
// Functions: createCalendar, getCalendar, getOwnedCalendars, getMemberCalendars,
//            updateCalendar, deleteCalendar, addMember, getCalendarByInviteCode
```

**Step 2: Event CRUD**

```typescript
// src/lib/firestore/events.ts
// Functions: createEvent, getEvent, getCalendarEvents, updateEvent, cancelEvent
```

**Step 3: Message operations**

```typescript
// src/lib/firestore/messages.ts
// Functions: sendMessage, deleteMessage, subscribeToMessages (real-time)
```

**Step 4: File operations**

```typescript
// src/lib/firestore/files.ts
// Functions: addFileRecord, getEventFiles, deleteFileRecord, uploadFile, deleteFile
```

**Step 5: Commit**

```bash
git add src/lib/firestore/
git commit -m "feat: add Firestore CRUD functions for calendars, events, messages, files"
```

---

### Task 11: React hooks for data

**Files:**
- Create: `src/hooks/useCalendar.ts`
- Create: `src/hooks/useEvents.ts`
- Create: `src/hooks/useMessages.ts`
- Create: `src/stores/calendarStore.ts`

**Step 1: Create useCalendar hook** — Fetches calendar by ID, determines user role (teacher/pupil).

**Step 2: Create useEvents hook** — Fetches events for a calendar, subscribes to real-time updates.

**Step 3: Create useMessages hook** — Real-time subscription via onSnapshot to event messages.

**Step 4: Create calendarStore** — Zustand store for active calendar context.

**Step 5: Commit**

```bash
git add src/hooks/ src/stores/calendarStore.ts
git commit -m "feat: add React hooks for calendar, events, and messages data"
```

---

## Phase 6: Dashboard & Calendar CRUD

### Task 12: Teacher dashboard

**Files:**
- Create: `src/app/[locale]/dashboard/page.tsx`
- Create: `src/components/dashboard/CalendarList.tsx`
- Create: `src/components/dashboard/CalendarCard.tsx`
- Create: `src/components/dashboard/EmptyState.tsx`

**Step 1: Create dashboard page** — Fetches owned calendars, shows grid of CalendarCards or EmptyState.

**Step 2: Create CalendarCard** — Shows title, description, theme badge, member count, invite button, edit/delete actions.

**Step 3: Create EmptyState** — Friendly prompt to create first calendar.

**Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/ src/components/dashboard/
git commit -m "feat: implement teacher dashboard with calendar list"
```

---

### Task 13: Create/Edit calendar

**Files:**
- Create: `src/app/[locale]/calendar/new/page.tsx`
- Create: `src/app/[locale]/calendar/[calendarId]/settings/page.tsx`
- Create: `src/components/calendar/CalendarForm.tsx`

**Step 1: Create CalendarForm** — react-hook-form with fields: title, description, theme (select), language (select), password (optional). Zod validation schema.

**Step 2: Create "new calendar" page** — Renders CalendarForm, on submit calls createCalendar with generated inviteCode.

**Step 3: Create settings page** — Loads existing calendar data into CalendarForm for editing.

**Step 4: Commit**

```bash
git add src/app/[locale]/calendar/new/ src/app/[locale]/calendar/*/settings/ src/components/calendar/CalendarForm.tsx
git commit -m "feat: implement calendar creation and settings pages"
```

---

## Phase 7: Event Management

### Task 14: Event CRUD pages

**Files:**
- Create: `src/app/[locale]/calendar/[calendarId]/event/new/page.tsx`
- Create: `src/app/[locale]/calendar/[calendarId]/event/[eventId]/page.tsx`
- Create: `src/app/[locale]/calendar/[calendarId]/event/[eventId]/edit/page.tsx`
- Create: `src/components/calendar/EventForm.tsx`
- Create: `src/components/calendar/CancelEventModal.tsx`

**Step 1: Create EventForm** — Fields: title, description, startTime (datetime-local), endTime (datetime-local), meetingLink. Auto-detects provider on URL change.

**Step 2: Create event creation page**.

**Step 3: Create event edit page** — Pre-fills form with existing data.

**Step 4: Create CancelEventModal** — Dialog asking for cancel reason, sets status to 'cancelled'.

**Step 5: Commit**

```bash
git add src/app/[locale]/calendar/*/event/ src/components/calendar/EventForm.tsx src/components/calendar/CancelEventModal.tsx
git commit -m "feat: implement event creation, editing, and cancellation"
```

---

### Task 15: Weekly calendar view

**Files:**
- Create: `src/app/[locale]/calendar/[calendarId]/page.tsx`
- Create: `src/components/calendar/WeekView.tsx`
- Create: `src/components/calendar/EventCard.tsx`

**Step 1: Create WeekView** — FullCalendar with timeGrid plugin. Maps CalendarEvents to FullCalendar event format. RTL support via `direction` prop. Cancelled events show with strikethrough + badge.

**Step 2: Create EventCard** — Custom event content renderer: title, time, provider icon, cancelled badge.

**Step 3: Create calendar page** — Renders WeekView + "Add Event" button (teacher only).

**Step 4: Commit**

```bash
git add src/app/[locale]/calendar/*/page.tsx src/components/calendar/WeekView.tsx src/components/calendar/EventCard.tsx
git commit -m "feat: implement weekly calendar view with FullCalendar"
```

---

## Phase 8: Event Detail Page

### Task 16: Event detail page with meeting link

**Files:**
- Modify: `src/app/[locale]/calendar/[calendarId]/event/[eventId]/page.tsx`
- Create: `src/components/calendar/MeetingLinkButton.tsx`

**Step 1: Build event detail layout** — Title, description, date/time formatted with date-fns, meeting link as styled button with provider icon, status badge.

**Step 2: Create MeetingLinkButton** — Shows provider icon (Zoom/Meet/Teams/Other) + "Join Meeting" text. Opens in new tab.

**Step 3: Add edit/cancel buttons** for teachers.

**Step 4: Commit**

```bash
git add src/app/[locale]/calendar/*/event/*/page.tsx src/components/calendar/MeetingLinkButton.tsx
git commit -m "feat: implement event detail page with meeting link button"
```

---

### Task 17: Chat thread

**Files:**
- Create: `src/components/chat/ChatThread.tsx`
- Create: `src/components/chat/MessageBubble.tsx`
- Create: `src/components/chat/MessageInput.tsx`

**Step 1: Create MessageBubble** — Shows author name, text, timestamp. Teacher messages right-aligned with accent color, pupil messages left-aligned. Delete button for own messages (or all for teachers).

**Step 2: Create MessageInput** — Text input + send button. Submit on Enter. Uses react-hook-form.

**Step 3: Create ChatThread** — Uses useMessages hook for real-time subscription. Groups messages by date. Scrolls to bottom on new messages. Auto-scroll with scroll-area.

**Step 4: Integrate ChatThread into event detail page.**

**Step 5: Commit**

```bash
git add src/components/chat/
git commit -m "feat: implement real-time chat thread with message bubbles"
```

---

### Task 18: File attachments

**Files:**
- Create: `src/components/files/FileUploader.tsx`
- Create: `src/components/files/FileList.tsx`

**Step 1: Create FileUploader** — react-dropzone with 20MB limit, accepts PDF/DOC/DOCX. Uploads to Firebase Storage, creates Firestore record. Shows upload progress. Teacher only.

**Step 2: Create FileList** — Displays files with icon (PDF/Word), name, size (formatted), upload date, download button. Teacher can delete files.

**Step 3: Integrate into event detail page.**

**Step 4: Commit**

```bash
git add src/components/files/
git commit -m "feat: implement file upload and download with react-dropzone"
```

---

## Phase 9: Invite System

### Task 19: Invite flow

**Files:**
- Create: `src/components/invite/InviteModal.tsx`
- Create: `src/components/invite/QRCodeDisplay.tsx`
- Create: `src/components/invite/ShareLinkButton.tsx`
- Create: `src/app/[locale]/invite/[inviteCode]/page.tsx`

**Step 1: Create QRCodeDisplay** — Renders QR code with qrcode.react for the invite URL.

**Step 2: Create ShareLinkButton** — Copies invite URL to clipboard with toast notification.

**Step 3: Create InviteModal** — Dialog showing: invite URL, QR code, copy button. Teacher opens this from dashboard or calendar view.

**Step 4: Create invite page** — Looks up calendar by inviteCode. If password-protected, shows password form. On success, adds UID to members array and redirects to calendar view.

**Step 5: Commit**

```bash
git add src/components/invite/ src/app/[locale]/invite/
git commit -m "feat: implement invite system with QR code and password gate"
```

---

## Phase 10: Google Calendar Export

### Task 20: Calendar export

**Files:**
- Create: `src/lib/ical.ts`
- Create: `src/app/api/export/[eventId]/route.ts`
- Create: `src/components/calendar/ExportButton.tsx`

**Step 1: Create iCal generator utility**

```typescript
// src/lib/ical.ts
import ical from 'ical-generator';
// Function: generateICS(event: CalendarEvent) => string
```

**Step 2: Create API route for .ics download**

```typescript
// src/app/api/export/[eventId]/route.ts
// GET handler: fetch event from Firestore, generate ICS, return as download
```

**Step 3: Create ExportButton** — Two options: "Add to Google Calendar" (opens Google Calendar URL) and "Download .ics" (hits API route).

**Step 4: Add ExportButton to event detail page.**

**Step 5: Commit**

```bash
git add src/lib/ical.ts src/app/api/export/ src/components/calendar/ExportButton.tsx
git commit -m "feat: implement Google Calendar export and .ics download"
```

---

## Phase 11: Firebase Security & Functions

### Task 21: Firestore security rules and Storage rules

**Files:**
- Create: `firestore.rules`
- Create: `storage.rules`
- Create: `firebase.json`

**Step 1: Write Firestore security rules** as specified in the spec.

**Step 2: Write Storage security rules** with 20MB limit and content type restrictions.

**Step 3: Create firebase.json config** pointing to rules files.

**Step 4: Commit**

```bash
git add firestore.rules storage.rules firebase.json
git commit -m "feat: add Firestore and Storage security rules"
```

---

### Task 22: Firebase Cloud Function for password verification

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/src/index.ts`

**Step 1: Initialize functions directory** with TypeScript.

**Step 2: Create verifyCalendarPassword callable function**

```typescript
// Accepts { calendarId, password }
// Fetches calendar doc, compares password with bcrypt
// On match, adds caller UID to members array
// Returns { success: boolean }
```

**Step 3: Commit**

```bash
git add functions/
git commit -m "feat: add Firebase callable function for password verification"
```

---

## Phase 12: Loading States, Error Handling & Polish

### Task 23: Loading states and error boundaries

**Files:**
- Create: `src/app/[locale]/loading.tsx`
- Create: `src/app/[locale]/dashboard/loading.tsx`
- Create: `src/app/[locale]/calendar/[calendarId]/loading.tsx`
- Create: `src/components/layout/ErrorBoundary.tsx`
- Create: `src/app/[locale]/not-found.tsx`

**Step 1: Create loading.tsx files** at each route segment with skeleton/spinner UI.

**Step 2: Create ErrorBoundary** — User-friendly fallback with retry button.

**Step 3: Create not-found page.**

**Step 4: Commit**

```bash
git add src/app/[locale]/loading.tsx src/app/[locale]/dashboard/loading.tsx src/components/layout/ErrorBoundary.tsx src/app/[locale]/not-found.tsx
git commit -m "feat: add loading states, error boundaries, and not-found page"
```

---

### Task 24: Landing page

**Files:**
- Create: `src/app/[locale]/page.tsx`

**Step 1: Create landing/home page** — If authenticated, redirect to dashboard. If not, show a landing page with hero section, feature highlights, and CTA to login/register.

**Step 2: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: implement landing page with auth redirect"
```

---

### Task 25: Mobile responsiveness and final polish

**Step 1: Audit all components** for mobile breakpoints. Ensure calendar view, chat, and forms are usable on mobile.

**Step 2: Add ARIA labels** to all interactive elements.

**Step 3: Test RTL layout** for Hebrew locale.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: add mobile responsiveness, accessibility, and RTL polish"
```

---

## Execution Plan

The 25 tasks are grouped into 12 phases. Tasks within phases are generally sequential, but phases can be parallelized:

**Parallel Group A (Foundation):** Tasks 1-4 (scaffold), Task 5-6 (i18n + themes)
**Parallel Group B (Core Features):** Tasks 7-8 (auth), Tasks 9 (layout), Tasks 10-11 (data layer)
**Parallel Group C (Pages):** Tasks 12-13 (dashboard + calendar CRUD), Tasks 14-15 (events)
**Parallel Group D (Features):** Tasks 16-18 (event detail), Task 19 (invites), Task 20 (export)
**Sequential:** Tasks 21-25 (security, functions, polish)
