// Đăng ký push Expo (US3, T047) — BEST-EFFORT, native-only. Web/simulator/không quyền/không EAS → null.
// Push không chặn "done" (clarify Q4); in-app reminder mới là bắt buộc.
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export interface PushRegistration {
  token: string;
  platform: "ios" | "android";
}

/**
 * Xin quyền + lấy Expo push token. Trả null (không ném) khi: web, simulator, từ chối quyền,
 * chưa cấu hình EAS projectId, hoặc bất kỳ lỗi mạng nào — để luồng gọi không bao giờ vỡ.
 */
export async function registerForPush(): Promise<PushRegistration | null> {
  if (Platform.OS === "web") return null; // web không có push native
  if (!Device.isDevice) return null; // simulator không lấy được token

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Nhắc ôn tập",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null; // chưa có EAS project → bỏ qua (best-effort)

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token, platform: Platform.OS as "ios" | "android" };
  } catch (_e) {
    return null; // best-effort: nuốt mọi lỗi
  }
}
