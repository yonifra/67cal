import { create } from 'zustand';
import { Calendar } from '@/types';

interface CalendarState {
  activeCalendar: Calendar | null;
  setActiveCalendar: (calendar: Calendar | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  activeCalendar: null,
  setActiveCalendar: (calendar) => set({ activeCalendar: calendar }),
}));
