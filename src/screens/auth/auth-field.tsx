import { useState, type ComponentPropsWithRef, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { theme } from "@/constants/theme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  trailing?: ReactNode;
  ref?: ComponentPropsWithRef<typeof TextInput>["ref"];
};

export function AuthField({ label, error, trailing, ref, ...props }: Props) {
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
          ref={ref}
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
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
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
