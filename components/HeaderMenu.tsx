import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

export default function HeaderMenu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  function closeMenu() {
    setOpen(false);
  }

  function goTo(path: '/faq' | '/support' | '/terms' | '/privacy') {
    closeMenu();
    router.push(path);
  }

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      {open ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      ) : null}

      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.logoButton}
          onPress={() => {
            if (router.canDismiss()) router.dismissAll();
            else router.replace('/');
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={require('../assets/images/crafted-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuToggle, { borderColor: `${theme.accent}66`, backgroundColor: `${theme.accent}12` }]}
          onPress={() => setOpen((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[styles.menuToggleText, { color: theme.accent }]}>{open ? 'x' : '?'}</Text>
        </TouchableOpacity>
      </View>

      {open ? (
        <View style={[styles.menu, { backgroundColor: theme.card, borderColor: `${theme.accent}55` }]}>
          <Text style={[styles.menuHint, { color: theme.textSecondary }]}>Quick links</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => goTo('/faq')} activeOpacity={0.8}>
            <Text style={[styles.menuText, { color: theme.text }]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => goTo('/support')} activeOpacity={0.8}>
            <Text style={[styles.menuText, { color: theme.text }]}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => goTo('/terms')} activeOpacity={0.8}>
            <Text style={[styles.menuText, { color: theme.text }]}>Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => goTo('/privacy')} activeOpacity={0.8}>
            <Text style={[styles.menuText, { color: theme.text }]}>Privacy</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 200,
  },
  logoButton: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 110,
    height: 38,
  },
  menuToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuToggleText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  menu: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuHint: {
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  menuItem: {
    paddingVertical: 7,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
