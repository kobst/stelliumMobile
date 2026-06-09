import { Platform } from 'react-native';

export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
}) as string;

export const SERIF_FONT_ITALIC_STYLE = {
  fontFamily: SERIF_FONT,
  fontStyle: 'italic' as const,
};

export const DISPLAY = {
  fontFamily: SERIF_FONT,
  fontWeight: '500' as const,
  letterSpacing: -0.3,
};

export const EYEBROW = {
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 2.2,
  textTransform: 'uppercase' as const,
};
