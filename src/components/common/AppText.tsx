import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { Colors, FontSize } from '@/theme';

const FONTS = {
  body: {
    regular: undefined,
    medium: undefined,
    semibold: undefined,
    bold: undefined,
  },
  numeric: {
    regular: undefined,
    medium: undefined,
    semibold: undefined,
    bold: undefined,
  },
} as const;

type Variant = keyof typeof FONTS;
type Weight = keyof (typeof FONTS)[Variant];
type Size = keyof typeof FontSize;

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: Weight;
  size?: Size;
  color?: string;
  align?: TextStyle['textAlign'];
  italic?: boolean;
  uppercase?: boolean;
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
};

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  weight = 'regular',
  size = 'md',
  color = Colors.text,
  align,
  italic = false,
  uppercase = false,
  style,
  children,
  ...rest
}) => {
  const fontFamily = FONTS[variant][weight];

  const computed: TextStyle = {
    fontFamily,
    fontSize: FontSize[size],
    color,
    textAlign: align,
    fontStyle: italic ? 'italic' : 'normal',
    textTransform: uppercase ? 'uppercase' : 'none',
    // When no custom font is linked yet, fall back to OS font-weight
    fontWeight: !fontFamily ? WEIGHT_FALLBACK[weight] : undefined,
  };

  return (
    <Text style={[computed, style]} {...rest}>
      {children}
    </Text>
  );
};

const WEIGHT_FALLBACK: Record<Weight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
