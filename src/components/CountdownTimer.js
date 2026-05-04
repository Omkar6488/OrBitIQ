import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/colors';

const getRemainingMs = (targetDate) => {
  const target = new Date(targetDate).getTime();

  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.max(0, target - Date.now());
};

const formatRemaining = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

export default function CountdownTimer({ targetDate }) {
  const [remainingMs, setRemainingMs] = useState(getRemainingMs(targetDate));
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRemainingMs(getRemainingMs(targetDate));

    const intervalId = setInterval(() => {
      setRemainingMs(getRemainingMs(targetDate));

      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [pulse, targetDate]);

  const formatted = useMemo(() => formatRemaining(remainingMs), [remainingMs]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>COUNTDOWN</Text>
      <Animated.Text style={[styles.time, { transform: [{ scale: pulse }] }]}>{formatted}</Animated.Text>
      <Text style={styles.status}>{remainingMs > 0 ? 'to liftoff' : 'launch window opened'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  time: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  status: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
