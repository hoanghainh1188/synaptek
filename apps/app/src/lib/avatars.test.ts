import assert from "node:assert/strict";
import { test } from "node:test";
import { AVATARS, avatarEmoji, isAvatarUnlocked, DEFAULT_AVATAR } from "./avatars.ts";

test("avatarEmoji: key hợp lệ → emoji; sai/null → mặc định", () => {
  assert.equal(avatarEmoji("dragon"), "🐉");
  assert.equal(avatarEmoji(null), avatarEmoji(DEFAULT_AVATAR));
  assert.equal(avatarEmoji("không-tồn-tại"), avatarEmoji(DEFAULT_AVATAR));
});

test("isAvatarUnlocked theo ngưỡng XP", () => {
  const lion = AVATARS.find((a) => a.key === "lion")!; // xp 50
  assert.equal(isAvatarUnlocked(lion, 49), false);
  assert.equal(isAvatarUnlocked(lion, 50), true);
  const fox = AVATARS.find((a) => a.key === "fox")!; // xp 0
  assert.equal(isAvatarUnlocked(fox, 0), true);
});

test("có avatar miễn phí (xp=0) để HS mới luôn chọn được", () => {
  assert.ok(AVATARS.filter((a) => a.xp === 0).length >= 1);
  assert.ok(AVATARS.some((a) => a.key === DEFAULT_AVATAR && a.xp === 0));
});
