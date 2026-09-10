/**
 * Tiny form primitives for the auth/profile screens. Deliberately minimal —
 * the real design system arrives with the marketplace UI in a later phase.
 */
import { forwardRef } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

import { Text } from '@pandam/ui';

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, ...input },
  ref,
) {
  return (
    <View className="gap-1">
      <Text variant="muted">{label}</Text>
      <TextInput
        ref={ref}
        className="rounded-md border border-border bg-surface px-3 py-3 text-base text-text"
        placeholderTextColor="#9AA0AA"
        autoCapitalize="none"
        {...input}
      />
      {error ? (
        <Text variant="muted" className="text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function Button({ label, onPress, disabled, variant = 'primary' }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={[
        'items-center rounded-md px-4 py-3',
        primary ? 'bg-primary' : 'bg-transparent',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Text style={{ color: primary ? '#FFFFFF' : undefined }} variant={primary ? 'body' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}
