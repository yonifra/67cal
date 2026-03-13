'use client';

import { useEffect } from 'react';
import { Theme } from '@/types';

export function useTheme(theme: Theme = 'minimal') {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);
}
