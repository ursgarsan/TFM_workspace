import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { KeyboardLiftInfo } from '@/features/chat/types/chat';

export function useKeyboardLift(): KeyboardLiftInfo {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  return useMemo(() => {
    const inputBottomSpacing = Math.max(10, insets.bottom);
    const keyboardLift =
      Platform.OS === 'android' && keyboardHeight > 0
        ? Math.max(0, keyboardHeight - insets.bottom + 30)
        : 0;

    return {
      inputBottomSpacing,
      keyboardLift,
    };
  }, [insets.bottom, keyboardHeight]);
}
