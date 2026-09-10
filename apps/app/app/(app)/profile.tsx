import { zodResolver } from '@hookform/resolvers/zod';
import { boundedString, usernameSchema, z, type PatchProfileInput } from '@pandam/validation';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@pandam/ui';

import { Button, Field } from '@/components/form';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/lib/auth/hooks';
import { useUpdateProfile } from '@/lib/auth/profile';

// Form-local schema: blank inputs are allowed and mean "clear this field".
// Non-empty values are validated against the shared rules, then mapped to the
// strict `PatchProfileInput` (blank -> null) on submit.
const optionalTrimmed = (max: number) => z.string().trim().max(max).optional();
const profileFormSchema = z.object({
  displayName: boundedString(1, 80),
  username: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || usernameSchema.safeParse(v).success, {
      message: 'letters, numbers and underscores only',
    }),
  bio: optionalTrimmed(500),
  locationCity: optionalTrimmed(120),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const update = useUpdateProfile();

  const { control, handleSubmit, reset, formState } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: '', username: '', bio: '', locationCity: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        username: profile.username ?? '',
        bio: profile.bio ?? '',
        locationCity: profile.locationCity ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = handleSubmit((values) => {
    const payload: PatchProfileInput = {
      displayName: values.displayName,
      username: values.username?.trim() ? values.username.trim() : null,
      bio: values.bio?.trim() ? values.bio.trim() : null,
      locationCity: values.locationCity?.trim() ? values.locationCity.trim() : null,
    };
    update.mutate(payload, { onSuccess: () => router.replace('/(app)') });
  });

  const formError =
    update.error instanceof ApiError
      ? update.error.message
      : update.error
        ? 'Update failed.'
        : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 p-6">
        <Text variant="heading">Your profile</Text>

        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Field
              label="Display name"
              autoCapitalize="words"
              value={field.value ?? ''}
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
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="bio"
          render={({ field, fieldState }) => (
            <Field
              label="Bio"
              multiline
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="locationCity"
          render={({ field, fieldState }) => (
            <Field
              label="City (coarse location only)"
              autoCapitalize="words"
              value={field.value ?? ''}
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

        <View className="gap-2">
          <Button
            label={update.isPending ? 'Saving…' : 'Save'}
            onPress={onSubmit}
            disabled={update.isPending || formState.isSubmitting}
          />
          <Button label="Cancel" variant="ghost" onPress={() => router.replace('/(app)')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
