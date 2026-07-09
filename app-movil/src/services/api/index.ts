export { API_BASE_URL } from '@/services/api/config';

export { fetchCurrentUser, login, type CurrentUser, type LoginResponse } from '@/services/api/auth';
export { askAssistant, type AssistantReply } from '@/services/api/assistant';
export { registerPushDevice } from '@/services/api/notifications';
export { fetchMyReminders, type ReminderItem } from '@/services/api/treatments';
