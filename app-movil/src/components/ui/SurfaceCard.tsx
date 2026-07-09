import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius } from '@/theme';

export default function SurfaceCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D7DDE8',
    gap: 10,
  },
});
