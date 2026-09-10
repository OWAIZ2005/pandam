import { type ReactNode, forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '../tokens';

import { Text } from './Text';

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

/** Bare themed text input. Use `Field` for label + error. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { invalid, style, ...rest },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textMuted}
      style={[
        {
          borderWidth: 1,
          borderColor: invalid ? colors.danger : colors.border,
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          color: colors.textPrimary,
          fontSize: typography.body.fontSize,
          minHeight: 44,
        },
        style,
      ]}
      {...rest}
    />
  );
});

export interface FieldProps extends InputProps {
  label: string;
  hint?: string;
  error?: string;
}

/** Label + input + hint/error, the building block of every form. */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, error, multiline, ...input },
  ref,
) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" tone="secondary">
        {label}
      </Text>
      <Input
        ref={ref}
        invalid={!!error}
        multiline={multiline}
        style={multiline ? { minHeight: 96, textAlignVertical: 'top' } : undefined}
        accessibilityLabel={label}
        {...input}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export interface SearchInputProps extends TextInputProps {
  icon?: ReactNode;
}

/** Rounded search box. Pass an `icon` node (e.g. from @expo/vector-icons). */
export const SearchInput = forwardRef<TextInput, SearchInputProps>(function SearchInput(
  { icon, style, ...rest },
  ref,
) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
      }}
    >
      {icon}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={[{ flex: 1, color: colors.textPrimary, fontSize: typography.body.fontSize }, style]}
        {...rest}
      />
    </View>
  );
});
