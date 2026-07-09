import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowUp, X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppTextInput } from '@/components/ui';
import type { ChatMessage } from '@/features/chat';
import { colors, radius, spacing, typography } from '@/theme';

type AssistantChatModalProps = {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  sending: boolean;
  authToken: string | null;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  canSend: boolean;
  scrollRef: React.RefObject<ScrollView | null>;
  scrollToBottom: (animated?: boolean) => void;
  inputBottomSpacing: number;
  keyboardLift: number;
};

export default function AssistantChatModal({
  visible,
  onClose,
  messages,
  sending,
  authToken,
  input,
  setInput,
  onSend,
  canSend,
  scrollRef,
  scrollToBottom,
  inputBottomSpacing,
  keyboardLift,
}: AssistantChatModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.fullscreenContainer, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Asistente virtual</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={16} color="#1E3A8A" weight="bold" />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View key={msg.id} style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>{msg.text}</Text>
                </View>
              );
            })}
            {sending && (
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#1D4ED8" />
                <Text style={styles.typingText}>Escribiendo...</Text>
              </View>
            )}
          </ScrollView>

          {!authToken && <Text style={styles.loginInfo}>Inicia sesion para hablar con el asistente.</Text>}

          <View
            style={[
              styles.inputRowWrap,
              { paddingBottom: inputBottomSpacing, transform: [{ translateY: -keyboardLift }] },
            ]}
          >
            <View style={styles.inputRow}>
              <AppTextInput
                value={input}
                onChangeText={setInput}
                placeholder="Escribe tu pregunta..."
                style={styles.input}
                editable={!sending && Boolean(authToken)}
                multiline
                maxLength={500}
                onFocus={() => {
                  setTimeout(() => scrollToBottom(false), 80);
                }}
              />
              <AppButton onPress={onSend} disabled={!canSend} compact>
                <ArrowUp size={20} color="#FFFFFF" weight="bold" />
              </AppButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#1E3A8A',
    fontSize: typography.section,
    fontWeight: '800',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primaryStrong,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleTextUser: {
    color: colors.surface,
    fontSize: typography.body,
    lineHeight: 20,
  },
  bubbleTextAssistant: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 20,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  loginInfo: {
    fontSize: typography.caption,
    color: colors.warningText,
    backgroundColor: colors.warningBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.warningBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputRow: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  inputRowWrap: {
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    paddingVertical: 8,
    fontSize: typography.body,
  },
});
