import { CamperProvider } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import React from 'react';

export default function CalcLayout() {
  const theme = useTheme();

  return (
    <CamperProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="electrics" />
        <Stack.Screen name="insulate" />
        <Stack.Screen name="water-calc" />
        <Stack.Screen name="results" />
      </Stack>
    </CamperProvider>
  );
}
