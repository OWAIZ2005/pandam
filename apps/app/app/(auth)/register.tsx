import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, usernameSchema, z, type RegisterInput } from '@pandam/validation';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import {
  Button,
  Field,
  Notice,
  PasswordField,
  Row,
  Screen,
  Stack,
  Text,
  colors,
  spacing,
} from '@pandam/ui';

import { AuthShell } from '@/components/brand/AuthShell';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { ApiError } from '@/lib/api/client';
import { useRegister } from '@/lib/auth/hooks';

// Username is a plain optional string in the form (blank = none), validated
// against the shared rule only when present, then mapped to the strict input.
const registerFormSchema = registerSchema.extend({
  username: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || usernameSchema.safeParse(v).success, {
      message: 'letters, numbers and underscores only',
    }),
});
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const register = useRegister();
  const { control, handleSubmit, formState, watch } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', displayName: '', username: '' },
  });

  const onSubmit = handleSubmit((values) => {
    const payload: RegisterInput = {
      email: values.email,
      password: values.password,
      displayName: values.displayName,
      username: values.username?.trim() ? values.username.trim() : undefined,
    };
    register.mutate(payload, { onSuccess: () => router.replace('/(app)/(tabs)') });
  });

  const password = watch('password');

  const formError =
    register.error instanceof ApiError
      ? register.error.message
      : register.error
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
            title="Create your account"
            subtitle="Join PANDAM and start trading what you have for what you need."
          >
            <Stack gap="2xl">
              <Stack gap="lg">
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field, fieldState }) => (
                    <Field
                      label="Display name"
                      placeholder="Maya Rao"
                      autoCapitalize="words"
                      leftIcon={
                        <Ionicons name="person-outline" size={17} color={colors.textMuted} />
                      }
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <Field
                      label="Username"
                      placeholder="mayarao"
                      optional
                      hint="A handle others can find you by."
                      autoCapitalize="none"
                      leftIcon={<Ionicons name="at" size={17} color={colors.textMuted} />}
                      value={field.value ?? ''}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                    />
                  )}
                />
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
                    <View style={{ gap: spacing.sm }}>
                      <PasswordField
                        label="Password"
                        placeholder="At least 10 characters"
                        hint={field.value ? undefined : 'At least 10 characters, with a number.'}
                        autoComplete="new-password"
                        textContentType="newPassword"
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
                      <PasswordRequirements value={password ?? ''} />
                    </View>
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
                  label={register.isPending ? 'Creating…' : 'Create account'}
                  size="lg"
                  fullWidth
                  loading={register.isPending}
                  disabled={formState.isSubmitting}
                  onPress={onSubmit}
                />
              </Stack>

              <Row gap="xs" justify="center">
                <Text variant="bodySm" tone="secondary">
                  Already have an account?
                </Text>
                <Link href="/(auth)/login">
                  <Text variant="label" tone="accent">
                    Sign in
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
