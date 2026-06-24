// Design tokens Synaptek — nguồn 1 chỗ, dùng chung web + native (qua NativeWind).
// Anti-template (design-quality): màu NGỮ NGHĨA theo mạch kiến thức, không trang trí tùy tiện.

/** Màu theo mạch kiến thức (strand). Dùng cho thẻ chủ đề, tiến độ, nhấn. */
export const strandColors = {
  num: "#2563eb", // Số và phép tính — xanh dương
  geo: "#ea580c", // Hình học — cam
  measure: "#16a34a", // Đo lường — xanh lá
  stats: "#9333ea", // Thống kê & xác suất — tím
} as const;

export type StrandKey = keyof typeof strandColors;

/** Suy ra màu mạch từ id (vd "g4.num.fractions" → num). */
export function strandColorFromId(id: string): string {
  const part = id.split(".")[1] as StrandKey;
  return strandColors[part] ?? strandColors.num;
}

export const colors = {
  ...strandColors,
  bg: "#fbfbfd",
  surface: "#ffffff",
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  correct: "#16a34a",
  incorrect: "#dc2626",
  brand: "#4f46e5", // indigo — màu thương hiệu Synaptek
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, "2xl": 64 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const typography = {
  display: 32,
  title: 24,
  body: 17,
  caption: 14,
  // vùng chạm tối thiểu (trẻ em) — px
  touchTarget: 48,
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const tokens = { colors, strandColors, spacing, radius, typography, motion } as const;
export default tokens;
