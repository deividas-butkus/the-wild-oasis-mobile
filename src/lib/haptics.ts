import * as Haptics from "expo-haptics";

// Fire-and-forget feedback. expo-haptics throws where the platform can't vibrate (e.g. some
// browsers), and a missing buzz should never break an action, so failures are ignored.
const ignore = () => {};

export const haptics = {
  // Picking something: calendar day, filter chip, stepper
  selection: () => void Haptics.selectionAsync().catch(ignore),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore),
  warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore),
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(ignore),
};
