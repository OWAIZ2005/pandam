import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { loginSchema, type LoginInput } from '@pandam/validation';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { Button, Field, Notice, PasswordField, Row, Screen, Stack, Text, colors } from '@pandam/ui';

import { AuthShell } from '@/components/brand/AuthShell';
import { OAuthButtons, OAuthDivider } from '@/components/brand/OAuthButtons';
import { ApiError } from '@/lib/api/client';
import { useLogin } from '@/lib/auth/hooks';

export default function LoginScreen() {
  const router = useRouter();
  const login = useLogin();
  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => router.replace('/(app)/(tabs)') });
  });

  /*
   * The API returns one deliberately generic message for a bad email and a bad
   * password, so it cannot be used to discover which accounts exist. The copy
   * here has to work for both cases without implying which one it was.
   */
  const formError =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'We could not reach PANDAM. Check your connection and try again.'
        : null;

  return (
    <Screen padded={false} edges={['top', 'bottom']} contentStyle={{ maxWidth: '100%' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <AuthShell
            title="Welcome back"
            subtitle="Continue trading what you have for what you need."
          >
            <Stack gap="2xl">
              <Stack gap="lg">
                <OAuthButtons onSuccess={() => router.replace('/(app)/(tabs)')} />
                <OAuthDivider />
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field
                      label="Email"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      leftIcon={<Ionicons name="mail-outline" size={17} color={colors.textMuted} />}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <PasswordField
                      label="Password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="go"
                      onSubmitEditing={onSubmit}
                      leftIcon={
                        <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} />
                      }
                      revealIcon={
                        <Ionicons name="eye-outline" size={18} color={colors.textMuted} />
                      }
                      hideIcon={
                        <Ionicons name="eye-off-outline" size={18} color={colors.textMuted} />
                      }
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />

                {formError ? (
                  <Notice
                    kind="danger"
                    icon={<Ionicons name="alert-circle" size={16} color={colors.danger} />}
                  >
                    {formError}
                  </Notice>
                ) : null}

                <Button
                  label={login.isPending ? 'Signing in…' : 'Sign in'}
                  size="lg"
                  fullWidth
                  loading={login.isPending}
                  disabled={formState.isSubmitting}
                  onPress={onSubmit}
                />
              </Stack>

              <Row gap="xs" justify="center">
                <Text variant="bodySm" tone="secondary">
                  New to PANDAM?
                </Text>
                <Link href="/(auth)/register">
                  <Text variant="label" tone="accent">
                    Create an account
                  </Text>
                </Link>
              </Row>
            </Stack>
          </AuthShell>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
