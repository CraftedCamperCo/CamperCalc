import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AuthorityBadge({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[s.wrap, { borderColor: `${theme.accent}33`, backgroundColor: `${theme.accent}14` }]}>
      <MaterialCommunityIcons name="shield-check-outline" size={13} color={theme.accent} />
      <Text style={[s.text, { color: theme.accent }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

