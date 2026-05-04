import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../styles/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Loader({ count = 3, height = 150, compact = false }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer]);

  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
      }),
    [shimmer]
  );

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`loader-${index}`} style={[styles.card, { height }, compact && styles.compact]}>
          <View style={styles.topGlow} />
          <Animated.View style={[styles.shine, { transform: [{ translateX }] }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(123, 97, 255, 0.18)',
  },
  compact: {
    height: 90,
  },
  shine: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(50, 240, 255, 0.12)',
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
