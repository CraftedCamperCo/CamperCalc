import Colors, { ThemeColors } from '@/constants/Colors';
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext<ThemeColors>(Colors.dark);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = scheme === 'light' ? Colors.light : Colors.dark;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
