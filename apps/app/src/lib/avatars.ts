// Avatar mở khoá theo XP — THUẦN, test được. Dùng emoji (không cần asset/Storage).
export interface AvatarOption {
  key: string;
  emoji: string;
  xp: number; // ngưỡng XP để mở khoá (0 = có sẵn)
  label: string;
}

export const AVATARS: AvatarOption[] = [
  { key: "fox", emoji: "🦊", xp: 0, label: "Cáo" },
  { key: "panda", emoji: "🐼", xp: 0, label: "Gấu trúc" },
  { key: "cat", emoji: "🐱", xp: 0, label: "Mèo" },
  { key: "dog", emoji: "🐶", xp: 0, label: "Cún" },
  { key: "lion", emoji: "🦁", xp: 50, label: "Sư tử" },
  { key: "tiger", emoji: "🐯", xp: 100, label: "Hổ" },
  { key: "unicorn", emoji: "🦄", xp: 200, label: "Kỳ lân" },
  { key: "dragon", emoji: "🐉", xp: 400, label: "Rồng" },
  { key: "eagle", emoji: "🦅", xp: 700, label: "Đại bàng" },
  { key: "rocket", emoji: "🚀", xp: 1000, label: "Tên lửa" },
];

export const DEFAULT_AVATAR = "fox";

/** Emoji theo key (fallback về avatar mặc định nếu không hợp lệ). */
export function avatarEmoji(key: string | null | undefined): string {
  const found = AVATARS.find((a) => a.key === key);
  if (found) return found.emoji;
  return AVATARS.find((a) => a.key === DEFAULT_AVATAR)!.emoji;
}

/** Avatar đã mở khoá với mức XP hiện tại chưa? */
export function isAvatarUnlocked(opt: AvatarOption, totalXp: number): boolean {
  return totalXp >= opt.xp;
}
