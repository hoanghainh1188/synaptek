// Hồ sơ học sinh (US2 T036 · US3 T048: nhắc ôn). XP · streak · huy hiệu · bật/tắt nhắc. Guest → mời đăng nhập.
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getBadges } from "@/lib/content";
import { useAuth } from "@/lib/supabase/auth";
import { useGamification } from "@/lib/supabase/gamification";
import { useMyRole, useSetRole, type Role } from "@/lib/supabase/role";
import { useMyFullName, useSetFullName } from "@/lib/supabase/profile";
import {
  useMyParentCode,
  useRegenerateParentCode,
  useClearParentCode,
  useMyParents,
  useUnlink,
} from "@/lib/supabase/parent";
import { registerForPush } from "@/lib/notifications";
import { useSavePushToken, useSetPushEnabled } from "@/lib/supabase/push";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { AVATARS, avatarEmoji, isAvatarUnlocked } from "@/lib/avatars";
import {
  useMyAvatar,
  useSetAvatar,
  useMyAvatarPhoto,
  useSetAvatarPhoto,
  uploadAvatarPhoto,
} from "@/lib/supabase/avatar";
import { Mascot } from "@/components/Mascot";
import { BackButton } from "@/components/BackButton";

const ROLE_LABEL: Record<Role, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, signOut, signOutOtherDevices } = useAuth();
  const gami = useGamification();
  const myAvatar = useMyAvatar();
  const setAvatar = useSetAvatar();
  const myAvatarPhoto = useMyAvatarPhoto();
  const setAvatarPhoto = useSetAvatarPhoto();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const catalog = getBadges();

  const role = useMyRole();
  const setRole = useSetRole();
  const myFullName = useMyFullName();
  const setFullName = useSetFullName();
  const parentCode = useMyParentCode();
  const regenCode = useRegenerateParentCode();
  const clearCode = useClearParentCode();
  const myParents = useMyParents();
  const unlink = useUnlink();
  const savePush = useSavePushToken();
  const setPushEnabled = useSetPushEnabled();
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmOtherDevices, setConfirmOtherDevices] = useState(false);
  const [otherDevicesMsg, setOtherDevicesMsg] = useState<string | null>(null);

  const state = gami.data?.state;
  const earned = new Set(gami.data?.earnedBadgeIds ?? []);

  const enableReminders = async () => {
    const reg = await registerForPush();
    if (!reg) {
      setPushMsg(
        Platform.OS === "web"
          ? "Nhắc qua thông báo chỉ có trên điện thoại — bạn vẫn thấy mục “đến hạn ôn” ở trang chủ."
          : "Chưa bật được thông báo (cần thiết bị thật + cấp quyền).",
      );
      return;
    }
    savePush.mutate(reg);
    setPushMsg("Đã bật nhắc ôn tập 🔔");
  };

  const disableReminders = () => {
    setPushEnabled.mutate(false);
    setPushMsg("Đã tắt nhắc ôn tập.");
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <BackButton />
      <Text className="font-display text-3xl font-extrabold text-ink">Hồ sơ</Text>

      {!user ? (
        <Pressable
          onPress={() => router.push("/login")}
          accessibilityLabel="Đăng nhập"
          className="mt-5 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
        >
          <View className="rounded-full bg-white/20 p-1">
            <Mascot size={36} color="#ffffff" />
          </View>
          <Text className="flex-1 font-bold text-white">
            Đăng nhập để tích XP, giữ streak và sưu tầm huy hiệu nhé!
          </Text>
        </Pressable>
      ) : (
        <View className="mt-5 flex-row gap-3">
          <StatCard value={String(state?.totalXp ?? 0)} label="XP" accent="#4f46e5" />
          <StatCard value={`${state?.currentStreak ?? 0}🔥`} label="Streak" accent="#ea580c" />
          <StatCard value={String(state?.longestStreak ?? 0)} label="Kỷ lục" accent="#16a34a" />
        </View>
      )}

      {/* Tên hiển thị (D49) — sửa được sau khi đăng ký, khác lúc trước chỉ đặt được 1 lần */}
      {user && (
        <View className="mt-6">
          <Text className="font-display text-xl font-bold text-ink">Tên hiển thị</Text>
          {!editingName ? (
            <Pressable
              accessibilityLabel="Đổi tên hiển thị"
              onPress={() => {
                setNameDraft(myFullName.data ?? "");
                setEditingName(true);
              }}
              className="mt-2 min-h-[44px] flex-row items-center justify-between rounded-md border-2 border-line bg-surface px-3"
            >
              <Text className="font-semibold text-ink">{myFullName.data || "(chưa đặt tên)"}</Text>
              <Text className="font-bold text-brand">Sửa</Text>
            </Pressable>
          ) : (
            <View className="mt-2 rounded-md border-2 border-line bg-surface p-3">
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Tên của em"
                placeholderTextColor="#a1a1aa"
                accessibilityLabel="Tên hiển thị mới"
                className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
              />
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  accessibilityLabel="Lưu tên hiển thị"
                  disabled={!nameDraft.trim() || setFullName.isPending}
                  onPress={() =>
                    setFullName.mutate(nameDraft.trim(), {
                      onSuccess: () => setEditingName(false),
                    })
                  }
                  className={`min-h-[40px] flex-1 items-center justify-center rounded-md ${nameDraft.trim() ? "bg-brand" : "bg-line"}`}
                >
                  <Text className="font-display font-bold text-white">Lưu</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Huỷ đổi tên"
                  onPress={() => setEditingName(false)}
                  className="min-h-[40px] flex-1 items-center justify-center rounded-md bg-paper"
                >
                  <Text className="font-display font-bold text-ink">Huỷ</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Avatar mở khoá theo XP + ảnh thật (D51, lựa chọn thêm) */}
      {user && (
        <View className="mt-6">
          <View className="flex-row items-center gap-2">
            {myAvatarPhoto.data ? (
              <Image
                source={{ uri: myAvatarPhoto.data }}
                accessibilityLabel="Ảnh đại diện hiện tại"
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <Text className="text-3xl">{avatarEmoji(myAvatar.data)}</Text>
            )}
            <Text className="font-display text-xl font-bold text-ink">Avatar của em</Text>
          </View>

          <View className="mt-3 flex-row items-center gap-3">
            <Pressable
              accessibilityLabel="Tải ảnh đại diện lên"
              disabled={uploadingPhoto}
              onPress={() => {
                if (Platform.OS !== "web" || typeof document === "undefined") {
                  setPhotoMsg("Tải ảnh hiện hỗ trợ trên web.");
                  return;
                }
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  setUploadingPhoto(true);
                  setPhotoMsg(null);
                  try {
                    const url = await uploadAvatarPhoto(file, user.id);
                    setAvatarPhoto.mutate(url);
                  } catch {
                    setPhotoMsg("Tải ảnh thất bại (tối đa 2MB, chỉ ảnh).");
                  } finally {
                    setUploadingPhoto(false);
                  }
                };
                input.click();
              }}
              className="min-h-[40px] items-center justify-center rounded-md bg-surface px-3 shadow-sm"
            >
              <Text className="font-display font-bold text-ink">
                {uploadingPhoto ? "Đang tải…" : "Tải ảnh lên"}
              </Text>
            </Pressable>
            {myAvatarPhoto.data && (
              <Pressable
                accessibilityLabel="Dùng lại emoji"
                onPress={() => setAvatarPhoto.mutate(null)}
                className="min-h-[40px] items-center justify-center rounded-md bg-paper px-3"
              >
                <Text className="font-display font-bold text-ink">Dùng lại emoji</Text>
              </Pressable>
            )}
          </View>
          {photoMsg && <Text className="mt-1 text-xs text-no">{photoMsg}</Text>}
          <Text className="mt-1 text-xs text-muted">
            Nên dùng ảnh vui/hoạt hình thay vì ảnh mặt thật của em nhé.
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {AVATARS.map((a) => {
              const unlocked = isAvatarUnlocked(a, state?.totalXp ?? 0);
              const selected = (myAvatar.data ?? "fox") === a.key;
              return (
                <Pressable
                  key={a.key}
                  accessibilityLabel={
                    unlocked ? `Chọn avatar ${a.label}` : `Avatar ${a.label} đã khoá`
                  }
                  disabled={!unlocked || setAvatar.isPending}
                  onPress={() => setAvatar.mutate(a.key)}
                  className={`h-16 w-16 items-center justify-center rounded-xl border-2 ${
                    selected ? "border-brand bg-brand/10" : "border-line bg-surface"
                  } ${unlocked ? "" : "opacity-50"}`}
                >
                  <Text className="text-2xl">{unlocked ? a.emoji : "🔒"}</Text>
                  {!unlocked && <Text className="text-[10px] font-bold text-muted">{a.xp} XP</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {user && (
        <View className="mt-8">
          <Text className="font-display text-xl font-bold text-ink">Lớp học</Text>
          {role.data === "teacher" ? (
            <Pressable
              accessibilityLabel="Lớp của tôi"
              onPress={() => router.push("/classes")}
              className="mt-3 min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Lớp của tôi ›</Text>
            </Pressable>
          ) : role.data === "parent" ? (
            <Pressable
              accessibilityLabel="Con của tôi"
              onPress={() => router.push("/children")}
              className="mt-3 min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Con của tôi ›</Text>
            </Pressable>
          ) : (
            <View className="mt-3 gap-2">
              <Pressable
                accessibilityLabel="Lớp của tôi"
                onPress={() => router.push("/my-classes")}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-brand"
              >
                <Text className="font-display font-bold text-white">Lớp của tôi ›</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Bài được giao"
                onPress={() => router.push("/assignments")}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-surface shadow-sm"
              >
                <Text className="font-display font-bold text-ink">Bài được giao ›</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Vào lớp bằng mã"
                onPress={() => router.push("/join")}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-surface shadow-sm"
              >
                <Text className="font-display font-bold text-ink">Vào lớp bằng mã ›</Text>
              </Pressable>
            </View>
          )}

          {/* Ngân hàng câu tự soạn (GV/PH) */}
          {(role.data === "teacher" || role.data === "parent") && (
            <Pressable
              accessibilityLabel="Ngân hàng câu của tôi"
              onPress={() => router.push("/questions")}
              className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-surface shadow-sm"
            >
              <Text className="font-display font-bold text-ink">📝 Ngân hàng câu của tôi ›</Text>
            </Pressable>
          )}

          {/* Đổi vai trò — CÓ XÁC NHẬN (đổi vai trò thay đổi toàn bộ trải nghiệm) */}
          <Text className="mt-4 mb-1 text-sm font-bold text-muted">
            Vai trò: {ROLE_LABEL[role.data ?? "student"]}
          </Text>
          {!pendingRole ? (
            <Pressable
              accessibilityLabel="Đổi vai trò"
              onPress={() => setPendingRole(role.data ?? "student")}
              className="min-h-[44px] items-center justify-center rounded-md border-2 border-line bg-surface"
            >
              <Text className="font-display font-bold text-muted">Đổi vai trò…</Text>
            </Pressable>
          ) : (
            <View className="rounded-md border-2 border-line bg-surface p-3">
              <View className="flex-row gap-2">
                {(["student", "teacher", "parent"] as const).map((value) => {
                  const active = pendingRole === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityLabel={`Chọn ${ROLE_LABEL[value]}`}
                      onPress={() => setPendingRole(value)}
                      className={`min-h-[40px] flex-1 items-center justify-center rounded-md border-2 ${active ? "border-brand bg-brand/10" : "border-line"}`}
                    >
                      <Text className={`font-bold ${active ? "text-brand" : "text-muted"}`}>
                        {ROLE_LABEL[value]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="mt-2 text-xs text-muted">
                ⚠️ Đổi vai trò sẽ thay đổi toàn bộ trải nghiệm (màn hình, dữ liệu hiển thị).
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  accessibilityLabel="Xác nhận đổi vai trò"
                  disabled={pendingRole === role.data || setRole.isPending}
                  onPress={() =>
                    setRole.mutate(pendingRole, { onSuccess: () => setPendingRole(null) })
                  }
                  className={`min-h-[40px] flex-1 items-center justify-center rounded-md ${pendingRole !== role.data ? "bg-brand" : "bg-line"}`}
                >
                  <Text className="font-display font-bold text-white">Xác nhận</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Huỷ đổi vai trò"
                  onPress={() => setPendingRole(null)}
                  className="min-h-[40px] flex-1 items-center justify-center rounded-md bg-paper"
                >
                  <Text className="font-display font-bold text-ink">Huỷ</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* HS: mã liên kết phụ huynh (M4) — chỉ HS */}
      {user && role.data === "student" && (
        <View className="mt-8">
          <Text className="font-display text-xl font-bold text-ink">Liên kết phụ huynh</Text>
          <Text className="mt-1 text-sm text-muted">
            Đưa mã này cho ba/mẹ để theo dõi tiến độ học của em.
          </Text>
          {parentCode.data ? (
            <View className="mt-3 rounded-lg bg-brand/10 p-4">
              <Text className="font-display text-3xl font-extrabold tracking-widest text-brand">
                {parentCode.data}
              </Text>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  accessibilityLabel="Tạo lại mã"
                  onPress={() => regenCode.mutate()}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-md bg-surface shadow-sm"
                >
                  <Text className="font-display font-bold text-ink">Tạo lại</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Thu hồi mã"
                  onPress={() => clearCode.mutate()}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-md bg-surface shadow-sm"
                >
                  <Text className="font-display font-bold text-no">Thu hồi</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityLabel="Tạo mã liên kết phụ huynh"
              onPress={() => regenCode.mutate()}
              className="mt-3 min-h-[48px] items-center justify-center rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Tạo mã liên kết</Text>
            </Pressable>
          )}

          {(myParents.data?.length ?? 0) > 0 && (
            <View className="mt-3 gap-2">
              <Text className="text-sm font-bold text-muted">Phụ huynh đang theo dõi</Text>
              {myParents.data?.map((p) => (
                <View
                  key={p.id}
                  className="flex-row items-center gap-3 rounded-lg bg-surface p-3 shadow-sm"
                >
                  <Text className="flex-1 font-semibold text-ink">{p.fullName ?? "Phụ huynh"}</Text>
                  <Pressable
                    accessibilityLabel={`Gỡ ${p.fullName ?? "phụ huynh"}`}
                    onPress={() => user && unlink.mutate({ parentId: p.id, studentId: user.id })}
                    className="min-h-[40px] items-center justify-center rounded-md px-2"
                  >
                    <Text className="font-bold text-no">Gỡ</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {user && (
        <View className="mt-8">
          <Text className="font-display text-xl font-bold text-ink">Nhắc ôn tập</Text>
          <Text className="mt-1 text-sm text-muted">
            Bật để nhận nhắc khi có kỹ năng đến hạn ôn. (Thông báo đẩy chỉ trên điện thoại.)
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              accessibilityLabel="Bật nhắc ôn tập"
              onPress={enableReminders}
              className="min-h-[48px] flex-1 items-center justify-center rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Bật nhắc</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Tắt nhắc ôn tập"
              onPress={disableReminders}
              className="min-h-[48px] flex-1 items-center justify-center rounded-md bg-surface shadow-sm"
            >
              <Text className="font-display font-bold text-ink">Tắt nhắc</Text>
            </Pressable>
          </View>
          {pushMsg && <Text className="mt-2 text-sm font-semibold text-brand">{pushMsg}</Text>}
        </View>
      )}

      <Text className="mt-8 font-display text-xl font-bold text-ink">
        Huy hiệu{" "}
        <Text className="text-base font-bold text-muted">
          ({earned.size}/{catalog.length})
        </Text>
      </Text>
      <View className="mt-3">
        <BadgeGrid catalog={catalog} earned={earned} />
      </View>

      {/* Bảo mật — đổi mật khẩu khi đã đăng nhập (D48) + đăng xuất thiết bị khác (D50) */}
      {user && (
        <View className="mt-8">
          <Text className="font-display text-xl font-bold text-ink">Bảo mật</Text>
          <Pressable
            accessibilityLabel="Đổi mật khẩu"
            onPress={() => router.push("/change-password")}
            className="mt-3 min-h-[48px] items-center justify-center rounded-md bg-surface shadow-sm"
          >
            <Text className="font-display font-bold text-ink">Đổi mật khẩu ›</Text>
          </Pressable>

          {!confirmOtherDevices ? (
            <Pressable
              accessibilityLabel="Đăng xuất khỏi thiết bị khác"
              onPress={() => {
                setOtherDevicesMsg(null);
                setConfirmOtherDevices(true);
              }}
              className="mt-2 min-h-[48px] items-center justify-center rounded-md bg-surface shadow-sm"
            >
              <Text className="font-display font-bold text-ink">Đăng xuất khỏi thiết bị khác</Text>
            </Pressable>
          ) : (
            <View className="mt-2 rounded-md border-2 border-line bg-surface p-3">
              <Text className="text-sm text-ink">
                Thu hồi đăng nhập ở MỌI thiết bị khác — chỉ giữ lại phiên trên thiết bị này. Hữu ích
                nếu em nghi ngờ ai đó khác đang đăng nhập tài khoản của mình.
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  accessibilityLabel="Xác nhận đăng xuất thiết bị khác"
                  onPress={async () => {
                    const res = await signOutOtherDevices();
                    setConfirmOtherDevices(false);
                    setOtherDevicesMsg(
                      res.error
                        ? "Không thực hiện được, thử lại sau."
                        : "Đã đăng xuất thiết bị khác ✓",
                    );
                  }}
                  className="min-h-[40px] flex-1 items-center justify-center rounded-md bg-brand"
                >
                  <Text className="font-display font-bold text-white">Xác nhận</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Huỷ đăng xuất thiết bị khác"
                  onPress={() => setConfirmOtherDevices(false)}
                  className="min-h-[40px] flex-1 items-center justify-center rounded-md bg-paper"
                >
                  <Text className="font-display font-bold text-ink">Huỷ</Text>
                </Pressable>
              </View>
            </View>
          )}
          {otherDevicesMsg && (
            <Text className="mt-2 text-sm font-semibold text-brand">{otherDevicesMsg}</Text>
          )}
        </View>
      )}

      {/* Đăng xuất (có xác nhận) */}
      {user && (
        <View className="mt-8">
          {!confirmLogout ? (
            <Pressable
              accessibilityLabel="Đăng xuất"
              onPress={() => setConfirmLogout(true)}
              className="min-h-[48px] items-center justify-center rounded-md border-2 border-no/40"
            >
              <Text className="font-display font-bold text-no">Đăng xuất</Text>
            </Pressable>
          ) : (
            <View className="rounded-md border-2 border-no/30 p-3">
              <Text className="text-sm text-ink">Đăng xuất khỏi tài khoản này?</Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  accessibilityLabel="Xác nhận đăng xuất"
                  onPress={() => {
                    signOut();
                    setConfirmLogout(false);
                    router.replace("/");
                  }}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-md bg-no"
                >
                  <Text className="font-display font-bold text-white">Đăng xuất</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Huỷ đăng xuất"
                  onPress={() => setConfirmLogout(false)}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-md bg-paper"
                >
                  <Text className="font-display font-bold text-ink">Huỷ</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View
      className="flex-1 items-center rounded-lg bg-surface py-4 shadow-sm"
      style={{ borderTopWidth: 3, borderTopColor: accent }}
    >
      <Text className="font-display text-2xl font-extrabold text-ink">{value}</Text>
      <Text className="text-xs font-bold text-muted">{label}</Text>
    </View>
  );
}
