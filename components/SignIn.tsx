import { useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Step = 'email' | 'code';

export function SignIn() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailTrimmed = email.trim();

  async function sendCode() {
    setError(null);
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: emailTrimmed,
    });
    setBusy(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep('code');
  }

  async function verify() {
    setError(null);
    const codeTrimmed = code.trim();
    if (codeTrimmed.length < 8) {
      setError('Enter the 8-digit code from your email.');
      return;
    }
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: emailTrimmed,
      token: codeTrimmed,
      type: 'email',
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    // On success, onAuthStateChange in AuthProvider swaps the gate to the app.
  }

  function backToEmail() {
    setStep('email');
    setCode('');
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>The Daily Log</Text>

        {step === 'email' ? (
          <>
            <Text style={styles.heading}>Sign in</Text>
            <Text style={styles.sub}>
              We'll email you an 8-digit code — no password to remember.
            </Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.line}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={sendCode}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={sendCode}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send code</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Enter code</Text>
            <Text style={styles.sub}>
              We sent an 8-digit code to {emailTrimmed}.
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
              placeholder="12345678"
              placeholderTextColor={Colors.line}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={verify}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={verify}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify &amp; sign in</Text>
              )}
            </Pressable>

            <Pressable onPress={backToEmail} disabled={busy} hitSlop={8}>
              <Text style={styles.link}>Use a different email</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 14,
    color: Colors.terra,
    letterSpacing: 0.5,
    marginBottom: Spacing.xl,
  },
  heading: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.inkSoft,
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  input: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    color: Colors.ink,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  codeInput: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    letterSpacing: 6,
    textAlign: 'center',
  },
  error: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.terra,
    marginTop: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.terra,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#fff',
  },
  link: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
