import { zodResolver } from '@hookform/resolvers/zod';
import { boundedString, usernameSchema, z, type PatchProfileInput } from '@pandam/validation';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';

import { Button, Field, Screen, Stack, Text } from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/lib/auth/hooks';
import { useUpdateProfile } from '@/lib/auth/profile';

// Blank inputs are allowed and mean "clear this field"; non-empty values are
// checked against the shared rules, then mapped to the strict PatchProfileInput.
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

export default function EditProfileScreen() {
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

  const back = () => router.replace('/(app)/(tabs)/profile');

  const onSubmit = handleSubmit((values) => {
    const payload: PatchProfileInput = {
      displayName: values.displayName,
      username: values.username?.trim() ? values.username.trim() : null,
      bio: values.bio?.trim() ? values.bio.trim() : null,
      locationCity: values.locationCity?.trim() ? values.locationCity.trim() : null,
    };
    update.mutate(payload, { onSuccess: back });
  });

  const formError =
    update.error instanceof ApiError
      ? update.error.message
      : update.error
        ? 'Update failed.'
        : null;

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <AppHeader title="Edit profile" back />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <Stack gap="lg">
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
                hint="Others can find you by this handle."
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
                label="City"
                hint="Coarse location only — no exact address."
                autoCapitalize="words"
                value={field.value ?? ''}
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

          <Stack gap="sm">
            <Button
              label={update.isPending ? 'Saving…' : 'Save'}
              fullWidth
              loading={update.isPending}
              disabled={formState.isSubmitting}
              onPress={onSubmit}
            />
            <Button label="Cancel" variant="ghost" fullWidth onPress={back} />
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
}
