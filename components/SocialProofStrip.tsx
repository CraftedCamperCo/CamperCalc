import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SocialProofStrip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[s.wrap, { borderColor: `${theme.accent}2f`, backgroundColor: `${theme.accent}12` }]}>
      <MaterialCommunityIcons name="account-group-outline" size={15} color={theme.accent} />
      <Text style={[s.text, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});

