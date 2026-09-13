import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { boundedString, usernameSchema, z, type PatchProfileInput } from '@pandam/validation';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Alert, ScrollView, View } from 'react-native';

import {
  Avatar,
  Button,
  Field,
  Notice,
  Row,
  Screen,
  Stack,
  Text,
  colors,
  layout,
  spacing,
  useToast,
} from '@pandam/ui';

import { AppHeader } from '@/components/AppHeader';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/lib/auth/hooks';
import { useUpdateProfile } from '@/lib/auth/profile';
import { mediaSrc } from '@/lib/api/media';
import { useUploadAvatar } from '@/lib/hooks/useMedia';

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
  const uploadAvatar = useUploadAvatar();
  const toast = useToast();

  /**
   * Avatars upload straight away rather than on save: the picker already made
   * the choice explicit, and a photo that only appears after "Save changes"
   * reads as the tap having failed.
   */
  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    const uri = res.canceled ? null : res.assets[0]?.uri;
    if (!uri) return;
    uploadAvatar.mutate(uri, {
      onSuccess: () => toast.success('Photo updated.'),
      onError: () =>
        Alert.alert(
          'Upload failed',
          'That photo could not be uploaded. Check your connection and try again.',
        ),
    });
  };

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
    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Profile updated.');
        back();
      },
    });
  });

  const formError =
    update.error instanceof ApiError
      ? update.error.message
      : update.error
        ? 'Update failed.'
        : null;

  return (
    <Screen
      padded={false}
      edges={['top', 'bottom']}
      footer={
        <Stack gap="sm">
          <Button
            label={update.isPending ? 'Saving…' : 'Save changes'}
            size="lg"
            fullWidth
            loading={update.isPending}
            disabled={formState.isSubmitting}
            onPress={onSubmit}
          />
          <Button label="Cancel" variant="ghost" fullWidth onPress={back} />
        </Stack>
      }
    >
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.lg }}>
        <AppHeader title="Edit profile" back />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: layout.gutter,
          paddingBottom: spacing['3xl'],
        }}
      >
        <Stack gap="lg">
          <Row gap="lg" style={{ marginBottom: spacing.xs }}>
            <Avatar
              name={profile?.displayName ?? 'You'}
              size={60}
              uri={mediaSrc(profile?.avatarUrl)}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">Your photo</Text>
              <Text variant="caption" tone="muted">
                {uploadAvatar.isPending
                  ? 'Uploading…'
                  : profile?.avatarUrl
                    ? 'Tap to change it.'
                    : 'Optional — otherwise your initials are used.'}
              </Text>
              <Row gap="md" style={{ marginTop: spacing.xs }}>
                <Text
                  variant="label"
                  tone="accent"
                  onPress={uploadAvatar.isPending ? undefined : () => void pickAvatar()}
                >
                  {profile?.avatarUrl ? 'Change photo' : 'Add a photo'}
                </Text>
              </Row>
            </View>
          </Row>

          <Controller
            control={control}
            name="displayName"
            render={({ field, fieldState }) => (
              <Field
                label="Display name"
                autoCapitalize="words"
                leftIcon={<Ionicons name="person-outline" size={17} color={colors.textMuted} />}
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
            name="bio"
            render={({ field, fieldState }) => (
              <Field
                label="Bio"
                optional
                hint="A line or two about what you make, do, or collect."
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
                optional
                hint="Used to show your items to people nearby. City only — never an address."
                autoCapitalize="words"
                leftIcon={<Ionicons name="location-outline" size={17} color={colors.textMuted} />}
                value={field.value ?? ''}
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
        </Stack>
      </ScrollView>
    </Screen>
  );
}
