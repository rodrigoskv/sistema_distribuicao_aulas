import React, { createContext, useContext, useEffect, useMemo } from 'react';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void; // no-op (desativado)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('dark')) {
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('school-schedule-theme', 'dark');
    } catch {}
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: 'dark',
      toggleTheme: () => {}, 
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
