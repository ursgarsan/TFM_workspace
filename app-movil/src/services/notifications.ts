import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export type PushRegistrationResult = {
  expoPushToken: string | null;
  reason: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId
  );
}

function shouldAllowEmulatorPush(): boolean {
  return process.env.EXPO_PUBLIC_ALLOW_EMULATOR_PUSH?.trim().toLowerCase() === 'true';
}

export async function getExpoPushTokenOrNull(): Promise<string | null> {
  const result = await getExpoPushRegistrationResult();
  return result.expoPushToken;
}

export async function getExpoPushRegistrationResult(): Promise<PushRegistrationResult> {
  if (!Device.isDevice && !shouldAllowEmulatorPush()) {
    return { expoPushToken: null, reason: 'Push remoto no disponible en emulador sin override.' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { expoPushToken: null, reason: 'Permiso de notificaciones denegado.' };
  }

  await Notifications.setNotificationChannelAsync('medication-reminders', {
    name: 'Medication reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1D4ED8',
  });

  const projectId = getExpoProjectId();
  if (!projectId) {
    return { expoPushToken: null, reason: 'Falta EXPO_PUBLIC_PROJECT_ID.' };
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    return { expoPushToken: pushToken.data, reason: null };
  } catch (error) {
    return {
      expoPushToken: null,
      reason: error instanceof Error ? error.message : 'No se pudo obtener el token Expo Push.',
    };
  }
}
