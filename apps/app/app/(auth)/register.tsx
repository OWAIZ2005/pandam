import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, usernameSchema, z, type RegisterInput } from '@pandam/validation';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';

import { Button, Field, Row, Screen, Stack, Text } from '@pandam/ui';

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
  const { control, handleSubmit, formState } = useForm<RegisterFormValues>({
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

  const formError =
    register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? 'Something went wrong.'
        : null;

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Stack gap="xl">
          <View>
            <Text variant="display" tone="accent">
              PANDAM
            </Text>
            <Text variant="h3" style={{ marginTop: 4 }}>
              Create your account
            </Text>
            <Text tone="secondary">Barter, not buy — list what you have and what you need.</Text>
          </View>

          <Stack gap="lg">
            <Controller
              control={control}
              name="displayName"
              render={({ field, fieldState }) => (
                <Field
                  label="Display name"
                  autoCapitalize="words"
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
                  hint="Optional — a handle others can find you by."
                  autoCapitalize="none"
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
                  hint="At least 10 characters, with letters and numbers."
                  secureTextEntry
                  textContentType="newPassword"
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
              label={register.isPending ? 'Creating…' : 'Create account'}
              fullWidth
              loading={register.isPending}
              disabled={formState.isSubmitting}
              onPress={onSubmit}
            />
          </Stack>

          <Row gap="xs" justify="center">
            <Text tone="secondary">Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text tone="accent" style={{ fontWeight: '600' }}>
                Sign in
              </Text>
            </Link>
          </Row>
        </Stack>
      </ScrollView>
    </Screen>
  );
}
