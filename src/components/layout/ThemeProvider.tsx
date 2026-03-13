'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { Theme, ColorMode } from '@/types';

interface ThemeContextType {
  theme: Theme;
  colorMode: ColorMode;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'minimal', colorMode: 'light' });

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  theme = 'minimal',
  colorMode = 'light',
  children,
}: {
  theme?: Theme;
  colorMode?: ColorMode;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    };
  }, [theme, colorMode]);

  return (
    <ThemeContext.Provider value={{ theme, colorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
