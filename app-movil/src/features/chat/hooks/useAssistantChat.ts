import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

import type { ChatMessage } from '@/features/chat/types';
import { askAssistant } from '@/services/api/assistant';

function newMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export type UseAssistantChatState = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  input: string;
  setInput: (value: string) => void;
  sending: boolean;
  messages: ChatMessage[];
  canSend: boolean;
  scrollRef: React.RefObject<ScrollView | null>;
  scrollToBottom: (animated?: boolean) => void;
  onSend: () => Promise<void>;
};

export function useAssistantChat(authToken: string | null): UseAssistantChatState {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newMessageId(),
      role: 'assistant',
      text: 'Hola. Soy tu asistente virtual. Puedo ayudarte con tus tratamientos y recordatorios.',
    },
  ]);

  const scrollRef = useRef<ScrollView | null>(null);

  const scrollToBottom = useCallback((animated = false) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      scrollToBottom(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, messages.length, sending, scrollToBottom]);

  const canSend = useMemo(
    () => Boolean(authToken) && input.trim().length > 0 && !sending,
    [authToken, input, sending],
  );

  const onSend = useCallback(async () => {
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
  }, [authToken, input, sending]);

  return {
    isOpen,
    setIsOpen,
    input,
    setInput,
    sending,
    messages,
    canSend,
    scrollRef,
    scrollToBottom,
    onSend,
  };
}
