import { useTabNav } from '@/context/TabNavContext';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useMemo } from 'react';
import { Animated, PanResponder, PanResponderInstance } from 'react-native';

const SLIDE_DISTANCE = 30;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 0.3;

export function useScreenSlide(screenIndex: number, swipeEnabled = true) {
  const { currentIndex, prevIndex, totalTabs, navigate } = useTabNav();
  const isFocused = useIsFocused();
  const translateX = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFocused) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      const direction = currentIndex > prevIndex ? 1 : -1;
      translateX.setValue(direction * SLIDE_DISTANCE);
      Animated.spring(translateX, {
        toValue: 0,
        friction: 10,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  const panResponder: PanResponderInstance = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!swipeEnabled) return false;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (!swipeEnabled) return;
        const { dx, vx } = gestureState;
        if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) {
          if (currentIndex < totalTabs - 1) navigate(currentIndex + 1);
        } else if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) {
          if (currentIndex > 0) navigate(currentIndex - 1);
        }
      },
    }),
  [currentIndex, totalTabs, navigate, swipeEnabled]);

  return {
    style: { transform: [{ translateX }] },
    panHandlers: panResponder.panHandlers,
  };
}
