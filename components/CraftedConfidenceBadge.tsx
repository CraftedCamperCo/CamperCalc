import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CraftedConfidenceBadge() {
  const theme = useTheme();
  return (
    <View style={[s.wrap, { borderColor: `${theme.success}50`, backgroundColor: `${theme.success}16` }]}>
      <FontAwesome name="check-circle" size={13} color={theme.success} />
      <Text style={[s.text, { color: theme.success }]}>Crafted Confidence</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
  },
});

