import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@pandam/validation';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@pandam/ui';

import { Button, Field } from '@/components/form';
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
    login.mutate(values, { onSuccess: () => router.replace('/(app)') });
  });

  const formError =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'Something went wrong.'
        : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow justify-center gap-5 p-6">
        <View className="gap-1">
          <Text variant="heading">Welcome back</Text>
          <Text variant="muted">Sign in to your PANDAM account.</Text>
        </View>

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
          <Text variant="muted" className="text-danger">
            {formError}
          </Text>
        ) : null}

        <Button
          label={login.isPending ? 'Signing in…' : 'Sign in'}
          onPress={onSubmit}
          disabled={login.isPending || formState.isSubmitting}
        />

        <View className="flex-row justify-center gap-1">
          <Text variant="muted">No account?</Text>
          <Link href="/(auth)/register">
            <Text variant="muted" className="text-primary">
              Create one
            </Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
