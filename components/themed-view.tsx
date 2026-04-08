// themed-view.tsx - A themed wrapper around the default View component

import { useThemeColor } from '@/hooks/use-theme-color';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

// ThemedView component that applies the correct background color based on the current theme
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}