<div align="center">

# 67Cal — Home Learning Scheduler

**Create and manage weekly class schedules for remote learning. Share calendars with pupils via links or QR codes, chat in real-time, and share materials — all in one place.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Firebase Setup](#firebase-setup)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Routes](#routes)
- [Architecture](#architecture)
  - [Data Model](#data-model)
  - [Components](#components)
  - [Hooks & State](#hooks--state)
  - [Firestore Data Layer](#firestore-data-layer)
  - [Cloud Functions](#cloud-functions)
- [Theme System](#theme-system)
- [Internationalisation](#internationalisation)
- [Security](#security)
- [Configuration Reference](#configuration-reference)

---

## Overview

67Cal is a full-stack web application built for teachers conducting remote or home learning. Teachers create weekly class schedules, organise them into themed calendars, and share access with pupils via invite links or QR codes. Each scheduled event supports real-time chat threads and file attachments, making it a self-contained hub for a class session.

**Two user roles** are derived at runtime — no explicit role assignment needed:

| Role | How determined | Capabilities |
|------|----------------|-------------|
| **Teacher** | `calendar.ownerId === user.uid` | Full CRUD on calendars, events, files. Delete any chat message. |
| **Pupil** | User's UID is in `calendar.members[]` | View calendar & events, join meetings, chat, download files. Delete own messages only. |

---

## Features

### Core

- **Authentication** — Email/password and Google OAuth via Firebase Auth. Persistent sessions with `onAuthStateChanged`. Protected routes redirect unauthenticated users.
- **Calendar Management** — Teachers create calendars with a title, description, visual theme, language, and optional password. Each calendar auto-generates an 8-character invite code.
- **Event Management** — Create, edit, and cancel class sessions. Cancellations are soft-deletes: the event stays visible with a strikethrough and reason. Meeting links are auto-detected (Zoom, Google Meet, Microsoft Teams).
- **Weekly Calendar View** — Interactive FullCalendar time-grid view. Click any event to navigate to its detail page. Teachers see an "Add Event" button; pupils don't.

### Collaboration

- **Real-time Chat** — Per-event chat threads powered by Firestore `onSnapshot`. Messages are grouped by date (Today / Yesterday / full date). Teacher messages are right-aligned; pupil messages are left-aligned.
- **File Attachments** — Drag-and-drop upload for PDF and Word documents (max 20 MB). Teachers upload and delete; pupils download.

### Sharing

- **Invite System** — Share calendars via a direct link or QR code. Password-protected calendars gate access through a Firebase callable function — plaintext passwords never touch the database.
- **Calendar Export** — "Add to Google Calendar" deep link and downloadable `.ics` file via a server-side API route.

### Customisation

- **4 Visual Themes** — Kids (bright & playful), Teen (bold & dark), Adult (clean & professional), Minimal (white & grey). Themes adjust colours, border-radius, and font size.
- **Bilingual (EN/HE)** — Full English and Hebrew translations with automatic RTL layout for Hebrew, including FullCalendar direction support.

### Polish

- **Loading States** — Skeleton screens at route-segment level via Next.js `loading.tsx` files.
- **Error Boundaries** — User-friendly fallback UI with a retry button.
- **Responsive Design** — Mobile-friendly layout across all pages.
- **Accessibility** — ARIA labels on all interactive elements, keyboard-navigable chat input.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Components) |
| **Language** | [TypeScript 5](https://typescriptlang.org) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) primitives |
| **Backend & DB** | [Firebase](https://firebase.google.com) (Auth, Firestore, Storage, Cloud Functions) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Internationalisation** | [next-intl](https://next-intl-docs.vercel.app/) |
| **Calendar View** | [@fullcalendar/react](https://fullcalendar.io) (timeGrid + dayGrid) |
| **Date Utilities** | [date-fns](https://date-fns.org) |
| **QR Codes** | [qrcode.react](https://github.com/zpao/qrcode.react) |
| **File Upload** | [react-dropzone](https://react-dropzone.js.org/) |
| **iCal Export** | [ical-generator](https://github.com/sebbo2002/ical-generator) |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com/) |
| **Icons** | [Lucide React](https://lucide.dev) |

---

## Project Structure

```
67cal/
├── firebase.json                  # Firebase services config
├── firestore.rules                # Firestore security rules
├── firestore.indexes.json         # Firestore index overrides
├── storage.rules                  # Firebase Storage security rules
├── next.config.ts                 # Next.js + next-intl plugin config
├── tsconfig.json
├── package.json
│
├── functions/                     # Firebase Cloud Functions
│   ├── src/index.ts               #   verifyCalendarPassword, hashCalendarPassword
│   ├── package.json
│   └── tsconfig.json
│
├── public/                        # Static assets
│
└── src/
    ├── middleware.ts               # next-intl locale routing
    │
    ├── app/
    │   ├── globals.css             # Tailwind base + 4 theme definitions
    │   ├── layout.tsx              # Root layout (passes children)
    │   ├── page.tsx                # Root → redirects to /en
    │   │
    │   ├── [locale]/
    │   │   ├── layout.tsx          # i18n provider, Navbar, Toaster, RTL
    │   │   ├── page.tsx            # Landing page / dashboard redirect
    │   │   ├── loading.tsx         # Global loading skeleton
    │   │   ├── not-found.tsx       # 404 page
    │   │   │
    │   │   ├── auth/
    │   │   │   ├── login/page.tsx
    │   │   │   └── register/page.tsx
    │   │   │
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx        # Calendar list (owned + joined tabs)
    │   │   │   └── loading.tsx
    │   │   │
    │   │   ├── calendar/
    │   │   │   ├── new/page.tsx    # Create calendar form
    │   │   │   └── [calendarId]/
    │   │   │       ├── page.tsx    # Weekly FullCalendar view
    │   │   │       ├── loading.tsx
    │   │   │       ├── settings/page.tsx
    │   │   │       └── event/
    │   │   │           ├── new/page.tsx
    │   │   │           └── [eventId]/
    │   │   │               ├── page.tsx    # Event detail + chat + files
    │   │   │               └── edit/page.tsx
    │   │   │
    │   │   └── invite/
    │   │       └── [inviteCode]/page.tsx    # Public invite + password gate
    │   │
    │   └── api/
    │       └── export/
    │           └── [eventId]/route.ts       # GET → .ics file download
    │
    ├── components/
    │   ├── auth/                   # AuthGuard, LoginForm, RegisterForm
    │   ├── calendar/               # CalendarForm, EventForm, WeekView, EventCard,
    │   │                           #   CancelEventModal, MeetingLinkButton, ExportButton
    │   ├── chat/                   # ChatThread, MessageBubble, MessageInput
    │   ├── dashboard/              # CalendarCard, EmptyState
    │   ├── files/                  # FileUploader, FileList
    │   ├── invite/                 # InviteModal, QRCodeDisplay, ShareLinkButton
    │   ├── layout/                 # Navbar, Sidebar, LanguageSwitcher,
    │   │                           #   ThemeProvider, ErrorBoundary
    │   └── ui/                     # shadcn/ui primitives (15 components)
    │
    ├── hooks/                      # useAuth, useCalendar, useEvents,
    │                               #   useMessages, useTheme
    ├── stores/                     # authStore, calendarStore (Zustand)
    │
    ├── lib/
    │   ├── firebase.ts             # Client SDK init
    │   ├── firebase-admin.ts       # Admin SDK init (null-safe)
    │   ├── auth.ts                 # signIn, signUp, signInWithGoogle, signOut
    │   ├── meetingProvider.ts      # detectMeetingProvider, getMeetingProviderLabel
    │   ├── inviteCodes.ts          # generateInviteCode (nanoid)
    │   ├── password.ts             # hashPassword, verifyPassword (bcrypt)
    │   ├── ical.ts                 # generateICS, generateGoogleCalendarUrl
    │   ├── utils.ts                # cn() — clsx + tailwind-merge
    │   └── firestore/              # CRUD functions for each collection
    │       ├── calendars.ts
    │       ├── events.ts
    │       ├── messages.ts
    │       └── files.ts
    │
    ├── i18n/
    │   ├── en.json                 # English translations
    │   ├── he.json                 # Hebrew translations
    │   ├── routing.ts              # Locale config (en, he)
    │   ├── request.ts              # Server-side message loader
    │   └── navigation.ts           # Locale-aware Link, redirect, useRouter
    │
    └── types/
        └── index.ts                # All TypeScript interfaces and type aliases
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Firebase CLI** — `npm install -g firebase-tools`
- A [Firebase project](https://console.firebase.google.com) with a registered Web App

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/67cal.git
cd 67cal

# Install dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### Firebase Setup

1. **Link your Firebase project:**

   ```bash
   firebase use <your-project-id>
   ```

2. **Deploy security rules:**

   ```bash
   firebase deploy --only firestore:rules,storage
   ```

3. **Build and deploy Cloud Functions:**

   ```bash
   cd functions
   npm run build
   firebase deploy --only functions --force
   cd ..
   ```

4. **Enable Auth providers** in the [Firebase Console](https://console.firebase.google.com):
   - Go to **Authentication > Sign-in method**
   - Enable **Email/Password**
   - Enable **Google**

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Firebase Client SDK (public — exposed in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (server-side only — required for .ics export API)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Note:** The Admin SDK credentials are optional for development. If absent, the `.ics` export endpoint returns `503` but all other features work normally.
>
> To get Admin credentials: Firebase Console > Project Settings > Service Accounts > Generate New Private Key.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/en` (English) by default.

---

## Deployment

### Vercel (Recommended)

1. Push your repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Add all environment variables from `.env.local` in the Vercel dashboard.
4. Deploy.

> Update `NEXT_PUBLIC_BASE_URL` to your production domain so invite links are correct.

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | — | Redirects to `/en` |
| `/[locale]` | — | Landing page or redirect to dashboard |
| `/[locale]/auth/login` | — | Email/password + Google login |
| `/[locale]/auth/register` | — | Registration with display name |
| `/[locale]/dashboard` | Required | Teacher's calendar list (owned & joined tabs) |
| `/[locale]/calendar/new` | Required | Create a new calendar |
| `/[locale]/calendar/[id]` | Required | Weekly calendar view (FullCalendar) |
| `/[locale]/calendar/[id]/settings` | Owner | Edit calendar settings |
| `/[locale]/calendar/[id]/event/new` | Owner | Create a new event |
| `/[locale]/calendar/[id]/event/[eid]` | Required | Event detail with chat, files, export |
| `/[locale]/calendar/[id]/event/[eid]/edit` | Owner | Edit event details |
| `/[locale]/invite/[code]` | Required | Join a calendar via invite code |
| `/api/export/[eventId]` | — | GET: `.ics` file download |

---

## Architecture

### Data Model

All data is stored in **Cloud Firestore**:

```
calendars/{calendarId}
│   id, title, description, ownerId, theme, language,
│   passwordHash, inviteCode, members[], createdAt, updatedAt
│
├── events/{eventId}
│   │   id, title, description, startTime, endTime,
│   │   meetingLink, meetingProvider, status, cancelReason,
│   │   createdAt, updatedAt
│   │
│   ├── messages/{messageId}
│   │       id, authorId, authorName, authorRole, text, createdAt
│   │
│   └── files/{fileId}
│           id, name, type, storagePath, downloadUrl,
│           uploadedBy, uploadedAt, sizeBytes
```

### Components

| Group | Components | Purpose |
|-------|-----------|---------|
| `auth/` | `AuthGuard`, `LoginForm`, `RegisterForm` | Authentication UI and route protection |
| `calendar/` | `CalendarForm`, `EventForm`, `WeekView`, `EventCard`, `CancelEventModal`, `MeetingLinkButton`, `ExportButton` | Calendar and event management |
| `chat/` | `ChatThread`, `MessageBubble`, `MessageInput` | Real-time chat per event |
| `dashboard/` | `CalendarCard`, `EmptyState` | Dashboard calendar list |
| `files/` | `FileUploader`, `FileList` | File upload and display |
| `invite/` | `InviteModal`, `QRCodeDisplay`, `ShareLinkButton` | Invite sharing |
| `layout/` | `Navbar`, `Sidebar`, `LanguageSwitcher`, `ThemeProvider`, `ErrorBoundary` | App shell |
| `ui/` | 15 shadcn/ui primitives | Radix-based design system |

### Hooks & State

| Hook | Description |
|------|-------------|
| `useAuth()` | Subscribes to Firebase auth state, syncs to Zustand `authStore` |
| `useCalendar(id)` | Fetches calendar by ID; computes `isOwner`, `isMember`, `role` |
| `useEvents(calendarId)` | Real-time `onSnapshot` subscription to events |
| `useMessages(calendarId, eventId)` | Real-time `onSnapshot` subscription to chat messages |
| `useTheme(theme)` | Sets `data-theme` attribute on `<html>` |

| Store | State |
|-------|-------|
| `authStore` | `user`, `loading`, `setUser()`, `setLoading()` |
| `calendarStore` | `activeCalendar`, `setActiveCalendar()` |

### Firestore Data Layer

All database operations are in `src/lib/firestore/`:

| Module | Functions |
|--------|-----------|
| `calendars.ts` | `createCalendar`, `getCalendar`, `getOwnedCalendars`, `getMemberCalendars`, `updateCalendar`, `deleteCalendar`, `addMember`, `getCalendarByInviteCode` |
| `events.ts` | `createEvent`, `getEvent`, `getCalendarEvents`, `subscribeToEvents`, `updateEvent`, `cancelEvent` |
| `messages.ts` | `sendMessage`, `deleteMessage`, `subscribeToMessages` |
| `files.ts` | `uploadFile` (with progress callback), `getEventFiles`, `deleteFile` |

### Cloud Functions

Two Firebase callable functions in `functions/src/index.ts`:

| Function | Description |
|----------|-------------|
| `verifyCalendarPassword` | Receives `{ calendarId, password }`. Compares against the stored bcrypt hash. On match, adds the caller's UID to `calendar.members` via `arrayUnion`. Returns `{ success: boolean }`. |
| `hashCalendarPassword` | Receives `{ password }`. Returns `{ hash }` (bcrypt, cost factor 10). Used so plaintext passwords never reach Firestore directly. |

---

## Theme System

Four visual themes are available per calendar, applied via a `data-theme` attribute on `<html>`:

| Theme | Target | Primary Colour | Style |
|-------|--------|----------------|-------|
| **Kids** | Young children | Playful pink | Bright palette (pink/teal/yellow), large rounded corners (`1rem`), larger font (`18px`) |
| **Teen** | Teenagers | Vivid purple | Dark background, bold colours (purple/blue/neon-green), medium corners (`0.5rem`) |
| **Adult** | Professionals | Blue | Clean white background, neutral palette, subtle corners (`0.375rem`), compact font (`15px`) |
| **Minimal** | Any | Grey | Pure white/grey, zero colour chroma, near-square corners (`0.25rem`), compact font (`15px`) |

Themes override shadcn's CSS custom properties (`--primary`, `--secondary`, `--accent`, `--background`, `--card`, `--muted`, `--border`, `--radius`) using `oklch()` colours. The theme is stored on each calendar document and applied by the `ThemeProvider` component when viewing that calendar.

---

## Internationalisation

| Locale | Language | Direction |
|--------|----------|-----------|
| `en` | English | LTR |
| `he` | Hebrew | RTL |

- **Routing** — `/en/...` and `/he/...` via `next-intl` middleware.
- **RTL** — Hebrew sets `dir="rtl"` on `<html>` and passes `direction: 'rtl'` to FullCalendar.
- **Language switcher** — In the Navbar; persists preference to `localStorage`.
- **Translation namespaces** — `common`, `nav`, `auth`, `dashboard`, `calendar`, `event`, `chat`, `files`, `invite`, `errors`.

---

## Security

### Firestore Rules

Role-based access using three helper functions — `isAuth()`, `isOwner(calId)`, `isMember(calId)`:

| Path | Read | Create | Update/Delete |
|------|------|--------|---------------|
| `calendars/{calId}` | Owner or member | Any authenticated user | Owner only |
| `.../events/{eventId}` | Owner or member | Owner only | Owner only |
| `.../messages/{msgId}` | Owner or member | Owner or member | Original author only |
| `.../files/{fileId}` | Owner or member | Owner only | Owner only |

### Storage Rules

```
calendars/{calId}/events/{eventId}/{fileName}
  read:  authenticated
  write: authenticated + size < 20 MB + contentType is PDF/DOC/DOCX
```

### Password Protection

Passwords are **never stored in plaintext**:

1. Client calls the `hashCalendarPassword` Cloud Function before saving.
2. Only the bcrypt hash is written to `calendar.passwordHash`.
3. Joining pupils send their password to `verifyCalendarPassword`, which compares server-side.
4. On match, the function adds the user's UID to `calendar.members`.

---

## Configuration Reference

### `next.config.ts`

Wraps the Next.js config with `next-intl` plugin (pointing to `./src/i18n/request.ts`) and marks `firebase-admin` as a server external package.

### `tsconfig.json`

Strict mode, bundler module resolution, `@/*` path alias to `src/`, excludes `functions/` directory.

### `components.json`

shadcn/ui config: style `base-nova`, RSC enabled, Lucide icons, neutral base colour, CSS variables enabled.

### `firebase.json`

Points to `firestore.rules`, `firestore.indexes.json`, `storage.rules`, and `functions/` source directory.

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint

# Cloud Functions (from the functions/ directory)
npm run build     # Compile TypeScript
npm run serve     # Build + start Firebase emulator
npm run deploy    # Deploy to Firebase
```

---

<div align="center">

Built with [Next.js](https://nextjs.org), [Firebase](https://firebase.google.com), and [shadcn/ui](https://ui.shadcn.com).

</div>
