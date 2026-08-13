import { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  /** Ayuda debajo del campo (se reemplaza por el error si lo hay). */
  hint?: string;
  /** Muestra "12/60" usando maxLength. */
  showCounter?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  showCounter,
  style,
  value,
  maxLength,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const counter = showCounter && maxLength ? `${value?.length ?? 0}/${maxLength}` : null;

  return (
    <View style={styles.container}>
      {label || counter ? (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {counter ? <Text style={styles.counter}>{counter}</Text> : null}
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        accessibilityLabel={label}
        value={value}
        maxLength={maxLength}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.xs + 2,
  },
  label: {
    ...Typography.label,
  },
  counter: {
    ...Typography.micro,
  },
  input: {
    minHeight: 50,
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 1,
    fontSize: 15,
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.primaryInk,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.dangerInk,
    borderWidth: 1.5,
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    marginTop: Spacing.xs + 2,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.xs + 2,
  },
});
