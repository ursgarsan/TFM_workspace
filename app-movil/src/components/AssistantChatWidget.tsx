import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { askAssistant } from '@/services/api';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type AssistantChatWidgetProps = {
  authToken: string | null;
};

function newMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export default function AssistantChatWidget({ authToken }: AssistantChatWidgetProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newMessageId(),
      role: 'assistant',
      text: 'Hola. Soy tu asistente virtual. Puedo ayudarte con tus tratamientos y recordatorios.',
    },
  ]);

  const scrollRef = useRef<ScrollView | null>(null);

  const scrollToBottom = (animated = false) => {
    scrollRef.current?.scrollToEnd({ animated });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      scrollToBottom(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, messages.length, sending]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      const screenHeight = Dimensions.get('screen').height;
      const overlapByScreenY = Math.max(0, windowHeight - event.endCoordinates.screenY);
      const overlapByHeight = Math.max(0, event.endCoordinates.height || 0);
      const overlapByViewport = Math.max(0, screenHeight - windowHeight);
      const resolvedHeight = Math.max(overlapByScreenY, overlapByHeight, overlapByViewport);

      setKeyboardHeight(resolvedHeight);
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const inputBottomSpacing = Math.max(10, insets.bottom);
  const keyboardLift =
    Platform.OS === 'android' && keyboardHeight > 0
      ? Math.max(0, keyboardHeight - insets.bottom + 30)
      : 0;

  const canSend = useMemo(
    () => Boolean(authToken) && input.trim().length > 0 && !sending,
    [authToken, input, sending],
  );

  const onSend = async () => {
    const question = input.trim();
    if (!authToken || !question || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: newMessageId(),
      role: 'user',
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const result = await askAssistant(authToken, question);
      const assistantMessage: ChatMessage = {
        id: newMessageId(),
        role: 'assistant',
        text: result.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'No se pudo contactar al asistente.';
      const errorMessage: ChatMessage = {
        id: newMessageId(),
        role: 'assistant',
        text: `Error: ${fallback}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setSending(false);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.fullscreenContainer, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Asistente virtual</Text>
            <Pressable onPress={() => setIsOpen(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>X</Text>
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
                <View
                  key={msg.id}
                  style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
                >
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

          {!authToken && (
            <Text style={styles.loginInfo}>Inicia sesion para hablar con el asistente.</Text>
          )}

          <View style={[styles.inputRowWrap, { paddingBottom: inputBottomSpacing, transform: [{ translateY: -keyboardLift }] }]}>
            <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor="#94A3B8"
              style={styles.input}
              editable={!sending && Boolean(authToken)}
              multiline
              maxLength={500}
              onFocus={() => {
                setTimeout(() => scrollToBottom(false), 80);
              }}
            />
            <Pressable
              onPress={onSend}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </Pressable>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
      >
        <Text style={styles.fabIcon}>💬</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 26,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
  },
  closeText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '900',
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#1D4ED8',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderBottomLeftRadius: 4,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextAssistant: {
    color: '#0F172A',
    fontSize: 14,
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
    fontSize: 12,
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputRowWrap: {
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});
