import { describe, it, expect } from 'vitest';
import { detectMeetingProvider, getMeetingProviderLabel } from '../meetingProvider';

describe('detectMeetingProvider()', () => {
  it('detects Zoom links (zoom.us)', () => {
    expect(detectMeetingProvider('https://zoom.us/j/123456')).toBe('zoom');
  });

  it('detects Zoom links (zoom.com)', () => {
    expect(detectMeetingProvider('https://zoom.com/j/123456')).toBe('zoom');
  });

  it('detects Zoom links with subdomains', () => {
    expect(detectMeetingProvider('https://us02web.zoom.us/j/123456')).toBe('zoom');
  });

  it('detects Google Meet links', () => {
    expect(detectMeetingProvider('https://meet.google.com/abc-defg-hij')).toBe('meet');
  });

  it('detects Microsoft Teams links (teams.microsoft.com)', () => {
    expect(detectMeetingProvider('https://teams.microsoft.com/l/meetup-join/123')).toBe('teams');
  });

  it('detects Microsoft Teams links (teams.live.com)', () => {
    expect(detectMeetingProvider('https://teams.live.com/meet/123')).toBe('teams');
  });

  it('returns "other" for unknown providers', () => {
    expect(detectMeetingProvider('https://example.com/meeting')).toBe('other');
  });

  it('returns "other" for invalid URLs', () => {
    expect(detectMeetingProvider('not-a-valid-url')).toBe('other');
  });

  it('returns "other" for empty string', () => {
    expect(detectMeetingProvider('')).toBe('other');
  });

  it('is case-insensitive for hostnames', () => {
    expect(detectMeetingProvider('https://ZOOM.US/j/123456')).toBe('zoom');
    expect(detectMeetingProvider('https://Meet.Google.Com/abc')).toBe('meet');
  });
});

describe('getMeetingProviderLabel()', () => {
  it('returns "Zoom" for zoom provider', () => {
    expect(getMeetingProviderLabel('zoom')).toBe('Zoom');
  });

  it('returns "Google Meet" for meet provider', () => {
    expect(getMeetingProviderLabel('meet')).toBe('Google Meet');
  });

  it('returns "Microsoft Teams" for teams provider', () => {
    expect(getMeetingProviderLabel('teams')).toBe('Microsoft Teams');
  });

  it('returns "Meeting" for other provider', () => {
    expect(getMeetingProviderLabel('other')).toBe('Meeting');
  });
});
