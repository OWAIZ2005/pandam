import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@pandam/validation';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button, Field, Row, Screen, Stack, Text } from '@pandam/ui';

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

  const formError =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'Something went wrong.'
        : null;

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Stack gap="xl">
            <View>
              <Text variant="display" tone="accent">
                PANDAM
              </Text>
              <Text variant="h3" style={{ marginTop: 4 }}>
                Welcome back
              </Text>
              <Text tone="secondary">Trade what you have for what you need.</Text>
            </View>

            <Stack gap="lg">
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field
                    label="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
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
                  <Field
                    label="Password"
                    secureTextEntry
                    textContentType="password"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {formError ? (
                <Text variant="bodySm" tone="danger">
                  {formError}
                </Text>
              ) : null}

              <Button
                label={login.isPending ? 'Signing in…' : 'Sign in'}
                fullWidth
                loading={login.isPending}
                disabled={formState.isSubmitting}
                onPress={onSubmit}
              />
            </Stack>

            <Row gap="xs" justify="center">
              <Text tone="secondary">No account?</Text>
              <Link href="/(auth)/register">
                <Text tone="accent" style={{ fontWeight: '600' }}>
                  Create one
                </Text>
              </Link>
            </Row>
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
