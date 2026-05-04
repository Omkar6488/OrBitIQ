import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

export default function EmptyState({ title, message, onRetry, icon = 'alert-circle-outline' }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={36} color={colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {!!onRetry && (
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: colors.card,
    padding: 22,
    alignItems: 'center',
  },
  title: {
    marginTop: 10,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    marginTop: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#041018',
    fontWeight: '700',
  },
});
