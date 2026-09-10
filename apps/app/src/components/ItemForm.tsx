/**
 * Create / edit form for a listing ("I HAVE") or a need ("I NEED"). One
 * component, driven by `kind` + `mode`. Validation bounds come from the shared
 * `@pandam/validation` primitives so the client and server never disagree.
 *
 * Photos are LOCAL PREVIEW ONLY — R2 upload is a later phase, so they are shown
 * but never submitted, and clearly labelled as not uploaded.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { type MarketItem } from '@pandam/types';
import { boundedString, itemTypeSchema, z } from '@pandam/validation';
import { Button, Chip, Field, Row, Stack, Text, colors, radii, spacing } from '@pandam/ui';

import { ApiError } from '@/lib/api/client';
import { TYPE_LABEL } from '@/lib/format';
import { useCategories } from '@/lib/hooks/useCategories';

const formSchema = z.object({
  categoryId: z.string().min(1, 'Pick a category'),
  type: itemTypeSchema,
  title: boundedString(3, 120),
  description: boundedString(10, 4000),
  publish: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

export interface ItemFormSubmit {
  categoryId: string;
  type: FormValues['type'];
  title: string;
  description: string;
  status: 'draft' | 'published';
}

export interface ItemFormProps {
  kind: 'listing' | 'need';
  mode: 'create' | 'edit';
  initial?: MarketItem;
  submitting?: boolean;
  error?: unknown;
  onSubmit: (values: ItemFormSubmit) => void;
}

export function ItemForm({ kind, mode, initial, submitting, error, onSubmit }: ItemFormProps) {
  const isHave = kind === 'listing';
  const categories = useCategories();
  const [photos, setPhotos] = useState<string[]>([]);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initial?.category.id ?? '',
      type: initial?.type ?? 'service',
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      publish: initial ? initial.status === 'published' : true,
    },
  });

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 6));
  };

  const submit = handleSubmit((v) => {
    onSubmit({
      categoryId: v.categoryId,
      type: v.type,
      title: v.title.trim(),
      description: v.description.trim(),
      status: v.publish ? 'published' : 'draft',
    });
  });

  const formError =
    error instanceof ApiError ? error.message : error ? 'Could not save. Try again.' : null;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing['5xl'],
        gap: spacing.xl,
      }}
    >
      <Stack gap="lg">
        <View>
          <Text variant="label" tone="secondary">
            Category
          </Text>
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <View style={{ gap: spacing.xs }}>
                <Row gap="sm" style={{ flexWrap: 'wrap', marginTop: spacing.xs }}>
                  {(categories.data ?? []).map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      selected={field.value === c.id}
                      onPress={() => field.onChange(c.id)}
                    />
                  ))}
                </Row>
                {fieldState.error ? (
                  <Text variant="caption" tone="danger">
                    {fieldState.error.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </View>

        <View>
          <Text variant="label" tone="secondary">
            Kind
          </Text>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Row gap="sm" style={{ marginTop: spacing.xs }}>
                {(['product', 'service', 'skill'] as const).map((t) => (
                  <Chip
                    key={t}
                    label={TYPE_LABEL[t]}
                    selected={field.value === t}
                    onPress={() => field.onChange(t)}
                  />
                ))}
              </Row>
            )}
          />
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <Field
              label={isHave ? 'What do you have?' : 'What do you need?'}
              placeholder={isHave ? 'e.g. Hand-built websites' : 'e.g. Product photography'}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={120}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <Field
              label="Describe it"
              hint="What’s included, condition, timescale — anything a trader should know."
              placeholder="Add a few details…"
              multiline
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <View style={{ gap: spacing.xs }}>
          <Text variant="label" tone="secondary">
            Photos
          </Text>
          <Row gap="sm" style={{ flexWrap: 'wrap' }}>
            {photos.map((uri) => (
              <View key={uri}>
                <Image
                  source={{ uri }}
                  style={{ width: 72, height: 72, borderRadius: radii.md }}
                  contentFit="cover"
                />
                <Pressable
                  accessibilityLabel="Remove photo"
                  onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: colors.surface,
                    borderRadius: radii.pill,
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a photo"
              onPress={() => void pickPhoto()}
              style={{
                width: 72,
                height: 72,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <Ionicons name="add" size={22} color={colors.textMuted} />
            </Pressable>
          </Row>
          {photos.length > 0 ? (
            <Text variant="caption" tone="muted">
              Local preview only — photo upload arrives with cloud storage, so these aren’t saved
              yet.
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="publish"
          render={({ field }) => (
            <Row justify="space-between">
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text variant="bodyStrong">Make it visible now</Text>
                <Text variant="caption" tone="muted">
                  Visible in Discover and eligible for barter matches. Turn off to save as a draft.
                </Text>
              </View>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ true: colors.accent }}
              />
            </Row>
          )}
        />

        {formError ? (
          <Text variant="bodySm" tone="danger">
            {formError}
          </Text>
        ) : null}

        <Button
          label={
            submitting
              ? 'Saving…'
              : mode === 'create'
                ? `Publish this ${isHave ? 'HAVE' : 'NEED'}`
                : 'Save changes'
          }
          variant={isHave ? 'primary' : 'need'}
          fullWidth
          loading={submitting}
          disabled={formState.isSubmitting}
          onPress={submit}
        />
      </Stack>
    </ScrollView>
  );
}
