import { useState, type ReactNode } from "react";
import { useController, type FieldValues, type UseControllerProps } from "react-hook-form";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { theme } from "@/constants/theme";

type Props<T extends FieldValues> = Omit<TextInputProps, "value" | "onChangeText" | "onBlur" | "defaultValue"> &
  Pick<UseControllerProps<T>, "control" | "name" | "rules" | "shouldUnregister"> & {
    label: string;
    trailing?: ReactNode;
    onEdit?: () => void;
  };

export function AuthField<T extends FieldValues>({
  control, name, rules, shouldUnregister, label, trailing, onEdit, ...props
}: Props<T>) {
  const {
    field: { ref: inputRef, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name, rules, shouldUnregister });
  const error = fieldState.error?.message;
  const [focused, setFocused] = useState(false);
  const id = props.nativeID;

  return (
    <View style={styles.field}>
      <Text nativeID={id ? `${id}-label` : undefined} style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.control,
          focused && styles.focused,
          error ? styles.invalid : undefined,
        ]}
      >
        <TextInput
          {...props}
          ref={inputRef}
          value={value}
          onChangeText={(value) => {
            onChange(value);
            onEdit?.();
          }}
          accessibilityLabel={label}
          accessibilityLabelledBy={id ? `${id}-label` : undefined}
          accessibilityHint={error}
          aria-invalid={Boolean(error)}
          aria-describedby={error && id ? `${id}-error` : undefined}
          placeholderTextColor={theme.colors.placeholder}
          selectionColor={theme.colors.accentShadow}
          underlineColorAndroid="transparent"
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          style={[styles.input, props.style]}
        />
        {trailing}
      </View>
      {error ? (
        <Text
          nativeID={id ? `${id}-error` : undefined}
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { color: colors.textMuted, fontFamily: fonts.label, fontSize: 13 },
  control: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.field,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 2,
    borderBottomWidth: 4,
    minHeight: 54,
  },
  focused: { borderColor: colors.focus },
  invalid: { borderColor: colors.warning },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.label,
    fontSize: 17,
    color: colors.ink,
    outlineWidth: 0,
  },
  error: {
    color: colors.warning,
    fontFamily: fonts.label,
    fontSize: 13,
    lineHeight: 18,
  },
});
