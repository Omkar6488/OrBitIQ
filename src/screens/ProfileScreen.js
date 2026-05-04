import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavbar from '../components/TopNavbar';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';

export default function ProfileScreen({ navigation }) {
  const { currentUser, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <TopNavbar title="Profile" onLeftPress={() => navigation.goBack()} showSearch={false} showNotify={false} />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>EMAIL</Text>
          <Text style={styles.value}>{currentUser?.email || 'unknown'}</Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 120,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,90,125,0.6)',
    backgroundColor: 'rgba(255,90,125,0.16)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
