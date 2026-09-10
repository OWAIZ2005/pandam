import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, usernameSchema, z, type RegisterInput } from '@pandam/validation';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@pandam/ui';

import { Button, Field } from '@/components/form';
import { ApiError } from '@/lib/api/client';
import { useRegister } from '@/lib/auth/hooks';

// The form keeps username as a plain optional string (blank = "no username");
// it is validated against the shared `usernameSchema` only when non-empty, then
// mapped to the strict `RegisterInput` on submit.
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
    register.mutate(payload, { onSuccess: () => router.replace('/(app)') });
  });

  const formError =
    register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? 'Something went wrong.'
        : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow justify-center gap-5 p-6">
        <View className="gap-1">
          <Text variant="heading">Create your account</Text>
          <Text variant="muted">Trade what you have for what you need.</Text>
        </View>

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
              label="Username (optional)"
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
              label="Password (min 10 chars, letters + numbers)"
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
          <Text variant="muted" className="text-danger">
            {formError}
          </Text>
        ) : null}

        <Button
          label={register.isPending ? 'Creating…' : 'Create account'}
          onPress={onSubmit}
          disabled={register.isPending || formState.isSubmitting}
        />

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">Already have an account?</Text>
          <Link href="/(auth)/login">
            <Text variant="muted" className="text-primary">
              Sign in
            </Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
