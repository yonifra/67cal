import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from '../calendarStore';
import type { Calendar } from '@/types';

describe('calendarStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useCalendarStore.setState({ activeCalendar: null });
  });

  describe('initial state', () => {
    it('has null activeCalendar', () => {
      expect(useCalendarStore.getState().activeCalendar).toBeNull();
    });
  });

  describe('setActiveCalendar()', () => {
    it('sets the active calendar', () => {
      const mockCalendar: Calendar = {
        id: 'cal-1',
        title: 'Math Class',
        description: 'Weekly math lessons',
        ownerId: 'user-1',
        theme: 'kids',
        language: 'en',
        colorMode: 'light',
        firstDay: 0,
        weekendDays: 'sat-sun',
        passwordHash: null,
        inviteCode: 'abc12345',
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
        members: ['user-1', 'user-2'],
      };

      useCalendarStore.getState().setActiveCalendar(mockCalendar);
      expect(useCalendarStore.getState().activeCalendar).toEqual(mockCalendar);
    });

    it('can set active calendar to null', () => {
      const mockCalendar: Calendar = {
        id: 'cal-1',
        title: 'Math Class',
        description: 'Weekly math lessons',
        ownerId: 'user-1',
        theme: 'adult',
        language: 'he',
        colorMode: 'dark',
        firstDay: 1,
        weekendDays: 'fri-sat',
        passwordHash: 'hashed',
        inviteCode: 'xyz67890',
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
        members: ['user-1'],
      };

      useCalendarStore.getState().setActiveCalendar(mockCalendar);
      useCalendarStore.getState().setActiveCalendar(null);
      expect(useCalendarStore.getState().activeCalendar).toBeNull();
    });

    it('replaces the previous active calendar', () => {
      const calendar1: Calendar = {
        id: 'cal-1',
        title: 'First Calendar',
        description: '',
        ownerId: 'user-1',
        theme: 'minimal',
        language: 'en',
        colorMode: 'light',
        firstDay: 0,
        weekendDays: 'sat-sun',
        passwordHash: null,
        inviteCode: 'aaa11111',
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
        members: [],
      };

      const calendar2: Calendar = {
        id: 'cal-2',
        title: 'Second Calendar',
        description: '',
        ownerId: 'user-2',
        theme: 'teen',
        language: 'he',
        colorMode: 'dark',
        firstDay: 1,
        weekendDays: 'fri-sat',
        passwordHash: null,
        inviteCode: 'bbb22222',
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
        members: [],
      };

      useCalendarStore.getState().setActiveCalendar(calendar1);
      useCalendarStore.getState().setActiveCalendar(calendar2);

      const state = useCalendarStore.getState();
      expect(state.activeCalendar?.id).toBe('cal-2');
      expect(state.activeCalendar?.title).toBe('Second Calendar');
    });
  });
});
