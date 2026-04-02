import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const IMG_WIDTH = Math.min(width * 0.7, 260);
const IMG_HEIGHT = IMG_WIDTH * 0.95;

export default function VanIllustration() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require('../assets/images/van-illustration.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  image: {
    width: IMG_WIDTH,
    height: IMG_HEIGHT,
  },
});
