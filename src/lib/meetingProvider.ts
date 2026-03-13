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

export function getMeetingProviderLabel(provider: MeetingProvider): string {
  switch (provider) {
    case 'zoom': return 'Zoom';
    case 'meet': return 'Google Meet';
    case 'teams': return 'Microsoft Teams';
    case 'other': return 'Meeting';
  }
}
