import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';
import globalStyles from '../styles/globalStyles';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    useProxy: Platform.OS !== 'web',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '174346155743-nfkska1nc19o82j84rr459d1lg0m8kfq.apps.googleusercontent.com',
    webClientId: '174346155743-nfkska1nc19o82j84rr459d1lg0m8kfq.apps.googleusercontent.com',
    redirectUri,
  });

  const isDisabled = useMemo(() => !email.trim() || !password.trim(), [email, password]);

  const onLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await login({ email: email.trim(), password: password.trim() });
    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Login failed.');
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainHub' }],
    });
  };

  useEffect(() => {
    const handleGoogle = async () => {
      if (response?.type !== 'success') {
        return;
      }

      const idToken = response?.authentication?.idToken;
      if (!idToken) {
        setError('Google login failed.');
        return;
      }

      setGoogleLoading(true);
      const result = await loginWithGoogle({ idToken });
      setGoogleLoading(false);

      if (!result.ok) {
        setError(result.error || 'Google login failed.');
      }
    };

    handleGoogle();
  }, [loginWithGoogle, response]);

  const onGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    await promptAsync({ useProxy: Platform.OS !== 'web' });
    setGoogleLoading(false);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your orbital briefing.</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            style={styles.input}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={[styles.buttonWrap, isDisabled && styles.buttonDisabled]} onPress={onLogin} disabled={isDisabled || loading}>
            <LinearGradient
              colors={['rgba(79,209,255,0.9)', 'rgba(123,97,255,0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#041018" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[styles.googleButton, (!request || googleLoading) && styles.buttonDisabled]}
            onPress={onGoogleLogin}
            disabled={!request || googleLoading}
          >
            <Text style={styles.googleText}>{googleLoading ? 'Connecting...' : 'Continue with Google'}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}>Don't have an account? Sign Up</Text>
          </Pressable>

          <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainHub' }] })}>
            <Text style={styles.guestLink}>Continue as Guest</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 22,
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  buttonWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#041018',
    fontWeight: '800',
    fontSize: 15,
  },
  googleButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  googleText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  link: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
  },
  guestLink: {
    marginTop: 6,
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
