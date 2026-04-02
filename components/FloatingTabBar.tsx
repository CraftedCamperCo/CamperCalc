import { useTabNav } from '@/context/TabNavContext';
import { useTheme } from '@/context/ThemeContext';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = FEATURE_FLAGS.THREE_D_KITS_ENABLED
  ? [
      { name: 'index', label: 'Camper', iconLib: 'mci', icon: 'van-utility' },
      { name: 'two', label: 'Systems', iconLib: 'fa', icon: 'bolt' },
      { name: 'insulation', label: 'Insulate', iconLib: 'mci', icon: 'shield-home' },
      { name: 'water', label: 'Water', iconLib: 'mci', icon: 'water' },
      { name: 'furniture', label: 'Furniture', iconLib: 'mci', icon: 'sofa-outline' },
      { name: 'three', label: 'Summary', iconLib: 'fa', icon: 'wrench' },
    ]
  : [
      { name: 'index', label: 'Camper', iconLib: 'mci', icon: 'van-utility' },
      { name: 'two', label: 'Systems', iconLib: 'fa', icon: 'bolt' },
      { name: 'insulation', label: 'Insulate', iconLib: 'mci', icon: 'shield-home' },
      { name: 'water', label: 'Water', iconLib: 'mci', icon: 'water' },
      { name: 'three', label: 'Summary', iconLib: 'fa', icon: 'wrench' },
    ];

function TabIcon({ iconLib, icon, color }: { iconLib: string; icon: string; color: string }) {
  if (iconLib === 'mci') {
    return <MaterialCommunityIcons name={icon as any} size={20} color={color} />;
  }
  return <FontAwesome name={icon as any} size={18} color={color} />;
}

const PILL_HEIGHT = 62;
const BUBBLE_WIDTH = 48;
const BUBBLE_HEIGHT = 42;

export default function FloatingTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentIndex, navigate } = useTabNav();

  const [rowWidth, setRowWidth] = useState(0);
  const bubbleX = useRef(new Animated.Value(0)).current;
  const prevIndex = useRef(currentIndex);

  const tabWidth = rowWidth / TABS.length;
  const bubbleCenter = (index: number) => tabWidth * index + (tabWidth - BUBBLE_WIDTH) / 2;

  useEffect(() => {
    if (rowWidth === 0) return;
    if (prevIndex.current === currentIndex) {
      bubbleX.setValue(bubbleCenter(currentIndex));
      return;
    }
    prevIndex.current = currentIndex;
    Animated.spring(bubbleX, {
      toValue: bubbleCenter(currentIndex),
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, rowWidth]);

  const onRowLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setRowWidth(w);
    bubbleX.setValue(w / TABS.length * currentIndex + (w / TABS.length - BUBBLE_WIDTH) / 2);
  };

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 12) + 4 }]} pointerEvents="box-none">
      <View style={[styles.pill, { borderColor: `${theme.accent}28` }]}>
        <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.surface, { backgroundColor: theme.tabBarBg }]} />
        <View style={styles.topEdge} />
        <View style={[styles.chromaRed, { borderColor: 'rgba(255,60,60,0.05)' }]} />
        <View style={[styles.chromaBlue, { borderColor: 'rgba(60,60,255,0.05)' }]} />

        <View style={styles.tabsRow} onLayout={onRowLayout}>
          {/* Sliding bubble indicator */}
          {rowWidth > 0 && (
            <Animated.View
              style={[
                styles.bubble,
                {
                  transform: [{ translateX: bubbleX }],
                  borderColor: `${theme.accent}30`,
                },
              ]}
            >
              <BlurView intensity={25} tint={theme.blurTint} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.bubbleSurface, { backgroundColor: `${theme.accent}22` }]} />
              <View style={[styles.bubbleTopEdge, { backgroundColor: `${theme.accent}55` }]} />
            </Animated.View>
          )}

          {TABS.map((tab, i) => {
            const isActive = i === currentIndex;
            const color = isActive ? theme.accent : theme.tabIconDefault;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => navigate(i)}
                activeOpacity={0.7}
              >
                <View style={styles.tabIconWrap}>
                  <TabIcon iconLib={tab.iconLib} icon={tab.icon} color={color} />
                </View>
                <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    alignItems: 'stretch',
  },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chromaRed: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    marginLeft: -1,
    marginTop: 1,
  },
  chromaBlue: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    marginLeft: 1,
    marginTop: -1,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    borderRadius: BUBBLE_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    top: (PILL_HEIGHT - BUBBLE_HEIGHT) / 2,
  },
  bubbleSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  bubbleTopEdge: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_HEIGHT,
  },
  tabIconWrap: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
