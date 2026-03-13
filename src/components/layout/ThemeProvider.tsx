'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { Theme } from '@/types';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'minimal' });

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  theme = 'minimal',
  children,
}: {
  theme?: Theme;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}
