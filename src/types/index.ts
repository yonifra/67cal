import { Timestamp } from 'firebase/firestore';

export type Theme = 'kids' | 'teen' | 'adult' | 'minimal';
export type Language = 'en' | 'he';
export type ColorMode = 'light' | 'dark';
export type FirstDay = 0 | 1; // 0 = Sunday, 1 = Monday
export type WeekendDays = 'sat-sun' | 'fri-sat';
export type MeetingProvider = 'zoom' | 'meet' | 'teams' | 'other';
export type EventStatus = 'active' | 'cancelled';
export type UserRole = 'teacher' | 'pupil';
export type AuthorRole = 'teacher' | 'pupil';
export type FileType = 'pdf' | 'docx' | 'doc';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
  avatarStyle?: string;   // DiceBear style name: 'adventurer' | 'funEmoji' | 'bottts' | 'bigSmile'
  avatarSeed?: string;    // Random seed string for generating the avatar
}

export interface Calendar {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  theme: Theme;
  language: Language;
  colorMode: ColorMode;
  firstDay: FirstDay;
  weekendDays: WeekendDays;
  passwordHash: string | null;
  inviteCode: string;
  collaborators: string[];
  collaboratorInviteCode: string;
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
  recurrenceGroupId: string | null;
  recurrenceIndex: number | null;
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
  authorAvatarStyle?: string;
  authorAvatarSeed?: string;
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
  colorMode: ColorMode;
  firstDay: FirstDay;
  weekendDays: WeekendDays;
  password?: string;
}

export interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  repeatUntil: string;
  repeatDays: number[];  // 0=Sun, 1=Mon, ..., 6=Sat — empty array = no repeat
}
