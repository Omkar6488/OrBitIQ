import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/colors';

export default function InfoChip({ label, tone = 'default' }) {
  const chipTone =
    tone === 'success'
      ? { backgroundColor: 'rgba(104, 211, 145, 0.16)', color: colors.success }
      : tone === 'warning'
        ? { backgroundColor: 'rgba(246, 173, 85, 0.16)', color: colors.warning }
        : tone === 'danger'
          ? { backgroundColor: 'rgba(255, 90, 125, 0.16)', color: colors.danger }
          : { backgroundColor: 'rgba(79, 209, 255, 0.14)', color: colors.primary };

  return (
    <View style={[styles.wrapper, { backgroundColor: chipTone.backgroundColor }]}>
      <Text style={[styles.text, { color: chipTone.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});