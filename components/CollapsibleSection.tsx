import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  /** Short summary shown in the header when collapsed */
  badge?: string;
  /** Whether to start expanded */
  initiallyOpen?: boolean;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, badge, initiallyOpen = false, subtitle, children }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const isDark = theme.blurTint === 'dark';

  useEffect(() => {
    setOpen(initiallyOpen);
  }, [initiallyOpen]);

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(250, 'easeInEaseOut', 'opacity')
    );
    setOpen(o => !o);
  };

  return (
    <View style={[s.container, { borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
      <TouchableOpacity style={s.header} onPress={toggle} activeOpacity={0.75}>
        <View style={s.headerLeft}>
          <Text style={[s.title, { color: theme.textSecondary }]}>{title}</Text>
          {subtitle && !open && (
            <Text style={[s.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
        <View style={s.headerRight}>
          {badge && !open && (
            <View style={[s.badge, { backgroundColor: `${theme.accent}20` }]}>
              <Text style={[s.badgeText, { color: theme.accent }]}>{badge}</Text>
            </View>
          )}
          <FontAwesome
            name={open ? 'chevron-up' : 'chevron-down'}
            size={11}
            color={theme.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {open && (
        <View style={s.body}>
          {children}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 14,
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 2,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    opacity: 0.7,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    paddingTop: 10,
  },
});
