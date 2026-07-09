import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantChatModal, ChatFab, useAssistantChat, useKeyboardLift } from '@/features/chat';

type AssistantChatWidgetProps = {
  authToken: string | null;
};

export default function AssistantChatWidget({ authToken }: AssistantChatWidgetProps) {
  const insets = useSafeAreaInsets();
  const { inputBottomSpacing, keyboardLift } = useKeyboardLift();
  const {
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
  } = useAssistantChat(authToken);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <AssistantChatModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        sending={sending}
        authToken={authToken}
        input={input}
        setInput={setInput}
        onSend={() => {
          void onSend();
        }}
        canSend={canSend}
        scrollRef={scrollRef}
        scrollToBottom={scrollToBottom}
        inputBottomSpacing={inputBottomSpacing}
        keyboardLift={keyboardLift}
      />

      <ChatFab onPress={() => setIsOpen(!isOpen)} bottomOffset={20 + insets.bottom} />
    </View>
  );
}
