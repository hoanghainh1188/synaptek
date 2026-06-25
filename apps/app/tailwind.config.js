/** @type {import('tailwindcss').Config} */
// Giữ ĐỒNG BỘ với apps/app/theme/tokens.ts (nguồn-sự-thật token). NativeWind v4 preset.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#fbfbfd",
        surface: "#ffffff",
        ink: "#18181b",
        muted: "#71717a",
        line: "#e4e4e7",
        brand: "#4f46e5",
        num: "#2563eb",
        geo: "#ea580c",
        measure: "#16a34a",
        stats: "#9333ea",
        ok: "#16a34a",
        no: "#dc2626",
      },
      fontFamily: {
        display: ["Display", "system-ui", "sans-serif"], // Be Vietnam Pro (đủ dấu tiếng Việt)
        body: ["Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "8px", md: "12px", lg: "20px", xl: "28px", pill: "999px" },
    },
  },
  plugins: [],
};
