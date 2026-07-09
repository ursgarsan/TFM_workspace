import { Pressable, StyleSheet } from 'react-native';
import { ChatCircleDots } from 'phosphor-react-native';

import { colors, radius } from '@/theme';

type ChatFabProps = {
  onPress: () => void;
  bottomOffset: number;
};

export default function ChatFab({ onPress, bottomOffset }: ChatFabProps) {
  return (
    <Pressable onPress={onPress} style={[styles.fab, { bottom: bottomOffset }]}> 
      <ChatCircleDots size={28} color="#FFFFFF" weight="fill" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: radius.fab,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});
